import type * as Party from "partykit/server";
import { Token, User, getSession, isSessionValid } from "./utils/auth";
import { error, json, notFound } from "./utils/response";

/**
 * The user party holds an user session. Each user has their own room.
 */
export default class UserServer implements Party.Server {
  constructor(public party: Party.Party) {}
  async onRequest(request: Party.Request) {
    // Clients and other parties fetch a session by sending a GET request
    // return user session, if exists and has not expired
    if (request.method === "GET") {
      const session = await this.party.storage.get<User>("session");
      const user = isSessionValid(session) ? session : null;
      return json<{ user: User | null }>({ user });
    }

    // Other parties may initialise a session by sending a POST request
    if (request.method === "POST") {
      // validate session token
      const token = (await request.json()) as Token;
      const session = await getSession(
        this.party.env.NEXT_APP_URL as string,
        token
      );

      // we get the room id from the client, so make sure they are who they claim to be
      if (isSessionValid(session) && session.username === token.username) {
        // store the user session
        await this.party.storage.put("session", session);
        return json<{ user: User }>({ user: session });
      }

      return error("Unauthorized", 401);
    }

    return notFound();
  }
}
