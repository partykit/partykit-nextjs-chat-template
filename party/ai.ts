import { PartyKitServer, PartyKitConnection } from "partykit/server";
import type { Message, ChatMessage, UserMessage } from "./chatRoom";

export const AI_USERNAME = "AI";

// act as a user in the room
const participate = (socket: PartyKitConnection["socket"]) => {
  let messages: Message[] = [];
  let identified = false;

  // listen to messages from the chatroom
  socket.addEventListener("message", (message) => {
    if (!identified) {
      identified = true;
      socket.send(
        JSON.stringify(<UserMessage>{ type: "identify", username: "AI" })
      );
    }

    const data = JSON.parse(message.data as string) as ChatMessage;
    if (data.type === "sync") {
      messages = data.messages;
    }

    if (data.type === "update") {
      messages.push(data);
      if (data.from.id !== "AI" && data.from.id !== "system") {
        setTimeout(() => {
          socket.send(
            JSON.stringify(<UserMessage>{
              type: "new",
              text: `${data.text.toUpperCase()}!!!!!`,
            })
          );
        }, 500);
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
        // open a websocket connection to the chatroom
        const chatRoom = room.parties.chatroom.get(id);

        // TODO: Handle reconnections via PartySocket
        const socket = chatRoom.connect();

        // this is where the logic happens
        participate(socket);

        return new Response("OK");
      }
    }

    return new Response("Not found", { status: 404 });
  },
  onConnect(connection, room) {},
} satisfies PartyKitServer;
