import { z } from "zod";

export const ASSIGNMENT_TECHNOLOGIES = [
  "Scratch Junior",
  "Scratch",
  "HTML",
  "Python",
  "Java",
  "MySQL",
  "Paint",
  "Editor",
  "Spreadsheet",
  "Presentation",
  "General Computer Science",
  "Other",
] as const;

export const ASSIGNMENT_TYPES = [
  { value: "mcq", label: "MCQs" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the Blanks" },
  { value: "mixed", label: "Mixed" },
] as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number]["value"];

export const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

export type AttemptStatus = "not_started" | "in_progress" | "submitted" | "auto_scored" | "published";

export const ATTEMPT_STATUS_META: Record<
  AttemptStatus,
  { label: string; className: string }
> = {
  not_started: {
    label: "Assigned",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
  },
  in_progress: {
    label: "In progress",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
  },
  submitted: {
    label: "Submitted",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
  },
  auto_scored: {
    label: "Auto-scored",
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30",
  },
  published: {
    label: "Published",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  },
};

export const questionSchema = z.object({
  questionText: z.string().min(1, "Question text is required").max(4000),
  questionType: z.enum(["mcq", "true_false", "fill_blank"]),
  options: z.array(z.string().max(600)).max(10).default([]),
  correctAnswers: z.array(z.string().max(600)).min(1, "At least one correct answer is required"),
  marks: z.number().min(0.5).max(100).default(1),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export const assignmentSettingsSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(6000).optional().default(""),
  technology: z.string().min(1).max(80),
  assignmentType: z.enum(["mcq", "true_false", "fill_blank", "mixed"]),
  passingMarks: z.number().min(0).max(10000).default(0),
  dueAt: z.string().max(60).optional().nullable(),
  timeLimitMinutes: z.number().int().min(0).max(600).optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  randomizePerStudent: z.boolean().default(false),
  allowMultipleAttempts: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).max(20).default(1),
  showCorrectAnswers: z.boolean().default(true),
  autoPublish: z.boolean().default(false),
  target: z.object({
    kind: z.enum(["students", "class"]),
    studentIds: z.array(z.string().uuid()).optional(),
    className: z.string().max(60).optional().nullable(),
    section: z.string().max(20).optional().nullable(),
  }),
});

export const createAssignmentSchema = assignmentSettingsSchema.extend({
  questions: z.array(questionSchema).min(1, "Add at least one question").max(200),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

/** Normalise a free-text answer for comparison (case + whitespace insensitive). */
export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function blankQuestion(type: QuestionType): QuestionInput {
  if (type === "true_false") {
    return { questionText: "", questionType: "true_false", options: ["True", "False"], correctAnswers: ["True"], marks: 1 };
  }
  if (type === "fill_blank") {
    return { questionText: "", questionType: "fill_blank", options: [], correctAnswers: [""], marks: 1 };
  }
  return { questionText: "", questionType: "mcq", options: ["", "", "", ""], correctAnswers: [""], marks: 1 };
}