import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between min-h-screen relative">
      <Header />
      <main className="p-6 flex-grow">
        <div className="max-w-7xl m-auto">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
