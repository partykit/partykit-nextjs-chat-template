"use client";

import { FormEventHandler, useState } from "react";
import usePartySocket from "partysocket/react";
import PartySocket from "partysocket";

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
      const req = await fetch("/api/auth/token");
      const res = await req.json();
      if (res.session && res.csrf) {
        (event.target as PartySocket).send(
          JSON.stringify({
            type: "identify",
            session: res.session,
            csrf: res.csrf,
          })
        );
      }
    },

    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data);
      if (message.type === "message") {
        setMessages((messages) => [...messages, message.text]);
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
      <form onSubmit={handleSubmit}>
        <input
          className="text-white dark:text-black px-1"
          type="text"
          name="message"
        ></input>
      </form>
    </div>
  );
  return;
};
