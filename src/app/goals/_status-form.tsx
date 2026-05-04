"use client";

import { useState, useTransition } from "react";
import { updateGoalsState } from "@/app/actions/goals";
import { GoalsState } from "@/lib/types";

const LABELS: Record<string, string> = {
  ideation: "Ideation",
  planning: "Planning",
  building: "Building",
  launched: "Launched",
  identifying: "Identifying",
  due_diligence: "Due Diligence",
  negotiation: "Negotiation",
  invested: "Invested",
};

export default function StatusForm({
  field,
  stages,
  currentStatus,
  currentNotes,
}: {
  field: "online_business" | "equity";
  stages: string[];
  currentStatus: string;
  currentNotes: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [pending, start] = useTransition();

  function save(nextStatus?: string, nextNotes?: string) {
    const patch: Partial<GoalsState> = {};
    if (field === "online_business") {
      patch.online_business_status =
        (nextStatus ?? status) as GoalsState["online_business_status"];
      if (nextNotes !== undefined) patch.online_business_notes = nextNotes;
    } else {
      patch.equity_status = (nextStatus ?? status) as GoalsState["equity_status"];
      if (nextNotes !== undefined) patch.equity_notes = nextNotes;
    }
    start(async () => {
      await updateGoalsState(patch);
    });
  }

  function pickStage(s: string) {
    setStatus(s);
    save(s);
  }

  const idx = stages.indexOf(status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {stages.map((s, i) => {
          const reached = i <= idx;
          const current = i === idx;
          return (
            <button
              key={s}
              type="button"
              onClick={() => pickStage(s)}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (current
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950 font-semibold"
                  : reached
                  ? "border-zinc-600 text-zinc-300"
                  : "border-zinc-800 text-zinc-600")
              }
            >
              {i + 1}. {LABELS[s] ?? s}
            </button>
          );
        })}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => save(undefined, notes)}
        placeholder="Notes / current status..."
        rows={3}
        disabled={pending}
        className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      />
    </div>
  );
}
