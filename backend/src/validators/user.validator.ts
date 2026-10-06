import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(60).optional(),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").toLowerCase().optional(),
  avatar: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
