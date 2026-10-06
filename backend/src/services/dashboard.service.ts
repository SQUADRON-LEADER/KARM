import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { Activity } from "../models/Activity.js";

export interface DashboardData {
  statistics: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    projectsInProgress: number;
    completionRate: number;
  };
  taskCompletion: {
    name: string;
    projectId: string;
    Completed: number;
    Remaining: number;
  }[];
  tasksByStatus: {
    name: string;
    status: string;
    value: number;
  }[];
  projectsByStatus: {
    name: string;
    status: string;
    value: number;
  }[];
  tasksByPriority: {
    name: string;
    priority: string;
    Open: number;
    Done: number;
  }[];
  upcomingTasks: any[];
  recentActivities: any[];
}

export class DashboardService {
  public static async getDashboardData(userId: string): Promise<DashboardData> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      projects,
      tasks,
      recentActivities,
    ] = await Promise.all([
      Project.find({ userId: userObjectId }).lean(),
      Task.find({ userId: userObjectId }).lean(),
      Activity.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = totalTasks - completedTasks;
    const projectsInProgress = projects.filter((p) => p.status === "in_progress").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Per project completion
    const taskCompletion = projects.map((p: any) => {
      const projTasks = tasks.filter((t: any) => t.projectId.toString() === p._id.toString());
      const done = projTasks.filter((t: any) => t.status === "completed").length;
      return {
        name: p.name.split(" ")[0] || p.name,
        projectId: p._id.toString(),
        Completed: done,
        Remaining: projTasks.length - done,
      };
    });

    // Tasks by status
    const tasksByStatus = [
      { name: "Pending", status: "pending", value: tasks.filter((t) => t.status === "pending").length },
      { name: "In Progress", status: "in_progress", value: tasks.filter((t) => t.status === "in_progress").length },
      { name: "Completed", status: "completed", value: completedTasks },
    ];

    // Projects by status
    const projectsByStatus = [
      { name: "Not Started", status: "not_started", value: projects.filter((p) => p.status === "not_started").length },
      { name: "In Progress", status: "in_progress", value: projectsInProgress },
      { name: "Completed", status: "completed", value: projects.filter((p) => p.status === "completed").length },
    ];

    // Tasks by priority
    const priorities = ["high", "medium", "low"] as const;
    const tasksByPriority = priorities.map((k) => ({
      name: k[0].toUpperCase() + k.slice(1),
      priority: k,
      Open: tasks.filter((t) => t.priority === k && t.status !== "completed").length,
      Done: tasks.filter((t) => t.priority === k && t.status === "completed").length,
    }));

    // Upcoming tasks
    const upcomingTasks = tasks
      .filter((t) => t.status !== "completed")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6)
      .map((t: any) => ({
        id: t._id.toString(),
        userId: t.userId.toString(),
        projectId: t.projectId.toString(),
        name: t.name,
        description: t.description,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        tags: t.tags || [],
        createdDate: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      }));

    const formattedActivities = recentActivities.map((a: any) => ({
      id: a._id.toString(),
      userId: a.userId.toString(),
      type: a.type,
      message: a.message,
      metadata: a.metadata,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    }));

    return {
      statistics: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        projectsInProgress,
        completionRate,
      },
      taskCompletion,
      tasksByStatus,
      projectsByStatus,
      tasksByPriority,
      upcomingTasks,
      recentActivities: formattedActivities,
    };
  }
}
