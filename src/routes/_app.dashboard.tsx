import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { formatDistanceToNow, differenceInCalendarDays, parseISO } from "date-fns";
import { CheckCircle2, CircleDashed, FolderKanban, ListTodo, Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, fmt, PriorityBadge, TaskStatusBadge } from "@/components/kram/bits";
import { useSimulatedLoad } from "@/components/kram/use-loading";
import { CountUp, Ring, stagger } from "@/components/kram/motion";
import { TaskCheck } from "@/components/kram/task-list";
import { BadgeShelf, FlameStreak, streaks } from "@/components/kram/celebrate";
import { useCurrentUser, useMyActivities, useMyProjects, useMyTasks } from "@/lib/store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — KRAM" },
      { name: "description", content: "An overview of your projects, tasks and recent activity." },
      { property: "og:title", content: "Dashboard — KRAM" },
      { property: "og:description", content: "An overview of your projects, tasks and recent activity." },
    ],
  }),
  component: Dashboard,
});

const C = { terracotta: "var(--chart-1)", sage: "var(--chart-2)", amber: "var(--chart-3)", brown: "var(--chart-4)", burnt: "var(--chart-5)", gray: "var(--muted-foreground)", sand: "var(--sand)" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4"><h3 className="text-sm font-semibold">{title}</h3><p className="text-xs text-muted-foreground">{sub}</p></div>
      <div className="h-56">{children}</div>
    </Card>
  );
}

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }, cursor: { fill: "var(--muted)" } };

function Legend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((i) => (
        <li key={i.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} /><span className="text-muted-foreground">{i.name}</span><span className="ml-auto font-medium tabular">{i.value}</span></li>
      ))}
    </ul>
  );
}

