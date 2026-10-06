import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FieldError, NativeSelect } from "./bits";
import { sleep, useAllTags, useKram, useMyProjects, type Project, type Task } from "@/lib/store";

const projectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(80, "Keep it under 80 characters"),
    description: z.string().max(500, "Keep it under 500 characters"),
    status: z.enum(["not_started", "in_progress", "completed"], { required_error: "Status is required" }),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "End date cannot be earlier than start date" });

type PV = z.infer<typeof projectSchema>;

export function ProjectFormDialog({ open, onOpenChange, project }: { open: boolean; onOpenChange: (o: boolean) => void; project?: Project | null }) {
  const createProject = useKram((s) => s.createProject);
  const updateProject = useKram((s) => s.updateProject);
  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PV>({ resolver: zodResolver(projectSchema) });

  useEffect(() => {
    if (open) reset(project ? { name: project.name, description: project.description, status: project.status, startDate: project.startDate, endDate: project.endDate } : { name: "", description: "", status: "not_started", startDate: today, endDate: "" });
  }, [open, project, reset, today]);

  const onSubmit = async (v: PV) => {
    await sleep(500);
    try {
      if (project) { updateProject(project.id, v); toast.success("Project updated successfully"); }
      else { createProject(v); toast.success("Project created successfully"); }
      onOpenChange(false);
    } catch {
      toast.error(project ? "Unable to update project" : "Unable to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>{project ? "Update the details of this project." : "Give your project a name and a timeline."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="pname">Project name</Label>
            <Input id="pname" className="mt-1.5" placeholder="e.g. Customer Portal Launch" {...register("name")} aria-invalid={!!errors.name} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="pdesc">Description</Label>
            <Textarea id="pdesc" className="mt-1.5" rows={3} placeholder="What is this project about?" {...register("description")} />
            <FieldError msg={errors.description?.message} />
          </div>
          <div>
            <Label htmlFor="pstatus">Status</Label>
            <NativeSelect id="pstatus" className="mt-1.5 w-full" {...register("status")}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </NativeSelect>
            <FieldError msg={errors.status?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pstart">Start date</Label>
              <Input id="pstart" type="date" className="mt-1.5" {...register("startDate")} />
              <FieldError msg={errors.startDate?.message} />
            </div>
            <div>
              <Label htmlFor="pend">End date</Label>
              <Input id="pend" type="date" className="mt-1.5" {...register("endDate")} />
              <FieldError msg={errors.endDate?.message} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {project ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const taskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required").max(120, "Keep it under 120 characters"),
  description: z.string().max(500, "Keep it under 500 characters"),
  projectId: z.string().min(1, "Project is required"),
  priority: z.enum(["low", "medium", "high"], { required_error: "Priority is required" }),
  status: z.enum(["pending", "in_progress", "completed"], { required_error: "Status is required" }),
  dueDate: z.string().min(1, "Due date is required").refine((d) => !isNaN(Date.parse(d)), "Enter a valid date"),
  tags: z.string().max(200, "Keep tags under 200 characters"),
});
type TV = z.infer<typeof taskSchema>;

export function TaskFormDialog({ open, onOpenChange, task, defaultProjectId, defaultDueDate }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task | null; defaultProjectId?: string | undefined; defaultDueDate?: string | undefined }) {
  const projects = useMyProjects();
  const allTags = useAllTags();
  const createTask = useKram((s) => s.createTask);
  const updateTask = useKram((s) => s.updateTask);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<TV>({ resolver: zodResolver(taskSchema) });

  useEffect(() => {
    if (open) reset(task ? { name: task.name, description: task.description, projectId: task.projectId, priority: task.priority, status: task.status, dueDate: task.dueDate, tags: task.tags.join(", ") } : { name: "", description: "", projectId: defaultProjectId ?? "", priority: "medium", status: "pending", dueDate: defaultDueDate ?? "", tags: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, defaultProjectId, defaultDueDate]);

  const tagValue = watch("tags") ?? "";
  const activeTags = tagValue.split(",").map((s) => s.trim()).filter(Boolean).map((s) => s.toLowerCase());
  const toggleTag = (t: string) => {
    if (activeTags.includes(t.toLowerCase())) setValue("tags", activeTags.filter((x) => x !== t.toLowerCase()).join(", "));
    else setValue("tags", [...activeTags, t].join(", "), { shouldDirty: true });
  };

  const onSubmit = async (v: TV) => {
    await sleep(450);
    const tags = [...new Set(v.tags.split(",").map((s) => s.trim()).filter(Boolean).map((s) => s.toLowerCase()))];
    if (task) { updateTask(task.id, { ...v, tags }); toast.success("Task updated successfully"); }
    else { createTask({ ...v, tags }); toast.success("Task created successfully"); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>{task ? "Update this task's details." : "Add a task and assign it to a project."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="tname">Task name</Label>
            <Input id="tname" className="mt-1.5" placeholder="e.g. Review pricing page copy" {...register("name")} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="tdesc">Description</Label>
            <Textarea id="tdesc" className="mt-1.5" rows={2} {...register("description")} />
          </div>
          <div>
            <Label htmlFor="tproj">Project</Label>
            <NativeSelect id="tproj" className="mt-1.5 w-full" {...register("projectId")}>
              <option value="">Select a project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </NativeSelect>
            <FieldError msg={errors.projectId?.message} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="tprio">Priority</Label>
              <NativeSelect id="tprio" className="mt-1.5 w-full" {...register("priority")}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="tstat">Status</Label>
              <NativeSelect id="tstat" className="mt-1.5 w-full" {...register("status")}>
                <option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="tdue">Due date</Label>
              <Input id="tdue" type="date" className="mt-1.5" {...register("dueDate")} />
            </div>
          </div>
          <div>
            <Label htmlFor="ttags">Tags</Label>
            <Input id="ttags" className="mt-1.5" placeholder="e.g. design, backend" {...register("tags")} />
            {allTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs transition-all hover:-translate-y-0.5 press",
                      activeTags.includes(t) ? "border-primary bg-peach text-primary" : "bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FieldError msg={errors.dueDate?.message} />
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || projects.length === 0}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, message, confirmLabel, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; message: string; confirmLabel: string; onConfirm: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); await sleep(400); await onConfirm(); setBusy(false); onOpenChange(false); }}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
