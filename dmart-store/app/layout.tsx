import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DMart Store — Agent Demo",
  description:
    "Demo grocery catalog with REST APIs, semantic markup, and cart — built for agentic AI workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">{children}</main>
      </body>
    </html>
  );
}
