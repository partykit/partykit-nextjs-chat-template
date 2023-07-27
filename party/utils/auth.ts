import { PartyKitRoom } from "partykit/server";

export type User = {
  username: string;
  name?: string;
  email?: string;
  image?: string;
};

export type Token = {
  sessionToken: string;
  csrfToken: string;
  username: string;
};

/**
 * Get current session for `username` from the session party
 */
export const getUserSession = async (room: PartyKitRoom, username: string) => {
  const session = room.parties.session.get(username);
  const response = await session.fetch({ method: "GET" }).then((r) => r.json());

  // TODO: Validate response
  return response as User | null;
};

/**
 * Create a new session for user in the session party, if the token is valid
 */
export const authenticateUserSession = async (
  room: PartyKitRoom,
  token: Token
) => {
  const session = room.parties.session.get(token.username);
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

/**
 * Authorize token against the NextAuth session endpoint
 */
export const authenticateUser = async (
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
        return session.user;
      }

      return null;
    }

    throw new Error(await res.text());
  } catch (e) {
    console.log("Failed to authenticate user", e);
    throw e;
  }
};
