"use client";

import { Chat } from "@/components/Chat";
import { useSession } from "next-auth/react";

export const App = () => {
  const session = useSession();

  return (
    <main>
      <Chat
        room="chat-room"
        render={(messages) => (
          <ul>
            {messages.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        )}
      />
      <section>
        {session.data?.user ? (
          <a href="/api/auth/signout" className="underline">
            Sign out
          </a>
        ) : (
          <a href="/api/auth/signin" className="underline">
            Sign in with GitHub
          </a>
        )}
      </section>
    </main>
  );
};
