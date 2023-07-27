"use client";

import { FormEventHandler, useState } from "react";
import usePartySocket from "partysocket/react";
import PartySocket from "partysocket";
import { getCsrfToken } from "next-auth/react";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
if (!host) {
  throw new Error("PartyKit host URL not configured");
}

export const Chat: React.FC<{
  room: string;
  render: (messages: string[]) => React.ReactNode;
}> = ({ room, render }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const socket = usePartySocket({
    room,
    host,
    async onOpen(event) {
      // identify user in the partykit room
      const req = await fetch("/api/session");
      const res = await req.json();
      const csrfToken = await getCsrfToken();
      if (res.sessionToken && res.session) {
        (event.target as PartySocket).send(
          JSON.stringify({
            type: "identify",
            username: res.session.username,
            sessionToken: res.sessionToken,
            csrfToken: csrfToken,
          })
        );
      }
    },

    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data);
      if (message.type === "message") {
        setMessages((messages) => [
          ...messages,
          `${message.sender.username}: ${message.text}`,
        ]);
      }
      if (message.type === "error") {
        setMessages((messages) => [...messages, "ERROR :: " + message.text]);
      }
    },
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const text = event.currentTarget.message.value;
    if (text?.trim()) {
      socket.send(JSON.stringify({ type: "message", text }));
      event.currentTarget.message.value = "";
    }
  };

  return (
    <div>
      <div>{render(messages)}</div>
      <form onSubmit={handleSubmit} className="py-2">
        <input
          placeholder="Send message..."
          className="px-1 bg-slate-200"
          type="text"
          name="message"
        ></input>
      </form>
    </div>
  );
  return;
};
