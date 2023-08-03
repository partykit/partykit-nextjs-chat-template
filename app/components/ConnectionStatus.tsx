"use client";

import { useEffect, useState } from "react";
import PartySocket from "partysocket";

const readyStates = {
  0: {
    // CONNECTING
    text: "Connecting",
    className: "bg-yellow-500",
  },
  1: {
    // OPEN
    text: "Connected",
    className: "bg-green-500",
  },
  2: {
    // CLOSING
    text: "Closing",
    className: "bg-orange-500",
  },
  3: {
    // CLOSED
    text: "Not Connected",
    className: "bg-red-500",
  },
};

export default function ConnectionStatus(props: { socket: PartySocket }) {
  const { socket } = props;
  const [readyState, setReadyState] = useState<number>(socket.readyState);
  const display = readyStates[readyState as keyof typeof readyStates];

  useEffect(() => {
    const onStateChange = () => {
      setReadyState(socket.readyState);
    };

    socket.addEventListener("open", onStateChange);
    socket.addEventListener("close", onStateChange);

    return () => {
      socket.removeEventListener("open", onStateChange);
      socket.removeEventListener("close", onStateChange);
    };
  }, [socket]);

  return (
    <div className="absolute top-2 left-0 w-full flex justify-center">
      <div className="flex gap-2 justify-center items-center bg-stone-50 rounded-full drop-shadow-md border border-stone-300 px-3 py-2">
        <p className="text-xs font-base uppercase tracking-wider leading-none text-stone-500">
          {display.text}
        </p>
        <div className={`w-3 h-3 rounded-full ${display.className}`}></div>
      </div>
    </div>
  );
}
