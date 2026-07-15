import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────
const targetSchema = z.object({
  kind: z.enum(["students", "class"]),
  studentIds: z.array(z.string().uuid()).optional(),
  className: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
});

const assignmentCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  kind: z.enum(["assignment", "project"]).default("assignment"),
  dueDate: z.string().optional().nullable(),
  maxMarks: z.number().int().min(1).max(1000).default(100),
  target: targetSchema,
});

const questionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(["mcq", "true_false", "fill_blank"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  marks: z.number().int().min(1).max(100).default(1),
});

const quizCreateSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().max(100).optional().default(""),
  gradeLevel: z.string().max(50).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  source: z.enum(["manual", "ai"]).default("manual"),
  timeLimitMinutes: z.number().int().min(1).max(600).optional().nullable(),
  target: targetSchema,
  questions: z.array(questionSchema).min(1),
});

const attemptSubmitSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
});

const submissionSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().max(10000).optional().default(""),
  fileUrl: z.string().url().max(2000).optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
});

const gradeSchema = z.object({
  submissionId: z.string().uuid(),
  grade: z.number().min(0).max(1000),
  feedback: z.string().max(4000).optional().default(""),
  status: z.enum(["reviewed", "returned", "completed"]).default("reviewed"),
});

// ─────────────────────────────────────────────────────────────
// Teacher: create assignment
// ─────────────────────────────────────────────────────────────
export const createAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => assignmentCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, resolveTargetStudents, notify } = await import("./learning.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const students = await resolveTargetStudents(teacher.school_id, data.target);
    if (students.length === 0) throw new Error("No students match the selected audience.");

    const insert = await supabaseAdmin
      .from("assignments")
      .insert({
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        title: data.title.trim(),
        description: data.description || null,
        kind: data.kind,
        due_date: data.dueDate || null,
        max_marks: data.maxMarks,
        target_kind: data.target.kind,
        target_class: data.target.className || null,
        target_section: data.target.section || null,
      })
      .select("id, title, kind")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    if (data.target.kind === "students") {
      const targetRows = students.map((s) => ({ assignment_id: insert.data.id, student_id: s.id }));
      const t = await supabaseAdmin.from("assignment_targets").insert(targetRows);
      if (t.error) throw new Error(t.error.message);
    }

    await notify(
      students.map((s) => s.user_id).filter(Boolean),
      "assignment",
      `New ${insert.data.kind}: ${insert.data.title}`,
      `${teacher.full_name} assigned you a new ${insert.data.kind}.`,
      "/student/assignments",
    );

    return { id: insert.data.id, assignedCount: students.length };
  });

// Teacher: list assignments + submission counts
export const listTeacherAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("assignments")
      .select("id, title, kind, description, due_date, max_marks, target_kind, target_class, target_section, created_at, submissions(id, status, student_id, grade, feedback, submitted_at, content, file_url, file_name, students(id, full_name, roll_number, class_name, section))")
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Teacher: grade a submission
export const gradeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => gradeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, notify } = await import("./learning.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const upd = await supabaseAdmin
      .from("submissions")
      .update({
        grade: data.grade,
        feedback: data.feedback || null,
        status: data.status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.submissionId)
      .select("id, assignment_id, student_id, assignments!inner(title, teacher_id), students!inner(user_id, full_name)")
      .single();
    if (upd.error) throw new Error(upd.error.message);
    if ((upd.data.assignments as { teacher_id: string }).teacher_id !== teacher.id) {
      throw new Error("You can only grade your own submissions.");
    }
    const student = upd.data.students as { user_id: string; full_name: string };
    const assignment = upd.data.assignments as { title: string };
    await notify(
      [student.user_id],
      "graded",
      `Feedback on: ${assignment.title}`,
      `You scored ${data.grade}. ${data.feedback ? "Check teacher feedback." : ""}`,
      "/student/assignments",
    );
    return { ok: true };
  });

// Student: list assignments assigned to me
export const listStudentAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStudentForUser } = await import("./learning.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("assignments")
      .select("id, title, kind, description, due_date, max_marks, created_at, teachers!inner(full_name), submissions(id, status, grade, feedback, content, file_url, file_name, submitted_at, reviewed_at, student_id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((a) => ({
      ...a,
      submission: (a.submissions ?? []).find((s) => s.student_id === student.id) ?? null,
    }));
  });

