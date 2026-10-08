import mongoose from "mongoose";
import { Project, ProjectStatus } from "../models/Project.js";
import { Task, Priority, TaskStatus } from "../models/Task.js";
import { Activity } from "../models/Activity.js";

type ProjectSeed = {
  name: string;
  description: string;
  status: ProjectStatus;
  startOffset: number;
  endOffset: number;
};

type TaskSeed = {
  project: number;
  name: string;
  priority: Priority;
  status: TaskStatus;
  dueOffset: number;
  tags: string[];
};

const projects: ProjectSeed[] = [
  { name: "Campus Event Platform", description: "Plan bookings, venues, tickets, and event discovery for student societies.", status: "in_progress", startOffset: -28, endOffset: 28 },
  { name: "Inventory Management Portal", description: "Track stock across warehouses and introduce low-stock alerts.", status: "in_progress", startOffset: -18, endOffset: 42 },
  { name: "Marketing Analytics Dashboard", description: "Bring campaign spend, attribution, and weekly KPIs into one view.", status: "not_started", startOffset: 4, endOffset: 66 },
  { name: "E-Commerce Redesign", description: "Refresh product discovery, cart, and checkout experiences for mobile.", status: "completed", startOffset: -90, endOffset: -12 },
  { name: "Employee Onboarding System", description: "Create a guided first-week experience for new hires and their managers.", status: "in_progress", startOffset: -12, endOffset: 35 },
  { name: "Community Health Portal", description: "Support appointment scheduling, care plans, and provider messaging.", status: "not_started", startOffset: 12, endOffset: 80 },
];

const tasks: TaskSeed[] = [
  { project: 0, name: "Map event discovery journey", priority: "high", status: "completed", dueOffset: -8, tags: ["research", "design"] },
  { project: 0, name: "Build venue booking calendar", priority: "high", status: "in_progress", dueOffset: 3, tags: ["frontend"] },
  { project: 0, name: "Add ticket checkout validation", priority: "high", status: "pending", dueOffset: 8, tags: ["backend", "security"] },
  { project: 0, name: "Run event organizer usability test", priority: "medium", status: "pending", dueOffset: 14, tags: ["testing"] },
  { project: 1, name: "Create stock movement schema", priority: "high", status: "completed", dueOffset: -10, tags: ["backend"] },
  { project: 1, name: "Build warehouse overview", priority: "medium", status: "in_progress", dueOffset: 2, tags: ["frontend", "design"] },
  { project: 1, name: "Implement low-stock alerts", priority: "high", status: "pending", dueOffset: 10, tags: ["backend"] },
  { project: 1, name: "Add supplier reorder workflow", priority: "medium", status: "pending", dueOffset: 20, tags: ["backend", "testing"] },
  { project: 2, name: "Define KPI dictionary", priority: "medium", status: "pending", dueOffset: 9, tags: ["research"] },
  { project: 2, name: "Create campaign performance cards", priority: "high", status: "pending", dueOffset: 18, tags: ["frontend", "design"] },
  { project: 2, name: "Connect ad-spend import", priority: "high", status: "pending", dueOffset: 25, tags: ["backend"] },
  { project: 2, name: "Schedule stakeholder review", priority: "low", status: "pending", dueOffset: 32, tags: ["planning"] },
  { project: 3, name: "Audit mobile checkout", priority: "high", status: "completed", dueOffset: -40, tags: ["research"] },
  { project: 3, name: "Rebuild cart drawer", priority: "high", status: "completed", dueOffset: -28, tags: ["frontend"] },
  { project: 3, name: "Improve payment error states", priority: "medium", status: "completed", dueOffset: -18, tags: ["design", "frontend"] },
  { project: 3, name: "Publish conversion report", priority: "low", status: "completed", dueOffset: -10, tags: ["analytics"] },
  { project: 4, name: "Draft first-week checklist", priority: "medium", status: "completed", dueOffset: -4, tags: ["content"] },
  { project: 4, name: "Build document upload step", priority: "high", status: "in_progress", dueOffset: 4, tags: ["frontend"] },
  { project: 4, name: "Assign onboarding buddies", priority: "medium", status: "pending", dueOffset: 11, tags: ["operations"] },
  { project: 4, name: "Add manager progress view", priority: "low", status: "pending", dueOffset: 18, tags: ["frontend"] },
  { project: 5, name: "Map appointment booking journey", priority: "high", status: "pending", dueOffset: 16, tags: ["research", "design"] },
  { project: 5, name: "Design care-plan timeline", priority: "medium", status: "pending", dueOffset: 26, tags: ["design"] },
  { project: 5, name: "Build provider messaging inbox", priority: "high", status: "pending", dueOffset: 38, tags: ["frontend", "backend"] },
  { project: 5, name: "Run accessibility review", priority: "medium", status: "pending", dueOffset: 50, tags: ["testing"] },
];

const dateAt = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

/** Creates a useful starter workspace for a newly registered user. */
export async function seedDemoWorkspace(userId: mongoose.Types.ObjectId): Promise<void> {
  const createdProjects = await Project.insertMany(
    projects.map((project) => ({
      ...project,
      userId,
      startDate: dateAt(project.startOffset),
      endDate: dateAt(project.endOffset),
    }))
  );

  await Task.insertMany(
    tasks.map((task) => ({
      userId,
      projectId: createdProjects[task.project]!._id,
      name: task.name,
      description: `${task.name} for ${createdProjects[task.project]!.name}.`,
      priority: task.priority,
      status: task.status,
      dueDate: dateAt(task.dueOffset),
      tags: task.tags,
    }))
  );

  await Activity.create({
    userId,
    type: "DEMO_WORKSPACE_CREATED",
    message: "Added a starter workspace with sample projects and tasks",
    metadata: { projectCount: createdProjects.length, taskCount: tasks.length },
  });
}
