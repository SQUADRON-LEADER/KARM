import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, addMonths, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, EmptyState, PageHeader, PriorityBadge } from "@/components/kram/bits";
import { TaskFormDialog } from "@/components/kram/forms";
import { useSimulatedLoad } from "@/components/kram/use-loading";
import { stagger } from "@/components/kram/motion";
import { confetti } from "@/components/kram/celebrate";
import { cn } from "@/lib/utils";
import { TaskCheck } from "@/components/kram/task-list";
import { useKram, useMyProjects, useMyTasks, type Task } from "@/lib/store";

export const Route = createFileRoute("/_app/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — KRAM" },
      { name: "description", content: "See and drag your tasks across the month by due date." },
      { property: "og:title", content: "Calendar — KRAM" },
      { property: "og:description", content: "See and drag your tasks across the month by due date." },
    ],
  }),
  component: CalendarPage,
});

const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarPage() {
  const loading = useSimulatedLoad();
  const tasks = useMyTasks();
  const projects = useMyProjects();
  const setTaskDue = useKram((s) => s.setTaskDue);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [newOn, setNewOn] = useState<string | null>(null);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) }),
    [cursor],
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      const k = t.dueDate.slice(0, 10);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    for (const list of m.values()) list.sort((a, b) => (a.status === "completed" ? 1 : 0) - (b.status === "completed" ? 1 : 0));
    return m;
  }, [tasks]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const drop = (dayIso: string) => {
    setOverDay(null);
    if (!dragId) return;
    const t = tasks.find((x) => x.id === dragId);
    setDragId(null);
    if (!t || t.dueDate.slice(0, 10) === dayIso) return;
    setTaskDue(dragId, dayIso);
    toast.success(`Moved to ${format(parseISO(dayIso), "EEE d MMM")}`);
  };

  const monthTasks = tasks.filter((t) => isSameMonth(parseISO(t.dueDate), cursor));
  const upcoming = tasks
    .filter((t) => t.status !== "completed" && t.dueDate >= todayIso)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[560px] rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Drag a task chip to another day to reschedule it.">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setCursor((c) => subMonths(c, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <button onClick={() => setCursor(startOfMonth(new Date()))} className="min-w-36 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-muted rainbow-text" aria-label="Go to today">
            {format(cursor, "MMMM yyyy")}
          </button>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setCursor((c) => addMonths(c, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button onClick={() => setNewOn(todayIso)}><Plus className="h-4 w-4" /> New Task</Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
            {wd.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const iso = format(d, "yyyy-MM-dd");
              const inMonth = isSameMonth(d, cursor);
              const dayTasks = byDay.get(iso) ?? [];
              const overdue = dayTasks.filter((t) => t.status !== "completed" && t.dueDate < todayIso).length;
              const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.status === "completed");
              return (
                <div
                  key={iso}
                  style={stagger(Math.min(i, 35), 12)}
                  onDragOver={(e) => { e.preventDefault(); setOverDay(iso); }}
                  onDragLeave={() => setOverDay((o) => (o === iso ? null : o))}
                  onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); const t = tasks.find((x) => x.id === id); drop(iso); if (t && t.dueDate.slice(0, 10) !== iso) confetti(e.clientX, e.clientY, 10); }}
                  className={cn(
                    "fade-up group relative min-h-24 border-b border-r p-1.5 transition-colors last:border-r-0 sm:min-h-28",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    isToday(d) && "bg-peach/40",
                    overDay === iso && "drop-target",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between px-0.5">
                    <span className={cn("inline-grid h-6 w-6 place-items-center rounded-full text-xs tabular", isToday(d) && "bg-primary font-semibold text-primary-foreground", !inMonth && "opacity-50")}>
                      {format(d, "d")}
                    </span>
                    <button
                      onClick={() => setNewOn(iso)}
                      aria-label={`Add task on ${format(d, "MMM d")}`}
                      className="grid h-5 w-5 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); setDragId(t.id); }}
                        onDragEnd={() => { setDragId(null); setOverDay(null); }}
                        title={t.name}
                        className={cn(
                          "cursor-grab rounded-md border bg-card px-1.5 py-1 text-[11px] leading-tight shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift active:cursor-grabbing",
                          dragId === t.id && "rotate-2 opacity-50",
                          t.status === "completed" && "bg-sage-soft/60 text-muted-foreground",
                        )}
                      >
                        <span className="flex items-center gap-1">
                          <TaskCheck task={t} />
                          <span className={cn("truncate", t.status === "completed" && "line-through")}>{t.name}</span>
                        </span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && <div className="px-1 text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</div>}
                    {overdue > 0 && <div className="px-1 text-[10px] font-medium text-destructive">{overdue} overdue</div>}
                    {allDone && <div className="px-1 text-[10px] font-medium text-sage">✓ all done</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-primary" /> {format(cursor, "MMMM")} at a glance</div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">Tasks due</span><span className="font-medium tabular">{monthTasks.length}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Done</span><span className="font-medium tabular text-sage">{monthTasks.filter((t) => t.status === "completed").length}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className={cn("font-medium tabular", monthTasks.some((t) => t.status !== "completed" && t.dueDate < todayIso) ? "text-destructive" : "")}>{monthTasks.filter((t) => t.status !== "completed" && t.dueDate < todayIso).length}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Projects</span><span className="font-medium tabular">{projects.length}</span></li>
            </ul>
          </Card>
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold">Up next</div>
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nothing scheduled ahead.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((t, i) => (
                  <li key={t.id} style={stagger(i, 50)} className="fade-up flex items-center gap-2 text-sm">
                    <span className="w-14 shrink-0 text-xs tabular text-muted-foreground">{format(parseISO(t.dueDate), "d MMM")}</span>
                    <PriorityBadge priority={t.priority} />
                    <span className="truncate">{t.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {tasks.length === 0 && <div className="mt-4"><EmptyState icon={CalendarDays} title="No tasks yet" body="Create your first task to see it on the calendar." action={{ label: "New Task", onClick: () => setNewOn(todayIso) }} /></div>}

      <TaskFormDialog open={!!newOn} onOpenChange={(o) => !o && setNewOn(null)} defaultDueDate={newOn ?? undefined} />
    </div>
  );
}
