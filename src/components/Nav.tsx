"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, ListChecks, Calendar } from "lucide-react";

const links = [
  { href: "/", label: "Today", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/todos", label: "Todos", icon: ListChecks },
  { href: "/history", label: "History", icon: Calendar },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-zinc-900 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0.25rem)",
      }}
    >
      <div className="mx-auto max-w-2xl grid grid-cols-4">
        {links.map((l) => {
          const active =
            l.href === "/"
              ? path === "/"
              : path === l.href || path.startsWith(l.href + "/");
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wider transition " +
                (active
                  ? "text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300")
              }
            >
              <Icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                className={active ? "text-emerald-400" : ""}
              />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
