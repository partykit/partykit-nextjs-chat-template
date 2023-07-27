"use client";
import { useState } from "react";
import usePartySocket from "partysocket/react";
import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import Link from "next/link";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;

export const RoomList: React.FC<{ initialRooms: RoomInfo[] }> = ({
  initialRooms,
}) => {
  // render with initial data, update from websocket as messages arrive
  const [rooms, setRooms] = useState(initialRooms);

  usePartySocket({
    host,
    party: "chatrooms",
    room: SINGLETON_ROOM_ID,
    onMessage(event: MessageEvent<string>) {
      setRooms(JSON.parse(event.data) as RoomInfo[]);
    },
  });

  return (
    <ul>
      {rooms.map((room) => (
        <li key={room.id}>
          <Link className="underline" href={`/chat/${room.id}`}>
            # {room.id} ({room.connections} people)
          </Link>
        </li>
      ))}
    </ul>
  );
};
