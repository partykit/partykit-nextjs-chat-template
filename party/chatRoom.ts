import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "partykit/server";
import { SINGLETON_ROOM_ID } from "./chatRooms";
import { nanoid } from "nanoid";
import { Token, User, authenticateUser, isSessionValid } from "./utils/auth";

type Sender = {
  id: string;
  image?: string;
};

export type Message = {
  id: string; // set by server
  from: Sender;
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

type ChatConnection = PartyKitConnection & {
  user?: User | null;
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

const update = (msg: Omit<Message, "id" | "at">) =>
  JSON.stringify(<BroadcastMessage>{
    type: "update",
    id: nanoid(),
    at: Date.now(),
    ...msg,
  });

const sync = (messages: Message[]) =>
  JSON.stringify(<SyncMessage>{ type: "sync", messages });

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

  async onConnect(connection: ChatConnection, room: ChatRoom) {
    if (!room.messages) {
      room.messages = (await room.storage.get<Message[]>("messages")) ?? [];
    }

    // Send the whole list of messages to the new user
    connection.send(sync(room.messages ?? []));

    // keep track of connections in a separate room list
    updateRoomList(connection, room);

    connection.addEventListener("message", async (evt) => {
      const event = JSON.parse(evt.data as string) as UserMessage;

      if (event.type === "identify") {
        connection.user = await authenticateUser(room, event);
        if (connection.user) {
          return connection.send(
            update({
              from: { id: "system" },
              text: `Welcome ${connection.user.username}!`,
            })
          );
        }
      }

      if (event.type === "new") {
        const user = connection.user;
        if (!isSessionValid(user)) {
          return connection.send(
            update({
              from: { id: "system" },
              text: `You must sign in to send messages to this room`,
            })
          );
        }

        const message = <Message>{
          id: nanoid(),
          from: { id: user.username, image: user.image },
          text: event.text,
          at: Date.now(),
        };

        room.messages!.push(message);

        // Broadcast the message to everyone including the sender
        room.broadcast(update(message), []);

        // persist the messages to storage
        room.storage.put("messages", room.messages);
      }
    });
  },
} satisfies PartyKitServer;
