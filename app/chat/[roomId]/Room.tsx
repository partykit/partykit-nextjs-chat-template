"use client";
import { FormEventHandler, useEffect, useState } from "react";
import usePartySocket from "partysocket/react";
import type { User } from "@/party/utils/auth";
import type { Message, ChatMessage } from "@/party/utils/message";
import { useSession } from "next-auth/react";
import PartySocket from "partysocket";
import Link from "next/link";
import RoomMessage from "./components/RoomMessage";
import ConnectionStatus from "@/app/components/ConnectionStatus";

const identify = async (socket: PartySocket) => {
  // the ./auth route will authenticate the connection to the partykit room
  const url = `${window.location.pathname}/auth?_pk=${socket._pk}`;
  const req = await fetch(url, { method: "POST" });

  if (!req.ok) {
    const res = await req.text();
    console.error("Failed to authenticate connection to PartyKit room", res);
  }
};

export const Room: React.FC<{
  room: string;
  host: string;
  user: User | null;
  party: string;
  messages: Message[];
}> = ({ room, host, user: initialUser, party, messages: initialMessages }) => {
  // render with initial data, update from websocket as messages arrive
  const session = useSession();
  const [messages, setMessages] = useState(initialMessages);
  const [user, setUser] = useState(initialUser);
  const socket = usePartySocket({
    host,
    party,
    room,
    onOpen(e) {
      // identify user upon connection
      if (session.status === "authenticated" && e.target) {
        identify(e.target as PartySocket);
        if (session?.data?.user) setUser(session.data.user as User);
      }
    },
    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as ChatMessage;
      // upon connection, the server will send all messages in the room
      if (message.type === "sync") setMessages(message.messages);
      // after that, the server will send updates as they arrive
      if (message.type === "new") setMessages((prev) => [...prev, message]);
      if (message.type === "clear") setMessages([]);
      if (message.type === "edit") {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
      scrollToBottom();
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
      scrollToBottom();
    }
  };

  function scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      <div className="h-full w-full flex flex-col gap-6">
        {messages.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => (
              <RoomMessage
                key={message.id}
                message={message}
                isMe={message.from.id === user?.username}
              />
            ))}
          </ul>
        ) : (
          <p className="italic">No messages yet</p>
        )}
        {session.status === "authenticated" ? (
          <form onSubmit={handleSubmit} className="sticky bottom-4 sm:bottom-6">
            <input
              placeholder="Send message..."
              className="border border-stone-400 p-3 bg-stone-100 min-w-full rounded"
              type="text"
              name="message"
            ></input>
          </form>
        ) : session.status === "unauthenticated" ? (
          <div className="sticky left-4 sm:left-6 bottom-4 sm:bottom-6 pt-2 rounded-sm flex items-start">
            <p className="bg-red-100 p-3">
              You must be signed in to post messages.{" "}
              <Link
                className="underline"
                href={`/api/auth/signin?callbackUrl=${window.location.href}`}
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <span />
        )}
      </div>
      <ConnectionStatus socket={socket} />
    </>
  );
};
