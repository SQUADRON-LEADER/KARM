import { useState } from "react";
import { Check, ListChecks, Plus, Timer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playSound, useExtras, useSubtasks } from "@/lib/extras";
import type { Task } from "@/lib/store";
import { confetti } from "./celebrate";
import { startFocus } from "./focus-timer";

/** Compact progress indicator for a task's checklist. */
export function SubtaskMeter({ taskId }: { taskId: string }) {
  const subs = useSubtasks(taskId);
  if (!subs.length) return null;
  const done = subs.filter((s) => s.done).length;
  const pct = Math.round((done / subs.length) * 100);
  return (
    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
      <ListChecks className="h-3 w-3" />
      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-sage transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      <span className="tabular">{done}/{subs.length}</span>
    </div>
  );
}

export function SubtaskDialog({ task, onOpenChange }: { task: Task | null; onOpenChange: (o: boolean) => void }) {
  const subs = useSubtasks(task?.id ?? "");
  const { addSubtask, toggleSubtask, removeSubtask } = useExtras();
  const mins = useExtras((s) => (task ? s.focusMinutes[task.id] ?? 0 : 0));
  const [text, setText] = useState("");
  if (!task) return null;
  const done = subs.filter((s) => s.done).length;
  const pct = subs.length ? Math.round((done / subs.length) * 100) : 0;
  const add = () => { const v = text.trim(); if (!v) return; addSubtask(task.id, v); setText(""); playSound("tick"); };

  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{task.name}</DialogTitle></DialogHeader>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{done} of {subs.length} steps · {mins} focus min</span>
          <span className="font-semibold tabular text-primary">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-sage transition-all duration-700" style={{ width: `${pct}%` }} /></div>
        <ul className="max-h-72 space-y-1.5 overflow-auto">
          {subs.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Break this task into small steps.</li>}
          {subs.map((s, i) => (
            <li key={s.id} style={{ animationDelay: `${i * 30}ms` }} className="fade-up group flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2">
              <button
                aria-label={s.done ? `Mark ${s.title} not done` : `Mark ${s.title} done`}
                onClick={(e) => {
                  toggleSubtask(task.id, s.id);
                  if (!s.done) {
                    playSound("done");
                    if (done + 1 === subs.length) { const r = e.currentTarget.getBoundingClientRect(); confetti(r.left, r.top, 30); }
                  }
                }}
                className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all", s.done ? "scale-110 border-sage bg-sage text-primary-foreground" : "hover:border-primary")}
              >{s.done && <Check className="pop-in h-3.5 w-3.5" />}</button>
              <span className={cn("flex-1 text-sm transition-colors", s.done && "text-muted-foreground line-through")}>{s.title}</span>
              <button aria-label={`Remove ${s.title}`} onClick={() => removeSubtask(task.id, s.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a step…" aria-label="New step" className="h-9 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <Button type="submit" size="sm" className="h-9"><Plus className="h-4 w-4" /> Add</Button>
        </form>
        <Button variant="outline" onClick={() => { startFocus(task.id, task.name); onOpenChange(false); }}><Timer className="h-4 w-4" /> Start 25-min focus</Button>
      </DialogContent>
    </Dialog>
  );
}
