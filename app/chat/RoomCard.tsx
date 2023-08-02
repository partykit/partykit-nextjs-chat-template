import Link from "next/link";
import { RoomInfo } from "@/party/chatRooms";
import Avatar from "@/app/components/Avatar";

export default function RoomCard(props: { room: RoomInfo }) {
  const { room } = props;
  return (
    <li className="col-span-1 divide-y divide-stone-200">
      <Link href={`/chat/${room.id}`}>
        <div className="rounded-lg bg-white outline outline-1 outline-stone-200 shadow hover:shadow-md">
          <div className="flex w-full items-center justify-between p-6 space-x-6">
            <div className="flex-1 flex items-center">
              <h3 className="font-medium">{room.id}</h3>
            </div>

            <span>
              <span className="bg-stone-200 rounded-full px-4 py-1">
                {room.connections}
                <span> viewer{room.connections !== 1 && "s"}</span>
              </span>
            </span>
          </div>
          <div className="p-6">
            <span className="flex space-x-2">
              {room.users?.map((u) => (
                <Avatar
                  key={u.username}
                  user={u}
                  variant={u.present ? "normal" : "ghost"}
                />
              ))}
            </span>
          </div>
          <div className="flex w-full items-center justify-center p-6 space-x-6 border-t border-stone-200">
            Enter -&gt;
          </div>
        </div>
      </Link>
    </li>
  );
}
