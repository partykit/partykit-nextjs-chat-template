import {
  PartyKitServer,
  PartyKitConnection,
  PartyKitRoom,
} from "partykit/server";
import { nanoid } from "nanoid";
import type { Message, ChatMessage, UserMessage } from "./chatRoom";
import { getChatCompletionResponse, AIMessage } from "./utils/openai";

export const AI_USERNAME = "AI";

const getPrompt = (messages: Message[]): AIMessage[] => {
  // format chat history in a way that OpenAI can understand
  return [
    {
      role: "system",
      content:
        "You are a participant in an internet chatroom. You're trying to fit in and impress everyone else with cool facts that you know, emulating the tone and writing style of the room. When presented with a chat history, you'll respond with a cool fact that's related to the topic being discussed. Keep your responses short.",
    },
    ...messages.slice(-10).map((message) => ({
      role:
        message.from.id === AI_USERNAME
          ? ("assistant" as const)
          : ("user" as const),
      content: message.text,
    })),
  ];
};

// act as a user in the room
const join = (socket: PartyKitConnection["socket"], room: PartyKitRoom) => {
  let messages: Message[] = [];
  let identified = false;
  let typing = false;

  // listen to messages from the chatroom
  socket.addEventListener("message", (message) => {
    // before first message, let the room know who we are
    if (!identified) {
      identified = true;
      socket.send(
        JSON.stringify(<UserMessage>{
          type: "identify",
          username: AI_USERNAME,
        }),
      );
    }

    const data = JSON.parse(message.data as string) as ChatMessage;
    if (data.type === "sync") {
      messages = data.messages;
    }

    if (data.type === "edit") {
      messages = messages.map((m) => (m.id === data.id ? data : m));
    }

    // when new messages arrive, respond to them with a message from the AI
    if (data.type === "new") {
      messages.push(data);
      if (data.from.id !== AI_USERNAME && data.from.id !== "system") {
        let text = "";
        const prompt = getPrompt(messages);
        const id = nanoid(); // give message an id so we can edit it
        getChatCompletionResponse(
          room.env,
          prompt,
          () => {
            // post an empty message to start with
            socket.send(JSON.stringify(<UserMessage>{ type: "new", id, text }));
          },
          (token) => {
            // edit the message as tokens arrive
            text += token;
            socket.send(
              JSON.stringify(<UserMessage>{ type: "edit", id, text }),
            );
          },
        ).finally(() => {
          typing = false;
        });
      }
    }
  });
};

export default {
  async onRequest(req, room) {
    // the chatroom sends a request to the AI to join the chat
    if (req.method === "POST") {
      const { id, action } = await req.json();
      if (action === "connect") {
        if (!room.env.OPENAI_API_KEY) {
          return new Response("OPENAI_API_KEY not set", { status: 500 });
        }

        // open a websocket connection to the chatroom
        const chatRoom = room.parties.chatroom.get(id);
        const socket = chatRoom.connect();

        // this is where the logic happens
        join(socket, room);

        return new Response("OK");
      }
    }

    return new Response("Not found", { status: 404 });
  },
  onConnect(connection, room) {},
} satisfies PartyKitServer;
