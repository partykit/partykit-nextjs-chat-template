import { PartyKitServer } from "partykit/server";
import { docs, webSocketConnectorDemo } from "./utils/docs";

export default {
  unstable_onFetch(request) {
    return docs(request);
  },
  onRequest(req, room) {
    return webSocketConnectorDemo(room);
  },
  onConnect(connection, room) {
    const info = (message: string) =>
      `[${room.id}@${new Date().toLocaleTimeString()}]: ${message} (${
        room.connections.size
      } connections)\n`;

    connection.send(info("Welcome to the party! 🎉"));
    room.broadcast(info("Someone joined the party! 👋"), [connection.id]);
  },
} satisfies PartyKitServer;
