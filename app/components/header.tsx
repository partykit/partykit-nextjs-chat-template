import { getServerSession } from 'next-auth'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Image from 'next/image';
import Signout from './Signout';

export default async function Header() {
    const session = await getServerSession(authOptions)

    return (
      <header className="p-6 w-full border-b border-stone-300 absolute sticky top-0 bg-white/80 backdrop-blur">
        <nav className="max-w-7xl m-auto flex justify-between items-center">
            <h1 className="font-medium my-2">Chat Template</h1>
            { session?.user && (
                <div className="flex gap-2 items-center">
                    <Image src={session.user.image!} alt={`Avatar for ${session.user.username}`} width="128" height="128" className="w-8 h-8 rounded-full bg-stone-200" />
                    <span>Hi { session.user.username }!</span>
                    <Signout />
                </div>
            ) }
        </nav>
      </header>
    );
}