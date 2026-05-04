"use server";

import { getSupabase } from "@/lib/supabase";
import { Todo } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { todayISO } from "@/lib/calc";

export async function listOpenTodos(): Promise<Todo[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("completed", false)
    .order("priority", { ascending: true }) // high < medium < low alphabetically — we'll re-sort below
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  // Re-order priority high > medium > low
  const order = { high: 0, medium: 1, low: 2 } as const;
  return (data || []).sort(
    (a, b) => order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order]
  ) as Todo[];
}

export async function listRecentlyCompleted(limit = 20): Promise<Todo[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as Todo[];
}

export async function createTodo(input: {
  title: string;
  category: Todo["category"];
  priority: Todo["priority"];
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("todos").insert({
    title: input.title.trim(),
    category: input.category,
    priority: input.priority,
    due_date: todayISO(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function toggleTodo(id: string, completed: boolean) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("todos")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function deleteTodo(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/todos");
  revalidatePath("/");
}
