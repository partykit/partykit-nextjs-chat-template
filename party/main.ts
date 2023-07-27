import { PartyKitServer } from "partykit/server";
import { authenticateSession } from "./authenticateSession";

type MessageEvent =
  | { type: "identify"; session: string; csrf: string }
  | { type: "message"; text: string }
  | { type: "error"; text: string };

export default {
  onRequest(req) {
    console.log("request to main room", req);
    return new Response("OK", { status: 200 });
  },
  async onMessage(message, socket, room) {
    const reply = (response: MessageEvent) =>
      socket.send(JSON.stringify(response));

    const connection: typeof socket & {
      user?: {
        username: string;
      };
    } = socket;

    const event = JSON.parse(message as string) as MessageEvent;

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
      if (user) {
        connection.user = user;
        connection.serializeAttachment({
          ...connection.deserializeAttachment(),
          user,
        });

        reply({ type: "message", text: `Welcome ${user.username}` });
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
