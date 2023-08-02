import Link from "next/link";

export default function Footer() {
  return (
    <footer className="p-6 w-full">
      <div className="pt-4 max-w-7xl m-auto text-sm text-stone-400 flex flex-row justify-between">
        <div className="flex flex-col gap-2 justify-start">
          <h2>
            PartyKit Next.js Chat Template {" "}
            (also a <Link href="/garden" className="underline">tiny garden</Link>)
          </h2>
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
              className="bg-stone-200 hover:bg-stone-300 p-2 rounded text-stone-600"
            >
              View on GitHub
            </Link>
        </div>
      </div>
    </footer>
  );
}