// Student: submit assignment
export const submitAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => submissionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getStudentForUser, notify } = await import("./learning.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const up = await supabaseAdmin
      .from("submissions")
      .upsert(
        {
          assignment_id: data.assignmentId,
          student_id: student.id,
          content: data.content || null,
          file_url: data.fileUrl || null,
          file_name: data.fileName || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "assignment_id,student_id" },
      )
      .select("id, assignment_id")
      .single();
    if (up.error) throw new Error(up.error.message);

    // notify teacher
    const asg = await supabaseAdmin
      .from("assignments")
      .select("title, teachers!inner(user_id)")
      .eq("id", data.assignmentId)
      .single();
    if (!asg.error && asg.data) {
      const t = asg.data.teachers as { user_id: string };
      await notify(
        [t.user_id],
        "submission",
        `Submission: ${asg.data.title}`,
        `${student.full_name} submitted their work.`,
        "/teacher/assignments",
      );
    }
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// Quizzes
// ─────────────────────────────────────────────────────────────
export const createQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => quizCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, resolveTargetStudents, notify } = await import("./learning.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const students = await resolveTargetStudents(teacher.school_id, data.target);
    if (students.length === 0) throw new Error("No students match the selected audience.");

    const q = await supabaseAdmin
      .from("quizzes")
      .insert({
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        title: data.title.trim(),
        subject: data.subject || null,
        grade_level: data.gradeLevel || null,
        description: data.description || null,
        source: data.source,
        time_limit_minutes: data.timeLimitMinutes ?? null,
        target_kind: data.target.kind,
        target_class: data.target.className || null,
        target_section: data.target.section || null,
      })
      .select("id, title")
      .single();
    if (q.error) throw new Error(q.error.message);

    const qRows = data.questions.map((qq, idx) => ({
      quiz_id: q.data.id,
      question_text: qq.questionText,
      question_type: qq.questionType,
      options: qq.options ?? null,
      correct_answer: qq.correctAnswer,
      marks: qq.marks,
      order_index: idx,
    }));
    const qi = await supabaseAdmin.from("quiz_questions").insert(qRows);
    if (qi.error) throw new Error(qi.error.message);

    if (data.target.kind === "students") {
      const rows = students.map((s) => ({ quiz_id: q.data.id, student_id: s.id }));
      const a = await supabaseAdmin.from("quiz_assignments").insert(rows);
      if (a.error) throw new Error(a.error.message);
    }

    await notify(
      students.map((s) => s.user_id).filter(Boolean),
      "quiz",
      `New quiz: ${q.data.title}`,
      `${teacher.full_name} assigned you a new quiz.`,
      "/student/quizzes",
    );
    return { id: q.data.id, assignedCount: students.length };
  });

export const listTeacherQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("quizzes")
      .select("id, title, subject, grade_level, source, target_kind, target_class, target_section, created_at, quiz_questions(id), quiz_attempts(id, score, total, submitted_at, students(full_name, roll_number))")
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listStudentQuizzes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStudentForUser } = await import("./learning.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("quizzes")
      .select("id, title, subject, grade_level, description, time_limit_minutes, created_at, teachers!inner(full_name), quiz_questions(id, question_text, question_type, options, marks, order_index), quiz_attempts(id, score, total, submitted_at, student_id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((q) => ({
      ...q,
      attempt: (q.quiz_attempts ?? []).find((a) => a.student_id === student.id) ?? null,
    }));
  });

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => attemptSubmitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getStudentForUser, notify } = await import("./learning.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const qres = await supabaseAdmin
      .from("quiz_questions")
      .select("id, question_type, correct_answer, marks")
      .eq("quiz_id", data.quizId);
    if (qres.error) throw new Error(qres.error.message);
    const questions = qres.data ?? [];
    let score = 0;
    let total = 0;
    for (const q of questions) {
      total += q.marks;
      const given = (data.answers[q.id] ?? "").trim().toLowerCase();
      const correct = q.correct_answer.trim().toLowerCase();
      if (given && given === correct) score += q.marks;
    }

    const up = await supabaseAdmin
      .from("quiz_attempts")
      .upsert(
        {
          quiz_id: data.quizId,
          student_id: student.id,
          answers: data.answers,
          score,
          total,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "quiz_id,student_id" },
      )
      .select("id")
      .single();
    if (up.error) throw new Error(up.error.message);

    const quiz = await supabaseAdmin
      .from("quizzes")
      .select("title, teachers!inner(user_id)")
      .eq("id", data.quizId)
      .single();
    if (!quiz.error && quiz.data) {
      const t = quiz.data.teachers as { user_id: string };
      await notify(
        [t.user_id],
        "quiz_submission",
        `Quiz submitted: ${quiz.data.title}`,
        `${student.full_name} scored ${score}/${total}.`,
        "/teacher/quizzes",
      );
    }
    return { score, total };
  });

