import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { isAuthed } from "@/lib/auth";
import { getRecentLogs } from "@/app/actions/daily";
import { todayISO, isAllClean, streak } from "@/lib/calc";
import { DailyLog } from "@/lib/types";

export const metadata: Metadata = {
  title: "Protocol",
  description: "Daily habit + goal tracker",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

async function getStreakForSidebar(): Promise<number> {
  try {
    const logs = await getRecentLogs(180);
    const map = new Map<string, Partial<DailyLog>>();
    for (const r of logs) if (r.date) map.set(r.date, r);
    return streak(map, todayISO(), isAllClean);
  } catch {
    return 0;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();
  const cleanStreak = authed ? await getStreakForSidebar() : 0;

  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        {authed && <Sidebar cleanStreak={cleanStreak} />}
        <main
          className={
            "min-h-screen " + (authed ? "lg:pl-64" : "")
          }
        >
          {children}
        </main>
      </body>
    </html>
  );
}
