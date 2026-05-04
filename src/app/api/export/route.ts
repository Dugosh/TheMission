import { getSupabase } from "@/lib/supabase";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const lines = rows.map((r) => cols.map((c) => csvCell(r[c])).join(","));
  return [head, ...lines].join("\n");
}

export async function GET() {
  const sb = getSupabase();
  const [
    { data: logs },
    { data: revenue },
    { data: debts },
    { data: savings },
    { data: todos },
    { data: state },
  ] = await Promise.all([
    sb.from("daily_logs").select("*").order("date"),
    sb.from("revenue_entries").select("*").order("month"),
    sb.from("debt_payments").select("*").order("date"),
    sb.from("savings_snapshots").select("*").order("date"),
    sb.from("todos").select("*").order("created_at"),
    sb.from("goals_state").select("*").eq("id", 1),
  ]);

  const parts: string[] = [];
  parts.push("# DAILY_LOGS\n" + toCsv(logs ?? []));
  parts.push("\n\n# REVENUE_ENTRIES\n" + toCsv(revenue ?? []));
  parts.push("\n\n# DEBT_PAYMENTS\n" + toCsv(debts ?? []));
  parts.push("\n\n# SAVINGS_SNAPSHOTS\n" + toCsv(savings ?? []));
  parts.push("\n\n# TODOS\n" + toCsv(todos ?? []));
  parts.push("\n\n# GOALS_STATE\n" + toCsv(state ?? []));
  const body = parts.join("");
  const today = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="protocol-export-${today}.csv"`,
    },
  });
}
