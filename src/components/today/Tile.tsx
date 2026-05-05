"use client";

import { LucideIcon } from "lucide-react";

type Tone = "neutral" | "hit" | "broke";

function shellClass(tone: Tone): string {
  if (tone === "hit")
    return "border-emerald-600/60 bg-gradient-to-br from-emerald-950/60 to-emerald-950/20 text-emerald-50 shadow-lg shadow-emerald-500/10";
  if (tone === "broke")
    return "border-red-800/60 bg-gradient-to-br from-red-950/40 to-red-950/10 text-red-50";
  return "border-zinc-800/80 bg-gradient-to-br from-zinc-900/40 to-zinc-950 text-zinc-300 hover:border-zinc-700";
}

function iconBgClass(tone: Tone): string {
  if (tone === "hit")
    return "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40";
  if (tone === "broke")
    return "bg-red-500/15 text-red-400 ring-1 ring-red-500/30";
  return "bg-zinc-900 text-zinc-500 ring-1 ring-zinc-800";
}

type BaseProps = {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  tone?: Tone;
  onTap: () => void;
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
        "group flex h-[112px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.97] " +
        shellClass(tone)
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
            "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition " +
            (value
              ? "bg-emerald-400 text-emerald-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              : "border border-zinc-700 text-zinc-700")
          }
        >
          {value ? "✓" : ""}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold leading-tight">{label}</div>
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
  const display = value == null || value === 0 ? "—" : formatNumber(value);
  return (
    <button
      type="button"
      onClick={onTap}
      className={
        "group flex h-[112px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.97] " +
        shellClass(tone)
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
          <span
            className={
              "text-2xl font-black tabular-nums leading-none " +
              (hit ? "text-emerald-300" : "text-zinc-100")
            }
          >
            {display}
          </span>
          {unit && value != null && value !== 0 && (
            <span className="text-xs text-zinc-500">{unit}</span>
          )}
        </div>
        <div className="mt-1 text-xs font-semibold leading-tight">{label}</div>
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
        "group flex h-[112px] flex-col justify-between rounded-2xl border p-4 text-left transition active:scale-[0.97] " +
        shellClass(tone)
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
        <div
          className={
            "text-lg font-bold leading-tight " +
            (hit ? "text-emerald-200" : "text-zinc-100")
          }
        >
          {display}
        </div>
        <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
      </div>
    </button>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString();
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}
