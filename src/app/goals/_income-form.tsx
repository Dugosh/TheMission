"use client";

import { useState, useTransition } from "react";
import { upsertPersonalIncome } from "@/app/actions/goals";
import { PersonalIncomeEntry } from "@/lib/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function IncomeForm({
  year,
  entries,
}: {
  year: number;
  entries: PersonalIncomeEntry[];
}) {
  const map = new Map(entries.map((e) => [e.month, Number(e.amount)]));
  const [pending, start] = useTransition();
  const [focused, setFocused] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  function commit(month: string) {
    const raw = edits[month];
    if (raw == null) {
      setFocused(null);
      return;
    }
    const cleaned = raw.replace(/[^0-9.]/g, "");
    if (cleaned === "") {
      start(async () => {
        await upsertPersonalIncome(month, 0);
        setEdits((p) => {
          const c = { ...p };
          delete c[month];
          return c;
        });
        setFocused(null);
      });
      return;
    }
    const n = parseFloat(cleaned);
    if (isNaN(n)) {
      setFocused(null);
      return;
    }
    start(async () => {
      await upsertPersonalIncome(month, n);
      setEdits((p) => {
        const c = { ...p };
        delete c[month];
        return c;
      });
      setFocused(null);
    });
  }

  function fmtMoney(n: number): string {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Monthly take-home
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MONTHS.map((m, i) => {
          const month = `${year}-${String(i + 1).padStart(2, "0")}-01`;
          const current = map.get(month);
          const isFocused = focused === month;
          const editing = edits[month];

          let display: string;
          if (isFocused) {
            display = editing != null
              ? editing
              : current != null ? String(current) : "";
          } else {
            display = current != null && current > 0 ? fmtMoney(current) : "";
          }

          return (
            <label
              key={month}
              className={
                "rounded-xl border px-3 py-2 transition " +
                (isFocused
                  ? "border-emerald-500 bg-zinc-950"
                  : current != null && current > 0
                    ? "border-emerald-700/40 bg-zinc-950"
                    : "border-zinc-800 bg-zinc-950")
              }
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                {m}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={display}
                onFocus={() => {
                  setFocused(month);
                  setEdits((p) => ({
                    ...p,
                    [month]: current != null ? String(current) : "",
                  }));
                }}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                  setEdits((p) => ({ ...p, [month]: cleaned }));
                }}
                onBlur={() => commit(month)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    (e.target as HTMLInputElement).blur();
                }}
                placeholder="$0"
                disabled={pending}
                className="w-full bg-transparent text-base font-semibold tabular-nums text-zinc-100 focus:outline-none placeholder:text-zinc-600"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
