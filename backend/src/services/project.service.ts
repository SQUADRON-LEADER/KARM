import mongoose from "mongoose";
import { Project, IProject } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { AppError } from "../utils/apiResponse.js";
import { CreateProjectInput, UpdateProjectInput, ProjectQueryInput } from "../validators/project.validator.js";
import { ActivityService } from "./activity.service.js";

const projectStatusLabel: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export class ProjectService {
  public static async create(userId: string, input: CreateProjectInput): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const project = await Project.create({
      userId: userObjectId,
      name: input.name,
      description: input.description || "",
      status: input.status || "not_started",
      startDate: input.startDate,
      endDate: input.endDate,
    });

    await ActivityService.log(
      userId,
      "PROJECT_CREATED",
      `Created project — ${project.name}`,
      { projectId: project._id.toString() }
    );

    return project.toJSON();
  }

  public static async list(
    userId: string,
    query: ProjectQueryInput
  ): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, any> = { userId: userObjectId };

    if (query.status && query.status !== "all") {
      filter.status = query.status.toLowerCase();
    }

    if (query.search && query.search.trim()) {
      filter.name = { $regex: query.search.trim(), $options: "i" };
    }

    const sortOptions: Record<string, any> = {};
    if (query.sort === "name") {
      sortOptions.name = 1;
    } else if (query.sort === "oldest") {
      sortOptions.createdAt = 1;
    } else {
      sortOptions.createdAt = -1; // Default newest
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sortOptions).skip(skip).limit(limit),
      Project.countDocuments(filter),
    ]);

    return {
      data: projects.map((p) => p.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public static async getById(userId: string, projectId: string): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const project = await Project.findOne({ _id: projectObjectId, userId: userObjectId });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return project.toJSON();
  }

  public static async update(userId: string, projectId: string, input: UpdateProjectInput): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const project = await Project.findOne({ _id: projectObjectId, userId: userObjectId });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const oldStatus = project.status;

    if (input.name !== undefined) project.name = input.name;
    if (input.description !== undefined) project.description = input.description;
    if (input.status !== undefined) project.status = input.status as any;
    if (input.startDate !== undefined) project.startDate = input.startDate;
    if (input.endDate !== undefined) project.endDate = input.endDate;

    await project.save();

    if (input.status && input.status !== oldStatus) {
      await ActivityService.log(
        userId,
        "PROJECT_STATUS_CHANGED",
        `Changed project status — ${project.name} → ${projectStatusLabel[project.status] || project.status}`,
        { projectId: project._id.toString(), status: project.status }
      );
    } else {
      await ActivityService.log(
        userId,
        "PROJECT_UPDATED",
        `Updated project — ${project.name}`,
        { projectId: project._id.toString() }
      );
    }

    return project.toJSON();
  }

  public static async delete(userId: string, projectId: string): Promise<{ id: string; name: string }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const project = await Project.findOneAndDelete({ _id: projectObjectId, userId: userObjectId });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Cascade delete associated tasks
    await Task.deleteMany({ projectId: projectObjectId, userId: userObjectId });

    await ActivityService.log(
      userId,
      "PROJECT_DELETED",
      `Deleted project — ${project.name}`,
      { projectId: project._id.toString() }
    );

    return { id: project._id.toString(), name: project.name };
  }
}
