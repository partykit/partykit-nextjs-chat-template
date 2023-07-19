"use client";

import { useEffect, useState } from "react";
import { Chat } from "./Chat";

export const App = () => {
  const [token, setToken] = useState();
  const [csrf, setCsrf] = useState();
  const [error, setError] = useState();

  useEffect(() => {
    // get session tokens
    // TODO: there must be a better way
    fetch("/api/token")
      .then((response) => response.json())
      .then(({ token, csrf, error }) => {
        if (token) {
          setToken(token);
          setCsrf(csrf);
        }
        if (error) {
          setError(error);
        }
      });
  }, []);

  return (
    <div>
      {token && csrf ? (
        <Chat
          token={token}
          csrf={csrf}
          render={(messages) => (
            <ul>
              {messages.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
          )}
        />
      ) : null}
    </div>
  );
};
