"use client";
"use client";

const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST!;
const protocol =
  host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
    ? "http"
    : "https";

export default function ClearRoomButton(props: { roomId: string }) {
  const clearRoom = () => {
    fetch(`${protocol}://${host}/parties/chatroom/${props.roomId}`, {
      method: "DELETE",
    });
  };
  return (
    <button className="hover:underline text-gray-400" onClick={clearRoom}>
      Clear room
    </button>
  );
}
