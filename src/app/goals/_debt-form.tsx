"use client";

import { useState, useTransition } from "react";
import { addDebtPayment } from "@/app/actions/goals";
import { Debt } from "@/lib/types";
import { todayISO } from "@/lib/calc";

export default function DebtForm({ debts }: { debts: Debt[] }) {
  const [date, setDate] = useState(todayISO());
  const [debtId, setDebtId] = useState<string>(debts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();

  if (debts.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-500">
        Add a debt account first.
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(/[$,]/g, ""));
    if (isNaN(n) || n <= 0 || !debtId) return;
    start(async () => {
      await addDebtPayment({ date, debt_id: debtId, amount: n });
      setAmount("");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Log payment
      </h3>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm flex-1"
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="$ amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm w-32 text-right"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {debts.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDebtId(d.id)}
            className={
              "rounded-full border px-3 py-1.5 text-xs " +
              (debtId === d.id
                ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold"
                : "border-zinc-800 text-zinc-400")
            }
          >
            {d.name}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending || !amount || !debtId}
        className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Add payment"}
      </button>
    </form>
  );
}
