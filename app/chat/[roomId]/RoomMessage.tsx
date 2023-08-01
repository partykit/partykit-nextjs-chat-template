export default function RoomMessage(props: { message: any; isMe: boolean }) {
  const { message, isMe } = props;

  if (message.from.id === "system") {
    return (
      <li className="text-stone-400 flex flex-col justify-center items-center gap-1">
        <span className="font-mono text-sm">{message.text}</span>
        <span className="text-xs">
          {new Date(message.at).toLocaleTimeString()}
        </span>
      </li>
    );
  } else {
    return (
      <li
        className={`flex flex-col justify-center gap-1 ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        <span className="bg-stone-100 p-2 rounded-sm">{message.text}</span>
        <span className="text-xs text-stone-400">
          {new Date(message.at).toLocaleTimeString()}
        </span>
      </li>
    );
  }
}
