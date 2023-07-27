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

// Make a combined type of PartyKitRoom and the message store
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
    try {
      if (request.method === "GET") {
        const payload: SyncMessage = {
          type: "sync",
          messages: room.messages || [],
        };

        return new Response(JSON.stringify(payload));
      }

      return new Response("Not found", { status: 404 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
      });
    }
  },

  onConnect(websocket, room: ChatRoom) {
    // keep track of connections in a separate room list
    updateRoomList(websocket, room);

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

      const broadcast = <BroadcastMessage>{
        type: "update",
        ...message,
      };

      // Broadcast the message to everyone including the
      room.broadcast(JSON.stringify(broadcast), []);
    });

    // Send the whole list of messages to the new user
    const sync = <SyncMessage>{
      type: "sync",
      messages: room.messages || [],
    };

    websocket.send(JSON.stringify(sync));
  },
} satisfies PartyKitServer;
