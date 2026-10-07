import { cn } from "@/lib/utils";
import type { Priority, ProjectStatus, TaskStatus } from "@/lib/store";
import { priorityLabel, projectStatusLabel, taskStatusLabel } from "@/lib/store";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src="/logo.png" alt="KRAM" className="h-7 w-7 rounded-md object-cover" />
      <span className="text-[17px] font-semibold tracking-[0.18em] text-foreground">KRAM</span>
    </div>
  );
}

const pill = "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap";
const dot = "h-1.5 w-1.5 rounded-full";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = { not_started: ["bg-muted text-muted-foreground", "bg-muted-foreground"], in_progress: ["bg-peach text-primary", "bg-primary"], completed: ["bg-sage-soft text-sage", "bg-sage"] }[status];
  return <span className={cn(pill, s[0])}><span className={cn(dot, s[1])} />{projectStatusLabel[status]}</span>;
}
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = { pending: ["bg-amber-soft text-amber", "bg-amber"], in_progress: ["bg-peach text-primary", "bg-primary"], completed: ["bg-sage-soft text-sage", "bg-sage"] }[status];
  return <span className={cn(pill, s[0])}><span className={cn(dot, s[1])} />{taskStatusLabel[status]}</span>;
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  const s = { high: "bg-peach text-destructive", medium: "bg-sand text-amber", low: "bg-sage-soft text-sage" }[priority];
  return <span className={cn(pill, s)}>{priorityLabel[priority]}</span>;
}

export function fmt(d: string, f = "MMM d, yyyy") {
  const p = parseISO(d);
  return isValid(p) ? format(p, f) : "—";
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-sand", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="grow-x h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-sand text-brown"><Icon className="h-5 w-5" /></div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn("h-9 rounded-lg border border-input bg-card px-2.5 pr-7 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring", className)}
    {...props}
  >
    {children}
  </select>
));
NativeSelect.displayName = "NativeSelect";

export function FieldError({ msg }: { msg?: string | undefined }) {
  return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("tilt rounded-xl border bg-card shadow-soft", className)}>{children}</div>;
}

export function initials(n: string) {
  return n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "K";
}

export function Avatar({ name, src, className }: { name: string; src?: string | undefined; className?: string }) {
  return src ? (
    <img src={src} alt="" className={cn("h-8 w-8 rounded-full object-cover", className)} />
  ) : (
    <div className={cn("grid h-8 w-8 place-items-center rounded-full bg-sand text-xs font-semibold text-brown", className)}>{initials(name)}</div>
  );
}

