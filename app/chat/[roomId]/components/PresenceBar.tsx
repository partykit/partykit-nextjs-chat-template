"use client";

import { useState } from "react";
import usePartySocket from "partysocket/react";
import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import Avatar from "@/app/components/Avatar";
import { PARTYKIT_HOST } from "@/app/env";

export default function PresenceBar(props: { roomId: string }) {
  const [room, setRoom] = useState<RoomInfo | null>(null);

  usePartySocket({
    host: PARTYKIT_HOST,
    party: "chatrooms",
    room: SINGLETON_ROOM_ID,
    onMessage(event: MessageEvent<string>) {
      const rooms = JSON.parse(event.data) as RoomInfo[];
      const room = rooms.find((room) => room.id === props.roomId);
      setRoom(room ?? null);
    },
  });

  if (!room) return;

  return (
    <div className="flex flex-reverse row -space-x-2">
      {room.users.map((user) => (
        <Avatar
          key={user.username}
          username={user.username}
          image={user.image ?? null}
        />
      ))}
    </div>
  );
}
