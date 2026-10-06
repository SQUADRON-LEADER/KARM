import { z } from "zod";

const projectStatusEnum = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum(["not_started", "in_progress", "completed"])
);

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(100, "Project name must be under 100 characters"),
    description: z.string().max(1000, "Description must be under 1000 characters").optional().default(""),
    status: projectStatusEnum.optional().default("not_started"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "End date cannot be before start date",
  });

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(100).optional(),
    description: z.string().max(1000).optional(),
    status: projectStatusEnum.optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
  })
  .refine((v) => {
    if (v.startDate && v.endDate) {
      return v.endDate >= v.startDate;
    }
    return true;
  }, {
    path: ["endDate"],
    message: "End date cannot be before start date",
  });

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(["newest", "oldest", "name"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
