"use client";

import { useState, useTransition } from "react";
import { Trash2, Pencil, Plus, X, Check } from "lucide-react";
import { Debt } from "@/lib/types";
import {
  createDebt,
  updateDebt,
  archiveDebt,
} from "@/app/actions/goals";
import { fmtMoney } from "@/lib/calc";

type Props = {
  debts: Debt[];
  paidByDebtId: Record<string, number>;
};

export default function DebtManager({ debts, paidByDebtId }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Accounts
        </h3>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
        >
          {adding ? <X size={12} /> : <Plus size={12} />}
          {adding ? "Cancel" : "Add debt"}
        </button>
      </div>

      {adding && <AddDebtForm onDone={() => setAdding(false)} />}

      <ul className="space-y-2">
        {debts.map((d) => {
          const paid = paidByDebtId[d.id] ?? 0;
          const remaining = Math.max(0, Number(d.initial_balance) - paid);
          const pctPaid =
            d.initial_balance > 0
              ? Math.min(100, (paid / Number(d.initial_balance)) * 100)
              : 0;
          return (
            <li
              key={d.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
            >
              {editingId === d.id ? (
                <EditDebtForm
                  debt={d}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-zinc-500">
                        {fmtMoney(Number(d.initial_balance))} initial ·{" "}
                        {fmtMoney(remaining)} left
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingId(d.id)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                      >
                        <Pencil size={14} />
                      </button>
                      <ArchiveButton debt={d} />
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${pctPaid}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                    <span>{fmtMoney(paid)} paid</span>
                    <span>{pctPaid.toFixed(1)}%</span>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddDebtForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(bal.replace(/[$,]/g, ""));
    if (!name.trim() || isNaN(n) || n < 0) return;
    start(async () => {
      await createDebt({ name: name.trim(), initial_balance: n });
      setName("");
      setBal("");
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-xl border border-amber-700/40 bg-amber-950/10 p-3"
    >
      <input
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Debt name (e.g. Personal loan)"
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <input
        type="text"
        inputMode="decimal"
        value={bal}
        onChange={(e) => setBal(e.target.value)}
        placeholder="$ initial balance"
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || !name.trim() || !bal}
        className="rounded-lg bg-amber-500 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50"
      >
        {pending ? "..." : "Add debt"}
      </button>
    </form>
  );
}

function EditDebtForm({
  debt,
  onDone,
}: {
  debt: Debt;
  onDone: () => void;
}) {
  const [name, setName] = useState(debt.name);
  const [bal, setBal] = useState(String(debt.initial_balance));
  const [pending, start] = useTransition();

  function save() {
    const n = parseFloat(bal.replace(/[$,]/g, ""));
    if (!name.trim() || isNaN(n) || n < 0) return;
    start(async () => {
      await updateDebt(debt.id, {
        name: name.trim(),
        initial_balance: n,
      });
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <input
        type="text"
        inputMode="decimal"
        value={bal}
        onChange={(e) => setBal(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          <Check size={14} />
          Save
        </button>
      </div>
    </div>
  );
}

function ArchiveButton({ debt }: { debt: Debt }) {
  const [pending, start] = useTransition();
  function archive() {
    if (!confirm(`Archive "${debt.name}"? Existing payments stay in history.`))
      return;
    start(async () => await archiveDebt(debt.id));
  }
  return (
    <button
      onClick={archive}
      disabled={pending}
      className="rounded p-1.5 text-zinc-500 hover:bg-red-950/40 hover:text-red-400"
    >
      <Trash2 size={14} />
    </button>
  );
}
