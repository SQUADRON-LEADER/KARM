import { useEffect, useState } from "react";
import { Coffee, Pause, Play, Timer, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { playSound, useExtras } from "@/lib/extras";

const FOCUS = 25 * 60;
const BREAK = 5 * 60;

export function startFocus(taskId: string | null, taskName: string) {
  useExtras.getState().setTimer({ taskId, taskName, mode: "focus", endsAt: Date.now() + FOCUS * 1000, remaining: FOCUS, total: FOCUS });
  playSound("tick");
  toast.success(`Focus started — ${taskName}`);
}

/** Floating Pomodoro widget with an animated progress ring. */
export function FocusTimerWidget() {
  const timer = useExtras((s) => s.timer);
  const setTimer = useExtras((s) => s.setTimer);
  const logFocus = useExtras((s) => s.logFocus);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!timer?.endsAt) return;
    const i = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(i);
  }, [timer?.endsAt]);

  const left = timer ? (timer.endsAt ? Math.max(0, Math.round((timer.endsAt - Date.now()) / 1000)) : timer.remaining) : 0;

  useEffect(() => {
    if (!timer?.endsAt || left > 0) return;
    playSound("timer");
    if (timer.mode === "focus") {
      if (timer.taskId) logFocus(timer.taskId, Math.round(timer.total / 60));
      toast.success("Focus session done! Take a 5 min break ☕");
      setTimer({ ...timer, mode: "break", endsAt: Date.now() + BREAK * 1000, remaining: BREAK, total: BREAK });
    } else {
      toast.success("Break over — ready for another round?");
      setTimer(null);
    }
  }, [left, timer, setTimer, logFocus]);

  if (!timer) return null;
  const pct = 1 - left / timer.total;
  const r = 22, c = 2 * Math.PI * r;
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  const running = !!timer.endsAt;

  return (
    <div className={cn("pop-in fixed bottom-5 left-5 z-50 lg:left-64 flex items-center gap-3 rounded-2xl border bg-popover/95 p-3 pr-4 shadow-lift backdrop-blur", running && "timer-glow")}>
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90">
          <circle cx="26" cy="26" r={r} className="fill-none stroke-muted" strokeWidth="4" />
          <circle cx="26" cy="26" r={r} className={cn("fill-none transition-[stroke-dashoffset] duration-500", timer.mode === "focus" ? "stroke-primary" : "stroke-sage")} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">{timer.mode === "focus" ? <Timer className={cn("h-5 w-5 text-primary", running && "animate-pulse")} /> : <Coffee className="h-5 w-5 text-sage" />}</div>
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{timer.mode === "focus" ? "Focusing" : "Break"}</div>
        <div className="text-xl font-semibold tabular">{mm}:{ss}</div>
        <div className="max-w-36 truncate text-xs text-muted-foreground">{timer.taskName}</div>
      </div>
      <div className="flex flex-col gap-1">
        <button aria-label={running ? "Pause timer" : "Resume timer"} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
          onClick={() => setTimer(running ? { ...timer, endsAt: null, remaining: left } : { ...timer, endsAt: Date.now() + left * 1000 })}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button aria-label="Stop timer" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive" onClick={() => setTimer(null)}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
