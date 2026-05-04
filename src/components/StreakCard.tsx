type Props = {
  label: string;
  count: number;
  accent?: "green" | "neutral";
};

export default function StreakCard({ label, count, accent = "neutral" }: Props) {
  const isFire = count > 0;
  return (
    <div
      className={
        "rounded-md border px-3 py-2 " +
        (isFire && accent === "green"
          ? "border-emerald-800 bg-emerald-950/40"
          : "border-zinc-800 bg-zinc-950")
      }
    >
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{count}</div>
    </div>
  );
}
