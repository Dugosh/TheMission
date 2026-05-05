"use client";

import { useState, useTransition } from "react";
import { addContribution } from "@/app/actions/goals";
import { todayISO } from "@/lib/calc";

export default function SavingsForm() {
  const [date, setDate] = useState(todayISO());
  const [cash, setCash] = useState("");
  const [invested, setInvested] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cashN = parseFloat(cash.replace(/[$,]/g, "")) || 0;
    const invN = parseFloat(invested.replace(/[$,]/g, "")) || 0;
    if (!cashN && !invN) return;
    start(async () => {
      await addContribution(date, cashN, invN, notes);
      setCash("");
      setInvested("");
      setNotes("");
    });
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">
            Cash deposit
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="$0"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-right tabular-nums"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">
            Invested deposit
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="$0"
            value={invested}
            onChange={(e) => setInvested(e.target.value)}
            className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-right tabular-nums"
          />
        </label>
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — e.g. Robinhood deposit"
        className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending || (!cash && !invested)}
        className="rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? "..." : "Add contribution"}
      </button>
    </form>
  );
}
