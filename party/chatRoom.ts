import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "partykit/server";
import { SINGLETON_ROOM_ID } from "./chatRooms";
import { nanoid } from "nanoid";
import { Token, User, authenticateUser, isSessionValid } from "./utils/auth";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
};

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
  type: "new" | "edit";
} & Message;

type SyncMessage = {
  type: "sync";
  messages: Message[];
};

// Inbound message types
type NewMessage = {
  type: "new";
  text: string;
  id?: string; // optional, server will set if not provided
};

type EditMessage = {
  type: "edit";
  text: string;
  id: string;
};

type ClearRoomMessage = {
  type: "clear";
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

export type UserMessage = NewMessage | EditMessage | IdentifyMessage;
export type ChatMessage = BroadcastMessage | SyncMessage | ClearRoomMessage;

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
  return room.parties.chatrooms.get(SINGLETON_ROOM_ID).fetch({
    method: "POST",
    body: JSON.stringify({
      id: room.id,
      connections: room.connections.size,
      user: websocket.user,
      action,
    }),
  });
};

const removeRoomFromRoomList = async (room: ChatRoom) => {
  return room.parties.chatrooms.get(SINGLETON_ROOM_ID).fetch({
    method: "POST",
    body: JSON.stringify({
      id: room.id,
      action: "delete",
    }),
  });
};

const removeRoomMessages = async (room: Omit<ChatRoom, "id">) => {
  await room.storage.delete("messages");
  room.messages = [];
};

const newMessage = (msg: Omit<Message, "id" | "at">) =>
  JSON.stringify(<BroadcastMessage>{
    type: "new",
    id: nanoid(),
    at: Date.now(),
    ...msg,
  });

const editMessage = (msg: Omit<Message, "at">) =>
  JSON.stringify(<BroadcastMessage>{
    type: "edit",
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

    if (request.method === "POST") {
      await room.storage.put("id", room.id);
      return new Response("OK", { status: 200, headers });
    }

    if (request.method === "GET") {
      // TODO: Remove this after migration complete
      // await room.storage.put("id", room.id);
      if (await room.storage.get("id")) {
        return new Response(
          JSON.stringify(<SyncMessage>{
            type: "sync",
            messages: room.messages,
          })
        );
      }

      return new Response("Not found", { status: 404 });
    }

    if (request.method === "DELETE") {
      await removeRoomMessages(room);
      room.broadcast(JSON.stringify(<ClearRoomMessage>{ type: "clear" }));
      room.broadcast(
        newMessage({
          from: { id: "system" },
          text: `Room history cleared`,
        })
      );

      return new Response("OK", { status: 200, headers });
    }

    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers });
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
            newMessage({
              from: { id: "system" },
              text: `Welcome ${connection.user.username}!`,
            })
          );
        }
      }

      if (event.type === "new" || event.type === "edit") {
        const user = connection.user;
        if (!isSessionValid(user)) {
          return connection.send(
            newMessage({
              from: { id: "system" },
              text: `You must sign in to send messages to this room`,
            })
          );
        }

        if (event.text.length > 1000) {
          return connection.send(
            newMessage({
              from: { id: "system" },
              text: `Message too long`,
            })
          );
        }

        const message = <Message>{
          id: event.id ?? nanoid(),
          from: { id: user.username, image: user.image },
          text: event.text,
          at: Date.now(),
        };

        // send new message to all connections
        if (event.type === "new") {
          room.broadcast(newMessage(message), []);
          room.messages!.push(message);
        }

        // send edited message to all connections
        if (event.type === "edit") {
          room.broadcast(editMessage(message), []);
          room.messages = room.messages!.map((m) =>
            m.id == event.id ? message : m
          );
        }
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
    const id = await room.storage.get<string>("id");
    if (id) {
      removeRoomMessages(room);
      removeRoomFromRoomList({ ...room, id });
    }
  },
} satisfies PartyKitServer;
