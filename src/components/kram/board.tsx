import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { taskStatusLabel, useKram, type Project, type Task, type TaskStatus } from "@/lib/store";
import { fmt, PriorityBadge } from "./bits";
import { TaskCheck } from "./task-list";
import { stagger } from "./motion";
import { accentFor, burst } from "./accent";

const cols: { s: TaskStatus; dot: string }[] = [
  { s: "pending", dot: "bg-amber" },
  { s: "in_progress", dot: "bg-primary" },
  { s: "completed", dot: "bg-sage" },
];

/** Kanban board: drag a card between columns to change its status. */
export function TaskBoard({ tasks, projects }: { tasks: Task[]; projects?: Project[] }) {
  const setStatus = useKram((s) => s.setTaskStatus);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const drop = (s: TaskStatus, id: string) => {
    const t = tasks.find((x) => x.id === id);
    setOver(null); setDragging(null);
    if (!t || t.status === s) return;
    setStatus(id, s);
    toast.success(s === "completed" ? "Task marked as completed" : `Moved to ${taskStatusLabel[s]}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cols.map(({ s, dot }) => {
        const list = tasks.filter((t) => t.status === s);
        return (
          <div
            key={s}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }}
            onDragLeave={() => setOver((o) => (o === s ? null : o))}
            onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (s === "completed") burst(e.clientX, e.clientY); drop(s, id); }}
            className={cn("flex min-h-48 flex-col rounded-xl border bg-muted/40 p-2.5 transition-colors", over === s && "drop-target")}
          >
            <div className="flex items-center gap-2 px-1.5 pb-2.5 pt-1 text-sm font-medium">
              <span className={cn("h-2 w-2 rounded-full pulse-warm", dot)} />{taskStatusLabel[s]}
              <span className="ml-auto rounded-md bg-card px-1.5 text-xs tabular text-muted-foreground">{list.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {list.map((t, i) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); setDragging(t.id); }}
                  onDragEnd={() => { setDragging(null); setOver(null); }}
                  style={stagger(i, 30)}
                  className={cn(
                    "fade-up group relative cursor-grab overflow-hidden rounded-lg border bg-card p-3 pl-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift active:cursor-grabbing",
                    dragging === t.id && "rotate-1 opacity-50",
                  )}
                >
                  <span className={cn("absolute inset-y-0 left-0 w-1", accentFor(t.projectId).bar)} />
                  <div className="flex items-start gap-2.5">
                    <div className="pt-0.5"><TaskCheck task={t} /></div>
                    <div className="min-w-0 flex-1">
                      <div className={cn("text-sm font-medium leading-snug", t.status === "completed" && "text-muted-foreground line-through")}>{t.name}</div>
                      {projects && <div className="mt-0.5 truncate text-xs text-muted-foreground">{projects.find((p) => p.id === t.projectId)?.name}</div>}
                      {t.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{t.tags.map((g) => <span key={g} className="rounded bg-sand px-1.5 py-px text-[10px] font-medium text-brown">#{g}</span>)}</div>}
                    </div>
                    <GripVertical className="h-4 w-4 shrink-0 text-border opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <PriorityBadge priority={t.priority} />
                    <span className={cn("flex items-center gap-1 text-xs tabular", t.status !== "completed" && t.dueDate < today ? "text-destructive" : "text-muted-foreground")}>
                      <CalendarDays className="h-3.5 w-3.5" />{fmt(t.dueDate, "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="grid flex-1 place-items-center rounded-lg border border-dashed py-8 text-xs text-muted-foreground">Drop tasks here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ViewToggle({ view, onChange }: { view: "list" | "board"; onChange: (v: "list" | "board") => void }) {
  return (
    <div className="flex rounded-lg border bg-card p-0.5" role="tablist" aria-label="View">
      {(["list", "board"] as const).map((v) => (
        <button key={v} role="tab" aria-selected={view === v} onClick={() => onChange(v)}
          className={cn("rounded-md px-3 py-1 text-sm capitalize transition-colors", view === v ? "bg-sand font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {v}
        </button>
      ))}
    </div>
  );
}
