import { PartyKitConnection, PartyKitServer } from "partykit/server";
import { authenticateSession } from "./authenticateSession";

type MessageEvent =
  | { type: "identify"; session: string; csrf: string }
  | { type: "message"; text: string }
  | { type: "error"; text: string };

type Connection = PartyKitConnection & {
  user?: {
    username: string;
  };
};

export default {
  onConnect(connection: Connection) {
    connection.user = (connection.deserializeAttachment() ?? {}).user;
  },

  async onMessage(message, connection: Connection, room) {
    const reply = (response: MessageEvent) =>
      connection.send(JSON.stringify(response));

    const event = JSON.parse(message as string) as MessageEvent;

    console.log("event", event.type, message);
    if (event.type === "identify") {
      if (typeof room.env.NEXT_APP_URL !== "string") {
        return reply({
          type: "error",
          text: "Configuration error: Authentication URL not set",
        });
      }

      const user = await authenticateSession(
        room.env.NEXT_APP_URL,
        event.session,
        event.csrf
      );

      console.log("user", user);

      if (user) {
        connection.user = user;
        connection.serializeAttachment({
          ...(connection.deserializeAttachment() ?? {}),
          user,
        });

        reply({ type: "message", text: `Welcome ${user.username}` });
      } else {
        reply({ type: "error", text: "No user found" });
      }
    }

    if (event.type === "message") {
      if (connection.user) {
        room.broadcast(message as string);
      } else {
        reply({ type: "error", text: "Unauthenticated" });
      }
    }
  },
} satisfies PartyKitServer;
