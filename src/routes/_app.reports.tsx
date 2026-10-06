import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { differenceInCalendarDays, eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { AlarmClock, CalendarClock, Flame, ListChecks, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Area, AreaChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, PriorityBadge } from "@/components/kram/bits";
import { useSimulatedLoad } from "@/components/kram/use-loading";
import { CountUp, stagger } from "@/components/kram/motion";
import { BadgeShelf, FlameStreak, Mascot, completionDays } from "@/components/kram/celebrate";
import { Link } from "@tanstack/react-router";
import { useMyActivities, useMyProjects, useMyTasks } from "@/lib/store";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — KRAM" },
      { name: "description", content: "Insights into your completion streaks, weekly output and workload." },
      { property: "og:title", content: "Reports — KRAM" },
      { property: "og:description", content: "Insights into your completion streaks, weekly output and workload." },
    ],
  }),
  component: ReportsPage,
});

const C = { terracotta: "var(--chart-1)", sage: "var(--chart-2)", amber: "var(--chart-3)", brown: "var(--chart-4)", burnt: "var(--chart-5)", gray: "var(--muted-foreground)", sand: "var(--sand)" };
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }, cursor: { fill: "var(--muted)" } };

function StatCard({ label, value, suffix, sub, icon: Icon, tone, i }: { label: string; value: number; suffix?: string; sub: string; icon: typeof Flame; tone: string; i: number }) {
  return (
    <div style={stagger(i)} className="fade-up shine-hover wiggle-hover group relative overflow-hidden rounded-xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-150 ${tone.split(" ")[1]}`} />
      <div className={`relative mb-4 grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <div className="relative text-2xl font-semibold tabular"><CountUp value={value} />{suffix}</div>
      <div className="text-sm font-medium text-brown">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ReportsPage() {
  const loading = useSimulatedLoad();
  const tasks = useMyTasks();
  const projects = useMyProjects();
  const activities = useMyActivities();

  const data = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const completed = tasks.filter((t) => t.status === "completed");
    const open = tasks.filter((t) => t.status !== "completed");
    const overdue = open.filter((t) => t.dueDate < todayIso);
    const next7 = open.filter((t) => { const d = differenceInCalendarDays(parseISO(t.dueDate), today); return d >= 0 && d <= 7; });
    const days = completionDays(activities);
    const completedThisMonth = days.filter((d) => d.slice(0, 7) === todayIso.slice(0, 7)).length;

    // Weekly completions, last 8 weeks (Monday start)
    const weeks: { label: string; Done: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = startOfWeek(new Date(today.getTime() - w * 7 * 86400000), { weekStartsOn: 1 });
      const end = endOfWeek(start, { weekStartsOn: 1 });
      const count = days.filter((d) => { const t = parseISO(d); return t >= start && t <= end; }).length;
      weeks.push({ label: w === 0 ? "This wk" : format(start, "d MMM"), Done: count });
    }

    // Open tasks due per weekday
    const wdNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = wdNames.map((name) => ({ name, Due: 0 }));
    for (const t of open) { const p = parseISO(t.dueDate); if (!isNaN(p.getTime())) weekday[p.getDay()]!.Due++; }

    const prio = (["high", "medium", "low"] as const).map((k) => ({
      name: k[0]!.toUpperCase() + k.slice(1),
      value: tasks.filter((t) => t.priority === k && t.status !== "completed").length,
      color: k === "high" ? C.terracotta : k === "medium" ? C.amber : C.sage,
    }));

    // Busiest project by open tasks
    const busiest = projects
      .map((p) => ({ p, open: tasks.filter((t) => t.projectId === p.id && t.status !== "completed").length }))
      .sort((a, b) => b.open - a.open)[0];
    const busiestDone = busiest ? tasks.filter((t) => t.projectId === busiest.p.id && t.status === "completed").length : 0;
    const busiestTotal = busiest ? busiest.open + busiestDone : 0;

    const topTags = [...new Set(tasks.flatMap((t) => t.tags))].slice(0, 6);
    return { completed, open, overdue, next7, completedThisMonth, weeks, weekday, prio, busiest, busiestDone, busiestTotal, topTags, total: tasks.length };
  }, [tasks, projects, activities]);

  const { currentStreak, longestStreak } = useMemo(() => {
    const days = completionDays(activities).sort();
    let longest = 0, run = days.length ? 1 : 0, current = 0;
    for (let i = 1; i < days.length; i++) {
      const gap = (Date.parse(days[i]!) - Date.parse(days[i - 1]!)) / 86400000;
      run = gap === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    longest = Math.max(longest, run);
    const last = days[days.length - 1];
    if (last) {
      const gapToday = (Date.parse(todayIso()) - Date.parse(last)) / 86400000;
      if (gapToday <= 1) {
        current = 1;
        for (let i = days.length - 1; i > 0; i--) {
          const gap = (Date.parse(days[i]!) - Date.parse(days[i - 1]!)) / 86400000;
          if (gap === 1) current++;
          else break;
        }
      }
    }
    return { currentStreak: current, longestStreak: longest };
  }, [activities]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px] rounded-xl" />)}</div>
        <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
      </div>
    );
  }

  const allCaughtUp = data.overdue.length === 0;

  return (
    <div className="space-y-6">
      <div className="fade-up relative overflow-hidden rounded-2xl border bg-sunrise px-6 py-7 shadow-soft">
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-36 w-36 rounded-3xl bg-primary/15 float-slow" />
        <div aria-hidden className="pointer-events-none absolute right-24 top-10 h-16 w-16 rounded-xl bg-sage/25 float-slower" />
        <div className="relative flex items-center gap-5">
          <div>
            <div className="text-xs font-medium tracking-[0.2em] text-primary">INSIGHTS</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1>
            <p className="mt-1 text-sm text-brown">How your work is flowing — streaks, weekly output and what needs attention.</p>
            <div className="mt-3"><FlameStreak streak={currentStreak} /></div>
          </div>
          <div className="ml-auto hidden sm:block"><Mascot happy={allCaughtUp} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard i={0} label="Current Streak" value={currentStreak} sub={currentStreak > 0 ? "Keep it going!" : "Complete a task today"} icon={Flame} tone="text-destructive bg-peach" />
        <StatCard i={1} label="Longest Streak" value={longestStreak} sub="best run so far" icon={TrendingUp} tone="text-primary bg-peach" />
        <StatCard i={2} label="Done This Month" value={data.completedThisMonth} sub={`${data.completed.length} all-time`} icon={ListChecks} tone="text-sage bg-sage-soft" />
        <StatCard i={3} label="Due Next 7 Days" value={data.next7.length} sub={`${data.overdue.length} overdue now`} icon={CalendarClock} tone="text-amber bg-amber-soft" />
      </div>

      <div className="fade-up grid gap-4 lg:grid-cols-5" style={stagger(6)}>
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="mb-4"><h3 className="text-sm font-semibold">Weekly completions</h3><p className="text-xs text-muted-foreground">Tasks finished per week, last 8 weeks</p></div>
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={data.weeks} margin={{ left: -22, right: 4 }}>
                  <defs>
                    <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.terracotta} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={C.terracotta} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" interval={0} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="Done" stroke={C.terracotta} strokeWidth={2.5} fill="url(#weeklyFill)" animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4"><h3 className="text-sm font-semibold">Workload by weekday</h3><p className="text-xs text-muted-foreground">Open tasks due on each day</p></div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={data.weekday} margin={{ left: -22, right: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" interval={0} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                  <Tooltip {...tip} />
                  <Bar dataKey="Due" radius={[4, 4, 0, 0]} animationDuration={800}>
                    {data.weekday.map((d, i) => <Cell key={i} fill={d.name === "Sat" || d.name === "Sun" ? C.amber : C.sage} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="fade-up grid gap-4 lg:grid-cols-5" style={stagger(8)}>
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4"><h3 className="text-sm font-semibold">Open by priority</h3><p className="text-xs text-muted-foreground">Where the pressure sits</p></div>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.prio.some((p) => p.value > 0) ? data.prio : [{ name: "None", value: 1, color: C.sand }]} dataKey="value" innerRadius="60%" outerRadius="88%" paddingAngle={3} stroke="none" animationDuration={800}>
                    {(data.prio.some((p) => p.value > 0) ? data.prio : [{ color: C.sand }]).map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.prio.map((p) => (
                <li key={p.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /><span className="text-muted-foreground">{p.name}</span><span className="ml-auto font-medium tabular">{p.value}</span></li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><AlarmClock className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Needs attention</h3></div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between rounded-lg border bg-peach/40 px-3 py-2.5">
                <span>Overdue tasks</span>
                <span className={`font-semibold tabular ${data.overdue.length ? "text-destructive" : "text-sage"}`}>{data.overdue.length}</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border bg-sand/40 px-3 py-2.5">
                <span>Due within 7 days</span><span className="font-semibold tabular">{data.next7.length}</span>
              </li>
              {data.busiest && data.busiest.open > 0 && (
                <li className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <span className="min-w-0 truncate">Busiest project — <Link to="/projects/$id" params={{ id: data.busiest.p.id }} className="font-medium text-primary hover:text-primary-hover">{data.busiest.p.name}</Link></span>
                  <span className="ml-2 shrink-0 text-xs tabular text-muted-foreground">{data.busiest.open} open of {data.busiestTotal}</span>
                </li>
              )}
              {data.topTags.length > 0 && (
                <li className="flex flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2.5">
                  <span className="mr-1 text-muted-foreground">Top tags:</span>
                  {data.topTags.map((t) => <span key={t} className="rounded-md bg-peach px-2 py-0.5 text-xs text-primary">{t}</span>)}
                </li>
              )}
            </ul>
            {data.next7.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">NEXT UP</div>
                <ul className="space-y-2">
                  {data.next7.slice(0, 4).map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm"><PriorityBadge priority={t.priority} /><span className="truncate">{t.name}</span><span className="ml-auto shrink-0 text-xs tabular text-muted-foreground">{format(parseISO(t.dueDate), "EEE d MMM")}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>

      <BadgeShelf />
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
