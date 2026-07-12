import { z } from "zod";

export const salesRepCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  employeeId: z.string().trim().max(40).optional().default(""),
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(120),
  password: z.string().min(1, "Password is required").max(256),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(180),
  phone: z.string().trim().min(1, "Phone number is required").max(40),
  designation: z.string().trim().min(2, "Designation is required").max(100),
  department: z.string().trim().max(80).optional().default("Sales"),
  reportingManagerId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type SalesRepCreateInput = z.infer<typeof salesRepCreateSchema>;