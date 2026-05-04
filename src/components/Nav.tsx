"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Today" },
  { href: "/goals", label: "Goals" },
  { href: "/todos", label: "Todos" },
  { href: "/history", label: "History" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-zinc-900 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto max-w-2xl grid grid-cols-4">
        {links.map((l) => {
          const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                "py-3 text-center text-xs uppercase tracking-wider " +
                (active
                  ? "text-zinc-100 font-semibold"
                  : "text-zinc-500 hover:text-zinc-300")
              }
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
