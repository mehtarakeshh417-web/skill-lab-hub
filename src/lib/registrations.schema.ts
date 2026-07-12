import { z } from "zod";

export const submitRegistrationSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required").max(160),
  schoolCode: z.string().trim().min(3, "School code is required").max(40),
  principalName: z.string().trim().max(160).optional().default(""),
  region: z.string().trim().max(160).optional().default(""),
  designation: z.string().trim().max(120).optional().default("Principal"),
  notes: z.string().trim().max(2000).optional().default(""),
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(120),
  password: z.string().min(1, "Password is required").max(256),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  address: z.string().trim().max(600).optional().default(""),
});
export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>;

export const approveRegistrationSchema = z.object({
  id: z.string().uuid(),
  salesRepId: z.string().uuid("Assign a sales representative"),
  // Optional overrides at approval time
  schoolName: z.string().trim().max(160).optional(),
  schoolCode: z.string().trim().max(40).optional(),
  principalName: z.string().trim().max(160).optional(),
  region: z.string().trim().max(160).optional(),
  designation: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(600).optional(),
});
export type ApproveRegistrationInput = z.infer<typeof approveRegistrationSchema>;

export const rejectRegistrationSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(600).optional().default(""),
});
export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>;