"use server";

import { getSupabase } from "@/lib/supabase";
import { DailyLog } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function upsertDailyField(
  date: string,
  patch: Partial<DailyLog>
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("daily_logs")
    .upsert(
      { date, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "date" }
    );
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true };
}

export async function getDailyLog(date: string): Promise<Partial<DailyLog> | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getRecentLogs(days: number): Promise<Partial<DailyLog>[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("date", { ascending: false })
    .limit(days);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAllLogs(): Promise<Partial<DailyLog>[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
