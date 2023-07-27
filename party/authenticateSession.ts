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
    const res = await fetch(`${authServerUrl}/api/session`, {
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
    } else {
      return {
        username: await res.text(),
      };
    }
  } catch (e) {
    console.log("Error", e);
    throw e;
  }

  return null;
};
