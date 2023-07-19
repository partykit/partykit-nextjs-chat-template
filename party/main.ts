import { PartyKitRoom, PartyKitServer } from "partykit/server";

const authenticateSession = async (sessionToken: string, csrfToken: string) => {
  const cookie = `next-auth.csrf-token=${csrfToken}; next-auth.session-token=${sessionToken}'`;
  const res = await fetch("http://localhost:3000/api/auth/session", {
    headers: {
      Accept: "application/json",
      Cookie: cookie,
    },
  });

  if (res.ok) {
    const session = await res.json();
    if (session.user) {
      return {
        user: session.user,
      };
    }
  }

  return null;
};

export default {
  async onBeforeConnect(req) {
    // TODO: Instead of initial, do auth handshake in a message
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const csrf = url.searchParams.get("csrf");
    if (!token || !csrf) {
      return {};
    }

    return authenticateSession(token, csrf) ?? {};
  },
  onConnect(ws, room) {
    const initial = ws.unstable_initial;
    ws.send(`Welcome ${initial?.user?.username}`);
  },
} satisfies PartyKitServer;
