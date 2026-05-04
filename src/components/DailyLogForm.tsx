"use client";

import { useState, useTransition } from "react";
import {
  DailyLog,
  SUBTRACTIONS,
  CARDIO_OPTIONS,
  LIFTING_OPTIONS,
  CARDIO_LABEL,
  LIFTING_LABEL,
} from "@/lib/types";
import { upsertDailyField } from "@/app/actions/daily";

type Props = {
  date: string;
  initial: Partial<DailyLog>;
};

export default function DailyLogForm({ date, initial }: Props) {
  const [log, setLog] = useState<Partial<DailyLog>>(initial);
  const [, startTransition] = useTransition();

  function save<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
    setLog((prev) => ({ ...prev, [key]: value }));
    startTransition(async () => {
      await upsertDailyField(date, { [key]: value } as Partial<DailyLog>);
    });
  }

  return (
    <div className="space-y-8">
      {/* Subtractions */}
      <Section title="Subtractions" subtitle="Stay clean">
        <div className="grid grid-cols-1 gap-2">
          {SUBTRACTIONS.map((s) => (
            <ComplianceToggle
              key={s.key}
              label={s.label}
              value={(log[s.key] as boolean) ?? false}
              onChange={(v) => save(s.key, v as never)}
            />
          ))}
        </div>
      </Section>

      {/* Additions */}
      <Section title="Additions" subtitle="Hit your targets">
        <div className="grid grid-cols-1 gap-2">
          <ComplianceToggle
            label="10 pull-ups upon waking"
            value={log.pullups_done ?? false}
            onChange={(v) => save("pullups_done", v)}
          />

          <NumberRow
            label="Steps"
            unit=""
            target="10,000"
            value={log.steps ?? 0}
            onChange={(v) => save("steps", v)}
            hit={(log.steps ?? 0) >= 10000}
          />

          <PillSelect
            label="Cardio"
            options={CARDIO_OPTIONS as unknown as string[]}
            labels={CARDIO_LABEL}
            value={log.cardio_type ?? null}
            onChange={(v) => save("cardio_type", v)}
          />

          <PillSelect
            label="Lifting"
            options={LIFTING_OPTIONS as unknown as string[]}
            labels={LIFTING_LABEL}
            value={log.lifting_type ?? null}
            onChange={(v) => save("lifting_type", v)}
          />

          <ComplianceToggle
            label="Sauna session"
            sublabel="target 6×/week"
            value={log.sauna ?? false}
            onChange={(v) => save("sauna", v)}
          />

          <ComplianceToggle
            label="1+ gallon of water"
            value={log.water_gallon ?? false}
            onChange={(v) => save("water_gallon", v)}
          />

          <ComplianceToggle
            label="Finished eating by 7:30 PM"
            value={log.finished_eating_by_730 ?? false}
            onChange={(v) => save("finished_eating_by_730", v)}
          />

          <NumberRow
            label="Focused work"
            unit="hrs"
            target="6+"
            value={log.focused_work_hours ?? 0}
            step={0.25}
            onChange={(v) => save("focused_work_hours", v)}
            hit={(log.focused_work_hours ?? 0) >= 6}
          />
        </div>
      </Section>

      {/* Nutrition */}
      <Section title="Nutrition" subtitle="Compliance only — diet is fixed">
        <div className="grid grid-cols-1 gap-2">
          <ComplianceToggle
            label="Meal 1 — rice, chicken, olive oil"
            sublabel="~550 cal · 50g P"
            value={log.meal_1 ?? false}
            onChange={(v) => save("meal_1", v)}
          />
          <ComplianceToggle
            label="Meal 2 — 2 scoops whey"
            sublabel="~240 cal · 50g P"
            value={log.meal_2 ?? false}
            onChange={(v) => save("meal_2", v)}
          />
          <ComplianceToggle
            label="Meal 3 — beef tacos"
            sublabel="~700 cal · 55g P"
            value={log.meal_3 ?? false}
            onChange={(v) => save("meal_3", v)}
          />
          <ComplianceToggle
            label="Refeed day"
            sublabel="extra rice carbs"
            value={log.refeed_day ?? false}
            onChange={(v) => save("refeed_day", v)}
          />
          {log.refeed_day && (
            <NumberRow
              label="Extra carbs (rice)"
              unit="g"
              value={log.refeed_extra_carbs_g ?? 0}
              onChange={(v) => save("refeed_extra_carbs_g", v)}
            />
          )}
        </div>
      </Section>

      {/* Biometrics */}
      <Section title="Biometrics">
        <NumberRow
          label="Morning weight"
          unit="lbs"
          value={log.weight_lbs ?? 0}
          step={0.1}
          decimals={1}
          onChange={(v) => save("weight_lbs", v)}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wider">{title}</h2>
        {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function ComplianceToggle({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={
        "flex items-center justify-between rounded-md border px-4 py-3 text-left transition " +
        (value
          ? "border-emerald-700 bg-emerald-950/40"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700")
      }
    >
      <div>
        <div className="font-medium">{label}</div>
        {sublabel && <div className="text-xs text-zinc-500">{sublabel}</div>}
      </div>
      <div
        className={
          "ml-3 h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold " +
          (value
            ? "border-emerald-500 bg-emerald-500 text-emerald-950"
            : "border-zinc-700 text-zinc-700")
        }
      >
        {value ? "✓" : ""}
      </div>
    </button>
  );
}

function NumberRow({
  label,
  unit,
  target,
  value,
  step,
  decimals,
  onChange,
  hit,
}: {
  label: string;
  unit?: string;
  target?: string;
  value: number;
  step?: number;
  decimals?: number;
  onChange: (v: number) => void;
  hit?: boolean;
}) {
  const [local, setLocal] = useState<string>(
    value === 0 ? "" : String(value)
  );

  function commit() {
    const n = parseFloat(local);
    const clean = isNaN(n) ? 0 : decimals != null ? Number(n.toFixed(decimals)) : n;
    onChange(clean);
  }

  return (
    <div
      className={
        "flex items-center justify-between rounded-md border px-4 py-3 " +
        (hit
          ? "border-emerald-700 bg-emerald-950/40"
          : "border-zinc-800 bg-zinc-950")
      }
    >
      <div>
        <div className="font-medium">{label}</div>
        {target && (
          <div className="text-xs text-zinc-500">target {target}{unit ? ` ${unit}` : ""}</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step ?? 1}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-24 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-right text-base focus:border-zinc-500 focus:outline-none"
          placeholder="0"
        />
        {unit && <span className="text-sm text-zinc-500 w-8">{unit}</span>}
      </div>
    </div>
  );
}

function PillSelect({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  labels: Record<string, string>;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="mb-2 font-medium">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={
              "rounded-full border px-3 py-1 text-sm transition " +
              (value === o
                ? "border-emerald-500 bg-emerald-500 text-emerald-950 font-semibold"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500")
            }
          >
            {labels[o] || o}
          </button>
        ))}
      </div>
    </div>
  );
}