function Donut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="grid h-full grid-cols-[1fr_auto] items-center gap-4">
      <div className="relative h-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={total ? data : [{ name: "None", value: 1, color: C.sand }]} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={total ? 2 : 0} stroke="none">
              {(total ? data : [{ color: C.sand }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            {total > 0 && <Tooltip {...tip} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="text-center"><div className="text-xl font-semibold tabular">{total}</div><div className="text-[11px] text-muted-foreground">total</div></div></div>
      </div>
      <div className="w-36"><Legend items={data} /></div>
    </div>
  );
}

/** Today's focus: overall completion ring, the next 3 tasks to tick off, and per-project progress. */
function FocusStrip() {
  const tasks = useMyTasks();
  const projects = useMyProjects();
  const done = tasks.filter((t) => t.status === "completed").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const next = tasks.filter((t) => t.status !== "completed").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3);
  const active = projects.filter((p) => p.status === "in_progress").slice(0, 3);
  return (
    <div className="fade-up grid gap-4 lg:grid-cols-[auto_1fr_1fr]" style={stagger(5)}>
      <Card className="flex items-center gap-4 p-5">
        <div className="relative"><Ring pct={pct} size={76} stroke={7} /><div className="absolute inset-0 grid place-items-center text-sm font-semibold tabular"><span><CountUp value={pct} />%</span></div></div>
        <div><div className="text-sm font-semibold">Overall progress</div><div className="text-xs text-muted-foreground">{done} of {tasks.length} tasks done</div></div>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold">Focus next</div>
        {next.length === 0 ? <p className="text-sm text-muted-foreground">Nothing pending — enjoy the calm.</p> : (
          <ul className="space-y-2.5">{next.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 text-sm"><TaskCheck task={t} /><span className="truncate">{t.name}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{fmt(t.dueDate, "MMM d")}</span></li>
          ))}</ul>
        )}
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold">Active projects</div>
        <ul className="space-y-3">{active.map((p) => {
          const t = tasks.filter((x) => x.projectId === p.id); const d = t.filter((x) => x.status === "completed").length; const v = t.length ? Math.round((d / t.length) * 100) : 0;
          return (
            <li key={p.id}><Link to="/projects/$id" params={{ id: p.id }} className="group block">
              <div className="mb-1 flex justify-between text-xs"><span className="truncate font-medium group-hover:text-primary">{p.name}</span><span className="tabular text-muted-foreground">{v}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-sand"><div className="grow-x h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${v}%` }} /></div>
            </Link></li>
          );
        })}{active.length === 0 && <li className="text-sm text-muted-foreground">No projects in progress.</li>}</ul>
      </Card>
    </div>
  );
}

function Dashboard() {
  const loading = useSimulatedLoad();
  const user = useCurrentUser()!;
  const projects = useMyProjects();
  const tasks = useMyTasks();
  const activities = useMyActivities();

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProg = projects.filter((p) => p.status === "in_progress").length;
    return { completed, pending: tasks.length - completed, inProg, rate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
  }, [tasks, projects]);

  const perProject = projects.map((p) => {
    const t = tasks.filter((x) => x.projectId === p.id);
    const done = t.filter((x) => x.status === "completed").length;
    return { name: p.name.split(" ")[0] ?? p.name, Completed: done, Remaining: t.length - done };
  });
  const byStatus = [
    { name: "Pending", value: tasks.filter((t) => t.status === "pending").length, color: C.amber },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, color: C.terracotta },
    { name: "Completed", value: stats.completed, color: C.sage },
  ];
  const projStatus = [
    { name: "Not Started", value: projects.filter((p) => p.status === "not_started").length, color: C.gray },
    { name: "In Progress", value: stats.inProg, color: C.terracotta },
    { name: "Completed", value: projects.filter((p) => p.status === "completed").length, color: C.sage },
  ];
  const prio = (["high", "medium", "low"] as const).map((k) => ({ name: k[0]!.toUpperCase() + k.slice(1), Open: tasks.filter((t) => t.priority === k && t.status !== "completed").length, Done: tasks.filter((t) => t.priority === k && t.status === "completed").length }));

  const upcoming = tasks.filter((t) => t.status !== "completed").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const pname = (id: string) => projects.find((p) => p.id === id)?.name ?? "";

  const cards = [
    { label: "Total Projects", value: projects.length, ctx: `${projects.filter((p) => p.status === "completed").length} completed`, icon: FolderKanban, tone: "text-primary bg-peach" },
    { label: "Total Tasks", value: tasks.length, ctx: `across ${projects.length} projects`, icon: ListTodo, tone: "text-brown bg-sand" },
    { label: "Completed Tasks", value: stats.completed, ctx: `${stats.rate}% completion rate`, icon: CheckCircle2, tone: "text-sage bg-sage-soft" },
    { label: "Pending Tasks", value: stats.pending, ctx: `${tasks.filter((t) => t.status !== "completed" && t.dueDate < new Date().toISOString().slice(0, 10)).length} overdue`, icon: Timer, tone: "text-amber bg-amber-soft" },
    { label: "Projects In Progress", value: stats.inProg, ctx: "actively moving", icon: CircleDashed, tone: "text-primary bg-peach" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-80" /></div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{cards.map((c) => <Skeleton key={c.label} className="h-[118px] rounded-xl" />)}</div>
        <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="fade-up relative overflow-hidden rounded-2xl border bg-sunrise px-6 py-7 shadow-soft">
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-36 w-36 rounded-3xl bg-primary/15 float-slow" />
        <div aria-hidden className="pointer-events-none absolute right-24 top-10 h-16 w-16 rounded-xl bg-sage/25 float-slower" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-18px] right-48 h-20 w-20 rounded-2xl bg-amber/20 float-slow" />
        <div className="relative">
          <div className="text-xs font-medium tracking-[0.2em] text-primary">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{greeting()}, {user.fullName.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-brown">Here's what's happening across your projects — {stats.pending} tasks waiting, {stats.rate}% done.</p>
          <div className="mt-3"><FlameStreak streak={streaks(activities).currentStreak} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, ctx, icon: Icon, tone }, i) => (
          <div key={label} style={stagger(i)} className="fade-up wiggle-hover group relative overflow-hidden rounded-xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-150 ${tone.split(" ")[1]}`} />
            <div className={`relative mb-4 grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
            <div className="relative text-2xl font-semibold tabular"><CountUp value={value} /></div>
            <div className="text-sm font-medium text-brown">{label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{ctx}</div>
          </div>
        ))}
      </div>

      <FocusStrip />

      <BadgeShelf />


      <div className="fade-up grid gap-4 lg:grid-cols-5" style={stagger(6)}>
        <div className="lg:col-span-3">
          <ChartCard title="Task completion overview" sub="Completed vs remaining tasks per project">
            <ResponsiveContainer>
              <BarChart data={perProject} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip {...tip} />
                <Bar dataKey="Completed" stackId="a" fill={C.sage} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Remaining" stackId="a" fill={C.terracotta} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="lg:col-span-2"><ChartCard title="Tasks by status" sub="Current distribution"><Donut data={byStatus} /></ChartCard></div>
        <div className="lg:col-span-2"><ChartCard title="Projects by status" sub="Portfolio health"><Donut data={projStatus} /></ChartCard></div>
        <div className="lg:col-span-3">
          <ChartCard title="Task priority distribution" sub="Open and done tasks by priority">
            <ResponsiveContainer>
              <BarChart data={prio} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={60} />
                <Tooltip {...tip} />
                <Bar dataKey="Open" stackId="p" fill={C.burnt} />
                <Bar dataKey="Done" stackId="p" fill={C.brown} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="fade-up grid gap-4 lg:grid-cols-5" style={stagger(8)}>
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h3 className="text-sm font-semibold">Upcoming tasks</h3>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:text-primary-hover">View all</Link>
          </div>
          {upcoming.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">You're all caught up.</p> : (
            <ul>
              {upcoming.map((t) => {
                const d = differenceInCalendarDays(parseISO(t.dueDate), new Date());
                return (
                  <li key={t.id} className="border-b last:border-0">
                    <Link to="/projects/$id" params={{ id: t.projectId }} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{pname(t.projectId)}</div>
                      </div>
                      <div className="hidden sm:block"><PriorityBadge priority={t.priority} /></div>
                      <div className="hidden md:block"><TaskStatusBadge status={t.status} /></div>
                      <div className={`w-20 text-right text-xs tabular ${d < 0 ? "text-destructive" : d <= 2 ? "text-amber" : "text-muted-foreground"}`}>
                        {d < 0 ? `${-d}d overdue` : d === 0 ? "Today" : d === 1 ? "Tomorrow" : fmt(t.dueDate, "MMM d")}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <div className="border-b px-5 py-4"><h3 className="text-sm font-semibold">Recent activity</h3></div>
          {activities.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">No activity yet.</p> : (
            <ol className="relative px-5 py-4">
              {activities.slice(0, 7).map((a, i, arr) => (
                <li key={a.id} style={stagger(i, 60)} className="fade-up relative flex gap-3 pb-4 last:pb-0">
                  {i < arr.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" />}
                  <span className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-card ${a.type.includes("completed") ? "bg-sage" : a.type.includes("deleted") ? "bg-destructive" : a.type.includes("created") ? "bg-primary" : "bg-brown"}`} />
                  <div className="min-w-0">
                    <div className="text-sm">{a.message}</div>
                    <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
