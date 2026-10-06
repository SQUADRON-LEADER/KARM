import type { Activity, Project, Task, Priority, TaskStatus, ProjectStatus } from "./store";

const day = 86400000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);
const ts = (offsetDays: number, h = 0) => new Date(Date.now() + offsetDays * day + h * 3600000).toISOString();

const projectDefs: [string, string, ProjectStatus, number, number, number][] = [
  ["Campus Event Platform", "A booking and discovery portal for university societies, venues and ticketed events.", "in_progress", -40, 30, -42],
  ["Inventory Management Portal", "Stock tracking across three warehouses with low-stock alerts and supplier ordering.", "in_progress", -25, 45, -27],
  ["Marketing Analytics Dashboard", "Unified view of campaign spend, attribution and weekly channel performance.", "not_started", 7, 70, -6],
  ["E-Commerce Redesign", "Refresh of product pages, cart and checkout to lift conversion on mobile.", "completed", -90, -10, -95],
  ["Employee Onboarding System", "Guided first-week checklists, document collection and buddy assignments.", "in_progress", -14, 40, -16],
  ["Mobile Banking Prototype", "Clickable prototype for savings goals, transfers and card controls.", "not_started", 14, 60, -3],
];

const taskDefs: [number, string, Priority, TaskStatus, number, string[]][] = [
  [0, "Implement authentication flow", "high", "completed", -12, ["backend", "security"]],
  [0, "Design event listing page", "medium", "completed", -8, ["design"]],
  [0, "Build venue booking calendar", "high", "in_progress", 3, ["frontend"]],
  [0, "Add ticket checkout validation", "high", "pending", 6, ["backend", "bug"]],
  [0, "Test project creation flow", "low", "pending", 12, ["testing"]],
  [1, "Create database schema", "high", "completed", -15, ["backend"]],
  [1, "Build responsive navigation", "medium", "completed", -6, ["frontend", "design"]],
  [1, "Fix dashboard filtering", "high", "in_progress", 1, ["bug", "frontend"]],
  [1, "Implement low-stock alerts", "medium", "pending", 9, ["backend"]],
  [1, "Add supplier order form validation", "medium", "pending", 14, ["backend", "testing"]],
  [2, "Define KPI dictionary with marketing", "medium", "pending", 10, ["research"]],
  [2, "Create analytics chart components", "high", "pending", 18, ["frontend", "design"]],
  [2, "Connect ad spend import", "low", "pending", 25, ["backend"]],
  [3, "Design project overview", "medium", "completed", -60, ["design"]],
  [3, "Optimize mobile layout", "high", "completed", -40, ["frontend", "design"]],
  [3, "Rebuild cart drawer", "high", "completed", -30, ["frontend"]],
  [3, "Run checkout usability test", "medium", "completed", -14, ["research", "testing"]],
  [4, "Implement task completion", "medium", "completed", -5, ["backend"]],
  [4, "Draft first-week checklist content", "low", "completed", -3, ["research"]],
  [4, "Add form validation", "medium", "in_progress", 2, ["frontend", "bug"]],
  [4, "Build document upload step", "high", "pending", 0, ["frontend"]],
  [4, "Assign onboarding buddies", "low", "pending", 8, ["research"]],
  [5, "Map savings goal user journey", "medium", "pending", 16, ["research", "design"]],
  [5, "Prototype card freeze interaction", "high", "pending", 21, ["design"]],
  [5, "Review transfer screens with compliance", "medium", "pending", 28, ["research"]],
];

export function seedFor(userId: string) {
  const projects: Project[] = projectDefs.map(([name, description, status, s, e, c], i) => ({
    id: `${userId}_p${i}`, userId, name, description, status, startDate: iso(s), endDate: iso(e), createdDate: ts(c),
  }));
  const tasks: Task[] = taskDefs.map(([pi, name, priority, status, due, tags], i) => ({
    id: `${userId}_t${i}`, userId, projectId: projects[pi]!.id, name,
    description: `${name} for ${projects[pi]!.name}.`, priority, status, dueDate: iso(due), tags,
    createdDate: ts(Math.min(due, 0) - 10 + (i % 5), i),
  }));
  const msgs: [string, string, number][] = [
    ["task_completed", "Completed task — Draft first-week checklist content", -0.1],
    ["task_priority", "Changed task priority — Fix dashboard filtering → High", -0.4],
    ["task_created", "Created task — Build document upload step", -1],
    ["project_status", "Changed project status — Employee Onboarding System → In Progress", -2],
    ["task_completed", "Completed task — Implement task completion", -3],
    ["project_created", "Created project — Mobile Banking Prototype", -3.2],
    ["project_updated", "Updated project — Marketing Analytics Dashboard", -5],
    ["task_deleted", "Deleted task — Legacy CSV export", -6],
  ];
  const activities: Activity[] = msgs.map(([type, message, d], i) => ({ id: `${userId}_a${i}`, userId, type, message, createdAt: ts(d) }));
  return { projects, tasks, activities };
}
