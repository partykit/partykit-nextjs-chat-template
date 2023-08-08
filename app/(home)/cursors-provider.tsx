"use client";

import { useState, useEffect, useContext, createContext } from "react";
import usePartySocket from "partysocket/react";
import type { PartialCursor, CursorsMap } from "@/party/cursors";
import ConnectionStatus from "@/app/components/ConnectionStatus";
import { PARTYKIT_HOST } from "../env";

type CursorsContextType = {
  others: CursorsMap;
  myCursor: PartialCursor | null;
  myId: string | null;
  windowDimensions: { width: number; height: number };
  getCount: () => number;
};

export const CursorsContext = createContext<CursorsContextType>({
  others: {},
  myCursor: null,
  myId: null,
  windowDimensions: { width: 0, height: 0 },
  getCount: () => 0,
});

export function useCursors() {
  return useContext(CursorsContext);
}

export default function CursorsProvider(props: { children: React.ReactNode }) {
  const [myCursor, setMyCursor] = useState<PartialCursor | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [others, setOthers] = useState<CursorsMap>({});

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    party: "cursors",
    room: "shared-cursors",
  });

  useEffect(() => {
    if (socket) {
      setMyId(socket._pk);
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      const onMessage = (evt: WebSocketEventMap["message"]) => {
        const msg = JSON.parse(evt.data as string);
        switch (msg.type) {
          case "sync":
            const newOthers = { ...msg.cursors };
            setOthers(newOthers);
            break;
          case "update":
            const other = {
              x: msg.x,
              y: msg.y,
              country: msg.country,
              lastUpdate: msg.lastUpdate,
              pointer: msg.pointer,
            };
            setOthers((others) => ({ ...others, [msg.id]: other }));
            break;
          case "remove":
            setOthers((others) => {
              const newOthers = { ...others };
              delete newOthers[msg.id];
              return newOthers;
            });
            break;
        }
      };
      socket.addEventListener("message", onMessage);

      return () => {
        // @ts-ignore
        socket.removeEventListener("message", onMessage);
      };
    }
  }, [socket]);

  // Track window dimensions
  useEffect(() => {
    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Always track the mouse position
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!socket) return;
      if (!dimensions.width || !dimensions.height) return;
      const cursor = {
        x: e.clientX / dimensions.width,
        y: e.clientY / dimensions.height,
        pointer: "mouse",
      } as PartialCursor;
      socket.send(JSON.stringify(cursor));
      setMyCursor(cursor);
    };
    window.addEventListener("mousemove", onMouseMove);

    // Also listen for touch events
    const onTouchMove = (e: TouchEvent) => {
      if (!socket) return;
      if (!dimensions.width || !dimensions.height) return;
      e.preventDefault();
      const cursor = {
        x: e.touches[0].clientX / dimensions.width,
        y: e.touches[0].clientY / dimensions.height,
        pointer: "touch",
      } as PartialCursor;
      socket.send(JSON.stringify(cursor));
      setMyCursor(cursor);
    };
    window.addEventListener("touchmove", onTouchMove);

    // Catch the end of touch events
    const onTouchEnd = (e: TouchEvent) => {
      if (!socket) return;
      socket.send(JSON.stringify({}));
      setMyCursor(null);
    };
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [socket, dimensions]);

  const getCount = () => {
    const othersCount = Object.keys(others).length;
    return othersCount + (myCursor ? 1 : 0);
  };

  return (
    <CursorsContext.Provider
      value={{
        others: others,
        myCursor: myCursor,
        myId: myId,
        windowDimensions: dimensions,
        getCount: getCount,
      }}
    >
      <ConnectionStatus socket={socket} />
      {props.children}
    </CursorsContext.Provider>
  );
}
