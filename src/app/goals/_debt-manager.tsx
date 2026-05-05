"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, Pencil, Plus, X, Check, GripVertical } from "lucide-react";
import { Debt } from "@/lib/types";
import {
  createDebt,
  updateDebt,
  archiveDebt,
  reorderDebts,
} from "@/app/actions/goals";
import { fmtMoney } from "@/lib/calc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  debts: Debt[];
  paidByDebtId: Record<string, number>;
};

export default function DebtManager({ debts, paidByDebtId }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Local optimistic order — keeps drag results visible during server round-trip.
  const [order, setOrder] = useState<Debt[]>(debts);

  // Re-sync if the server list changes (add/edit/archive/refresh).
  useEffect(() => {
    setOrder(debts);
  }, [debts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = order.findIndex((d) => d.id === active.id);
    const newIdx = order.findIndex((d) => d.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = arrayMove(order, oldIdx, newIdx);
    setOrder(next); // optimistic
    void reorderDebts(next.map((d) => d.id));
  }

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={order.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {order.map((d) => (
              <SortableDebtItem
                key={d.id}
                debt={d}
                paid={paidByDebtId[d.id] ?? 0}
                editing={editingId === d.id}
                onStartEdit={() => setEditingId(d.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableDebtItem({
  debt,
  paid,
  editing,
  onStartEdit,
  onCancelEdit,
}: {
  debt: Debt;
  paid: number;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: debt.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto" as const,
  };

  const remaining = Math.max(0, Number(debt.initial_balance) - paid);
  const pctPaid =
    debt.initial_balance > 0
      ? Math.min(100, (paid / Number(debt.initial_balance)) * 100)
      : 0;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-zinc-950 p-3 ${
        isDragging
          ? "border-zinc-500 shadow-lg shadow-black/40"
          : "border-zinc-800"
      }`}
    >
      {editing ? (
        <EditDebtForm debt={debt} onDone={onCancelEdit} />
      ) : (
        <>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <button
                type="button"
                aria-label="Drag to reorder"
                className="-ml-1 mt-0.5 cursor-grab touch-none rounded p-1 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300 active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical size={16} />
              </button>
              <div className="min-w-0">
                <div className="font-medium truncate">{debt.name}</div>
                <div className="text-xs text-zinc-500">
                  {fmtMoney(Number(debt.initial_balance))} initial ·{" "}
                  {fmtMoney(remaining)} left
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={onStartEdit}
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              >
                <Pencil size={14} />
              </button>
              <ArchiveButton debt={debt} />
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
