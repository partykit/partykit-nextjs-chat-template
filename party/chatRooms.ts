import { PartyKitRoom, PartyKitServer } from "partykit/server";
import { User } from "./utils/auth";

const headers = {
  "Access-Control-Allow-Origin": "*",
};

export const SINGLETON_ROOM_ID = "list";

export type RoomInfoUpdate = {
  id: string;
  connections: number;
  action: "enter" | "leave";
  user?: User;
};

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

async function getActiveRooms(room: PartyKitRoom): Promise<RoomInfo[]> {
  const rooms = await room.storage.list<RoomInfo>();

  // migration: remove old numeric values
  // TODO: remove this after next deploy
  for (const [key, info] of rooms) {
    if (typeof info === "number") {
      await room.storage.delete(key);
      rooms.delete(key);
    }
  }

  return [...rooms.values()];
}

async function updateRoomInfo(req: Request, room: PartyKitRoom) {
  const update = (await req.json()) as RoomInfoUpdate;
  const info = (await room.storage.get<RoomInfo>(update.id)) ?? {
    id: update.id,
    connections: 0,
    users: [],
  };

  info.connections = update.connections;

  const user = update.user;

  console.log(update.action, user);
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
          : u,
      );
    }
  }

  await room.storage.put(update.id, info);
  return getActiveRooms(room);
}

export default {
  async onConnect(connection, room) {
    const roomList = await getActiveRooms(room);
    connection.send(JSON.stringify(roomList));
  },
  onMessage() {
    // allow connections
  },

  async onRequest(req, room) {
    // we only allow one instance of chatRooms party
    if (room.id !== SINGLETON_ROOM_ID)
      return new Response("Room not found", { status: 404 });

    if (req.method === "GET") {
      const roomList = await getActiveRooms(room);
      return new Response(JSON.stringify(roomList), { status: 200, headers });
    }

    if (req.method === "POST") {
      const roomList = await updateRoomInfo(req, room);
      room.broadcast(JSON.stringify(roomList));
      return new Response(JSON.stringify(roomList), { status: 200 });
    }

    return new Response("Method not implemented", { status: 404 });
  },
} satisfies PartyKitServer;
