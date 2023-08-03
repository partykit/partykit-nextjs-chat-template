import Image from "next/image";

export default function Avatar(props: {
  username: string;
  image: string | null;
  variant?: "normal" | "ghost";
}) {
  const { username, image } = props;
  const variant = props.variant ?? "normal";

  return (
    <div className="bg-white relative w-8 h-8 rounded-full outline outline-1 outline-stone-200">
      <Image
        src={image ?? ""}
        alt={username}
        width="128"
        height="128"
        className={`rounded-full ${variant === "ghost" ? "opacity-30" : ""}`}
      />
    </div>
  );
}
