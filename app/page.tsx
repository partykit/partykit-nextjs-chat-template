import Link from "next/link";

export default function Home() {
  return (
    <main className="p-4">
      <Link href="/chat" className="underline">
        Chat
      </Link>
    </main>
  );
}
