"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Trash2,
  Pencil,
  Plus,
  X,
  Check,
  GripVertical,
  ChevronDown,
} from "lucide-react";
import { Debt, DEBT_CATEGORIES, DebtCategory } from "@/lib/types";
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
  const [order, setOrder] = useState<Debt[]>(debts);
  const [collapsed, setCollapsed] = useState<Set<DebtCategory>>(new Set());

  useEffect(() => {
    setOrder(debts);
  }, [debts]);

  // Group debts by category, in the canonical category order.
  const grouped = useMemo(() => {
    const map = new Map<DebtCategory, Debt[]>();
    for (const cat of DEBT_CATEGORIES) map.set(cat, []);
    for (const d of order) {
      const cat = (DEBT_CATEGORIES as readonly string[]).includes(d.category)
        ? d.category
        : ("Other" as DebtCategory);
      map.get(cat)!.push(d);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [order]);

  function toggleCollapse(cat: DebtCategory) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="space-y-4">
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

      <div className="space-y-3">
        {grouped.map(([cat, items]) => {
          const subtotalInitial = items.reduce(
            (s, d) => s + Number(d.initial_balance),
            0
          );
          const subtotalPaid = items.reduce(
            (s, d) => s + (paidByDebtId[d.id] ?? 0),
            0
          );
          const subtotalRemaining = Math.max(
            0,
            subtotalInitial - subtotalPaid
          );
          const isCollapsed = collapsed.has(cat);
          return (
            <CategoryGroup
              key={cat}
              category={cat}
              items={items}
              isCollapsed={isCollapsed}
              onToggle={() => toggleCollapse(cat)}
              subtotalInitial={subtotalInitial}
              subtotalPaid={subtotalPaid}
              subtotalRemaining={subtotalRemaining}
              paidByDebtId={paidByDebtId}
              editingId={editingId}
              setEditingId={setEditingId}
              setOrder={setOrder}
              order={order}
            />
          );
        })}
      </div>
    </div>
  );
}

function CategoryGroup({
  category,
  items,
  isCollapsed,
  onToggle,
  subtotalInitial,
  subtotalPaid,
  subtotalRemaining,
  paidByDebtId,
  editingId,
  setEditingId,
  setOrder,
  order,
}: {
  category: DebtCategory;
  items: Debt[];
  isCollapsed: boolean;
  onToggle: () => void;
  subtotalInitial: number;
  subtotalPaid: number;
  subtotalRemaining: number;
  paidByDebtId: Record<string, number>;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setOrder: React.Dispatch<React.SetStateAction<Debt[]>>;
  order: Debt[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    if (!ids.includes(String(over.id))) return; // dragged outside this group, ignore

    // Compute new global order: move within this category's slice
    const oldIdxLocal = items.findIndex((d) => d.id === active.id);
    const newIdxLocal = items.findIndex((d) => d.id === over.id);
    if (oldIdxLocal === -1 || newIdxLocal === -1) return;
    const newLocal = arrayMove(items, oldIdxLocal, newIdxLocal);

    // Rebuild global order: replace the items in this category with the
    // reordered list, preserving everything else.
    const otherItems = order.filter((d) => d.category !== category);
    const next = [...otherItems, ...newLocal].sort((a, b) => {
      // Keep canonical category order, then position within category.
      const aCat = DEBT_CATEGORIES.indexOf(a.category);
      const bCat = DEBT_CATEGORIES.indexOf(b.category);
      if (aCat !== bCat) return aCat - bCat;
      // Same category — for the just-reordered one, use newLocal index.
      // Other categories preserve their existing relative order via display_order.
      if (a.category === category) {
        return newLocal.indexOf(a) - newLocal.indexOf(b);
      }
      return a.display_order - b.display_order;
    });
    setOrder(next);
    void reorderDebts(next.map((d) => d.id));
  }

  const pctPaid =
    subtotalInitial > 0 ? Math.min(100, (subtotalPaid / subtotalInitial) * 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-black/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-950/60"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform ${
              isCollapsed ? "-rotate-90" : ""
            }`}
          />
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
            {category}
          </span>
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-500 tabular-nums">
            {fmtMoney(subtotalRemaining)} left
          </span>
          <span className="text-amber-400 tabular-nums">
            {pctPaid.toFixed(0)}%
          </span>
        </div>
      </button>

      <div className="px-3 pb-1">
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full bg-amber-500/70 transition-all"
            style={{ width: `${pctPaid}%` }}
          />
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-3 pt-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {items.map((d) => (
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
      )}
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
    zIndex: isDragging ? 10 : ("auto" as const),
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

function CategorySelect({
  value,
  onChange,
}: {
  value: DebtCategory;
  onChange: (c: DebtCategory) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DebtCategory)}
      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
    >
      {DEBT_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

function AddDebtForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [category, setCategory] = useState<DebtCategory>("Credit Card");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(bal.replace(/[$,]/g, ""));
    if (!name.trim() || isNaN(n) || n < 0) return;
    start(async () => {
      await createDebt({
        name: name.trim(),
        initial_balance: n,
        category,
      });
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
      <CategorySelect value={category} onChange={setCategory} />
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
  const [category, setCategory] = useState<DebtCategory>(debt.category);
  const [pending, start] = useTransition();

  function save() {
    const n = parseFloat(bal.replace(/[$,]/g, ""));
    if (!name.trim() || isNaN(n) || n < 0) return;
    start(async () => {
      await updateDebt(debt.id, {
        name: name.trim(),
        initial_balance: n,
        category,
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
      <CategorySelect value={category} onChange={setCategory} />
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
