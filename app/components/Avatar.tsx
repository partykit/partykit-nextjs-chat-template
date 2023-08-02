import Image from "next/image";

export default function Avatar(props: {
  username: string;
  image: string | null;
  variant?: "normal" | "ghost";
}) {
  const { username, image } = props;
  const variant = props.variant ?? "normal";

  return (
    <Image
      src={image ?? ""}
      alt={username}
      width="128"
      height="128"
      className={`w-8 h-8 rounded-full bg-stone-200 ${
        variant === "ghost" ? "opacity-30" : ""
      }`}
    />
  );
}
