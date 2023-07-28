import { PartyKitRoom } from "partykit/server";

export type User = {
  username: string;
  name?: string;
  email?: string;
  image?: string;
  expires?: string;
};

export type Token = {
  sessionToken: string;
  csrfToken: string;
  username: string;
};

/** Get current session for `username` from the user party */
export const getUser = async (room: PartyKitRoom, username: string) => {
  const session = room.parties.user.get(username);
  const response = (await session
    .fetch({ method: "GET" })
    .then((r) => r.json())) as { user?: User | null };

  // TODO: Validate response
  return response?.user ?? null;
};

/** Create a new session in the `user` party if the token is valid */
export const authenticateUser = async (room: PartyKitRoom, token: Token) => {
  const session = room.parties.user.get(token.username);
  const request = await session.fetch({
    method: "POST",
    body: JSON.stringify(token),
  });

  // TODO: Validate response
  if (request.ok) {
    const response = (await request.json()) as { user: User | null };
    return response.user;
  }

  return null;
};

/** Check that the user exists, and isn't expired */
export const isSessionValid = (session?: User | null): session is User => {
  return Boolean(
    session && (!session.expires || session.expires > new Date().toISOString())
  );
};

/** Authorize token against the NextAuth session endpoint */
export const getSession = async (
  authServerUrl: string,
  { csrfToken, sessionToken }: Token
) => {
  const cookie = [
    `next-auth.csrf-token=${csrfToken}`,
    `next-auth.session-token=${sessionToken}`,
    `__Secure-next-auth.csrf-token=${csrfToken}`,
    `__Secure-next-auth.session-token=${sessionToken}`,
  ].join("; ");

  try {
    const url = `${authServerUrl}/api/auth/session`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Cookie: cookie,
      },
    });

    if (res.ok) {
      const session = await res.json();
      if (session.user) {
        return { ...session.user, expires: session.expires };
      }

      return null;
    } else {
      throw new Error(await res.text());
    }
  } catch (e) {
    console.log("Failed to authenticate user", e);
    throw e;
  }
};
