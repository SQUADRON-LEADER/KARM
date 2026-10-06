import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ListChecks, MoreHorizontal, Pencil, Timer, Trash2 } from "lucide-react";
import { playSound } from "@/lib/extras";
import { SubtaskDialog, SubtaskMeter } from "./subtasks";
import { startFocus } from "./focus-timer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useKram, type Project, type Task } from "@/lib/store";
import { fmt, PriorityBadge, TaskStatusBadge } from "./bits";
import { ConfirmDialog, TaskFormDialog } from "./forms";
import { stagger } from "./motion";
import { accentFor, burst } from "./accent";

export function TaskCheck({ task }: { task: Task }) {
  const toggle = useKram((s) => s.toggleTask);
  const done = task.status === "completed";
  return (
    <button
      type="button"
      aria-label={done ? `Mark ${task.name} as not completed` : `Mark ${task.name} as completed`}
      onClick={(e) => { const s = toggle(task.id); if (s === "completed") { const r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); playSound("done"); } toast.success(s === "completed" ? "Task marked as completed" : "Task reopened"); }}
      className={cn("grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", done ? "pop-check border-sage bg-sage text-primary-foreground" : "border-input bg-card hover:border-primary")}
    >
      {done && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

export function TaskList({ tasks, projects, showProject }: { tasks: Task[]; projects?: Project[]; showProject?: boolean }) {
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [checklist, setChecklist] = useState<Task | null>(null);
  const deleteTask = useKram((s) => s.deleteTask);
  const pname = (id: string) => projects?.find((p) => p.id === id)?.name ?? "—";

  const actions = (t: Task) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Actions for ${t.name}`}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setChecklist(t)}><ListChecks className="h-4 w-4" /> Checklist</DropdownMenuItem>
        <DropdownMenuItem onClick={() => startFocus(t.id, t.name)}><Timer className="h-4 w-4" /> Start focus</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-soft md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-2.5" />
              <th className="py-2.5 pr-4 font-medium">Task</th>
              {showProject && <th className="py-2.5 pr-4 font-medium">Project</th>}
              <th className="py-2.5 pr-4 font-medium">Priority</th>
              <th className="py-2.5 pr-4 font-medium">Status</th>
              <th className="py-2.5 pr-4 font-medium">Due</th>
              <th className="py-2.5 pr-4 font-medium">Created</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={t.id} style={stagger(Math.min(i, 12), 25)} className="fade-up border-b last:border-0 transition-colors hover:bg-muted/40">
                <td className="px-4 py-3"><TaskCheck task={t} /></td>
                <td className="py-3 pr-4">
                  <div className={cn("font-medium", t.status === "completed" && "text-muted-foreground line-through decoration-border")}>{t.name}</div>
                  {t.description && <div className="line-clamp-1 text-xs text-muted-foreground">{t.description}</div>}
                  {t.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{t.tags.map((g) => <span key={g} className="rounded bg-sand px-1.5 py-px text-[10px] font-medium text-brown">#{g}</span>)}</div>}
                  <SubtaskMeter taskId={t.id} />
                </td>
                {showProject && <td className="py-3 pr-4"><Link to="/projects/$id" params={{ id: t.projectId }} className="inline-flex items-center gap-1.5 text-brown hover:text-primary"><span className={`h-2 w-2 rounded-full ${accentFor(t.projectId).bar}`} />{pname(t.projectId)}</Link></td>}
                <td className="py-3 pr-4"><PriorityBadge priority={t.priority} /></td>
                <td className="py-3 pr-4"><TaskStatusBadge status={t.status} /></td>
                <td className="py-3 pr-4 tabular text-muted-foreground">{fmt(t.dueDate, "MMM d")}</td>
                <td className="py-3 pr-4 tabular text-muted-foreground">{fmt(t.createdDate, "MMM d")}</td>
                <td className="pr-3">{actions(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">
        {tasks.map((t) => (
          <div key={t.id} className="flex gap-3 rounded-xl border bg-card p-3.5 shadow-soft">
            <div className="pt-0.5"><TaskCheck task={t} /></div>
            <div className="min-w-0 flex-1">
              <div className={cn("font-medium", t.status === "completed" && "text-muted-foreground line-through")}>{t.name}</div>
              {showProject && <div className="text-xs text-muted-foreground">{pname(t.projectId)}</div>}
              {t.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{t.tags.map((g) => <span key={g} className="rounded bg-sand px-1.5 py-px text-[10px] font-medium text-brown">#{g}</span>)}</div>}
                  <SubtaskMeter taskId={t.id} />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <PriorityBadge priority={t.priority} /><TaskStatusBadge status={t.status} />
                <span className="text-xs text-muted-foreground">Due {fmt(t.dueDate, "MMM d")}</span>
              </div>
            </div>
            {actions(t)}
          </div>
        ))}
      </div>
      <SubtaskDialog task={checklist} onOpenChange={(o) => !o && setChecklist(null)} />
      <TaskFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} task={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete task?"
        message="This task will be permanently removed."
        confirmLabel="Delete Task"
        onConfirm={() => { if (deleting) { deleteTask(deleting.id); toast.success("Task deleted"); } }}
      />
    </>
  );
}

export type TaskSort = "due_asc" | "due_desc" | "priority" | "newest" | "oldest" | "name";
export function sortTasks(list: Task[], sort: TaskSort) {
  const rank = { high: 3, medium: 2, low: 1 };
  const l = [...list];
  switch (sort) {
    case "due_asc": return l.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    case "due_desc": return l.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    case "priority": return l.sort((a, b) => rank[b.priority] - rank[a.priority] || a.dueDate.localeCompare(b.dueDate));
    case "newest": return l.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    case "oldest": return l.sort((a, b) => a.createdDate.localeCompare(b.createdDate));
    case "name": return l.sort((a, b) => a.name.localeCompare(b.name));
  }
}
