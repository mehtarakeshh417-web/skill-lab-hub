import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const fileSchema = z.object({
  name: z.string().min(1).max(255),
  path: z.string().min(1).max(600),
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  instructions: z.string().max(8000).optional().default(""),
  technology: z.string().min(1).max(80),
  templateKey: z.string().max(120).optional().nullable(),
  submissionType: z.enum(["text", "screenshot", "file", "source_code", "multi_file"]),
  dueDate: z.string().max(40).optional().nullable(),
  maxMarks: z.number().int().min(1).max(1000).default(100),
  target: z.object({
    kind: z.enum(["students", "class"]),
    studentIds: z.array(z.string().uuid()).optional(),
    className: z.string().max(60).optional().nullable(),
    section: z.string().max(20).optional().nullable(),
  }),
});

const submitSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().max(20000).optional().default(""),
  sourceCode: z.string().max(60000).optional().default(""),
  files: z.array(fileSchema).max(10).optional().default([]),
});

const reviewSchema = z.object({
  submissionId: z.string().uuid(),
  action: z.enum(["under_review", "evaluate", "resubmit"]),
  marks: z.number().min(0).max(1000).optional().nullable(),
  feedback: z.string().max(6000).optional().default(""),
});

// ── Teacher: create a project ────────────────────────────────────────────────
export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, resolveTargetStudents, notify } = await import("./learning.server");
    const { admin, logEvent } = await import("./projects.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const db = await admin();

    const students = await resolveTargetStudents(teacher.school_id, data.target);
    if (students.length === 0) throw new Error("No students match the selected audience.");

    const insert = await db
      .from("assignments")
      .insert({
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        title: data.title.trim(),
        description: data.description || null,
        instructions: data.instructions || null,
        technology: data.technology,
        template_key: data.templateKey || null,
        submission_type: data.submissionType,
        kind: "project",
        due_date: data.dueDate || null,
        max_marks: data.maxMarks,
        target_kind: data.target.kind,
        target_class: data.target.className || null,
        target_section: data.target.section || null,
      })
      .select("id, title")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    if (data.target.kind === "students") {
      const rows = students.map((s) => ({ assignment_id: insert.data.id, student_id: s.id }));
      const t = await db.from("assignment_targets").insert(rows);
      if (t.error) throw new Error(t.error.message);
    }

    for (const s of students) {
      await logEvent({
        assignmentId: insert.data.id,
        studentId: s.id,
        status: "assigned",
        actorRole: "teacher",
        actorName: teacher.full_name,
        note: `Project assigned (${data.technology})`,
      });
    }

    await notify(
      students.map((s) => s.user_id).filter(Boolean),
      "project",
      `New project: ${insert.data.title}`,
      `${teacher.full_name} assigned you a ${data.technology} project.`,
      `/student/projects?focus=${insert.data.id}`,
    );

    return { id: insert.data.id, assignedCount: students.length };
  });

// ── Teacher: list my projects with submissions ───────────────────────────────
export const listTeacherProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const { admin, signFiles, studentDirectory, type ProjectFile } = await import("./projects.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const db = await admin();

    const { data, error } = await db
      .from("assignments")
      .select(
        "id, title, description, instructions, technology, template_key, submission_type, due_date, max_marks, target_kind, target_class, target_section, created_at, assignment_targets(student_id), submissions(id, status, attempt, grade, grade_letter, feedback, content, source_code, files, submitted_at, reviewed_at, student_id, students(id, full_name, roll_number, class_name, section))",
      )
      .eq("teacher_id", teacher.id)
      .eq("kind", "project")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const roster = await studentDirectory(context.supabase, teacher.school_id);

    const projects = [] as Array<Record<string, unknown>>;
    for (const p of data ?? []) {
      const targeted =
        p.target_kind === "class"
          ? roster.filter(
              (s) =>
                (!p.target_class || s.class_name === p.target_class) &&
                (!p.target_section || s.section === p.target_section),
            )
          : roster.filter((s) =>
              (p.assignment_targets ?? []).some((t: { student_id: string }) => t.student_id === s.id),
            );

      const subs = [];
      for (const s of p.submissions ?? []) {
        subs.push({
          ...s,
          files: await signFiles(((s.files ?? []) as unknown as ProjectFile[]) ?? []),
        });
      }
      projects.push({ ...p, audience: targeted, submissions: subs });
    }
    return { projects, roster };
  });

