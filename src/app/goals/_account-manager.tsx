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
import {
  WealthAccount,
  WealthAccountType,
  WEALTH_ACCOUNT_TYPES,
} from "@/lib/types";
import {
  createWealthAccount,
  updateWealthAccount,
  archiveWealthAccount,
  reorderWealthAccounts,
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
  accounts: WealthAccount[];
};

export default function AccountManager({ accounts }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [order, setOrder] = useState<WealthAccount[]>(accounts);
  const [collapsed, setCollapsed] = useState<Set<WealthAccountType>>(new Set());

  useEffect(() => {
    setOrder(accounts);
  }, [accounts]);

  const grouped = useMemo(() => {
    const map = new Map<WealthAccountType, WealthAccount[]>();
    for (const t of WEALTH_ACCOUNT_TYPES) map.set(t, []);
    for (const a of order) {
      const t = (WEALTH_ACCOUNT_TYPES as readonly string[]).includes(
        a.account_type
      )
        ? a.account_type
        : ("Cash" as WealthAccountType);
      map.get(t)!.push(a);
    }
    return Array.from(map.entries());
  }, [order]);

  function toggleCollapse(t: WealthAccountType) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
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
          {adding ? "Cancel" : "Add account"}
        </button>
      </div>

      {adding && <AddAccountForm onDone={() => setAdding(false)} />}

      <div className="space-y-3">
        {grouped.map(([type, items]) => {
          const subtotal = items.reduce((s, a) => s + Number(a.balance), 0);
          const isCollapsed = collapsed.has(type);
          return (
            <AccountGroup
              key={type}
              type={type}
              items={items}
              isCollapsed={isCollapsed}
              onToggle={() => toggleCollapse(type)}
              subtotal={subtotal}
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

function AccountGroup({
  type,
  items,
  isCollapsed,
  onToggle,
  subtotal,
  editingId,
  setEditingId,
  setOrder,
  order,
}: {
  type: WealthAccountType;
  items: WealthAccount[];
  isCollapsed: boolean;
  onToggle: () => void;
  subtotal: number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setOrder: React.Dispatch<React.SetStateAction<WealthAccount[]>>;
  order: WealthAccount[];
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
    if (!ids.includes(String(over.id))) return;
    const oldIdx = items.findIndex((a) => a.id === active.id);
    const newIdx = items.findIndex((a) => a.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const newLocal = arrayMove(items, oldIdx, newIdx);

    const otherItems = order.filter((a) => a.account_type !== type);
    const next = [...otherItems, ...newLocal].sort((a, b) => {
      const aT = WEALTH_ACCOUNT_TYPES.indexOf(a.account_type);
      const bT = WEALTH_ACCOUNT_TYPES.indexOf(b.account_type);
      if (aT !== bT) return aT - bT;
      if (a.account_type === type) {
        return newLocal.indexOf(a) - newLocal.indexOf(b);
      }
      return a.display_order - b.display_order;
    });
    setOrder(next);
    void reorderWealthAccounts(next.map((a) => a.id));
  }

  const accent =
    type === "Cash"
      ? "text-blue-300/70"
      : "text-emerald-300/70";

  if (items.length === 0) {
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
            <span className={`text-sm font-semibold uppercase tracking-wider ${accent}`}>
              {type}
            </span>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
              0
            </span>
          </div>
          <span className="text-xs text-zinc-600">no accounts</span>
        </button>
      </div>
    );
  }

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
          <span className={`text-sm font-semibold uppercase tracking-wider ${accent}`}>
            {type}
          </span>
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
            {items.length}
          </span>
        </div>
        <div className="text-xs">
          <span className="text-zinc-500 uppercase tracking-wider">Subtotal </span>
          <span className="tabular-nums font-semibold text-zinc-100">
            {fmtMoney(subtotal)}
          </span>
        </div>
      </button>

      {!isCollapsed && (
        <div className="px-3 pb-3 pt-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {items.map((a) => (
                  <SortableAccountItem
                    key={a.id}
                    account={a}
                    editing={editingId === a.id}
                    onStartEdit={() => setEditingId(a.id)}
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

function SortableAccountItem({
  account,
  editing,
  onStartEdit,
  onCancelEdit,
}: {
  account: WealthAccount;
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
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : ("auto" as const),
  };

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
        <EditAccountForm account={account} onDone={onCancelEdit} />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              aria-label="Drag to reorder"
              className="-ml-1 cursor-grab touch-none rounded p-1 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={16} />
            </button>
            <div className="min-w-0">
              <div className="font-medium truncate">{account.name}</div>
              {account.notes && (
                <div className="text-[11px] text-zinc-500 truncate">
                  {account.notes}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-semibold tabular-nums text-zinc-100">
              {fmtMoney(Number(account.balance))}
            </span>
            <div className="flex gap-0.5">
              <button
                onClick={onStartEdit}
                aria-label="Edit"
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              >
                <Pencil size={14} />
              </button>
              <ArchiveButton account={account} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function TypeSelect({
  value,
  onChange,
}: {
  value: WealthAccountType;
  onChange: (t: WealthAccountType) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as WealthAccountType)}
      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
    >
      {WEALTH_ACCOUNT_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [type, setType] = useState<WealthAccountType>("Cash");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(bal.replace(/[$,]/g, "")) || 0;
    if (!name.trim()) return;
    start(async () => {
      await createWealthAccount({
        name: name.trim(),
        account_type: type,
        balance: n,
        notes,
      });
      setName("");
      setBal("");
      setNotes("");
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-xl border border-blue-700/40 bg-blue-950/10 p-3"
    >
      <input
        type="text"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Account name (e.g. Chase Checking, Robinhood)"
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <TypeSelect value={type} onChange={setType} />
        <input
          type="text"
          inputMode="decimal"
          value={bal}
          onChange={(e) => setBal(e.target.value)}
          placeholder="$ balance"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-right tabular-nums focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || !name.trim()}
        className="rounded-lg bg-blue-500 py-2 text-sm font-semibold text-blue-950 disabled:opacity-50"
      >
        {pending ? "..." : "Add account"}
      </button>
    </form>
  );
}

function EditAccountForm({
  account,
  onDone,
}: {
  account: WealthAccount;
  onDone: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [bal, setBal] = useState(String(account.balance));
  const [type, setType] = useState<WealthAccountType>(account.account_type);
  const [notes, setNotes] = useState(account.notes ?? "");
  const [pending, start] = useTransition();

  function save() {
    const n = parseFloat(bal.replace(/[$,]/g, "")) || 0;
    if (!name.trim()) return;
    start(async () => {
      await updateWealthAccount(account.id, {
        name: name.trim(),
        account_type: type,
        balance: n,
        notes,
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
      <div className="grid grid-cols-2 gap-2">
        <TypeSelect value={type} onChange={setType} />
        <input
          type="text"
          inputMode="decimal"
          value={bal}
          onChange={(e) => setBal(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-right tabular-nums focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:bg-zinc-900"
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

function ArchiveButton({ account }: { account: WealthAccount }) {
  const [pending, start] = useTransition();
  function archive() {
    if (!confirm(`Remove "${account.name}"? This can't be undone.`)) return;
    start(async () => await archiveWealthAccount(account.id));
  }
  return (
    <button
      onClick={archive}
      disabled={pending}
      aria-label="Remove"
      className="rounded p-1.5 text-zinc-500 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
