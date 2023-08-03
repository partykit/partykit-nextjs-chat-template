import {
  PartyKitServer,
  PartyKitConnection,
  PartyKitRoom,
} from "partykit/server";
import { nanoid } from "nanoid";
import type { Message, ChatMessage, UserMessage } from "./utils/message";
import { getChatCompletionResponse, AIMessage } from "./utils/openai";
import { notFound } from "next/navigation";
import { error, ok } from "./utils/response";

export const AI_USERNAME = "AI";

/**
 * A chatroom party can request an AI to join it, and the AI party responds
 * by opening a WebSocket connection and simulating a user in the chatroom
 */
export default {
  async onRequest(req, room) {
    if (req.method !== "POST") return notFound();

    const { id, action } = await req.json();
    if (action !== "connect") return notFound();

    if (!room.env.OPENAI_API_KEY) return error("OPENAI_API_KEY not set");

    // open a websocket connection to the chatroom
    const chatRoom = room.parties.chatroom.get(id);
    const socket = chatRoom.connect();

    // simulate an user in the chatroom
    simulateUser(socket, room);

    return ok();
  },
} satisfies PartyKitServer;

const PROMPT_MESSAGE_HISTORY_LENGTH = 10;
const PROMPT = `
You are a participant in an internet chatroom. 
You're trying to fit in and impress everyone else with cool facts that you know.
You emulate the tone and writing style of the room. 
When presented with a chat history, you'll respond with a cool fact that's related to the topic being discussed. 
Keep your responses short.
`;

// act as a user in the room
function simulateUser(
  socket: PartyKitConnection["socket"],
  room: PartyKitRoom
) {
  let messages: Message[] = [];
  let identified = false;

  // listen to messages from the chatroom
  socket.addEventListener("message", (message) => {
    // before first message, let the room know who we are
    if (!identified) {
      identified = true;
      socket.send(
        JSON.stringify(<UserMessage>{
          type: "identify",
          username: AI_USERNAME,
        })
      );
    }

    const data = JSON.parse(message.data as string) as ChatMessage;
    // the room sent us the whole list of messages
    if (data.type === "sync") {
      messages = data.messages;
    }
    // a client updated a message
    if (data.type === "edit") {
      messages = messages.map((m) => (m.id === data.id ? data : m));
    }
    // a client sent a nessage message
    if (data.type === "new") {
      messages.push(data);
      // don't respond to our own messages
      if (data.from.id !== AI_USERNAME && data.from.id !== "system") {
        // construct a mesage history to send to the AI
        const prompt: AIMessage[] = [
          { role: "system", content: PROMPT },
          ...messages.slice(-PROMPT_MESSAGE_HISTORY_LENGTH).map((message) => ({
            role:
              message.from.id === AI_USERNAME
                ? ("assistant" as const)
                : ("user" as const),
            content: message.text,
          })),
        ];

        // give message an id so we can edit it
        const id = nanoid();
        let text = "";

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
              JSON.stringify(<UserMessage>{ type: "edit", id, text })
            );
          }
        );
      }
    }
  });
}
