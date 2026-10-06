import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FolderX, ListTodo, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, EmptyState, fmt, NativeSelect, Progress, ProjectStatusBadge } from "@/components/kram/bits";
import { ConfirmDialog, ProjectFormDialog, TaskFormDialog } from "@/components/kram/forms";
import { sortTasks, TaskList, type TaskSort } from "@/components/kram/task-list";
import { progressFor } from "@/components/kram/project-progress";
import { useSimulatedLoad } from "@/components/kram/use-loading";
import { TaskBoard, ViewToggle } from "@/components/kram/board";
import { Ring } from "@/components/kram/motion";
import { ProjectNotesTimeline } from "@/components/kram/project-notes";
import { useKram, useMyProjects, useMyTasks } from "@/lib/store";

export const Route = createFileRoute("/_app/projects/$id")({
  head: () => ({
    meta: [
      { title: "Project details — KRAM" },
      { name: "description", content: "Project progress, timeline and tasks." },
      { property: "og:title", content: "Project details — KRAM" },
      { property: "og:description", content: "Project progress, timeline and tasks." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const loading = useSimulatedLoad(350);
  const project = useMyProjects().find((p) => p.id === id);
  const allTasks = useMyTasks();
  const deleteProject = useKram((s) => s.deleteProject);
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [prio, setPrio] = useState("all");
  const [sort, setSort] = useState<TaskSort>("due_asc");
  const [view, setView] = useState<"list" | "board">("list");

  const tasks = useMemo(() => {
    const t = q.trim().toLowerCase();
    return sortTasks(allTasks.filter((x) => x.projectId === id && (status === "all" || x.status === status) && (prio === "all" || x.priority === prio) && (!t || x.name.toLowerCase().includes(t))), sort);
  }, [allTasks, id, q, status, prio, sort]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-5 w-32" /><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div>;
  if (!project) return <EmptyState icon={FolderX} title="Project not found" body="It may have been deleted, or it belongs to another workspace." action={{ label: "Back to Projects", onClick: () => navigate({ to: "/projects" }) }} />;

  const pr = progressFor(project.id, allTasks);
  const count = allTasks.filter((x) => x.projectId === id).length;

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link>

      <Card className="fade-up p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1><ProjectStatusBadge status={project.status} /></div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.description || "No description"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDel(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 border-t pt-5 md:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-5">
            <div className="hidden sm:block"><Ring pct={pr.pct} size={56} /></div>
            <div className="flex-1">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{pr.done} of {pr.total}</span> tasks completed</span>
              <span className="text-2xl font-semibold tabular text-primary">{pr.pct}%</span>
            </div>
            <Progress value={pr.pct} className="h-2" />
            {pr.pct === 100 && pr.total > 0 && <p className="fade-up mt-2 text-xs font-medium text-sage">All tasks complete — nicely done.</p>}
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-sm">
            {[["Start", project.startDate], ["End", project.endDate], ["Created", project.createdDate]].map(([l, d]) => (
              <div key={l}><dt className="text-xs text-muted-foreground">{l} date</dt><dd className="mt-0.5 font-medium tabular">{fmt(d ?? "")}</dd></div>
            ))}
          </dl>
        </div>
      </Card>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tasks <span className="text-sm font-normal text-muted-foreground">· {count}</span></h2>
          <div className="flex items-center gap-2"><ViewToggle view={view} onChange={setView} /><Button onClick={() => setNewTask(true)}><Plus className="h-4 w-4" /> New Task</Button></div>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" aria-label="Search tasks" className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">All statuses</option><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></NativeSelect>
          <NativeSelect value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="Priority"><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></NativeSelect>
          <NativeSelect value={sort} onChange={(e) => setSort(e.target.value as TaskSort)} aria-label="Sort"><option value="due_asc">Due date ↑</option><option value="due_desc">Due date ↓</option><option value="priority">Priority</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option></NativeSelect>
          <span className="ml-auto text-sm text-muted-foreground">{tasks.length} shown</span>
        </div>
        {count === 0 ? (
          <EmptyState icon={ListTodo} title="No tasks yet" body="Break this project into tasks to start tracking progress." action={{ label: "Create Task", onClick: () => setNewTask(true) }} />
        ) : tasks.length === 0 ? (
          <EmptyState icon={ListTodo} title="No tasks found" body="Try changing your filters or create a new task." />
        ) : (
          view === "board" ? <TaskBoard tasks={tasks} /> : <TaskList tasks={tasks} />
        )}
      </section>

      <ProjectNotesTimeline project={project} tasks={allTasks.filter((x) => x.projectId === id)} />

      <ProjectFormDialog open={edit} onOpenChange={setEdit} project={project} />
      <TaskFormDialog open={newTask} onOpenChange={setNewTask} defaultProjectId={project.id} />
      <ConfirmDialog open={del} onOpenChange={setDel} title="Delete project?" message="This will permanently remove the project and its associated tasks." confirmLabel="Delete Project"
        onConfirm={() => { deleteProject(project.id); toast.success("Project deleted"); navigate({ to: "/projects" }); }} />
    </div>
  );
}
