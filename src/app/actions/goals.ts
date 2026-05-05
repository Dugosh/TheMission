"use server";

import { getSupabase } from "@/lib/supabase";
import {
  RevenueEntry,
  Debt,
  DebtPayment,
  SavingsSnapshot,
  WealthContribution,
  PersonalIncomeEntry,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

// ---- Sales (revenue_entries) ----

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
  category?: string;
}) {
  const supabase = getSupabase();
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
    category: input.category ?? "Other",
    display_order: nextOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function updateDebt(
  id: string,
  patch: { name?: string; initial_balance?: number; category?: string }
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

export async function reorderDebts(orderedIds: string[]) {
  if (!orderedIds.length) return;
  const supabase = getSupabase();
  // Update each debt's display_order to its new index. Run in parallel.
  const updates = orderedIds.map((id, idx) =>
    supabase.from("debts").update({ display_order: idx }).eq("id", id)
  );
  const results = await Promise.all(updates);
  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
  }
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

// ---- Wealth contributions (cash + invested deposits) ----

export async function listContributions(): Promise<WealthContribution[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("wealth_contributions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as WealthContribution[];
}

/** Sum every contribution into a single (cash, invested) pair. */
export async function getWealthTotals(): Promise<{
  cashTotal: number;
  investedTotal: number;
}> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("wealth_contributions")
    .select("cash_amount, invested_amount");
  if (error) throw new Error(error.message);
  let cashTotal = 0;
  let investedTotal = 0;
  for (const row of data || []) {
    cashTotal += Number(row.cash_amount ?? 0);
    investedTotal += Number(row.invested_amount ?? 0);
  }
  return { cashTotal, investedTotal };
}

export async function addContribution(
  date: string,
  cash_amount: number,
  invested_amount: number,
  notes?: string
) {
  if (!cash_amount && !invested_amount) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("wealth_contributions").insert({
    date,
    cash_amount,
    invested_amount,
    notes: notes?.trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteContribution(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("wealth_contributions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function updateContribution(
  id: string,
  patch: {
    date?: string;
    cash_amount?: number;
    invested_amount?: number;
    notes?: string | null;
  }
) {
  const supabase = getSupabase();
  // Normalize empty notes to null for tidy DB.
  const cleanPatch = {
    ...patch,
    ...(patch.notes !== undefined
      ? { notes: patch.notes && patch.notes.trim() ? patch.notes.trim() : null }
      : {}),
  };
  const { error } = await supabase
    .from("wealth_contributions")
    .update(cleanPatch)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
  revalidatePath("/");
}

// Back-compat aliases — older imports/components still use these names.
export const getLatestSavings = async () => {
  const t = await getWealthTotals();
  return t.cashTotal + t.investedTotal > 0
    ? {
        id: "_aggregate",
        date: new Date().toISOString().slice(0, 10),
        cash_amount: t.cashTotal,
        invested_amount: t.investedTotal,
        notes: null,
      }
    : null;
};
export const listSavings = listContributions;
export async function addSavingsSnapshot(
  date: string,
  balance: number,
  invested_balance = 0
) {
  return addContribution(date, balance, invested_balance);
}

// ---- Personal income ----

export async function listPersonalIncome(): Promise<PersonalIncomeEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("personal_income_entries")
    .select("*")
    .order("month", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as PersonalIncomeEntry[];
}

export async function upsertPersonalIncome(month: string, amount: number) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("personal_income_entries")
    .upsert({ month, amount }, { onConflict: "month" });
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

