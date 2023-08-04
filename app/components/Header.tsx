import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { User } from "@/party/utils/auth";
import Link from "next/link";
import Signout from "./Signout";
import Avatar from "./Avatar";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const user = session?.user as User | null;

  return (
    <header className="z-10 p-4 sm:p-6 w-full border-b border-stone-300 absolute sticky top-0 bg-white/80 backdrop-blur">
      <nav className="max-w-7xl m-auto flex justify-between items-center">
        <Link href="/">
          <h1 className="font-medium my-2">🎈Starter Kit</h1>
        </Link>
        {user && (
          <div className="flex gap-2 items-center">
            <Avatar username={user.username} image={user.image ?? null} />
            <span>Hi {user.username}!</span>
            <Signout />
          </div>
        )}
      </nav>
    </header>
  );
}
