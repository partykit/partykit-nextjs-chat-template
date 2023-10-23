import type * as Party from "partykit/server";

export type User = {
  username: string;
  name?: string;
  email?: string;
  image?: string;
  expires?: string;
};

/** Check that the user exists, and isn't expired */
export const isSessionValid = (session?: User | null): session is User => {
  return Boolean(
    session && (!session.expires || session.expires > new Date().toISOString())
  );
};

/**
 * Authenticate the user against the NextAuth API of the server that proxied the request
 */
export const getNextAuthSession = async (proxiedRequest: Party.Request) => {
  const headers = proxiedRequest.headers;
  const origin = headers.get("origin") ?? "";
  const cookie = headers.get("cookie") ?? "";

  const url = `${origin}/api/auth/session`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Cookie: cookie,
    },
  });

  if (res.ok) {
    const session = await res.json();
    if (isSessionValid(session.user)) {
      return { ...session.user, expires: session.expires };
    }
  } else {
    console.error("Failed to authenticate user", await res.text());
  }

  return null;
};
