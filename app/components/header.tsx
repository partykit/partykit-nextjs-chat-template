export default function Header() {
    return (
      <header className="p-6 w-full border-b border-stone-300 absolute sticky top-0 bg-white/80 backdrop-blur">
        <nav className="max-w-7xl m-auto flex justify-between items-center">
            <h1 className="font-medium">Chat Template</h1>
            <p>
                @TODO sign in / sign out
            </p>
        </nav>
      </header>
    );
}