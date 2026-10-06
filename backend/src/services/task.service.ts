import mongoose from "mongoose";
import { Task, ITask } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { AppError } from "../utils/apiResponse.js";
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from "../validators/task.validator.js";
import { ActivityService } from "./activity.service.js";

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const taskStatusLabel: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export class TaskService {
  public static async create(userId: string, input: CreateTaskInput): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const projectObjectId = new mongoose.Types.ObjectId(input.projectId);

    // Verify project exists and belongs to this user
    const project = await Project.findOne({ _id: projectObjectId, userId: userObjectId });
    if (!project) {
      throw new AppError("Referenced project not found or does not belong to you.", 404);
    }

    const task = await Task.create({
      userId: userObjectId,
      projectId: projectObjectId,
      name: input.name,
      description: input.description || "",
      priority: input.priority || "medium",
      status: input.status || "pending",
      dueDate: input.dueDate,
      tags: input.tags || [],
    });

    await ActivityService.log(
      userId,
      "TASK_CREATED",
      `Created task — ${task.name}`,
      { taskId: task._id.toString(), projectId: project._id.toString() }
    );

    return task.toJSON();
  }

  public static async list(
    userId: string,
    query: TaskQueryInput
  ): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, any> = { userId: userObjectId };

    if (query.projectId && query.projectId !== "all") {
      filter.projectId = new mongoose.Types.ObjectId(query.projectId);
    }

    if (query.status && query.status !== "all") {
      filter.status = query.status.toLowerCase();
    }

    if (query.priority && query.priority !== "all") {
      filter.priority = query.priority.toLowerCase();
    }

    if (query.tag && query.tag !== "all") {
      filter.tags = query.tag.toLowerCase();
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      filter.$or = [
        { name: { $regex: term, $options: "i" } },
        { tags: { $regex: term, $options: "i" } },
      ];
    }

    const sortOptions: Record<string, any> = {};
    if (query.sort === "due_desc") {
      sortOptions.dueDate = -1;
    } else if (query.sort === "priority") {
      sortOptions.priority = 1; // Will do secondary sorting in memory or use custom field if needed
    } else if (query.sort === "newest") {
      sortOptions.createdAt = -1;
    } else if (query.sort === "oldest") {
      sortOptions.createdAt = 1;
    } else if (query.sort === "name") {
      sortOptions.name = 1;
    } else {
      // Default: due_asc
      sortOptions.dueDate = 1;
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortOptions).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    return {
      data: tasks.map((t) => t.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public static async getById(userId: string, taskId: string): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const task = await Task.findOne({ _id: taskObjectId, userId: userObjectId });
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return task.toJSON();
  }

  public static async update(userId: string, taskId: string, input: UpdateTaskInput): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const task = await Task.findOne({ _id: taskObjectId, userId: userObjectId });
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if (input.projectId && input.projectId !== task.projectId.toString()) {
      const projectObjectId = new mongoose.Types.ObjectId(input.projectId);
      const project = await Project.findOne({ _id: projectObjectId, userId: userObjectId });
      if (!project) {
        throw new AppError("Referenced project not found or does not belong to you.", 404);
      }
      task.projectId = projectObjectId;
    }

    const oldStatus = task.status;
    const oldPriority = task.priority;

    if (input.name !== undefined) task.name = input.name;
    if (input.description !== undefined) task.description = input.description;
    if (input.priority !== undefined) task.priority = input.priority as any;
    if (input.status !== undefined) task.status = input.status as any;
    if (input.dueDate !== undefined) task.dueDate = input.dueDate;
    if (input.tags !== undefined) task.tags = input.tags;

    await task.save();

    if (oldStatus !== "completed" && task.status === "completed") {
      await ActivityService.log(
        userId,
        "TASK_COMPLETED",
        `Completed task — ${task.name}`,
        { taskId: task._id.toString() }
      );
    } else if (oldPriority !== task.priority) {
      await ActivityService.log(
        userId,
        "TASK_PRIORITY_CHANGED",
        `Changed task priority — ${task.name} → ${priorityLabel[task.priority] || task.priority}`,
        { taskId: task._id.toString(), priority: task.priority }
      );
    } else if (oldStatus !== task.status) {
      await ActivityService.log(
        userId,
        "TASK_STATUS_CHANGED",
        `Moved task — ${task.name} → ${taskStatusLabel[task.status] || task.status}`,
        { taskId: task._id.toString(), status: task.status }
      );
    } else {
      await ActivityService.log(
        userId,
        "TASK_UPDATED",
        `Updated task — ${task.name}`,
        { taskId: task._id.toString() }
      );
    }

    return task.toJSON();
  }

  public static async complete(userId: string, taskId: string): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const task = await Task.findOne({ _id: taskObjectId, userId: userObjectId });
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    task.status = "completed";
    await task.save();

    await ActivityService.log(
      userId,
      "TASK_COMPLETED",
      `Completed task — ${task.name}`,
      { taskId: task._id.toString() }
    );

    return task.toJSON();
  }

  public static async delete(userId: string, taskId: string): Promise<{ id: string; name: string }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const taskObjectId = new mongoose.Types.ObjectId(taskId);

    const task = await Task.findOneAndDelete({ _id: taskObjectId, userId: userObjectId });
    if (!task) {
      throw new AppError("Task not found", 404);
    }

    await ActivityService.log(
      userId,
      "TASK_DELETED",
      `Deleted task — ${task.name}`,
      { taskId: task._id.toString() }
    );

    return { id: task._id.toString(), name: task.name };
  }
}
