import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { User } from "@/party/utils/auth";
import Link from "next/link";
import { Room } from "./Room";
import PresenceBar from "./PresenceBar";
import ClearRoomButton from "./ClearRoomButton";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;
const protocol =
  host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
    ? "http"
    : "https";

const party = "chatroom";

export const revalidate = 0;

export default async function ChatRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  // fetch initial data on the server
  const url = `${protocol}://${host}/parties/${party}/${params.roomId}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const room = res.status === 404 ? null : await res.json();
  const session = await getServerSession(authOptions);
  const user = session?.user as User | null;

  console.log("Server rendering", room?.messages);

  return (
    <div className="w-full flex flex-col gap-4 justify-between items-start">
      <div className="flex flex-wrap justify-start items-center gap-x-4 gap-y-2">
        <Link href="/chat" className="text-stone-400 whitespace-nowrap">
          &lt;- All Rooms
        </Link>
        <ClearRoomButton roomId={params.roomId} />
      </div>
      {room ? (
        <>
          <div className="w-full flex flex-row justify-between items-start pb-6">
            <div>
              <h1 className="text-4xl font-medium">{params.roomId}</h1>
            </div>
            <PresenceBar roomId={params.roomId} />
          </div>

          <Room
            host={host}
            party={party}
            user={user}
            room={params.roomId}
            messages={room.messages ?? []}
          />
        </>
      ) : (
        <h1 className="text-4xl font-medium">Room not found</h1>
      )}
    </div>
  );
}
