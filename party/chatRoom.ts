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
  ai?: boolean;
};

type ChatConnection = PartyKitConnection & {
  user?: User | null;
};

export type UserMessage = NewMessage | IdentifyMessage;
export type ChatMessage = BroadcastMessage | SyncMessage;

const ensureLoadMessages = async (room: Omit<ChatRoom, "id">) => {
  if (!room.messages) {
    room.messages = (await room.storage.get<Message[]>("messages")) ?? [];
  }
  return room.messages;
};

const ensureAIParticipant = async (room: ChatRoom) => {
  if (!room.ai) {
    room.ai = true;
    room.parties.ai.get(room.id).fetch({
      method: "POST",
      body: JSON.stringify({ action: "connect", id: room.id }),
    });
  }
};

const updateRoomList = async (
  action: "enter" | "leave",
  websocket: ChatConnection,
  room: ChatRoom
) => {
  const roomList = room.parties.chatrooms.get(SINGLETON_ROOM_ID);
  const user = websocket.user;
  roomList.fetch({
    method: "POST",
    body: JSON.stringify({
      id: room.id,
      connections: room.connections.size,
      action,
      user,
    }),
  });
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

const DELETE_MESSAGES_AFTER_INACTIVITY_PERIOD = 1000 * 60 * 60 * 24; // 24 hours

// server.ts
export default {
  async onRequest(request, room: ChatRoom) {
    if (!room.messages) {
      room.messages = (await room.storage.get<Message[]>("messages")) ?? [];
    }

    if (request.method === "GET") {
      return new Response(
        JSON.stringify(<SyncMessage>{
          type: "sync",
          messages: room.messages,
        })
      );
    }

    return new Response("Not found", { status: 404 });
  },

  async onConnect(connection: ChatConnection, room: ChatRoom) {
    await ensureLoadMessages(room);
    await ensureAIParticipant(room);

    // keep track of connections in a separate room list
    updateRoomList("enter", connection, room);
    connection.addEventListener("close", () =>
      updateRoomList("leave", connection, room)
    );

    // Send the whole list of messages to the new user
    connection.send(sync(room.messages ?? []));

    connection.addEventListener("message", async (evt) => {
      const event = JSON.parse(evt.data as string) as UserMessage;

      if (event.type === "identify") {
        connection.user = await authenticateUser(room, event);
        if (connection.user) {
          updateRoomList("enter", connection, room);
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

        if (event.text.length > 1000) {
          return connection.send(
            update({
              from: { id: "system" },
              text: `Message too long`,
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
        await room.storage.put("messages", room.messages);

        // automatically clear the room storage after period of inactivity
        await room.storage.deleteAlarm();
        await room.storage.setAlarm(
          new Date().getTime() + DELETE_MESSAGES_AFTER_INACTIVITY_PERIOD
        );
      }
    });
  },

  async onAlarm(room: Omit<ChatRoom, "id">) {
    console.log("Automatically deleting old messages after inactivity...");
    await room.storage.delete("messages");
    room.messages = [];
  },
} satisfies PartyKitServer;