// ── Student: my projects ─────────────────────────────────────────────────────
export const listStudentProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStudentForUser } = await import("./learning.server");
    const { admin, signFiles, type ProjectFile } = await import("./projects.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const db = await admin();

    const direct = await db
      .from("assignment_targets")
      .select("assignment_id")
      .eq("student_id", student.id);
    if (direct.error) throw new Error(direct.error.message);
    const directIds = (direct.data ?? []).map((r) => r.assignment_id);

    const { data, error } = await db
      .from("assignments")
      .select(
        "id, title, description, instructions, technology, submission_type, due_date, max_marks, target_kind, target_class, target_section, created_at, teachers(full_name)",
      )
      .eq("kind", "project")
      .eq("school_id", student.school_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const mine = (data ?? []).filter((p) => {
      if (p.target_kind === "students") return directIds.includes(p.id);
      const classOk = !p.target_class || p.target_class === student.class_name;
      const sectionOk = !p.target_section || p.target_section === student.section;
      return classOk && sectionOk;
    });
    if (mine.length === 0) return [];

    const subs = await db
      .from("submissions")
      .select("id, assignment_id, status, attempt, grade, grade_letter, feedback, content, source_code, files, submitted_at, reviewed_at")
      .eq("student_id", student.id)
      .in("assignment_id", mine.map((p) => p.id));
    if (subs.error) throw new Error(subs.error.message);

    const out = [];
    for (const p of mine) {
      const sub = (subs.data ?? []).find((s) => s.assignment_id === p.id) ?? null;
      out.push({
        ...p,
        submission: sub
          ? { ...sub, files: await signFiles(((sub.files ?? []) as unknown as ProjectFile[]) ?? []) }
          : null,
      });
    }
    return out;
  });

// ── Student: mark a project as started ───────────────────────────────────────
export const startProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ assignmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getStudentForUser } = await import("./learning.server");
    const { admin, assertStudentCanAccess, logEvent } = await import("./projects.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    await assertStudentCanAccess(data.assignmentId, student);
    const db = await admin();

    const existing = await db
      .from("submissions")
      .select("id, status")
      .eq("assignment_id", data.assignmentId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) return { ok: true, status: existing.data.status };

    const ins = await db
      .from("submissions")
      .insert({
        assignment_id: data.assignmentId,
        student_id: student.id,
        status: "in_progress",
      })
      .select("id")
      .single();
    if (ins.error) throw new Error(ins.error.message);

    await logEvent({
      assignmentId: data.assignmentId,
      studentId: student.id,
      submissionId: ins.data.id,
      status: "in_progress",
      actorRole: "student",
      actorName: student.full_name,
      note: "Student started working on the project",
    });
    return { ok: true, status: "in_progress" };
  });

