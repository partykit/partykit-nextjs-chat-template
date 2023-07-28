import { PartyKitRoom, PartyKitServer } from "partykit/server";

const headers = {
  "Access-Control-Allow-Origin": "*",
};

export const SINGLETON_ROOM_ID = "list";

export type RoomInfo = {
  id: string;
  connections: number;
};

async function getActiveRooms(room: PartyKitRoom) {
  const rooms = await room.storage.list<number>();
  const counts: RoomInfo[] = [];
  rooms.forEach((connections, id) => {
    counts.push({ id, connections });
  });

  return counts;
}

async function updateRoomInfo(req: Request, room: PartyKitRoom) {
  const body = (await req.json()) as RoomInfo;
  await room.storage.put(body.id, body.connections);
  return getActiveRooms(room);
}

export default {
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
      return new Response("OK", { status: 200 });
    }

    return new Response("Method not implemented", { status: 404 });
  },
} satisfies PartyKitServer;
