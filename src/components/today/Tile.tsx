"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type Tone = "neutral" | "hit" | "broke";

function toneClass(tone: Tone): string {
  if (tone === "hit")
    return "border-emerald-700/70 bg-emerald-950/40 text-emerald-50";
  if (tone === "broke")
    return "border-red-900/60 bg-red-950/30 text-red-50";
  return "border-zinc-800/80 bg-zinc-950 text-zinc-300";
}

function iconBgClass(tone: Tone): string {
  if (tone === "hit") return "bg-emerald-500/15 text-emerald-400";
  if (tone === "broke") return "bg-red-500/15 text-red-400";
  return "bg-zinc-900 text-zinc-500";
}

type BaseProps = {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  tone?: Tone;
  onTap: () => void;
  rightSlot?: ReactNode;
  disabled?: boolean;
};

export function ToggleTile({
  icon: Icon,
  label,
  sublabel,
  value,
  onTap,
  disabled,
}: BaseProps & { value: boolean }) {
  const tone: Tone = value ? "hit" : "neutral";
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className={
        "group flex h-[108px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.98] " +
        toneClass(tone)
      }
    >
      <div className="flex items-start justify-between">
        <div
          className={
            "flex h-9 w-9 items-center justify-center rounded-xl transition " +
            iconBgClass(tone)
          }
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <div
          className={
            "h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold transition " +
            (value
              ? "border-emerald-400 bg-emerald-400 text-emerald-950"
              : "border-zinc-700 text-zinc-700")
          }
        >
          {value ? "✓" : ""}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium leading-tight">{label}</div>
        {sublabel && (
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

export function NumberTile({
  icon: Icon,
  label,
  sublabel,
  value,
  unit,
  hit,
  onTap,
}: BaseProps & {
  value: number | null;
  unit?: string;
  hit?: boolean;
}) {
  const tone: Tone = hit ? "hit" : "neutral";
  const display =
    value == null || value === 0 ? "—" : formatNumber(value);
  return (
    <button
      type="button"
      onClick={onTap}
      className={
        "group flex h-[108px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.98] " +
        toneClass(tone)
      }
    >
      <div className="flex items-start justify-between">
        <div
          className={
            "flex h-9 w-9 items-center justify-center rounded-xl transition " +
            iconBgClass(tone)
          }
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums leading-none">
            {display}
          </span>
          {unit && value != null && value !== 0 && (
            <span className="text-xs text-zinc-500">{unit}</span>
          )}
        </div>
        <div className="mt-1 text-xs font-medium leading-tight">{label}</div>
        {sublabel && (
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

export function PillTile({
  icon: Icon,
  label,
  value,
  renderValue,
  hit,
  onTap,
}: BaseProps & {
  value: string | null;
  renderValue?: (v: string) => string;
  hit?: boolean;
}) {
  const tone: Tone = hit ? "hit" : "neutral";
  const display = value ? (renderValue ? renderValue(value) : value) : "—";
  return (
    <button
      type="button"
      onClick={onTap}
      className={
        "group flex h-[108px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.98] " +
        toneClass(tone)
      }
    >
      <div className="flex items-start justify-between">
        <div
          className={
            "flex h-9 w-9 items-center justify-center rounded-xl " +
            iconBgClass(tone)
          }
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <div className="text-lg font-bold leading-tight">{display}</div>
        <div className="mt-0.5 text-xs text-zinc-400">{label}</div>
      </div>
    </button>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString();
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}
