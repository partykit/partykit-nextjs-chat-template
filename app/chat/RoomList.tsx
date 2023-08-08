"use client";
import { useState } from "react";
import usePartySocket from "partysocket/react";
import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import RoomCard from "./components/RoomCard";
import ConnectionStatus from "../components/ConnectionStatus";
import { PARTYKIT_HOST } from "../env";

export const RoomList: React.FC<{ initialRooms: RoomInfo[] }> = ({
  initialRooms,
}) => {
  // render with initial data, update from websocket as messages arrive
  const [rooms, setRooms] = useState(initialRooms);

  // open a websocket connection to the server
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    party: "chatrooms",
    room: SINGLETON_ROOM_ID,
    onMessage(event: MessageEvent<string>) {
      setRooms(JSON.parse(event.data) as RoomInfo[]);
    },
  });

  return (
    <>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </ul>
      <ConnectionStatus socket={socket} />
    </>
  );
};
