import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "partykit/server";
import { SINGLETON_ROOM_ID } from "./chatRooms";
import { nanoid } from "nanoid";
import { Token, authenticateUserSession, getUserSession } from "./utils/auth";

type User = {
  id: string;
  image?: string;
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

type IdentifyMessage = {
  type: "identify";
} & Token;

type ChatRoom = PartyKitRoom & {
  messages?: Message[];
};

type ChatConnecttion = PartyKitConnection & {
  username?: string;
};

export type UserMessage = NewMessage | IdentifyMessage;
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

  onConnect(connection: ChatConnecttion, room: ChatRoom) {
    // Send the whole list of messages to the new user
    connection.send(
      JSON.stringify(<SyncMessage>{
        type: "sync",
        messages: room.messages || [],
      })
    );

    connection.addEventListener("message", async (evt) => {
      const event = JSON.parse(evt.data as string) as UserMessage;
      console.log("incoming", event);
      if (event.type === "new") {
        if (!connection.username) {
          return connection.send(
            JSON.stringify(<BroadcastMessage>{
              type: "update",
              id: nanoid(),
              from: { id: "system" },
              text: `You must sign in to send messages to this room`,
              at: Date.now(),
            })
          );
        }

        const user = await getUserSession(room, connection.username);
        if (!user) {
          return connection.send(
            JSON.stringify(<BroadcastMessage>{
              type: "update",
              id: nanoid(),
              from: { id: "system" },
              text: `Your session has expired, please sign in again`,
              at: Date.now(),
            })
          );
        }

        const message = <Message>{
          id: nanoid(),
          from: { id: user.username, image: user.image },
          text: event.text,
          at: Date.now(),
        };

        if (!room.messages) {
          room.messages = [];
        }

        room.messages.push(message);

        // Broadcast the message to everyone including the sender
        const broadcast = <BroadcastMessage>{ type: "update", ...message };
        room.broadcast(JSON.stringify(broadcast), []);
      }

      if (event.type === "identify") {
        const user = await authenticateUserSession(room, event);
        if (user) {
          connection.username = user.username;
          connection.send(
            JSON.stringify(<BroadcastMessage>{
              type: "update",
              id: nanoid(),
              from: { id: "system" },
              text: `Welcome ${user.name ?? user.username}!`,
              at: Date.now(),
            })
          );
        }
      }
    });

    // keep track of connections in a separate room list
    updateRoomList(connection, room);
  },
} satisfies PartyKitServer;
