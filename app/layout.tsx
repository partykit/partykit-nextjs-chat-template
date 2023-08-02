import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./components/Providers";
import Header from "./components/Header";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PartyKit Template",
  description: "Example of using PartyKit with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
        <div className="flex flex-col justify-between relative" style={{minHeight: "100dvh"}}>
          <Header />
          <div className="max-w-7xl m-auto flex-grow w-full flex flex-col justify-start items-start p-6">
            {children}
          </div>
          <Footer />
        </div>
        </Providers>
      </body>
    </html>
  );
}
