import { z } from "zod";

export const studentCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(140),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(180),
  phone: z.string().trim().max(40).optional().default(""),
  rollNumber: z.string().trim().max(60).optional().default(""),
  className: z.string().trim().max(60).optional().default(""),
  section: z.string().trim().max(30).optional().default(""),
  gender: z.string().trim().max(30).optional().default(""),
  dateOfBirth: z.string().trim().max(40).optional().default(""),
  guardianName: z.string().trim().max(140).optional().default(""),
  guardianPhone: z.string().trim().max(40).optional().default(""),
  address: z.string().trim().max(500).optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const STUDENT_TEMPLATE_COLUMNS = [
  { key: "fullName", header: "Full Name *", required: true, example: "Jane Doe" },
  { key: "email", header: "Email *", required: true, example: "jane@school.com" },
  { key: "phone", header: "Phone", required: false, example: "9876543210" },
  { key: "rollNumber", header: "Roll Number", required: false, example: "R-101" },
  { key: "className", header: "Class", required: false, example: "Grade 8" },
  { key: "section", header: "Section", required: false, example: "A" },
  { key: "gender", header: "Gender", required: false, example: "female" },
  { key: "dateOfBirth", header: "Date of Birth (YYYY-MM-DD)", required: false, example: "2012-05-14" },
  { key: "guardianName", header: "Guardian Name", required: false, example: "John Doe" },
  { key: "guardianPhone", header: "Guardian Phone", required: false, example: "9876543211" },
  { key: "address", header: "Address", required: false, example: "123 Main Street" },
  { key: "status", header: "Status (active/inactive)", required: false, example: "active" },
] as const;

export type StudentTemplateKey = (typeof STUDENT_TEMPLATE_COLUMNS)[number]["key"];

export const studentBulkSchema = z.object({
  students: z.array(studentCreateSchema).min(1, "Provide at least one student"),
});
export type StudentBulkInput = z.infer<typeof studentBulkSchema>;