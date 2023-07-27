"use client";
import { FormEventHandler, useState } from "react";
import usePartySocket from "partysocket/react";
import type { Message, ChatMessage } from "@/party/chatRoom";

export const Room: React.FC<{
  room: string;
  host: string;
  party: string;
  messages: Message[];
}> = ({ room, host, party, messages: initialMessages }) => {
  // render with initial data, update from websocket as messages arrive
  const [messages, setMessages] = useState(initialMessages);
  const socket = usePartySocket({
    host,
    party,
    room,
    onMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as ChatMessage;
      // upon connection, the server will send all messages in the room
      if (message.type === "sync") setMessages(message.messages);
      // after that, the server will send updates as they arrive
      if (message.type === "update") setMessages((prev) => [...prev, message]);
    },
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
              <span>{message.from.id.split("-")[0]}</span>: {message.text}
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
