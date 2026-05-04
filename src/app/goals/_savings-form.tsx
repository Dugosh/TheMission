"use client";

import { useState, useTransition } from "react";
import { addSavingsSnapshot } from "@/app/actions/goals";
import { todayISO } from "@/lib/calc";

export default function SavingsForm() {
  const [date, setDate] = useState(todayISO());
  const [bal, setBal] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(bal.replace(/[$,]/g, ""));
    if (isNaN(n)) return;
    start(async () => {
      await addSavingsSnapshot(date, n);
      setBal("");
    });
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm flex-1"
      />
      <input
        type="text"
        inputMode="decimal"
        placeholder="$ balance"
        value={bal}
        onChange={(e) => setBal(e.target.value)}
        className="rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm w-32 text-right"
      />
      <button
        type="submit"
        disabled={pending || !bal}
        className="rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? "..." : "Save"}
      </button>
    </form>
  );
}
