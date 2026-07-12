import { z } from "zod";

export const teacherCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(140),
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(120),
  password: z.string().min(1, "Password is required").max(256),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(180),
  phone: z.string().trim().max(40).optional().default(""),
  employeeId: z.string().trim().max(60).optional().default(""),
  subject: z.string().trim().max(120).optional().default(""),
  department: z.string().trim().max(120).optional().default(""),
  qualification: z.string().trim().max(200).optional().default(""),
  gender: z.string().trim().max(30).optional().default(""),
  dateOfBirth: z.string().trim().max(40).optional().default(""),
  address: z.string().trim().max(500).optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type TeacherCreateInput = z.infer<typeof teacherCreateSchema>;