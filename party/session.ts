import { PartyKitServer } from "partykit/server";
import { Token, authenticateUser } from "./utils/auth";

export default {
  async onRequest(request, room) {
    // return user session, if exists
    if (request.method === "GET") {
      const user = (await room.storage.get("user")) ?? null;
      return new Response(JSON.stringify({ user }), { status: 200 });
    }

    // authenticate user session and store it, if valid
    if (request.method === "POST") {
      const token = (await request.json()) as Token;
      const user = await authenticateUser(
        room.env.NEXT_APP_URL as string,
        token
      );

      // TODO: Check session expiry
      if (user) {
        // because we get the room id from the client, we need to make sure
        // the user is who they claim to be
        if (user.username !== token.username) {
          return new Response("Unauthorized", { status: 401 });
        }

        // store the user session
        await room.storage.put("user", user);
        return new Response(JSON.stringify({ user }), { status: 200 });
      }

      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies PartyKitServer;
