export const authenticateSession = async (
  authServerUrl: string,
  sessionToken: string,
  csrfToken: string
) => {
  const cookie = `next-auth.csrf-token=${csrfToken}; next-auth.session-token=${sessionToken}'`;
  const res = await fetch(`${authServerUrl}/api/auth/session`, {
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
  }

  return null;
};
