import { Sparkles, Timer, Volume2 } from "lucide-react";
import { playSound, useExtras } from "@/lib/extras";
import { startFocus } from "./focus-timer";
import { startTour } from "./tour";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { BarChart3, CalendarDays, CheckSquare, FolderKanban, LayoutDashboard, LogOut, Plus, Settings } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { useKram, useMyProjects, useMyTasks } from "@/lib/store";
import { ProjectFormDialog, TaskFormDialog } from "./forms";

/** Ctrl/⌘+K quick actions: jump anywhere, create things, open projects and tasks. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const projects = useMyProjects();
  const tasks = useMyTasks();
  const logout = useKram((s) => s.logout);
  const [newProject, setNewProject] = useState(false);
  const [newTask, setNewTask] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange(!open); }
    };
    let g = 0;
    const nav = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,select,[contenteditable]") || e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (k === "g") { g = Date.now(); return; }
      if (Date.now() - g < 900) {
        const to = { d: "/dashboard", p: "/projects", t: "/tasks", s: "/settings", c: "/calendar", r: "/reports" }[k] as "/dashboard" | undefined;
        if (to) navigate({ to });
        g = 0;
      }
    };
    window.addEventListener("keydown", h);
    window.addEventListener("keydown", nav);
    return () => { window.removeEventListener("keydown", h); window.removeEventListener("keydown", nav); };
  }, [open, onOpenChange, navigate]);

  const run = (fn: () => void) => { onOpenChange(false); fn(); };

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Create">
            <CommandItem onSelect={() => run(() => setNewProject(true))}><Plus className="h-4 w-4" /> New project</CommandItem>
            <CommandItem onSelect={() => run(() => setNewTask(true))}><Plus className="h-4 w-4" /> New task</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Extras">
            <CommandItem onSelect={() => run(() => startFocus(null, "Deep work"))}><Timer className="h-4 w-4" /> Start focus timer</CommandItem>
            <CommandItem onSelect={() => run(() => startTour())}><Sparkles className="h-4 w-4" /> Replay welcome tour</CommandItem>
            <CommandItem onSelect={() => run(() => { const v = !useExtras.getState().sound; useExtras.getState().setSound(v); if (v) playSound("done"); })}><Volume2 className="h-4 w-4" /> Toggle sound effects</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => run(() => navigate({ to: "/dashboard" }))}><LayoutDashboard className="h-4 w-4" /> Dashboard<CommandShortcut>G D</CommandShortcut></CommandItem>
            <CommandItem onSelect={() => run(() => navigate({ to: "/projects" }))}><FolderKanban className="h-4 w-4" /> Projects<CommandShortcut>G P</CommandShortcut></CommandItem>
            <CommandItem onSelect={() => run(() => navigate({ to: "/tasks" }))}><CheckSquare className="h-4 w-4" /> Tasks<CommandShortcut>G T</CommandShortcut></CommandItem>
            <CommandItem onSelect={() => run(() => navigate({ to: "/calendar" }))}><CalendarDays className="h-4 w-4" /> Calendar<CommandShortcut>G C</CommandShortcut></CommandItem>
            <CommandItem onSelect={() => run(() => navigate({ to: "/reports" }))}><BarChart3 className="h-4 w-4" /> Reports<CommandShortcut>G R</CommandShortcut></CommandItem>
            <CommandItem onSelect={() => run(() => navigate({ to: "/settings" }))}><Settings className="h-4 w-4" /> Settings</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Projects">
            {projects.map((p) => (
              <CommandItem key={p.id} value={`project ${p.name}`} onSelect={() => run(() => navigate({ to: "/projects/$id", params: { id: p.id } }))}>
                <FolderKanban className="h-4 w-4 text-primary" /> {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Tasks">
            {tasks.slice(0, 40).map((t) => (
              <CommandItem key={t.id} value={`task ${t.name} ${t.id}`} onSelect={() => run(() => navigate({ to: "/projects/$id", params: { id: t.projectId } }))}>
                <CheckSquare className="h-4 w-4 text-brown" /> {t.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => run(() => { logout(); toast.success("Signed out"); navigate({ to: "/login" }); })}><LogOut className="h-4 w-4" /> Log out</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <ProjectFormDialog open={newProject} onOpenChange={setNewProject} />
      <TaskFormDialog open={newTask} onOpenChange={setNewTask} />
    </>
  );
}
