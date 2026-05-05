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
    { data: payments },
    { data: savings },
    { data: income },
    { data: netWorth },
    { data: todos },
  ] = await Promise.all([
    sb.from("daily_logs").select("*").order("date"),
    sb.from("revenue_entries").select("*").order("month"),
    sb.from("debts").select("*").order("display_order"),
    sb.from("debt_payments").select("*").order("date"),
    sb.from("savings_snapshots").select("*").order("date"),
    sb.from("personal_income_entries").select("*").order("month"),
    sb.from("net_worth_snapshots").select("*").order("date"),
    sb.from("todos").select("*").order("created_at"),
  ]);

  const parts: string[] = [];
  parts.push("# DAILY_LOGS\n" + toCsv(logs ?? []));
  parts.push("\n\n# SALES (revenue_entries)\n" + toCsv(revenue ?? []));
  parts.push("\n\n# DEBTS\n" + toCsv(debts ?? []));
  parts.push("\n\n# DEBT_PAYMENTS\n" + toCsv(payments ?? []));
  parts.push("\n\n# SAVINGS_SNAPSHOTS\n" + toCsv(savings ?? []));
  parts.push("\n\n# PERSONAL_INCOME\n" + toCsv(income ?? []));
  parts.push("\n\n# NET_WORTH_SNAPSHOTS\n" + toCsv(netWorth ?? []));
  parts.push("\n\n# TODOS\n" + toCsv(todos ?? []));
  const body = parts.join("");
  const today = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="protocol-export-${today}.csv"`,
    },
  });
}
