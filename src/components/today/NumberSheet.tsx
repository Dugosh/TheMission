"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  initial: number | null;
  unit?: string;
  step?: number;
  decimals?: number;
  onSave: (n: number) => void;
};

export default function NumberSheet({
  open,
  onClose,
  label,
  initial,
  unit,
  step = 1,
  decimals,
  onSave,
}: Props) {
  const [val, setVal] = useState<string>(
    initial == null || initial === 0 ? "" : String(initial)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setVal(initial == null || initial === 0 ? "" : String(initial));
      // delay so the focus happens after the slide-in
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, initial]);

  // close on escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function commit() {
    const n = parseFloat(val);
    if (isNaN(n)) {
      onSave(0);
    } else {
      const clean = decimals != null ? Number(n.toFixed(decimals)) : n;
      onSave(clean);
    }
    onClose();
  }

  function clear() {
    onSave(0);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />
      {/* Sheet */}
      <div
        className={
          "fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-6 pb-10 shadow-2xl transition-transform duration-200 " +
          (open ? "translate-y-0" : "translate-y-full")
        }
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
          <h3 className="mb-4 text-lg font-semibold">{label}</h3>
          <div className="flex items-baseline gap-2">
            <input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              step={step}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
              }}
              placeholder="0"
              className="flex-1 bg-transparent text-5xl font-bold tabular-nums focus:outline-none"
            />
            {unit && (
              <span className="text-xl text-zinc-500">{unit}</span>
            )}
          </div>
          <div className="mt-8 flex gap-2">
            <button
              onClick={clear}
              className="flex-1 rounded-xl border border-zinc-800 py-3 text-sm font-medium text-zinc-400"
            >
              Clear
            </button>
            <button
              onClick={commit}
              className="flex-[2] rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
