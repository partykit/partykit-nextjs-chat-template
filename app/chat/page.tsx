import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import { RoomList } from "./RoomList";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
const protocol =
  host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
    ? "http"
    : "https";
const partyUrl = `${protocol}://${host}/parties/chatrooms/${SINGLETON_ROOM_ID}`;

export const revalidate = 0;

export default async function RoomListPagePage() {
  const res = await fetch(partyUrl, { next: { revalidate: 0 } });
  const rooms = ((await res.json()) ?? []) as RoomInfo[];

  return (
    <div>
      <h1 className="text-4xl font-medium pb-6">Chat Rooms</h1>
      <RoomList initialRooms={rooms} />
    </div>
  );
}
