import Link from 'next/link';

export default function Footer() {
    return (
      <footer className="p-6 w-full">
        <div className="max-w-7xl m-auto text-sm text-stone-400 flex flex-col gap-2">
            <h2>
                PartyKit Next.js Chat Template
            </h2>
            <p>
                Built with <Link href="https://nextjs.org" className="underline">Next.js</Link> and <Link href="https://partykit.io" className="underline">PartyKit</Link>
            </p>
        </div>
      </footer>
    );
}