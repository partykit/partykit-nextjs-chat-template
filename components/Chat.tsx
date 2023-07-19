"use client";

import { useEffect, useState } from "react";
import usePartySocket from "partysocket/react";

export const Chat: React.FC<{
  token: string;
  csrf: string;
  render: (messages: string[]) => React.ReactNode;
}> = ({ token, csrf, render }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const socket = usePartySocket({
    host: "localhost:1999",
    room: "chat-room",
    query: {
      token,
      csrf,
    },
  });

  useEffect(() => {
    const onOpen = (event: WebSocketEventMap["open"]) => {
      setMessages((messages) => [...messages, "Joined"]);
    };
    const onMessage = (event: WebSocketEventMap["message"]) => {
      setMessages((messages) => [...messages, event.data]);
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("message", onMessage);
    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("message", onMessage);
    };
  }, [socket]);

  return render(messages);
};
