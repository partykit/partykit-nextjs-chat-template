import { PartyKitConnection, PartyKitServer } from "partykit/server";
import { User, authenticateUserSession, getUserSession } from "./utils/auth";

type MessageEvent =
  | {
      type: "identify";
      sessionToken: string;
      csrfToken: string;
      username: string;
    }
  | { type: "message"; text: string; sender: User }
  | { type: "error"; text: string };

type Connection = PartyKitConnection & {
  username?: string;
};

export default {
  onConnect(connection: Connection) {
    connection.username = (connection.deserializeAttachment() ?? {}).username;
  },

  async onMessage(message, connection: Connection, room) {
    const reply = (response: MessageEvent) =>
      connection.send(JSON.stringify(response));

    const event = JSON.parse(message as string) as MessageEvent;

    if (event.type === "identify") {
      const user = await authenticateUserSession(room, event);
      if (user) {
        connection.username = user.username;
        connection.serializeAttachment({
          ...(connection.deserializeAttachment() ?? {}),
          username: user.username,
        });

        reply({
          type: "message",
          text: `Welcome ${user.username}`,
          sender: {
            username: "system",
          },
        });
      } else {
        reply({ type: "error", text: "No user found" });
      }
    }

    if (event.type === "message") {
      const user = connection.username
        ? await getUserSession(room, connection.username)
        : null;

      if (user) {
        const message = { ...event, sender: user };
        room.broadcast(JSON.stringify(message));
      } else {
        reply({ type: "error", text: "Unauthenticated" });
      }
    }
  },
} satisfies PartyKitServer;
