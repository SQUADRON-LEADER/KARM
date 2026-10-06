import type { Task } from "@/lib/store";

export function progressFor(projectId: string, tasks: Task[]) {
  const t = tasks.filter((x) => x.projectId === projectId);
  const done = t.filter((x) => x.status === "completed").length;
  return { total: t.length, done, pct: t.length ? Math.round((done / t.length) * 100) : 0 };
}
