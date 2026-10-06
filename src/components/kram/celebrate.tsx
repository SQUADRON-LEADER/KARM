import { playSound } from "@/lib/extras";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Award, Crown, Flame, Rocket, Sparkles, Star, Tag, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKram, useMyActivities, useMyProjects, useMyTasks, usePrefs } from "@/lib/store";
import { Card } from "./bits";
import { stagger } from "./motion";

/** Rich confetti burst: falling, spinning pieces from a screen point. */
export function confetti(x: number, y: number, count = 34) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["var(--primary)", "var(--sage)", "var(--amber)", "var(--primary-hover)", "var(--brown)", "var(--peach)"];
  for (let i = 0; i < count; i++) {
    const d = document.createElement("span");
    d.className = "confetti-piece";
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const r = 60 + Math.random() * 130;
    d.style.left = `${x - 4}px`;
    d.style.top = `${y - 7}px`;
    d.style.background = colors[i % colors.length]!;
    d.style.setProperty("--dx", `${Math.cos(a) * r}px`);
    d.style.setProperty("--dy", `${Math.sin(a) * r + 160}px`);
    d.style.animationDelay = `${Math.random() * 120}ms`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1700);
  }
}

export interface Stats {
  completedCount: number;
  currentStreak: number;
  longestStreak: number;
  projectsCompleted: number;
  projectsTotal: number;
  tagsUsed: number;
}

/** Completion days come from the activity log's task_completed entries. */
export function completionDays(activities: { type: string; createdAt: string }[]) {
  return [...new Set(activities.filter((a) => a.type === "task_completed").map((a) => a.createdAt.slice(0, 10)))];
}

export function streaks(activities: { type: string; createdAt: string }[]) {
  const days = completionDays(activities).sort();
  if (days.length === 0) return { currentStreak: 0, longestStreak: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let current = 0;
  const last = days[days.length - 1]!;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const gap = (Date.parse(days[i]!) - Date.parse(days[i - 1]!)) / 86400000;
      if (gap === 1) current++;
      else break;
    }
  }
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = (Date.parse(days[i]!) - Date.parse(days[i - 1]!)) / 86400000;
    run = gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}

export function computeStats(tasks: { status: string; tags: string[] }[], activities: { type: string; createdAt: string }[], projects: { status: string }[]): Stats {
  const { currentStreak, longestStreak } = streaks(activities);
  return {
    completedCount: tasks.filter((t) => t.status === "completed").length,
    currentStreak,
    longestStreak,
    projectsCompleted: projects.filter((p) => p.status === "completed").length,
    projectsTotal: projects.length,
    tagsUsed: new Set(tasks.flatMap((t) => t.tags)).size,
  };
}

export const BADGES = [
  { id: "first-step", label: "First Step", description: "Complete your first task", icon: Sparkles, tier: "text-primary bg-peach" },
  { id: "ten-done", label: "Task Stacker", description: "Complete 10 tasks", icon: Star, tier: "text-amber bg-amber-soft" },
  { id: "fifty-done", label: "Task Master", description: "Complete 50 tasks", icon: Trophy, tier: "text-brown bg-sand" },
  { id: "on-a-roll", label: "On a Roll", description: "3-day completion streak", icon: Flame, tier: "text-destructive bg-peach" },
  { id: "week-warrior", label: "Week Warrior", description: "7-day completion streak", icon: Crown, tier: "text-primary bg-peach" },
  { id: "finisher", label: "Finisher", description: "Complete a whole project", icon: Rocket, tier: "text-sage bg-sage-soft" },
  { id: "big-planner", label: "Big Planner", description: "Have 5 projects at once", icon: Award, tier: "text-amber bg-amber-soft" },
  { id: "tag-tactician", label: "Tag Tactician", description: "Use 5 different tags", icon: Tag, tier: "text-sage bg-sage-soft" },
] as const;

