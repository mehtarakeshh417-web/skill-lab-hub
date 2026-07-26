import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const generateSchema = z.object({
  technology: z.string().min(1).max(80),
  count: z.number().int().min(1).max(50),
  assignmentType: z.enum(["mcq", "true_false", "fill_blank", "mixed"]),
  difficulty: z.enum(["Beginner", "Easy", "Medium", "Hard", "Advanced"]),
  topic: z.string().max(300).optional().default(""),
});

export const generateObjectiveQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => generateSchema.parse(d))
  .handler(async ({ data }) => {
    const { generateQuestions } = await import("@/lib/ai-assignments.server");
    const questions = await generateQuestions({
      technology: data.technology,
      count: data.count,
      assignmentType: data.assignmentType,
      difficulty: data.difficulty,
      topic: data.topic?.trim() || undefined,
    });
    return { questions };
  });
