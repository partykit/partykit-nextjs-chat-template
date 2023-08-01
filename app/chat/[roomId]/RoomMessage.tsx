import { useEffect, useState } from "react";
import type { Message } from "@/party/chatRoom";

export default function RoomMessage(props: { message: Message, isMe: boolean }) {
    const { message, isMe } = props;
    const [formattedDate, setFormattedDate] = useState<string|null>();
  
    // Format the date on the client to avoid hydration mismatch
    useEffect(() => (
        setFormattedDate(new Date(message.at).toLocaleTimeString())
    ), [message.at]);    

    if (message.from.id === "system") {
        return (
            <li className="text-stone-400 flex flex-col justify-center items-center gap-1">
                <span className="font-mono text-sm">{ message.text }</span>
                <span className="text-xs">{ formattedDate }</span>
            </li>
        )
    }
    else {
        return (
            <li className={`flex flex-col justify-center gap-1 ${isMe ? "items-end" : "items-start"}`}>
                <span className="bg-stone-100 px-2 py-1 rounded-sm">{ message.text }</span>
                <span className="text-xs text-stone-400">{ formattedDate ?? <>&nbsp;</> }</span>
            </li>
        )
    }
}