export function earnedIds(s: Stats) {
  return BADGES.filter(
    (b) =>
      (b.id === "first-step" && s.completedCount >= 1) ||
      (b.id === "ten-done" && s.completedCount >= 10) ||
      (b.id === "fifty-done" && s.completedCount >= 50) ||
      (b.id === "on-a-roll" && s.currentStreak >= 3) ||
      (b.id === "week-warrior" && s.currentStreak >= 7) ||
      (b.id === "finisher" && s.projectsCompleted >= 1) ||
      (b.id === "big-planner" && s.projectsTotal >= 5) ||
      (b.id === "tag-tactician" && s.tagsUsed >= 5),
  ).map((b) => b.id);
}

/** Watches progress and unlocks badges with a confetti celebration. */
export function useAchievements() {
  const tasks = useMyTasks();
  const projects = useMyProjects();
  const activities = useMyActivities();
  const prefs = usePrefs();
  const setPrefs = useKram((s) => s.setPrefs);
  const earned = earnedIds(computeStats(tasks, activities, projects));
  const checked = useRef(false);
  useEffect(() => {
    if (!prefs.unlockedBadges) {
      setPrefs({ unlockedBadges: [] });
      return;
    }
    if (checked.current) return;
    const fresh = earned.filter((id) => !prefs.unlockedBadges.includes(id));
    if (fresh.length === 0) return;
    checked.current = true;
    setPrefs({ unlockedBadges: [...prefs.unlockedBadges, ...fresh] });
    for (const id of fresh) {
      const b = BADGES.find((x) => x.id === id)!;
      toast.success(`Badge unlocked — ${b.label}`, { description: b.description });
    }
    confetti(window.innerWidth / 2, window.innerHeight / 3, 44);
    playSound("badge");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earned.join(",")]);
  return { earned, unlocked: prefs.unlockedBadges ?? [], stats: computeStats(tasks, activities, projects) };
}

export function FlameStreak({ streak, className }: { streak: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={`${streak} day streak`}>
      <Flame className={cn("h-4 w-4 text-destructive", streak > 0 && "flame")} />
      <span className="font-semibold tabular">{streak}</span>
      <span className="text-xs text-muted-foreground">day streak</span>
    </span>
  );
}

/** A little mascot that reacts to how caught-up you are. */
export function Mascot({ happy }: { happy: boolean }) {
  return (
    <div className="relative h-16 w-16 select-none" aria-hidden>
      <div className={cn("absolute inset-0 rounded-[45%_55%_52%_48%/55%_45%_55%_45%] bob", happy ? "bg-sage" : "bg-primary")} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-card" />
          <span className="h-2 w-2 rounded-full bg-card" />
        </div>
      </div>
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2">
        {happy ? (
          <span className="block h-2 w-4 rounded-b-full border-b-2 border-card" />
        ) : (
          <span className="block h-0.5 w-3.5 rounded-full bg-card" />
        )}
      </div>
      {happy && <span className="absolute -right-1 -top-1 text-base pop-in">✨</span>}
    </div>
  );
}

/** Badge shelf: earned badges shine, locked ones wait in grey. */
export function BadgeShelf() {
  const { earned } = useAchievements();
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Badges</h3>
          <p className="text-xs text-muted-foreground">{earned.length} of {BADGES.length} unlocked</p>
        </div>
        <div className="flex gap-1">
          {BADGES.map((b, i) => (
            <span key={b.id} style={stagger(i, 40)} className={cn("h-2 w-2 rounded-full", earned.includes(b.id) ? "bg-primary" : "bg-border")} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {BADGES.map((b, i) => {
          const got = earned.includes(b.id);
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              style={stagger(i, 50)}
              title={`${b.label} — ${b.description}`}
              className={cn(
                "pop-in group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all hover:-translate-y-1 hover:shadow-lift",
                got ? "gradient-border" : "border-dashed opacity-50",
              )}
            >
              <span className={cn("grid h-9 w-9 place-items-center rounded-lg transition-transform group-hover:scale-110", got ? b.tier : "bg-muted text-muted-foreground")}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-medium leading-tight">{b.label}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
