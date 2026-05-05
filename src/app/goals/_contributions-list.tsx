"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { WealthContribution } from "@/lib/types";
import {
  deleteContribution,
  updateContribution,
} from "@/app/actions/goals";
import { fmtMoney } from "@/lib/calc";

type Props = {
  contributions: WealthContribution[];
};

export default function ContributionsList({ contributions }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (contributions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-xs text-zinc-600">
        No contributions yet
      </p>
    );
  }

  return (
    <ul className="space-y-1 text-sm">
      {contributions.slice(0, 10).map((c) =>
        editingId === c.id ? (
          <EditRow
            key={c.id}
            contribution={c}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <ViewRow
            key={c.id}
            contribution={c}
            onEdit={() => setEditingId(c.id)}
          />
        )
      )}
    </ul>
  );
}

function ViewRow({
  contribution,
  onEdit,
}: {
  contribution: WealthContribution;
  onEdit: () => void;
}) {
  const cash = Number(contribution.cash_amount);
  const inv = Number(contribution.invested_amount);
  return (
    <li className="group rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-zinc-500 tabular-nums">{contribution.date}</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {cash > 0 && (
              <span className="text-blue-400">+{fmtMoney(cash)} cash</span>
            )}
            {cash > 0 && inv > 0 && (
              <span className="mx-1 text-zinc-700">·</span>
            )}
            {inv > 0 && (
              <span className="text-blue-400">+{fmtMoney(inv)} inv</span>
            )}
          </span>
          <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={onEdit}
              aria-label="Edit"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
            >
              <Pencil size={13} />
            </button>
            <DeleteButton contribution={contribution} />
          </div>
        </div>
      </div>
      {contribution.notes && (
        <div className="mt-0.5 text-[11px] text-zinc-500">
          {contribution.notes}
        </div>
      )}
    </li>
  );
}

function EditRow({
  contribution,
  onDone,
}: {
  contribution: WealthContribution;
  onDone: () => void;
}) {
  const [date, setDate] = useState(contribution.date);
  const [cash, setCash] = useState(String(contribution.cash_amount));
  const [inv, setInv] = useState(String(contribution.invested_amount));
  const [notes, setNotes] = useState(contribution.notes ?? "");
  const [pending, start] = useTransition();

  function save() {
    const cashN = parseFloat(cash.replace(/[$,]/g, "")) || 0;
    const invN = parseFloat(inv.replace(/[$,]/g, "")) || 0;
    if (!cashN && !invN) return;
    start(async () => {
      await updateContribution(contribution.id, {
        date,
        cash_amount: cashN,
        invested_amount: invN,
        notes,
      });
      onDone();
    });
  }

  return (
    <li className="rounded-lg border border-blue-700/40 bg-blue-950/10 px-3 py-2">
      <div className="flex flex-col gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Cash
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-right tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Invested
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={inv}
              onChange={(e) => setInv(e.target.value)}
              className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-right tabular-nums"
            />
          </label>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 flex items-center justify-center gap-1 rounded border border-zinc-800 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900"
          >
            <X size={12} />
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-1 rounded bg-zinc-100 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-50"
          >
            <Check size={12} />
            {pending ? "..." : "Save"}
          </button>
        </div>
      </div>
    </li>
  );
}

function DeleteButton({
  contribution,
}: {
  contribution: WealthContribution;
}) {
  const [pending, start] = useTransition();
  function remove() {
    const cash = Number(contribution.cash_amount);
    const inv = Number(contribution.invested_amount);
    const summary =
      [
        cash > 0 ? `+${fmtMoney(cash)} cash` : null,
        inv > 0 ? `+${fmtMoney(inv)} inv` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "this contribution";
    if (
      !confirm(
        `Delete this contribution from ${contribution.date}?\n\n${summary}\n\nThis cannot be undone.`
      )
    )
      return;
    start(async () => await deleteContribution(contribution.id));
  }
  return (
    <button
      onClick={remove}
      disabled={pending}
      aria-label="Delete"
      className="rounded p-1 text-zinc-500 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 size={13} />
    </button>
  );
}