// ── Student: submit / resubmit ───────────────────────────────────────────────
export const submitProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getStudentForUser, notify } = await import("./learning.server");
    const { admin, assertStudentCanAccess, logEvent } = await import("./projects.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const project = await assertStudentCanAccess(data.assignmentId, student);
    const db = await admin();

    const type = project.submission_type;
    const hasFiles = data.files.length > 0;
    if (type === "text" && !data.content.trim()) throw new Error("Please write your answer before submitting.");
    if (type === "source_code" && !data.sourceCode.trim()) throw new Error("Please paste your source code before submitting.");
    if ((type === "file" || type === "screenshot" || type === "multi_file") && !hasFiles) {
      throw new Error("Please attach your work before submitting.");
    }

    const existing = await db
      .from("submissions")
      .select("id, attempt")
      .eq("assignment_id", data.assignmentId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);

    const payload = {
      assignment_id: data.assignmentId,
      student_id: student.id,
      content: data.content || null,
      source_code: data.sourceCode || null,
      files: data.files,
      file_url: null,
      file_name: data.files[0]?.name ?? null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      attempt: existing.data ? (existing.data.attempt ?? 1) + 1 : 1,
    };

    const saved = existing.data
      ? await db.from("submissions").update(payload).eq("id", existing.data.id).select("id, attempt").single()
      : await db.from("submissions").insert(payload).select("id, attempt").single();
    if (saved.error) throw new Error(saved.error.message);

    await logEvent({
      assignmentId: data.assignmentId,
      studentId: student.id,
      submissionId: saved.data.id,
      status: "submitted",
      actorRole: "student",
      actorName: student.full_name,
      note: `Attempt ${saved.data.attempt} submitted`,
    });

    const teacher = await db
      .from("teachers")
      .select("user_id")
      .eq("id", project.teacher_id)
      .maybeSingle();
    if (teacher.data?.user_id) {
      await notify(
        [teacher.data.user_id],
        "submission",
        `Submission: ${project.title}`,
        `${student.full_name} submitted their project. Tap to review.`,
        `/teacher/projects?submission=${saved.data.id}`,
      );
    }
    return { ok: true, submissionId: saved.data.id };
  });

// ── Teacher: review / evaluate / request resubmission ────────────────────────
export const reviewProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, notify } = await import("./learning.server");
    const { admin, loadSubmissionForTeacher, letterGrade, logEvent } = await import("./projects.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { assignment, student } = await loadSubmissionForTeacher(data.submissionId, teacher.id);
    const db = await admin();

    const max = assignment.max_marks ?? 100;
    let status = "under_review";
    let letter: string | null = null;
    let marks: number | null = null;

    if (data.action === "evaluate") {
      if (data.marks == null) throw new Error("Please enter the marks awarded.");
      if (data.marks > max) throw new Error(`Marks cannot be more than ${max}.`);
      marks = data.marks;
      letter = letterGrade(data.marks, max);
      status = "evaluated";
    } else if (data.action === "resubmit") {
      status = "resubmit_requested";
    }

    const upd = await db
      .from("submissions")
      .update({
        status,
        grade: marks,
        grade_letter: letter,
        feedback: data.feedback || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: teacher.id,
      })
      .eq("id", data.submissionId)
      .select("id")
      .single();
    if (upd.error) throw new Error(upd.error.message);

    await logEvent({
      assignmentId: assignment.id,
      studentId: student.id,
      submissionId: data.submissionId,
      status,
      actorRole: "teacher",
      actorName: teacher.full_name,
      note:
        data.action === "evaluate"
          ? `Evaluated: ${marks}/${max} (${letter})`
          : data.action === "resubmit"
            ? "Resubmission requested"
            : "Marked under review",
    });

    const link = `/student/projects?focus=${assignment.id}`;
    if (data.action === "evaluate") {
      await notify(
        [student.user_id],
        "graded",
        `Evaluated: ${assignment.title}`,
        `You scored ${marks}/${max} (${letter}).${data.feedback ? " Tap to read your feedback." : ""}`,
        link,
      );
    } else if (data.action === "resubmit") {
      await notify(
        [student.user_id],
        "project",
        `Resubmission requested: ${assignment.title}`,
        data.feedback || "Your teacher asked you to improve and submit again.",
        link,
      );
    } else {
      await notify(
        [student.user_id],
        "project",
        `Under review: ${assignment.title}`,
        "Your teacher has started reviewing your submission.",
        link,
      );
    }
    return { ok: true, status, grade: marks, gradeLetter: letter };
  });

// ── Project history ──────────────────────────────────────────────────────────
export const listProjectHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ assignmentId: z.string().uuid(), studentId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("project_events")
      .select("id, status, actor_role, actor_name, note, created_at, student_id")
      .eq("assignment_id", data.assignmentId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.studentId) query = query.eq("student_id", data.studentId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });