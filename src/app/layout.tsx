import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { isAuthed } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Protocol",
  description: "Daily habit + goal tracker",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        {authed && <Nav />}
        <main className="pb-24">{children}</main>
      </body>
    </html>
  );
}
