import { listOpenTodos, listRecentlyCompleted } from "@/app/actions/todos";
import TodoList from "./_list";

export const dynamic = "force-dynamic";

export default async function TodosPage() {
  const [open, recent] = await Promise.all([
    listOpenTodos(),
    listRecentlyCompleted(15),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Todos</h1>
      <TodoList open={open} recent={recent} />
    </div>
  );
}
