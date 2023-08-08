import { useEffect, useState } from "react";
import type { Message } from "@/party/utils/message";
import Avatar from "@/app/components/Avatar";

export default function RoomMessage(props: {
  message: Message;
  isMe: boolean;
}) {
  const { message, isMe } = props;
  const [formattedDate, setFormattedDate] = useState<string | null>();

  // Format the date on the client to avoid hydration mismatch
  useEffect(
    () => setFormattedDate(new Date(message.at).toLocaleTimeString()),
    [message.at]
  );

  if (message.from.id === "system") {
    return (
      <li className="text-stone-400 flex flex-col justify-center items-center text-center gap-1">
        <span className="font-mono text-sm">{message.text}</span>
        <span className="text-xs">{formattedDate}</span>
      </li>
    );
  } else {
    return (
      <li
        className={`flex justify-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}
      >
        <div className="grow-0">
          <Avatar
            username={message.from.id}
            image={message.from.image ?? null}
          />
        </div>
        <div className={`flex flex-col gap-1 ${isMe ? "items-end" : ""}`}>
          <span className="bg-stone-100 px-2 py-1 rounded-xl">
            {message.text}
          </span>
          <span className="text-xs text-stone-400">
            {formattedDate ?? <>&nbsp;</>}
          </span>
        </div>
      </li>
    );
  }
}
