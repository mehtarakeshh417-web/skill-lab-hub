import { normalizeAnswer } from "./objective-assignments.schema";

export type QuestionRow = {
  id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  correct_answers: unknown;
  marks: number;
  order_index: number;
};

export type PerQuestionResult = {
  questionId: string;
  answer: string;
  correct: boolean;
  awarded: number;
  marks: number;
  overridden?: boolean;
};

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

export async function logEvent(row: {
  assignmentId: string;
  studentId?: string | null;
  attemptId?: string | null;
  status: string;
  actorRole: string;
  actorName?: string | null;
  note?: string | null;
}) {
  const db = await admin();
  const { error } = await db.from("objective_events").insert({
    assignment_id: row.assignmentId,
    student_id: row.studentId ?? null,
    attempt_id: row.attemptId ?? null,
    status: row.status,
    actor_role: row.actorRole,
    actor_name: row.actorName ?? null,
    note: row.note ?? null,
  });
  if (error) console.error("[objective_events]", error.message);
}

/** Deterministic shuffle so a student always sees the same order for one attempt. */
export function shuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    h = (Math.imul(h, 48271) + 11) >>> 0;
    const j = h % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Confirm the student is in the audience of this assignment; returns the assignment row. */
export async function assertStudentCanAccess(
  assignmentId: string,
  student: { id: string; school_id: string; class_name: string | null; section: string | null },
) {
  const db = await admin();
  const { data, error } = await db
    .from("objective_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This assignment no longer exists.");
  if (data.school_id !== student.school_id) throw new Error("You do not have access to this assignment.");

  if (data.target_kind === "class") {
    const classOk = data.target_class ? data.target_class === student.class_name : true;
    const sectionOk = data.target_section ? data.target_section === student.section : true;
    if (!classOk || !sectionOk) throw new Error("This assignment was not given to your class.");
  } else {
    const { data: target, error: tErr } = await db
      .from("objective_targets")
      .select("student_id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!target) throw new Error("This assignment was not given to you.");
  }
  return data;
}

export async function loadQuestions(assignmentId: string): Promise<QuestionRow[]> {
  const db = await admin();
  const { data, error } = await db
    .from("objective_questions")
    .select("id, question_text, question_type, options, correct_answers, marks, order_index")
    .eq("assignment_id", assignmentId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuestionRow[];
}

/** Score a set of answers against the question bank. */
export function scoreAnswers(
  questions: QuestionRow[],
  answers: Record<string, string>,
): { results: PerQuestionResult[]; score: number; total: number } {
  const results: PerQuestionResult[] = [];
  let score = 0;
  let total = 0;
  for (const q of questions) {
    const marks = Number(q.marks) || 0;
    total += marks;
    const given = (answers[q.id] ?? "").toString();
    const accepted = asStringArray(q.correct_answers);
    const correct =
      given.trim().length > 0 && accepted.some((a) => normalizeAnswer(a) === normalizeAnswer(given));
    const awarded = correct ? marks : 0;
    score += awarded;
    results.push({ questionId: q.id, answer: given, correct, awarded, marks });
  }
  return { results, score, total };
}

/** Confirm the teacher owns the assignment behind an attempt. */
export async function loadAttemptForTeacher(attemptId: string, teacherId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("objective_attempts")
    .select(
      "*, objective_assignments!inner(id, teacher_id, title, total_marks, passing_marks, show_correct_answers), students!inner(id, user_id, full_name)",
    )
    .eq("id", attemptId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Attempt not found.");
  const assignment = data.objective_assignments as unknown as {
    id: string;
    teacher_id: string;
    title: string;
    total_marks: number;
    passing_marks: number;
    show_correct_answers: boolean;
  };
  if (assignment.teacher_id !== teacherId) {
    throw new Error("You can only review attempts on your own assignments.");
  }
  return {
    attempt: data,
    assignment,
    student: data.students as unknown as { id: string; user_id: string; full_name: string },
  };
}

export async function studentDirectory(schoolId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("students")
    .select("id, full_name, roll_number, class_name, section")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("class_name")
    .order("full_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}