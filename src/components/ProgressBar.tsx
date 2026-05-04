export default function ProgressBar({
  pct,
  tone = "green",
}: {
  pct: number;
  tone?: "green" | "blue" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "blue"
      ? "bg-sky-500"
      : "bg-amber-500";
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900">
      <div
        className={"h-full transition-all " + toneClass}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
