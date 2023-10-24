import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-4 px-4 sm:px-6 w-full">
      <div className="pt-4 max-w-7xl m-auto text-sm text-stone-400 flex flex-row justify-between">
        <div className="flex flex-col gap-1 justify-start">
          <h2>PartyKit Next.js Starter Kit</h2>
          <p>
            Built with{" "}
            <Link href="https://nextjs.org" className="underline">
              Next.js
            </Link>{" "}
            and{" "}
            <Link href="https://partykit.io" className="underline">
              PartyKit
            </Link>
          </p>
        </div>
        <div className="flex flex-col justify-end">
          <Link
            href="https://github.com/partykit/partykit-nextjs-chat-template"
            className="bg-stone-200 hover:bg-stone-300 p-2 rounded text-stone-600 whitespace-nowrap"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
