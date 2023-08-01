import Header from "@/app/components/header"
import Footer from "@/app/components/footer"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between min-h-screen">
        <Header />
        <main className="p-6 flex-grow">
            {children}
        </main>
        <Footer />
    </div>
  );
}
