import type * as Party from "partykit/server";
import { nanoid } from "nanoid";
import type { Message, ChatMessage, UserMessage } from "./utils/message";
import type { User } from "./utils/auth";
import { getChatCompletionResponse, AIMessage } from "./utils/openai";
import { notFound } from "next/navigation";
import { error, ok } from "./utils/response";

const PROMPT_MESSAGE_HISTORY_LENGTH = 10;
const PROMPT = `
You are a participant in an internet chatroom. 
You're trying to fit in and impress everyone else with cool facts that you know.
You emulate the tone and writing style of the room. 
When presented with a chat history, you'll respond with a cool fact that's related to the topic being discussed. 
Keep your responses short.
`;

export const AI_USERNAME = "AI";
export const AI_USER: User = {
  username: AI_USERNAME,
  image:
    "https://pbs.twimg.com/profile_images/1634058036934500352/b4F1eVpJ_400x400.jpg",
  expires: new Date(2099, 0, 1).toISOString(),
};

/**
 * A chatroom party can request an AI to join it, and the AI party responds
 * by opening a WebSocket connection and simulating a user in the chatroom
 */
export default class AIServer implements Party.Server {
  constructor(public party: Party.Party) {}

  async onRequest(req: Party.Request) {
    if (req.method !== "POST") return notFound();

    const { roomId, botId, action } = await req.json<{
      roomId: string;
      botId: string;
      action: string;
    }>();
    if (action !== "connect") return notFound();

    if (!this.party.env.OPENAI_API_KEY) return error("OPENAI_API_KEY not set");

    // open a websocket connection to the chatroom with the given id
    const chatRoom = this.party.context.parties.chatroom.get(roomId);
    const socket = await chatRoom.socket("/?_pk=" + botId);

    // simulate an user in the chatroom
    this.simulateUser(socket);

    return ok();
  }
  // act as a user in the room
  simulateUser(socket: Party.Connection["socket"]) {
    let messages: Message[] = [];
    //let identified = false;

    // listen to messages from the chatroom
    socket.addEventListener("message", (message) => {
      // // before first message, let the room know who we are
      // if (!identified) {
      //   identified = true;
      //   socket.send(
      //     JSON.stringify(<UserMessage>{
      //       type: "identify",
      //       username: AI_USERNAME,
      //     })
      //   );
      // }

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
            ...messages
              .slice(-PROMPT_MESSAGE_HISTORY_LENGTH)
              .map((message) => ({
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
            this.party.env,
            prompt,
            () => {
              // post an empty message to start with
              socket.send(
                JSON.stringify(<UserMessage>{ type: "new", id, text })
              );
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
}
