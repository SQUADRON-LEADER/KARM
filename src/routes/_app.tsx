import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Bell, CalendarDays, CheckSquare, Command as CmdIcon, FolderKanban, LayoutDashboard, LogOut, Menu, Moon, PanelLeft, Search, Settings, Sun } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Avatar, Logo } from "@/components/kram/bits";
import { CommandPalette } from "@/components/kram/command-palette";
import { FocusTimerWidget } from "@/components/kram/focus-timer";
import { WelcomeTour } from "@/components/kram/tour";
import { useExtras } from "@/lib/extras";
import { useCurrentUser, useKram, useMyActivities, useMyProjects, useMyTasks, usePrefs } from "@/lib/store";

export const Route = createFileRoute("/_app")({ component: AppLayout });

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function SidebarBody({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const user = useCurrentUser();
  const logout = useKram((s) => s.logout);
  const toggle = useExtras((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[data-status="active"]');
    setPill(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
  }, [path, collapsed]);
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center py-5", collapsed ? "justify-center px-2" : "justify-between px-5")}>
        {!collapsed && <Logo />}
        {!onNavigate && <button onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-transform hover:bg-muted hover:text-foreground"><PanelLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} /></button>}
      </div>
      <nav ref={navRef} data-tour="nav" className="relative mx-3 flex-1 space-y-0.5" aria-label="Main">
        {pill && <span className="nav-pill" style={pill} aria-hidden />}
        {nav.map(({ to, label, icon: Icon }, i) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            style={{ animationDelay: `${i * 40}ms` }}
            className={cn("nav-link fade-up relative z-10 flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted/60", collapsed ? "justify-center px-0" : "px-3")}
            activeProps={{ className: "text-foreground [&_svg]:text-primary hover:bg-transparent" }}
          >
            <Icon className="h-[18px] w-[18px] text-muted-foreground" />
            {!collapsed && label}
          </Link>
        ))}
      </nav>
      {user && (
        <div className={cn("m-3 flex items-center gap-3 rounded-lg border bg-background/60 p-2.5", collapsed && "flex-col p-1.5")}>
          <Avatar name={user.fullName} src={user.avatar} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          )}
          <button
            aria-label="Log out"
            onClick={() => { logout(); toast.success("Signed out"); navigate({ to: "/login" }); }}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Pointer-driven 3D tilt for every `.tilt` card. */
function TiltDriver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(pointer: fine)").matches) return;
    let last: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(".tilt");
      if (last && last !== el) { last.removeAttribute("data-tilting"); }
      last = el;
      if (!el || el.offsetHeight > 420) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(x - 0.5) * 7}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.setAttribute("data-tilting", "");
    };
    document.addEventListener("pointermove", move);
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return null;
}

