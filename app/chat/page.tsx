import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import { RoomList } from "./RoomList";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
const protocol = host?.startsWith("localhost") ? "http" : "https";
const partyUrl = `${protocol}://${host}/parties/chatrooms/${SINGLETON_ROOM_ID}`;

export const revalidate = 0;

export default async function RoomListPage() {
  console.log("host", host);
  console.log("protocol", protocol);
  console.log("partyUrl", partyUrl);

  let rooms = [] as RoomInfo[];
  try {
    const res = await fetch(partyUrl, { next: { revalidate: 0 } });
    console.log("ok?", res.ok);
    console.log("status", res.status);
    if (res.ok) {
      rooms = ((await res.json()) ?? []) as RoomInfo[];
      console.log("rooms", rooms);
    } else {
      console.log("fail", await res.text());
    }
  } catch (e) {
    console.error("Fetching rooms failed with error", e);
  }

  return (
    <div>
      <h1 className="text-4xl font-medium pb-6">Chat Rooms</h1>
      <RoomList initialRooms={rooms} />
    </div>
  );
}
