import { z } from "zod";

export const salesRepCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  employeeId: z.string().trim().max(40).optional().default(""),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(40)
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/, "Use letters, numbers, dots, dashes or underscores"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(180),
  phone: z.string().trim().min(6, "Phone number is required").max(24),
  designation: z.string().trim().min(2, "Designation is required").max(100),
  department: z.string().trim().max(80).optional().default("Sales"),
  reportingManagerId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type SalesRepCreateInput = z.infer<typeof salesRepCreateSchema>;