// ─────────────────────────────────────────────────────────────
// Roster (for teacher targeting)
// ─────────────────────────────────────────────────────────────
export const listMyStudentsForTeacher = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("students")
      .select("id, full_name, username, roll_number, class_name, section, status")
      .eq("school_id", teacher.school_id)
      .eq("status", "active")
      .order("class_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────
export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, type, title, message, link, read, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("notifications").update({ read: true });
    q = data.ids && data.ids.length > 0 ? q.in("id", data.ids) : q.eq("read", false);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─────────────────────────────────────────────────────────────
// AI Quiz generation (Lovable AI Gateway)
// ─────────────────────────────────────────────────────────────
const aiGenSchema = z.object({
  topic: z.string().min(2).max(200),
  subject: z.string().max(100).optional().default(""),
  gradeLevel: z.string().max(50).optional().default(""),
  count: z.number().int().min(1).max(20).default(5),
  types: z.array(z.enum(["mcq", "true_false", "fill_blank"])).min(1).default(["mcq", "true_false", "fill_blank"]),
});

export const generateQuizWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => aiGenSchema.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!lovableKey && !geminiKey) throw new Error("AI is not configured. Missing API key.");

    const typesList = data.types.join(", ");
    const prompt = `Generate exactly ${data.count} quiz questions on the topic "${data.topic}"${data.subject ? ` for the subject ${data.subject}` : ""}${data.gradeLevel ? ` at ${data.gradeLevel} level` : ""}. Mix question types across: ${typesList}. Return STRICT JSON matching this TypeScript type — no markdown, no explanations:
{"questions":[{"question_text":string,"question_type":"mcq"|"true_false"|"fill_blank","options":string[]|null,"correct_answer":string,"marks":number}]}
Rules: mcq → 4 options, correct_answer must be one of the options verbatim. true_false → options ["True","False"], correct_answer "True" or "False". fill_blank → options null, correct_answer is the single expected word/phrase. All questions must have marks:1.`;

    let raw = "{}";
    if (geminiKey) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
          }),
        },
      );
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`AI request failed [${resp.status}]: ${body}`);
      }
      const json = (await resp.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    }
    if (raw === "{}" && lovableKey) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "Lovable-API-Key": lovableKey },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a curriculum designer that outputs only valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!resp.ok) {
        const body = await resp.text();
        if (resp.status === 429) throw new Error("AI is rate limited. Please try again shortly.");
        if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
        throw new Error(`AI request failed [${resp.status}]: ${body}`);
      } else {
        const json = (await resp.json()) as { choices: Array<{ message: { content: string } }> };
        raw = json.choices?.[0]?.message?.content ?? "{}";
      }
    }
    let parsed: { questions?: Array<{ question_text: string; question_type: string; options?: string[] | null; correct_answer: string; marks?: number }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned unparseable output. Please retry.");
    }
    const questions = (parsed.questions ?? [])
      .filter((q) => q && q.question_text && q.correct_answer)
      .map((q) => ({
        questionText: q.question_text,
        questionType: (["mcq", "true_false", "fill_blank"].includes(q.question_type) ? q.question_type : "mcq") as "mcq" | "true_false" | "fill_blank",
        options: Array.isArray(q.options) ? q.options : undefined,
        correctAnswer: q.correct_answer,
        marks: q.marks ?? 1,
      }));
    if (questions.length === 0) throw new Error("AI returned no valid questions. Please retry.");
    return { questions };
  });