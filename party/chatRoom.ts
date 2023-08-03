import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "partykit/server";
import { nanoid } from "nanoid";
import { User, authenticateUser, isSessionValid } from "./utils/auth";
import { SINGLETON_ROOM_ID } from "./chatRooms";
import type {
  Message,
  SyncMessage,
  UserMessage,
  ClearRoomMessage,
} from "./utils/message";
import {
  editMessage,
  newMessage,
  syncMessage,
  systemMessage,
} from "./utils/message";
import { json, notFound, ok } from "./utils/response";

const DELETE_MESSAGES_AFTER_INACTIVITY_PERIOD = 1000 * 60 * 60 * 24; // 24 hours

// track additional information on room and connection objects
type ChatRoom = PartyKitRoom & { messages?: Message[]; ai?: boolean };
type ChatConnection = PartyKitConnection & { user?: User | null };

/**
 * This party manages the state and behaviour of an individual chat room
 */
export default {
  /**
   * Responds to HTTP requests to /parties/chatroom/:roomId endpoint
   */
  async onRequest(request, room: ChatRoom) {
    const messages = await ensureLoadMessages(room);

    // mark room as created by storing its id in object storage
    if (request.method === "POST") {
      await room.storage.put("id", room.id);
      return ok();
    }

    // return list of messages for server rendering pages
    if (request.method === "GET") {
      if (await room.storage.get("id")) {
        return json<SyncMessage>({ type: "sync", messages });
      }
      return notFound();
    }

    // clear room history
    if (request.method === "DELETE") {
      await removeRoomMessages(room);
      room.broadcast(JSON.stringify(<ClearRoomMessage>{ type: "clear" }));
      room.broadcast(
        newMessage({
          from: { id: "system" },
          text: `Room history cleared`,
        })
      );
      return ok();
    }

    // respond to cors preflight requests
    if (request.method === "OPTIONS") {
      return ok();
    }

    return notFound();
  },

  /**
   * Executes when a new WebSocket connection is made to the room
   */
  async onConnect(connection: ChatConnection, room: ChatRoom) {
    await ensureLoadMessages(room);
    await ensureAIParticipant(room);

    // send the whole list of messages to user when they connect
    connection.send(syncMessage(room.messages ?? []));



    // keep track of connections
    updateRoomList("enter", connection, room);
    connection.addEventListener("close", () =>
      updateRoomList("leave", connection, room)
    );

    // handle incoming messages from client
    const onUserMessage = async (message: UserMessage) => {
      // handle user authentication
      if (message.type === "identify") {
        if ((connection.user = await authenticateUser(room, message))) {
          updateRoomList("enter", connection, room);
          connection.send(
            newMessage({
              from: { id: "system" },
              text: `Welcome ${connection.user.username}!`,
            })
          );
          if (!room.env.OPENAI_API_KEY) {
            connection.send(
              systemMessage(
                "OpenAI API key not configured. AI bot is not available"
              )
            )};
          return;
        }
      }

      // handle user messages
      if (message.type === "new" || message.type === "edit") {
        const user = connection.user;
        if (!isSessionValid(user)) {
          return connection.send(
            systemMessage("You must sign in to send messages to this room")
          );
        }

        if (message.text.length > 1000) {
          return connection.send(systemMessage("Message too long"));
        }

        const payload = <Message>{
          id: message.id ?? nanoid(),
          from: { id: user.username, image: user.image },
          text: message.text,
          at: Date.now(),
        };

        // send new message to all connections
        if (message.type === "new") {
          room.broadcast(newMessage(payload), []);
          room.messages!.push(payload);
        }

        // send edited message to all connections
        if (message.type === "edit") {
          room.broadcast(editMessage(payload), []);
          room.messages = room.messages!.map((m) =>
            m.id == message.id ? payload : m
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
    };

    connection.addEventListener("message", (event) => {
      const message = JSON.parse(event.data as string) as UserMessage;
      onUserMessage(message).catch((error) => {
        console.log("Error while handling user message", error);
      });
    });
  },

  /**
   * A scheduled job that executes when the room storage alarm is triggered
   */
  async onAlarm(room: Omit<ChatRoom, "id">) {
    // alarms don't have access to room id, so retrieve it from storage
    const id = await room.storage.get<string>("id");
    if (id) {
      await removeRoomMessages(room);
      await removeRoomFromRoomList({ ...room, id });
    }
  },
} satisfies PartyKitServer;

/** Retrieve messages from room storage and store them on room instance */
async function ensureLoadMessages(room: Omit<ChatRoom, "id">) {
  if (!room.messages) {
    room.messages = (await room.storage.get<Message[]>("messages")) ?? [];
  }
  return room.messages;
}

/** Request the AI bot party to connect to this room, if not already connected */
async function ensureAIParticipant(room: ChatRoom) {
  if (!room.ai) {
    room.ai = true;
    room.parties.ai.get(room.id).fetch({
      method: "POST",
      body: JSON.stringify({ action: "connect", id: room.id }),
    });
  }
}

/** Send room presence to the room listing party */
async function updateRoomList(
  action: "enter" | "leave",
  websocket: ChatConnection,
  room: ChatRoom
) {
  return room.parties.chatrooms.get(SINGLETON_ROOM_ID).fetch({
    method: "POST",
    body: JSON.stringify({
      id: room.id,
      connections: room.connections.size,
      user: websocket.user,
      action,
    }),
  });
}

/** Remove this room from the room listing party */
async function removeRoomFromRoomList(room: ChatRoom) {
  return room.parties.chatrooms.get(SINGLETON_ROOM_ID).fetch({
    method: "POST",
    body: JSON.stringify({
      id: room.id,
      action: "delete",
    }),
  });
}

/** Clear room storage */
async function removeRoomMessages(room: Omit<ChatRoom, "id">) {
  await room.storage.delete("messages");
  room.messages = [];
}
