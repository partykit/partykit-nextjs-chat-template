import type * as Party from "partykit/server";
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

export default class ChatRoomsServer implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
    // this opts the chat room into hibernation mode, which
    // allows for a higher number of concurrent connections
  };

  constructor(public party: Party.Party) {}

  async onConnect(connection: Party.Connection) {
    // when a websocket connection is established, send them a list of rooms
    connection.send(JSON.stringify(await this.getActiveRooms()));
  }

  async onRequest(req: Party.Request) {
    // we only allow one instance of chatRooms party
    if (this.party.id !== SINGLETON_ROOM_ID) return notFound();

    // Clients fetch list of rooms for server rendering pages via HTTP GET
    if (req.method === "GET") return json(await this.getActiveRooms());

    // Chatrooms report their connections via HTTP POST
    // update room info and notify all connected clients
    if (req.method === "POST") {
      const roomList = await this.updateRoomInfo(req);
      this.party.broadcast(JSON.stringify(roomList));
      return json(roomList);
    }

    // admin api for clearing all rooms (not used in UI)
    if (req.method === "DELETE") {
      await this.party.storage.deleteAll();
      return json({ message: "All room history cleared" });
    }

    return notFound();
  }
  /** Fetches list of active rooms */
  async getActiveRooms(): Promise<RoomInfo[]> {
    const rooms = await this.party.storage.list<RoomInfo>();
    return [...rooms.values()];
  }
  /** Updates list of active rooms with information received from chatroom */
  async updateRoomInfo(req: Party.Request) {
    const update = (await req.json()) as
      | RoomInfoUpdateRequest
      | RoomDeleteRequest;

    if (update.action === "delete") {
      await this.party.storage.delete(update.id);
      return this.getActiveRooms();
    }

    const persistedInfo = await this.party.storage.get<RoomInfo>(update.id);
    if (!persistedInfo && update.action === "leave") {
      return this.getActiveRooms();
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

    await this.party.storage.put(update.id, info);
    return this.getActiveRooms();
  }
}
