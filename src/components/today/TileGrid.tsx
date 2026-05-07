"use client";

import { useState, useTransition } from "react";
import {
  CloudOff,
  EyeOff,
  Pizza,
  Wine,
  Footprints,
  Heart,
  Dumbbell,
  Flame,
  Droplet,
  UtensilsCrossed,
  Brain,
  Soup,
  Milk,
  Beef,
  Carrot,
  ArrowUpFromDot,
  type LucideIcon,
} from "lucide-react";
import { ToggleTile, NumberTile, PillTile } from "./Tile";
import NumberSheet from "./NumberSheet";
import { upsertDailyField } from "@/app/actions/daily";
import {
  DailyLog,
  CARDIO_OPTIONS,
  LIFTING_OPTIONS,
  CARDIO_LABEL,
  LIFTING_LABEL,
} from "@/lib/types";

type Props = {
  date: string;
  initial: Partial<DailyLog>;
};

type SheetState = {
  open: boolean;
  field: keyof DailyLog | null;
  label: string;
  unit?: string;
  step?: number;
  decimals?: number;
};

type PillSheetState = {
  open: boolean;
  field: keyof DailyLog | null;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
};

export default function TileGrid({ date, initial }: Props) {
  const [log, setLog] = useState<Partial<DailyLog>>(initial);
  const [, start] = useTransition();
  const [sheet, setSheet] = useState<SheetState>({
    open: false,
    field: null,
    label: "",
  });
  const [pillSheet, setPillSheet] = useState<PillSheetState>({
    open: false,
    field: null,
    label: "",
    options: [],
    labels: {},
  });

  function save<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
    setLog((prev) => ({ ...prev, [key]: value }));
    start(async () => {
      await upsertDailyField(date, { [key]: value } as Partial<DailyLog>);
    });
  }

  function toggle(key: keyof DailyLog) {
    const current = (log[key] as boolean) ?? false;
    save(key, !current as never);
  }

  function openNumberSheet(state: Omit<SheetState, "open">) {
    setSheet({ ...state, open: true });
  }

  function openPillSheet(state: Omit<PillSheetState, "open">) {
    setPillSheet({ ...state, open: true });
  }

  return (
    <>
      <Section title="Subtractions" subtitle="Stay clean">
        <Grid>
          <ToggleTile
            icon={CloudOff}
            label="No vape"
            value={log.no_vape ?? false}
            onTap={() => toggle("no_vape")}
          />
          <ToggleTile
            icon={EyeOff}
            label="No porn"
            value={log.no_porn ?? false}
            onTap={() => toggle("no_porn")}
          />
          <ToggleTile
            icon={Pizza}
            label="No processed food"
            value={log.no_processed_food ?? false}
            onTap={() => toggle("no_processed_food")}
          />
          <ToggleTile
            icon={Wine}
            label="No alcohol"
            value={log.no_alcohol ?? false}
            onTap={() => toggle("no_alcohol")}
          />
        </Grid>
      </Section>

      <Section title="Movement">
        <Grid>
          <ToggleTile
            icon={ArrowUpFromDot}
            label="10 pull-ups"
            sublabel="upon waking"
            value={log.pullups_done ?? false}
            onTap={() => toggle("pullups_done")}
          />
          <NumberTile
            icon={Footprints}
            label="Steps"
            sublabel="target 10,000"
            value={log.steps ?? 0}
            hit={(log.steps ?? 0) >= 10000}
            onTap={() =>
              openNumberSheet({
                field: "steps",
                label: "Steps today",
              })
            }
          />
          <PillTile
            icon={Heart}
            label="Cardio"
            value={log.cardio_type ?? null}
            renderValue={(v) => CARDIO_LABEL[v] ?? v}
            hit={
              !!log.cardio_type &&
              log.cardio_type !== "rest" &&
              log.cardio_type.length > 0
            }
            onTap={() =>
              openPillSheet({
                field: "cardio_type",
                label: "Cardio",
                options: CARDIO_OPTIONS,
                labels: CARDIO_LABEL,
              })
            }
          />
          <PillTile
            icon={Dumbbell}
            label="Lifting"
            value={log.lifting_type ?? null}
            renderValue={(v) => LIFTING_LABEL[v] ?? v}
            hit={
              !!log.lifting_type &&
              log.lifting_type !== "rest" &&
              log.lifting_type.length > 0
            }
            onTap={() =>
              openPillSheet({
                field: "lifting_type",
                label: "Lifting",
                options: LIFTING_OPTIONS,
                labels: LIFTING_LABEL,
              })
            }
          />
          <ToggleTile
            icon={Flame}
            label="Sauna"
            sublabel="6×/wk target"
            value={log.sauna ?? false}
            onTap={() => toggle("sauna")}
          />
        </Grid>
      </Section>

      <Section title="Body">
        <Grid>
          <ToggleTile
            icon={Droplet}
            label="1+ gal water"
            value={log.water_gallon ?? false}
            onTap={() => toggle("water_gallon")}
          />
          <ToggleTile
            icon={UtensilsCrossed}
            label="Done by 7:30"
            sublabel="eating cutoff"
            value={log.finished_eating_by_730 ?? false}
            onTap={() => toggle("finished_eating_by_730")}
          />
          <NumberTile
            icon={Brain}
            label="Focused work"
            sublabel="target 6+ hrs"
            value={log.focused_work_hours ?? 0}
            unit="hrs"
            hit={(log.focused_work_hours ?? 0) >= 6}
            onTap={() =>
              openNumberSheet({
                field: "focused_work_hours",
                label: "Focused work hours",
                unit: "hrs",
                step: 0.25,
                decimals: 2,
              })
            }
          />
        </Grid>
      </Section>

      <Section title="Nutrition" subtitle="Compliance — diet is fixed">
        <Grid>
          <ToggleTile
            icon={Soup}
            label="Meal 1"
            sublabel="rice + chicken"
            value={log.meal_1 ?? false}
            onTap={() => toggle("meal_1")}
          />
          <ToggleTile
            icon={Milk}
            label="Meal 2"
            sublabel="2 scoops whey"
            value={log.meal_2 ?? false}
            onTap={() => toggle("meal_2")}
          />
          <ToggleTile
            icon={Beef}
            label="Meal 3"
            sublabel="beef tacos"
            value={log.meal_3 ?? false}
            onTap={() => toggle("meal_3")}
          />
          <ToggleTile
            icon={Carrot}
            label="Refeed day"
            sublabel="extra rice"
            value={log.refeed_day ?? false}
            onTap={() => toggle("refeed_day")}
          />
        </Grid>
      </Section>

      {/* Number sheet */}
      <NumberSheet
        open={sheet.open}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        label={sheet.label}
        initial={
          sheet.field
            ? ((log[sheet.field] as number | null | undefined) ?? null)
            : null
        }
        unit={sheet.unit}
        step={sheet.step}
        decimals={sheet.decimals}
        onSave={(n) => {
          if (sheet.field) {
            save(sheet.field, n as never);
          }
        }}
      />

      {/* Pill sheet (option selector) */}
      <OptionSheet
        open={pillSheet.open}
        onClose={() => setPillSheet((s) => ({ ...s, open: false }))}
        label={pillSheet.label}
        options={pillSheet.options}
        labels={pillSheet.labels}
        current={
          pillSheet.field
            ? ((log[pillSheet.field] as string | null | undefined) ?? null)
            : null
        }
        onPick={(v) => {
          if (pillSheet.field) {
            save(pillSheet.field, v as never);
          }
        }}
      />
    </>
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
    <section className="mt-8 first:mt-6">
      <div className="mb-3 flex items-baseline justify-between px-0.5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
          {title}
        </h2>
        {subtitle && (
          <span className="text-[10px] uppercase tracking-wider text-zinc-600">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
  );
}

function OptionSheet({
  open,
  onClose,
  label,
  options,
  labels,
  current,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  current: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />
      <div
        className={
          "fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-transform duration-200 " +
          (open ? "translate-y-0" : "translate-y-full")
        }
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
          <h3 className="mb-4 text-lg font-semibold">{label}</h3>
          <div className="space-y-2">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  onPick(o);
                  onClose();
                }}
                className={
                  "w-full rounded-xl border px-4 py-3 text-left transition " +
                  (current === o
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                    : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700")
                }
              >
                {labels[o] ?? o}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
