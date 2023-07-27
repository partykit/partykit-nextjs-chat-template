export const authenticateSession = async (
  authServerUrl: string,
  sessionToken: string,
  csrfToken: string
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

    console.log("url", url);
    console.log("res", res.status);

    if (res.ok) {
      const session = await res.json();
      console.log("ses", session);
      if (session.user) {
        return session.user;
      }
    }

    throw new Error(await res.text());
  } catch (e) {
    console.log("Failed to authenticate user", e);
    throw e;
  }
};
