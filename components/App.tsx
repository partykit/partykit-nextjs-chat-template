"use client";

import { Chat } from "@/components/Chat";

export const App = () => {
  return (
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
  );
};
