"use client";

import { useState, useTransition } from "react";
import { addNetWorthSnapshot } from "@/app/actions/goals";
import { todayISO } from "@/lib/calc";

export default function NetWorthForm() {
  const [date, setDate] = useState(todayISO());
  const [amt, setAmt] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amt.replace(/[$,]/g, ""));
    if (isNaN(n)) return;
    start(async () => {
      await addNetWorthSnapshot(date, n);
      setAmt("");
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
      />
      <input
        type="text"
        inputMode="decimal"
        placeholder="$ net worth"
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
        className="w-36 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-right text-sm"
      />
      <button
        type="submit"
        disabled={pending || !amt}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? "..." : "Save"}
      </button>
    </form>
  );
}
