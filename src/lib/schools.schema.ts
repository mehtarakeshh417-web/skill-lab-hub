import { z } from "zod";

export const schoolOnboardingSchema = z.object({
  schoolName: z.string().trim().min(1, "School name is required"),
  schoolCode: z.string().trim().min(1, "School code is required"),
  username: z.string().trim().toLowerCase().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email address"),
  address: z.string().trim().min(1, "Address is required"),
  principalName: z.string().trim().min(1, "Principal name is required"),
  state: z.string().trim().min(1, "State is required"),
  city: z.string().trim().min(1, "City is required"),
  area: z.string().trim().min(1, "Area is required"),
  region: z.string().trim().optional().default(""),
  designation: z.string().trim().min(1, "Designation is required"),
  notes: z.string().trim().min(1, "Notes are required"),
  salesRepId: z.string().uuid("Assign a sales representative"),
});

export type SchoolOnboardingInput = z.infer<typeof schoolOnboardingSchema>;
