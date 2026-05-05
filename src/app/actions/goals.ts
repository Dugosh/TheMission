"use server";

import { getSupabase } from "@/lib/supabase";
import {
  RevenueEntry,
  Debt,
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

// ---- Debts ----

export async function listDebts(): Promise<Debt[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("archived", false)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as Debt[];
}

export async function createDebt(input: {
  name: string;
  initial_balance: number;
}) {
  const supabase = getSupabase();
  // Compute next display_order
  const { data: maxRow } = await supabase
    .from("debts")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow?.display_order as number) ?? 0) + 1;
  const { error } = await supabase.from("debts").insert({
    name: input.name.trim(),
    initial_balance: input.initial_balance,
    display_order: nextOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function updateDebt(
  id: string,
  patch: { name?: string; initial_balance?: number }
) {
  const supabase = getSupabase();
  const { error } = await supabase.from("debts").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function archiveDebt(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("debts")
    .update({ archived: true })
    .eq("id", id);
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
  debt_id: string;
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

// ---- Savings ----

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

// ---- Goals state ----

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
