import { PartyKitServer } from "partykit/server";
import { Token, User, getSession, isSessionValid } from "./utils/auth";

export default {
  async onRequest(request, room) {
    // return user session, if exists and has not expired
    if (request.method === "GET") {
      const session = await room.storage.get<User>("session");
      const user = isSessionValid(session) ? session : null;
      return new Response(JSON.stringify({ user }), { status: 200 });
    }

    // authenticate user session and store it, if valid
    if (request.method === "POST") {
      const token = (await request.json()) as Token;
      const session = await getSession(room.env.NEXT_APP_URL as string, token);

      // we get the room id from the client, so make sure they are who they claim to be
      if (isSessionValid(session) && session.username === token.username) {
        // store the user session
        await room.storage.put("session", session);
        return new Response(JSON.stringify({ user: session }), { status: 200 });
      }

      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies PartyKitServer;
