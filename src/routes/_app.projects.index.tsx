import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, FolderKanban, MoreHorizontal, Pencil, Plus, Search, SearchX, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EmptyState, fmt, NativeSelect, PageHeader, Progress, ProjectStatusBadge } from "@/components/kram/bits";
import { ConfirmDialog, ProjectFormDialog } from "@/components/kram/forms";
import { progressFor } from "@/components/kram/project-progress";
import { useSimulatedLoad } from "@/components/kram/use-loading";
import { stagger } from "@/components/kram/motion";
import { accentFor } from "@/components/kram/accent";
import { useKram, useMyProjects, useMyTasks, type Project, type ProjectStatus } from "@/lib/store";

export const Route = createFileRoute("/_app/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — KRAM" },
      { name: "description", content: "Plan, track, and manage all of your projects." },
      { property: "og:title", content: "Projects — KRAM" },
      { property: "og:description", content: "Plan, track, and manage all of your projects." },
    ],
  }),
  component: ProjectsPage,
});

const filters: { v: "all" | ProjectStatus; l: string }[] = [
  { v: "all", l: "All" }, { v: "not_started", l: "Not Started" }, { v: "in_progress", l: "In Progress" }, { v: "completed", l: "Completed" },
];

function ProjectsPage() {
  const loading = useSimulatedLoad();
  const projects = useMyProjects();
  const tasks = useMyTasks();
  const deleteProject = useKram((s) => s.deleteProject);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [sort, setSort] = useState("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const l = projects.filter((p) => (status === "all" || p.status === status) && (!t || p.name.toLowerCase().includes(t)));
    return l.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? a.createdDate.localeCompare(b.createdDate) : b.createdDate.localeCompare(a.createdDate));
  }, [projects, q, status, sort]);

  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <div>
      <PageHeader title="Projects" subtitle="Plan, track, and manage your work.">
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Project</Button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" aria-label="Search projects" className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1" role="tablist" aria-label="Filter by status">
          {filters.map((f) => (
            <button key={f.v} role="tab" aria-selected={status === f.v} onClick={() => setStatus(f.v)} className={cn("rounded-md px-3 py-1 text-sm transition-colors", status === f.v ? "bg-sand font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>{f.l}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 lg:ml-auto">
          <span className="text-sm text-muted-foreground">{list.length} project{list.length === 1 ? "" : "s"}</span>
          <NativeSelect value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort projects">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option>
          </NativeSelect>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" body="Create your first project to start organizing your work." action={{ label: "Create Project", onClick: openNew }} />
      ) : list.length === 0 ? (
        <EmptyState icon={SearchX} title="No results found" body="Try another search term or change the status filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => {
            const pr = progressFor(p.id, tasks);
            return (
              <div key={p.id} style={stagger(i)} className="fade-up group relative flex flex-col overflow-hidden rounded-xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
                <span className={cn("absolute inset-x-0 top-0 h-1 origin-left transition-transform duration-500 group-hover:scale-x-100", accentFor(p.id).bar, "scale-x-[0.25]")} />
                <div className="flex items-start justify-between gap-3">
                  <ProjectStatusBadge status={p.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger className="relative z-10 -mr-2 -mt-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Actions for ${p.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate({ to: "/projects/$id", params: { id: p.id } })}><ExternalLink className="h-4 w-4" /> Open</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link to="/projects/$id" params={{ id: p.id }} className="mt-3 after:absolute after:inset-0">
                  <h3 className="font-semibold leading-snug group-hover:text-primary">{p.name}</h3>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description || "No description"}</p>
                <div className="mt-auto pt-5">
                  <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{pr.done} of {pr.total} tasks</span><span className="font-medium tabular">{pr.pct}%</span></div>
                  <Progress value={pr.pct} />
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmt(p.startDate, "MMM d")} – {fmt(p.endDate, "MMM d, yyyy")}</span>
                    <span>Created {fmt(p.createdDate, "MMM d")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete project?"
        message="This will permanently remove the project and its associated tasks."
        confirmLabel="Delete Project"
        onConfirm={() => { if (deleting) { deleteProject(deleting.id); toast.success("Project deleted"); } }}
      />
    </div>
  );
}
