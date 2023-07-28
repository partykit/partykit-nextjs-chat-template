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
        <li key={room.id} className="flex space-x-2">
          <Link className="text-xl hover:underline" href={`/chat/${room.id}`}>
            # {room.id}
          </Link>
          <span>
            {room.users?.map((u) => (
              <a key={u.username} title={u.username}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img
                  alt={u.username}
                  src={u.image}
                  className={`w-6 h-6 rounded-full mt-0.5 ${
                    u.present ? "" : "opacity-30"
                  }`}
                />
              </a>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
};
