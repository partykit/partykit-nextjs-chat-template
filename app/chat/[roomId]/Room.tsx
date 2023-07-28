"use client";
import { FormEventHandler, useEffect, useState } from "react";
import usePartySocket from "partysocket/react";
import type { Message, ChatMessage } from "@/party/chatRoom";
import { getCsrfToken, useSession } from "next-auth/react";
import PartySocket from "partysocket";
import Link from "next/link";

const identify = async (socket: PartySocket) => {
  // identify user in the partykit room
  const req = await fetch("/api/session");
  const res = await req.json();
  const csrfToken = await getCsrfToken();
  if (res.sessionToken && res.session) {
    // note: this could be done as HTTP POST /parties/user/:username
    socket.send(
      JSON.stringify({
        type: "identify",
        username: res.session.username,
        sessionToken: res.sessionToken,
        csrfToken: csrfToken,
      })
    );
  }
};

export const Room: React.FC<{
  room: string;
  host: string;
  party: string;
  messages: Message[];
}> = ({ room, host, party, messages: initialMessages }) => {
  // render with initial data, update from websocket as messages arrive
  const session = useSession();
  const [messages, setMessages] = useState(initialMessages);
  const socket = usePartySocket({
    host,
    party,
    room,
    onOpen(e) {
      // identify user upon connection
      if (session.status === "authenticated" && e.target) {
        identify(e.target as PartySocket);
      }
    },
    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as ChatMessage;
      // upon connection, the server will send all messages in the room
      if (message.type === "sync") setMessages(message.messages);
      // after that, the server will send updates as they arrive
      if (message.type === "update") setMessages((prev) => [...prev, message]);
    },
  });

  // authenticate connection to the partykit room if session status changes
  useEffect(() => {
    if (
      session.status === "authenticated" &&
      socket?.readyState === socket.OPEN
    ) {
      identify(socket);
    }
  }, [session.status, socket]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const text = event.currentTarget.message.value;
    if (text?.trim()) {
      socket.send(JSON.stringify({ type: "new", text }));
      event.currentTarget.message.value = "";
    }
  };

  return (
    <div className="">
      <div className="">
        <ul className="font-mono">
          {messages.map((message) => (
            <li key={message.id}>
              {new Date(message.at).toLocaleTimeString()}{" "}
              <span>{message.from.id.split("-")[0]}</span>: {message.text}
            </li>
          ))}
        </ul>
      </div>
      {session.status === "authenticated" ? (
        <form onSubmit={handleSubmit} className="sticky bottom-0">
          <input
            placeholder="Send message..."
            className="px-1 bg-slate-200"
            type="text"
            name="message"
          ></input>
          <div>
            <Link className="underline text-sm" href="/api/auth/signout">
              Sign out
            </Link>
          </div>
        </form>
      ) : session.status === "unauthenticated" ? (
        <Link className="underline" href="/api/auth/signin">
          Sign in to start posting
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
};
