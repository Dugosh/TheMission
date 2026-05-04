"use client";

import { useState, useTransition } from "react";
import { upsertRevenue } from "@/app/actions/goals";
import { RevenueEntry } from "@/lib/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function RevenueForm({
  year,
  entries,
}: {
  year: number;
  entries: RevenueEntry[];
}) {
  const map = new Map(entries.map((e) => [e.month, Number(e.amount)]));
  const [pending, start] = useTransition();
  const [edits, setEdits] = useState<Record<string, string>>({});

  function commit(month: string) {
    const v = edits[month];
    if (v == null) return;
    const n = parseFloat(v.replace(/[$,]/g, ""));
    if (isNaN(n)) return;
    start(async () => {
      await upsertRevenue(month, n);
      setEdits((p) => {
        const c = { ...p };
        delete c[month];
        return c;
      });
    });
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Monthly revenue
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MONTHS.map((m, i) => {
          const month = `${year}-${String(i + 1).padStart(2, "0")}-01`;
          const current = map.get(month);
          const editing = edits[month];
          const display =
            editing != null
              ? editing
              : current != null
              ? current.toString()
              : "";
          return (
            <label
              key={month}
              className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2"
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                {m}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={display}
                onChange={(e) =>
                  setEdits((p) => ({ ...p, [month]: e.target.value }))
                }
                onBlur={() => commit(month)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    (e.target as HTMLInputElement).blur();
                }}
                placeholder="$0"
                disabled={pending}
                className="w-full bg-transparent text-base tabular-nums focus:outline-none"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
