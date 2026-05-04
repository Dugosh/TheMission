"use client";

import { useState, useTransition } from "react";
import { addDebtPayment } from "@/app/actions/goals";
import { todayISO } from "@/lib/calc";

const TYPES = [
  { value: "credit_card", label: "Credit cards" },
  { value: "irs", label: "IRS" },
  { value: "student_loan", label: "Student loans" },
] as const;

export default function DebtForm() {
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>(
    "credit_card"
  );
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount.replace(/[$,]/g, ""));
    if (isNaN(n) || n <= 0) return;
    start(async () => {
      await addDebtPayment({ date, debt_type: type, amount: n });
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
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={
              "flex-1 rounded border px-2 py-1.5 text-xs " +
              (type === t.value
                ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold"
                : "border-zinc-800 text-zinc-400")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending || !amount}
        className="w-full rounded bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Add payment"}
      </button>
    </form>
  );
}
