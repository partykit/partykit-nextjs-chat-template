import Image from "next/image";
import type { User } from "@/party/utils/auth";

export default function Avatar(props: {
  user: User;
  variant?: "normal" | "ghost";
}) {
  const { user } = props;
  const variant = props.variant ?? "normal";
  return (
    <Image
      src={user.image!}
      alt={user.username}
      width="128"
      height="128"
      className={`w-8 h-8 rounded-full bg-stone-200 ${
        variant === "ghost" ? "opacity-30" : ""
      }`}
    />
  );
}
