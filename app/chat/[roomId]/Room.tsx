"use client";
import { FormEventHandler, useState } from "react";
import usePartySocket from "partysocket/react";
import type { Message, ChatMessage } from "@/party/chatRoom";
import { nanoid } from "nanoid";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

const sessionId = nanoid(8);

export const Room: React.FC<{ id: string; initialMessages: Message[] }> = ({
  id,
  initialMessages,
}) => {
  // render with initial data, update from websocket as messages arrive
  const [messages, setMessages] = useState(initialMessages);

  // connect to the party via websocket
  const socket = usePartySocket({
    id: sessionId,
    host,
    party: "chatroom",
    room: id,
    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as ChatMessage;
      // upon connection, the server will send all messages in the room
      if (message.type === "sync") {
        setMessages(message.messages);
      }

      // after that, the server will send updates as they arrive
      if (message.type === "update") {
        setMessages((messages) => [...messages, message]);
      }
    },

    // async onOpen(event) {
    //   // identify user in the partykit room
    //   const req = await fetch("/api/session");
    //   const res = await req.json();
    //   const csrf = await getCsrfToken();
    //   if (res.session) {
    //     (event.target as PartySocket).send(
    //       JSON.stringify({
    //         type: "identify",
    //         session: res.session,
    //         csrf: csrf,
    //       })
    //     );
    //   }
    // },
  });

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
              <span
                className={
                  message.from.id === sessionId
                    ? "font-bold text-blue-600 dark:text-yellow-300"
                    : ""
                }
              >
                {message.from.id}
              </span>
              : {message.text}
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="sticky bottom-0">
        <input
          className="text-white dark:text-black px-1"
          type="text"
          name="message"
        ></input>
      </form>
    </div>
  );
};
