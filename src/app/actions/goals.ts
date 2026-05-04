"use server";

import { getSupabase } from "@/lib/supabase";
import {
  RevenueEntry,
  DebtPayment,
  SavingsSnapshot,
  GoalsState,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function listRevenue(): Promise<RevenueEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("revenue_entries")
    .select("*")
    .order("month", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as RevenueEntry[];
}

export async function upsertRevenue(month: string, amount: number) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("revenue_entries")
    .upsert({ month, amount }, { onConflict: "month" });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function listDebtPayments(): Promise<DebtPayment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("debt_payments")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as DebtPayment[];
}

export async function addDebtPayment(input: {
  date: string;
  debt_type: DebtPayment["debt_type"];
  amount: number;
  notes?: string;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("debt_payments").insert(input);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteDebtPayment(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("debt_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function getLatestSavings(): Promise<SavingsSnapshot | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("savings_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as SavingsSnapshot | null;
}

export async function listSavings(): Promise<SavingsSnapshot[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("savings_snapshots")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as SavingsSnapshot[];
}

export async function addSavingsSnapshot(date: string, balance: number) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("savings_snapshots")
    .insert({ date, balance });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function getGoalsState(): Promise<GoalsState> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("goals_state")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data as GoalsState;
}

export async function updateGoalsState(patch: Partial<GoalsState>) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("goals_state")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}
