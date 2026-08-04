import { z } from "zod";

export const submitRegistrationSchema = z.object({
  schoolName: z.string().trim().min(1, "School name is required"),
  principalName: z.string().trim().min(1, "Principal name is required"),
  designation: z.string().trim().min(1, "Designation is required"),
  state: z.string().trim().min(1, "State is required"),
  city: z.string().trim().min(1, "City is required"),
  area: z.string().trim().min(1, "Area is required"),
  region: z.string().trim().optional().default(""),
  notes: z.string().trim().min(1, "Submission notes are required"),
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().trim().min(1, "Phone is required"),
  address: z.string().trim().min(1, "Address is required"),
  salesRepName: z.string().trim().min(1, "Sales representative name is required"),
});
export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>;

export const approveRegistrationSchema = z.object({
  id: z.string().uuid(),
  salesRepId: z.string().uuid("Assign a sales representative"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Assign a login username (min 3 characters)")
    .regex(/^[a-z0-9._-]+$/, "Username can use letters, numbers, dot, dash and underscore only"),
  password: z.string().min(8, "Assign a login password (min 8 characters)"),
  // Optional overrides at approval time
  schoolName: z.string().trim().optional(),
  schoolCode: z.string().trim().min(1, "Enter a school code before approving"),
  principalName: z.string().trim().optional(),
  region: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});
export type ApproveRegistrationInput = z.infer<typeof approveRegistrationSchema>;

export const rejectRegistrationSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().optional().default(""),
});
export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>;