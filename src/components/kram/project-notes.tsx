import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle2, Flag, NotebookPen, PlayCircle, Plus, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "./bits";
import { useExtras } from "@/lib/extras";
import type { Project, Task } from "@/lib/store";

const EMPTY: never[] = [];

export function ProjectNotesTimeline({ project, tasks }: { project: Project; tasks: Task[] }) {
  const notes = useExtras((s) => s.notes[project.id] ?? EMPTY);
  const { addNote, removeNote } = useExtras();
  const [text, setText] = useState("");

  const events = useMemo(() => {
    const ev = [
      { at: project.createdDate, label: "Project created", icon: PlayCircle, tone: "text-primary" },
      { at: project.startDate, label: "Start date", icon: Flag, tone: "text-amber" },
      { at: project.endDate, label: "Target end date", icon: Flag, tone: "text-destructive" },
      ...tasks.map((t) => ({ at: t.dueDate, label: `${t.status === "completed" ? "Done" : "Due"} — ${t.name}`, icon: t.status === "completed" ? CheckCircle2 : StickyNote, tone: t.status === "completed" ? "text-sage" : "text-muted-foreground" })),
      ...notes.map((n) => ({ at: n.createdAt, label: `Note — ${n.text.slice(0, 50)}`, icon: NotebookPen, tone: "text-brown" })),
    ].filter((e) => e.at);
    return ev.sort((a, b) => a.at.localeCompare(b.at));
  }, [project, tasks, notes]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="fade-up p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><NotebookPen className="h-5 w-5 text-primary" /> Notes</h2>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = text.trim(); if (v) { addNote(project.id, v); setText(""); } }}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Jot down an idea or decision…" aria-label="New note" className="h-9 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <Button type="submit" size="sm" className="h-9"><Plus className="h-4 w-4" /> Add</Button>
        </form>
        <ul className="mt-4 max-h-80 space-y-2 overflow-auto">
          {notes.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No notes yet.</li>}
          {notes.map((n, i) => (
            <li key={n.id} style={{ animationDelay: `${i * 40}ms`, rotate: `${(i % 3) - 1}deg` }} className="pop-in group relative rounded-lg border-l-4 border-amber bg-sand/60 p-3 text-sm shadow-soft transition-transform hover:rotate-0 hover:scale-[1.02]">
              <p className="whitespace-pre-wrap pr-6">{n.text}</p>
              <div className="mt-1 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
              <button aria-label="Delete note" onClick={() => removeNote(project.id, n.id)} className="absolute right-2 top-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="fade-up p-5">
        <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
        <ol className="relative max-h-96 space-y-4 overflow-auto pl-6 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-border">
          {events.map((e, i) => (
            <li key={i} style={{ animationDelay: `${i * 50}ms` }} className="fade-up relative">
              <span className="absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-card ring-2 ring-background"><e.icon className={`h-4 w-4 ${e.tone}`} /></span>
              <div className="text-sm">{e.label}</div>
              <div className="text-xs tabular text-muted-foreground">{format(new Date(e.at), "MMM d, yyyy")}</div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
