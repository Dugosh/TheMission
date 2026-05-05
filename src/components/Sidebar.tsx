"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Target,
  ListChecks,
  Calendar,
  Menu,
  X,
  LogOut,
  Flame,
} from "lucide-react";

const links = [
  { href: "/", label: "Today", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/todos", label: "Todos", icon: ListChecks },
  { href: "/history", label: "History", icon: Calendar },
];

type Props = {
  cleanStreak: number;
};

export default function Sidebar({ cleanStreak }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // close on route change
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // lock body scroll while open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/90 backdrop-blur lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop on mobile */}
      <div
        onClick={() => setOpen(false)}
        className={
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />

      {/* Sidebar */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-900 bg-zinc-950 transition-transform " +
          "lg:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        {/* Brand + close */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-900 px-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
            <span className="text-sm font-bold uppercase tracking-[0.18em]">
              Mission Board
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-zinc-500 hover:text-zinc-200"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Streak hero */}
        <div className="px-5 pt-5">
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Clean streak
                </div>
                <div
                  className={
                    "mt-0.5 text-3xl font-black tabular-nums leading-none " +
                    (cleanStreak > 0
                      ? "text-emerald-300 [text-shadow:0_0_18px_rgba(52,211,153,0.4)]"
                      : "text-zinc-700")
                  }
                >
                  {cleanStreak}
                </div>
              </div>
              {cleanStreak > 0 && (
                <Flame
                  size={22}
                  strokeWidth={1.75}
                  className="text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {links.map((l) => {
              const active =
                l.href === "/"
                  ? path === "/"
                  : path === l.href || path.startsWith(l.href + "/");
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                      (active
                        ? "bg-zinc-900 text-zinc-100"
                        : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200")
                    }
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2 : 1.5}
                      className={active ? "text-emerald-400" : ""}
                    />
                    {l.label}
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-900 px-3 py-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs uppercase tracking-wider text-zinc-500 transition hover:bg-zinc-900/50 hover:text-zinc-300"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
