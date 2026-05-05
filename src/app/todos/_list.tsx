"use client";

import { useState, useTransition } from "react";
import { Todo } from "@/lib/types";
import { createTodo, toggleTodo, deleteTodo } from "@/app/actions/todos";

const CATEGORIES: Todo["category"][] = [
  "business",
  "fitness",
  "financial",
  "personal",
];
const PRIORITIES: Todo["priority"][] = ["high", "medium", "low"];

export default function TodoList({
  open,
  recent,
}: {
  open: Todo[];
  recent: Todo[];
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Todo["category"]>("business");
  const [priority, setPriority] = useState<Todo["priority"]>("medium");
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    start(async () => {
      await createTodo({ title: title.trim(), category, priority });
      setTitle("");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
      <form onSubmit={add} className="space-y-2 lg:sticky lg:top-6 lg:self-start">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          New todo
        </h2>
        <input
          type="text"
          placeholder="What needs to get done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-base focus:border-zinc-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                "rounded-full border px-3 py-1 text-xs uppercase tracking-wider " +
                (category === c
                  ? "border-zinc-100 bg-zinc-100 text-zinc-950 font-semibold"
                  : "border-zinc-800 text-zinc-400")
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={
                "flex-1 rounded border px-2 py-1.5 text-xs uppercase tracking-wider " +
                (priority === p
                  ? priorityActive(p)
                  : "border-zinc-800 text-zinc-500")
              }
            >
              {p}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </form>

      <div>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Open ({open.length})
          </h2>
          {open.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
              All clear.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {open.map((t) => (
                <Item key={t.id} todo={t} />
              ))}
            </ul>
          )}
        </section>

        {recent.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Recently completed
            </h2>
            <ul className="space-y-1.5">
              {recent.map((t) => (
                <Item key={t.id} todo={t} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Item({ todo }: { todo: Todo }) {
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => await toggleTodo(todo.id, !todo.completed));
  }
  function remove() {
    if (!confirm("Delete this todo?")) return;
    start(async () => await deleteTodo(todo.id));
  }

  return (
    <li
      className={
        "flex items-center gap-3 rounded border px-3 py-2 " +
        (todo.completed
          ? "border-zinc-900 bg-zinc-950 opacity-60"
          : "border-zinc-800 bg-zinc-950")
      }
    >
      <button
        onClick={toggle}
        disabled={pending}
        className={
          "h-5 w-5 shrink-0 rounded border flex items-center justify-center text-xs " +
          (todo.completed
            ? "border-emerald-500 bg-emerald-500 text-emerald-950"
            : "border-zinc-700")
        }
        aria-label="toggle"
      >
        {todo.completed ? "✓" : ""}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={
            "text-sm " +
            (todo.completed ? "line-through text-zinc-500" : "")
          }
        >
          <span
            className={
              "mr-2 text-[10px] uppercase tracking-wider " +
              priorityColor(todo.priority)
            }
          >
            {todo.priority}
          </span>
          {todo.title}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          {todo.category}
          {todo.due_date && ` · added ${todo.due_date}`}
        </div>
      </div>
      <button
        onClick={remove}
        disabled={pending}
        className="text-xs text-zinc-600 hover:text-red-400"
      >
        ✕
      </button>
    </li>
  );
}

function priorityColor(p: string) {
  if (p === "high") return "text-red-400";
  if (p === "medium") return "text-amber-400";
  return "text-zinc-500";
}

function priorityActive(p: string) {
  if (p === "high") return "border-red-500 bg-red-500/15 text-red-300 font-semibold";
  if (p === "medium")
    return "border-amber-500 bg-amber-500/15 text-amber-300 font-semibold";
  return "border-zinc-300 bg-zinc-300/20 text-zinc-200 font-semibold";
}
