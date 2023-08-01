import CursorsProvider from "./cursors-provider";
import Cursors from "./Cursors";

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CursorsProvider>
        <main className="p-6 relative">
            <Cursors />
            {children}
        </main>
    </CursorsProvider>
  );
}
