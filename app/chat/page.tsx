import { generateSlug, RandomWordOptions } from "random-word-slugs";
import { RoomInfo, SINGLETON_ROOM_ID } from "@/party/chatRooms";
import { RoomList } from "./RoomList";
import NewRoom from "./NewRoom";

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

  const options: RandomWordOptions<3> = {
    format: "kebab",
    categories: {
      noun: ["animals"],
    },
    partsOfSpeech: ["adjective", "adjective", "noun"],
  };

  const slug = generateSlug(3, options);


  return (
    <div className="w-full flex flex-col gap-6">
      <h1 className="text-4xl font-medium">Chat Rooms</h1>
      <RoomList initialRooms={rooms} />
      <NewRoom slug={slug} />
    </div>
  );
}
