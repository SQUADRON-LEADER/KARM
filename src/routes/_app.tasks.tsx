import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlarmClock, CalendarClock, Flame, ListTodo, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, NativeSelect, PageHeader } from "@/components/kram/bits";
import { TaskFormDialog } from "@/components/kram/forms";
import { sortTasks, TaskList, type TaskSort } from "@/components/kram/task-list";
import { useSimulatedLoad } from "@/components/kram/use-loading";
import { TaskBoard, ViewToggle } from "@/components/kram/board";
import { cn } from "@/lib/utils";
import { useAllTags, useMyProjects, useMyTasks } from "@/lib/store";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — KRAM" },
      { name: "description", content: "Every task across your projects, with search, filters and sorting." },
      { property: "og:title", content: "Tasks — KRAM" },
      { property: "og:description", content: "Every task across your projects, with search, filters and sorting." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const loading = useSimulatedLoad();
  const tasks = useMyTasks();
  const projects = useMyProjects();
  const allTags = useAllTags();
  const [q, setQ] = useState("");
  const [proj, setProj] = useState("all");
  const [status, setStatus] = useState("all");
  const [prio, setPrio] = useState("all");
  const [tag, setTag] = useState("all");
  const [quick, setQuick] = useState<"all" | "overdue" | "week" | "high">("all");
  const [sort, setSort] = useState<TaskSort>("due_asc");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "board">("list");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const todayIso = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return sortTasks(tasks.filter((x) =>
      (proj === "all" || x.projectId === proj) &&
      (status === "all" || x.status === status) &&
      (prio === "all" || x.priority === prio) &&
      (tag === "all" || x.tags.includes(tag)) &&
      (quick === "all" || (quick === "overdue" && x.status !== "completed" && x.dueDate < todayIso) || (quick === "week" && x.status !== "completed" && x.dueDate >= todayIso && x.dueDate <= weekEnd) || (quick === "high" && x.priority === "high" && x.status !== "completed")) &&
      (!t || x.name.toLowerCase().includes(t) || x.tags.some((g) => g.includes(t)))
    ), sort);
  }, [tasks, q, proj, status, prio, tag, quick, sort]);
  const filtered = q || proj !== "all" || status !== "all" || prio !== "all" || tag !== "all" || quick !== "all";

  const quickChips = [
    { k: "overdue", label: "Overdue", icon: AlarmClock, cls: "text-destructive" },
    { k: "week", label: "Due this week", icon: CalendarClock, cls: "text-amber" },
    { k: "high", label: "High priority", icon: Flame, cls: "text-primary" },
  ] as const;

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Everything on your plate, across every project.">
        <ViewToggle view={view} onChange={setView} />
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Task</Button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" aria-label="Search tasks" className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <NativeSelect value={proj} onChange={(e) => setProj(e.target.value)} aria-label="Project" className="max-w-[200px]"><option value="all">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</NativeSelect>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">All statuses</option><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></NativeSelect>
        <NativeSelect value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="Priority"><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></NativeSelect>
        <NativeSelect value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag"><option value="all">All tags</option>{allTags.map((t) => <option key={t} value={t}>#{t}</option>)}</NativeSelect>
        <NativeSelect value={sort} onChange={(e) => setSort(e.target.value as TaskSort)} aria-label="Sort"><option value="due_asc">Due date ↑</option><option value="due_desc">Due date ↓</option><option value="priority">Priority</option><option value="newest">Newest</option><option value="oldest">Oldest</option></NativeSelect>
        {filtered && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setProj("all"); setStatus("all"); setPrio("all"); setTag("all"); setQuick("all"); }}><X className="h-4 w-4" /> Clear</Button>}
        <span className="ml-auto text-sm text-muted-foreground">{list.length} of {tasks.length} tasks</span>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {quickChips.map(({ k, label, icon: Icon, cls }) => (
          <button
            key={k}
            onClick={() => setQuick((v) => (v === k ? "all" : k))}
            aria-pressed={quick === k}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:-translate-y-0.5 press",
              quick === k ? "border-primary bg-peach text-primary shadow-soft" : cn("bg-card text-muted-foreground hover:border-primary/40", cls),
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        {allTags.length > 0 && <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">Tip: search matches tags too.</span>}
      </div>
      {loading ? (
        <div className="space-y-2 rounded-xl border bg-card p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={ListTodo} title={tasks.length && q ? "No results found" : "No tasks found"} body={tasks.length && q ? "Try another search term." : "Try changing your filters or create a new task."} action={{ label: "Create Task", onClick: () => setOpen(true) }} />
      ) : (
        view === "board" ? <TaskBoard tasks={list} projects={projects} /> : <TaskList tasks={list} projects={projects} showProject />
      )}
      <TaskFormDialog open={open} onOpenChange={setOpen} defaultProjectId={proj !== "all" ? proj : undefined} />
    </div>
  );
}
