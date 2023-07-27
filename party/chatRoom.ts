import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "partykit/server";
import { SINGLETON_ROOM_ID } from "./chatRooms";
import { nanoid } from "nanoid";

type User = {
  id: string; // websocket.id
};

export type Message = {
  id: string; // set by server
  from: User;
  text: string;
  at: number; // Date
};

// Outbound message types
type BroadcastMessage = {
  type: "update";
} & Message;

type SyncMessage = {
  type: "sync";
  messages: Message[];
};

// Inbound message types
type NewMessage = {
  type: "new";
  text: string;
};

type ChatRoom = PartyKitRoom & {
  messages?: Message[];
};

export type ChatMessage = BroadcastMessage | SyncMessage;

const updateRoomList = async (
  websocket: PartyKitConnection,
  room: ChatRoom
) => {
  const roomList = room.parties.chatrooms.get(SINGLETON_ROOM_ID);
  const updateList = () =>
    roomList.fetch({
      method: "POST",
      body: JSON.stringify({ id: room.id, connections: room.connections.size }),
    });

  updateList();
  websocket.addEventListener("close", updateList);
};

// server.ts
export default {
  onRequest(request, room: ChatRoom) {
    if (request.method === "GET") {
      return new Response(
        JSON.stringify(<SyncMessage>{
          type: "sync",
          messages: room.messages || [],
        })
      );
    }

    return new Response("Not found", { status: 404 });
  },

  onConnect(websocket, room: ChatRoom) {
    // Send the whole list of messages to the new user
    websocket.send(
      JSON.stringify(<SyncMessage>{
        type: "sync",
        messages: room.messages || [],
      })
    );

    websocket.addEventListener("message", (evt) => {
      const { text } = JSON.parse(evt.data as string) as NewMessage;
      const message = <Message>{
        id: nanoid(),
        from: { id: websocket.id },
        text: text,
        at: Date.now(),
      };

      if (!room.messages) {
        room.messages = [];
      }

      room.messages.push(message);

      // Broadcast the message to everyone including the sender
      const broadcast = <BroadcastMessage>{ type: "update", ...message };
      room.broadcast(JSON.stringify(broadcast), []);
    });

    // keep track of connections in a separate room list
    updateRoomList(websocket, room);
  },
} satisfies PartyKitServer;
