import { getServerSession } from 'next-auth'
import { authOptions, UserSession } from "@/app/api/auth/[...nextauth]/route"
import Link from 'next/link';
import Image from 'next/image';
import Signout from './Signout';

export default async function Header() {
    const session = await getServerSession(authOptions);
    const user = session?.user as UserSession | null;

    return (
      <header className="p-6 w-full border-b border-stone-300 absolute sticky top-0 bg-white/80 backdrop-blur">
        <nav className="max-w-7xl m-auto flex justify-between items-center">
            <Link href="/"><h1 className="font-medium my-2">Chat Template</h1></Link>
            { user && (
                <div className="flex gap-2 items-center">
                    <Image src={user.image!} alt={`Avatar for ${user.username}`} width="128" height="128" className="w-8 h-8 rounded-full bg-stone-200" />
                    <span>Hi { user.username }!</span>
                    <Signout />
                </div>
            ) }
        </nav>
      </header>
    );
}