const floaters = Array.from({ length: 14 }, (_, i) => ({ left: `${(i * 37) % 100}%`, size: 14 + ((i * 13) % 34), dur: 22 + ((i * 7) % 20), delay: -((i * 5) % 30) }));

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const projects = useMyProjects();
  const tasks = useMyTasks();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const term = q.trim().toLowerCase();
  const res = useMemo(() => term ? { p: projects.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 5), t: tasks.filter((t) => t.name.toLowerCase().includes(term)).slice(0, 6) } : { p: [], t: [] }, [term, projects, tasks]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const go = (fn: () => void) => { fn(); setOpen(false); setQ(""); };
  const count = res.p.length + res.t.length;
  return (
    <div ref={ref} data-tour="search" className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Search projects and tasks…"
        aria-label="Search projects and tasks"
        className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && term && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border bg-popover shadow-lift">
          <div className="border-b px-3 py-2 text-xs text-muted-foreground">{count} result{count === 1 ? "" : "s"}</div>
          {count === 0 ? (
            <div className="px-3 py-6 text-center text-sm"><div className="font-medium">No results found</div><div className="text-muted-foreground">Try another search term.</div></div>
          ) : (
            <div className="max-h-80 overflow-auto py-1">
              {res.p.length > 0 && <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">Projects</div>}
              {res.p.map((p) => (
                <button key={p.id} onClick={() => go(() => navigate({ to: "/projects/$id", params: { id: p.id } }))} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                  <FolderKanban className="h-4 w-4 text-primary" />{p.name}
                </button>
              ))}
              {res.t.length > 0 && <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">Tasks</div>}
              {res.t.map((t) => (
                <button key={t.id} onClick={() => go(() => navigate({ to: "/projects/$id", params: { id: t.projectId } }))} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                  <CheckSquare className="h-4 w-4 text-brown" /><span className="truncate">{t.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{projects.find((p) => p.id === t.projectId)?.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const acts = useMyActivities().slice(0, 8);
  const prefs = usePrefs();
  const [seen, setSeen] = useState<string | null>(null);
  const unread = prefs.notifications && acts[0] && acts[0].id !== seen;
  return (
    <Popover onOpenChange={(o) => o && acts[0] && setSeen(acts[0].id)}>
      <PopoverTrigger className="relative grid h-9 w-9 place-items-center rounded-lg text-brown hover:bg-muted" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
        {unread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Recent activity</div>
        {!prefs.notifications ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Notifications are turned off in Settings.</div>
        ) : acts.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing yet.</div>
        ) : (
          <ul className="max-h-80 overflow-auto py-1">
            {acts.map((a) => (
              <li key={a.id} className="px-4 py-2.5 text-sm">
                <div>{a.message}</div>
                <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

const titles: Record<string, string> = { dashboard: "Dashboard", projects: "Projects", tasks: "Tasks", calendar: "Calendar", reports: "Reports", settings: "Settings" };

/** Applies the chosen theme + light/dark mode to the document. */
function ThemeApplier({ theme, dark }: { theme: string; dark: boolean }) {
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "terracotta") delete el.dataset["theme"];
    else el.dataset["theme"] = theme;
    el.classList.toggle("dark", dark);
  }, [theme, dark]);
  return null;
}

function AppLayout() {
  const hydrated = useKram((s) => s.hydrated);
  const user = useCurrentUser();
  const navigate = useNavigate();
  const prefs = usePrefs();
  const setPrefs = useKram((s) => s.setPrefs);
  const collapsed = useExtras((s) => s.sidebarCollapsed);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const section = path.split("/")[1] ?? "";

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/login", replace: true });
  }, [hydrated, user, navigate]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-60 border-r bg-sidebar p-5 lg:block"><Skeleton className="h-7 w-24" /></div>
        <div className="flex-1 space-y-4 p-8"><Skeleton className="h-8 w-56" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div><Skeleton className="h-72 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen", prefs.compact && "compact")}>
      <ThemeApplier theme={prefs.theme} dark={prefs.dark} />
      <div className="aurora" aria-hidden><span className="left-[-10%] top-[-12%] h-[45vmax] w-[45vmax]" /><span className="right-[-12%] top-[20%] h-[40vmax] w-[40vmax]" /><span className="bottom-[-15%] left-[30%] h-[38vmax] w-[38vmax]" /></div>
      <div className="floaters" aria-hidden>{floaters.map((f, i) => <i key={i} style={{ left: f.left, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />)}</div>
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 border-r bg-sidebar/90 backdrop-blur transition-[width] duration-300 lg:block", collapsed ? "w-[68px]" : "w-60")}><SidebarBody collapsed={collapsed} /></aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
            <span className="text-muted-foreground">KRAM</span><span className="text-border">/</span>
            <span className="font-medium">{titles[section] ?? "Workspace"}</span>
          </div>
          <div className="flex flex-1 justify-end gap-2 md:justify-center"><GlobalSearch /></div>
          <button onClick={() => setPalette(true)} className="hidden h-9 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex" aria-label="Open command menu" data-tour="cmdk"><CmdIcon className="h-3.5 w-3.5" />K</button>
          <button
            onClick={() => { setPrefs({ dark: !prefs.dark }); toast.success(`${!prefs.dark ? "Dark" : "Light"} mode on`); }}
            data-tour="theme"
            className="grid h-9 w-9 place-items-center rounded-lg text-brown transition-all hover:rotate-12 hover:bg-muted"
            aria-label={prefs.dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {prefs.dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <Notifications />
          <Link to="/settings" aria-label="Your settings"><Avatar name={user.fullName} src={user.avatar} /></Link>
        </header>
        <main key={path} className="page-in mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
        <CommandPalette open={palette} onOpenChange={setPalette} />
        <FocusTimerWidget />
        <WelcomeTour />
        <TiltDriver />
      </div>
    </div>
  );
}
