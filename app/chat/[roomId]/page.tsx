import { Room } from "./Room";
import { Message } from "@/party/chatRoom";
import PartySocket from "partysocket";

export const runtime = "edge";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;
const protocol = host?.startsWith("localhost") ? "http" : "https";
const party = "chatroom";

export default async function ChatRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const socket = new PartySocket({ host, party, room: params.roomId });
  const messages = (await Promise.race([
    new Promise((resolve) => {
      socket.addEventListener("message", (e) => {
        const message = JSON.parse(e.data);
        if (message.type === "sync") resolve(message.messages);
      });
    }),
    new Promise((resolve) => {
      setTimeout(() => resolve([]), 2000);
    }),
  ]).finally(() => socket.close())) as Message[];

  return (
    <div className="p-4 h-screen w-screen">
      <h1 className="text-4xl font-medium pb-2 h-20">{params.roomId}</h1>
      <Room
        host={host}
        party={party}
        room={params.roomId}
        messages={messages ?? []}
      />
    </div>
  );
}
