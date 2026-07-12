import { z } from "zod";

export const schoolOnboardingSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required").max(140),
  schoolCode: z.string().trim().min(3, "School code is required").max(40),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(40, "Username must be 40 characters or less")
    .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/, "Use letters, numbers, dots, dashes or underscores"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is required")
    .max(24)
    .regex(/^[+()\-\s0-9]+$/, "Enter a valid phone number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(180),
  address: z.string().trim().max(500).optional().default(""),
  principalName: z.string().trim().max(120).optional().default(""),
  region: z.string().trim().max(120).optional().default(""),
  designation: z.string().trim().max(100).optional().default("Principal"),
  notes: z.string().trim().max(1000).optional().default(""),
  salesRepId: z.string().uuid("Assign a sales representative"),
});

export type SchoolOnboardingInput = z.infer<typeof schoolOnboardingSchema>;
