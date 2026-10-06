import { z } from "zod";

const taskPriorityEnum = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum(["low", "medium", "high"])
);

const taskStatusEnum = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum(["pending", "in_progress", "completed"])
);

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().trim().min(1, "Task name is required").max(150, "Task name must be under 150 characters"),
  description: z.string().max(1000, "Description must be under 1000 characters").optional().default(""),
  priority: taskPriorityEnum.optional().default("medium"),
  status: taskStatusEnum.optional().default("pending"),
  dueDate: z.string().min(1, "Due date is required"),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = z.object({
  projectId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().max(1000).optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export const taskQuerySchema = z.object({
  search: z.string().optional(),
  projectId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["due_asc", "due_desc", "priority", "newest", "oldest", "name"]).optional().default("due_asc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
