import { PartyKitServer } from "partykit/server";
import { webSocketConnectorDemo } from "./utils/docs";

/**
 * This is the "main" party of the this example project.
 *
 * You'll connect to it at http://localhost:1999/party/{room-id} in development, and
 * https://{your-project-name}.{your-team-name}.partykit.dev/party/{room-id} in production.
 */
export default {
  /**
   * Each room can respond to HTTP requests by defining an `onRequest` handler.
   *
   * Try navigating to http://localhost:1999/party/your-first-room-id
   **/
  onRequest(req, room) {
    // Serve a little dynamic HTML page
    const roomId = room.id;
    const content = `<p>This is room <b>${roomId}</b>.</p>`;
    return webSocketConnectorDemo({ roomId, content });
  },

  /**
   * Each room can respond to WebSocket connections by defining an `onConnect` handler.
   *
   * Try navigating to http://localhost:1999/party/your-first-room-id and pressing the "Connect" button.
   **/
  onConnect(connection, room) {
    const info = (message: string) =>
      `[${room.id}@${new Date().toLocaleTimeString()}]: ${message} (${
        room.connections.size
      } connections)\n`;

    // send a response to the client that just connected
    connection.send(info("Welcome to the party! 🎉"));

    // let everyone else in the room know that new client connected
    room.broadcast(info("Someone joined the party! 👋"), [connection.id]);
  },
} satisfies PartyKitServer;
