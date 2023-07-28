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

  console.log(rooms);

  return (
    <ul className="flex flex-col space-y-2">
      {rooms.map((room) => (
        <Link
          key={room.id}
          className="flex justify-between border-2 border-black px-3 py-2 rounded hover:bg-gray-100"
          href={`/chat/${room.id}`}
        >
          <span className="flex space-x-2">
            <span>{room.id}</span>
            <span>
              {room.users?.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={u.username}
                  alt={u.username}
                  src={u.image}
                  className={`w-6 h-6 rounded-full ${
                    u.present ? "" : "opacity-30"
                  }`}
                />
              ))}
            </span>
          </span>
          <span>
            <span className="bg-black rounded-full px-4 py-1 text-white">
              {room.connections}
              <span className="hidden sm:inline"> connections</span>
            </span>
          </span>
        </Link>
      ))}
    </ul>
  );
};
