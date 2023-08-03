import { PartyKitRoom, PartyKitServer } from "partykit/server";
import { User } from "./utils/auth";
import { json, notFound } from "./utils/response";

/**
 * The chatRooms party's purpose is to keep track of all chat rooms, so we want
 * every client to connect to the same room instance by sharing the same room id.
 */
export const SINGLETON_ROOM_ID = "list";

/** Chat room sends an update when participants join/leave */
export type RoomInfoUpdateRequest = {
  id: string;
  connections: number;
  action: "enter" | "leave";
  user?: User;
};

/** Chat room notifies us when it's deleted  */
export type RoomDeleteRequest = {
  id: string;
  action: "delete";
};

/** Chat rooms sends us information about connections and users */
export type RoomInfo = {
  id: string;
  connections: number;
  users: {
    username: string;
    joinedAt: string;
    leftAt?: string;
    present: boolean;
    image?: string;
  }[];
};

export default {
  onMessage() {
    // defining an onMessage callback opts the room into using a hibernation
    // mode, which allows for a higher number of concurrent connections
  },

  async onConnect(connection, room) {
    // when a websocket connection is established, send them a list of rooms
    connection.send(JSON.stringify(await getActiveRooms(room)));
  },

  async onRequest(req, room) {
    // we only allow one instance of chatRooms party
    if (room.id !== SINGLETON_ROOM_ID) return notFound();

    // Clients fetch list of rooms for server rendering pages via HTTP GET
    if (req.method === "GET") return json(await getActiveRooms(room));

    // Chatrooms report their connections via HTTP POST
    // update room info and notify all connected clients
    if (req.method === "POST") {
      const roomList = await updateRoomInfo(req, room);
      room.broadcast(JSON.stringify(roomList));
      return json(roomList);
    }

    // admin api for clearing all rooms (not used in UI)
    if (req.method === "DELETE") {
      await room.storage.deleteAll();
      return json({ message: "All room history cleared" });
    }

    return notFound();
  },
} satisfies PartyKitServer;

/** Fetches list of active rooms */
async function getActiveRooms(room: PartyKitRoom): Promise<RoomInfo[]> {
  const rooms = await room.storage.list<RoomInfo>();
  return [...rooms.values()];
}

/** Updates list of active rooms with information received from chatroom */
async function updateRoomInfo(req: Request, room: PartyKitRoom) {
  const update = (await req.json()) as
    | RoomInfoUpdateRequest
    | RoomDeleteRequest;

  if (update.action === "delete") {
    await room.storage.delete(update.id);
    return getActiveRooms(room);
  }

  const persistedInfo = await room.storage.get<RoomInfo>(update.id);
  if (!persistedInfo && update.action === "leave") {
    return getActiveRooms(room);
  }

  const info = persistedInfo ?? {
    id: update.id,
    connections: 0,
    users: [],
  };

  info.connections = update.connections;

  const user = update.user;
  if (user) {
    if (update.action === "enter") {
      // bump user to the top of the list on entry
      info.users = info.users.filter((u) => u.username !== user.username);
      info.users.unshift({
        username: user.username,
        image: user.image,
        joinedAt: new Date().toISOString(),
        present: true,
      });
    } else {
      info.users = info.users.map((u) =>
        u.username === user.username
          ? { ...u, present: false, leftAt: new Date().toISOString() }
          : u
      );
    }
  }

  await room.storage.put(update.id, info);
  return getActiveRooms(room);
}
