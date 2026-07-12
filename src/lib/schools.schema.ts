import { z } from "zod";

export const schoolOnboardingSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required").max(140),
  schoolCode: z.string().trim().min(3, "School code is required").max(40),
  username: z.string().trim().toLowerCase().min(1, "Username is required").max(120),
  password: z.string().min(1, "Password is required").max(256),
  phone: z.string().trim().min(1, "Phone number is required").max(40),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(180),
  address: z.string().trim().max(500).optional().default(""),
  principalName: z.string().trim().max(120).optional().default(""),
  region: z.string().trim().max(120).optional().default(""),
  designation: z.string().trim().max(100).optional().default("Principal"),
  notes: z.string().trim().max(1000).optional().default(""),
  salesRepId: z.string().uuid("Assign a sales representative"),
});

export type SchoolOnboardingInput = z.infer<typeof schoolOnboardingSchema>;
