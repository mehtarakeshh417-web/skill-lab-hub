import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { createAssignmentSchema, assignmentSettingsSchema } from "./objective-assignments.schema";

const reviewSchema = z.object({
  attemptId: z.string().uuid(),
  overrides: z.array(z.object({ questionId: z.string().uuid(), awarded: z.number().min(0).max(1000) })).max(300).optional().default([]),
  remarks: z.string().max(6000).optional().default(""),
  publish: z.boolean().default(false),
});

const submitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string(), z.string().max(2000)),
});

// ── Teacher: create an assignment with its question bank ─────────────────────
export const createObjectiveAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createAssignmentSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, resolveTargetStudents, notify } = await import("./learning.server");
    const { admin, logEvent } = await import("./objective-assignments.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const db = await admin();

    const students = await resolveTargetStudents(teacher.school_id, data.target);
    if (students.length === 0) throw new Error("No students match the selected audience.");

    const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);
    if (data.passingMarks > totalMarks) {
      throw new Error(`Passing score cannot be more than the total of ${totalMarks} marks.`);
    }

    const insert = await db
      .from("objective_assignments")
      .insert({
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        title: data.title.trim(),
        description: data.description || null,
        technology: data.technology,
        assignment_type: data.assignmentType,
        total_marks: totalMarks,
        passing_marks: data.passingMarks,
        due_at: data.dueAt || null,
        time_limit_minutes: data.timeLimitMinutes ? data.timeLimitMinutes : null,
        shuffle_questions: data.shuffleQuestions,
        shuffle_options: data.shuffleOptions,
        randomize_per_student: data.randomizePerStudent,
        allow_multiple_attempts: data.allowMultipleAttempts,
        max_attempts: data.allowMultipleAttempts ? data.maxAttempts : 1,
        show_correct_answers: data.showCorrectAnswers,
        auto_publish: data.autoPublish,
        target_kind: data.target.kind,
        target_class: data.target.className || null,
        target_section: data.target.section || null,
      })
      .select("id, title")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    const qRows = data.questions.map((q, i) => ({
      assignment_id: insert.data.id,
      question_text: q.questionText.trim(),
      question_type: q.questionType,
      options: q.questionType === "mcq" ? q.options.filter((o) => o.trim().length > 0) : q.questionType === "true_false" ? ["True", "False"] : [],
      correct_answers: q.correctAnswers.filter((a) => a.trim().length > 0),
      marks: q.marks,
      order_index: i,
    }));
    const qIns = await db.from("objective_questions").insert(qRows);
    if (qIns.error) throw new Error(qIns.error.message);

    if (data.target.kind === "students") {
      const rows = students.map((s) => ({ assignment_id: insert.data.id, student_id: s.id }));
      const t = await db.from("objective_targets").insert(rows);
      if (t.error) throw new Error(t.error.message);
    }

    for (const s of students) {
      await logEvent({
        assignmentId: insert.data.id,
        studentId: s.id,
        status: "assigned",
        actorRole: "teacher",
        actorName: teacher.full_name,
        note: `Assignment issued (${data.technology}, ${data.questions.length} questions)`,
      });
    }

    await notify(
      students.map((s) => s.user_id).filter(Boolean),
      "assignment",
      `New assignment: ${insert.data.title}`,
      `${teacher.full_name} assigned a ${data.technology} assignment with ${data.questions.length} questions.`,
      `/student/assignments?focus=${insert.data.id}`,
    );

    return { id: insert.data.id, assignedCount: students.length, totalMarks };
  });

// ── Teacher: update settings (and questions while nobody has attempted) ──────
export const updateObjectiveAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    assignmentSettingsSchema
      .partial({ target: true })
      .extend({ assignmentId: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const { admin, logEvent } = await import("./objective-assignments.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const db = await admin();

    const owned = await db
      .from("objective_assignments")
      .select("id, teacher_id, total_marks")
      .eq("id", data.assignmentId)
      .maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data || owned.data.teacher_id !== teacher.id) {
      throw new Error("You can only edit your own assignments.");
    }
    if (data.passingMarks > Number(owned.data.total_marks)) {
      throw new Error(`Passing score cannot be more than the total of ${owned.data.total_marks} marks.`);
    }

    const upd = await db
      .from("objective_assignments")
      .update({
        title: data.title.trim(),
        description: data.description || null,
        technology: data.technology,
        passing_marks: data.passingMarks,
        due_at: data.dueAt || null,
        time_limit_minutes: data.timeLimitMinutes ? data.timeLimitMinutes : null,
        shuffle_questions: data.shuffleQuestions,
        shuffle_options: data.shuffleOptions,
        randomize_per_student: data.randomizePerStudent,
        allow_multiple_attempts: data.allowMultipleAttempts,
        max_attempts: data.allowMultipleAttempts ? data.maxAttempts : 1,
        show_correct_answers: data.showCorrectAnswers,
        auto_publish: data.autoPublish,
      })
      .eq("id", data.assignmentId);
    if (upd.error) throw new Error(upd.error.message);

    await logEvent({
      assignmentId: data.assignmentId,
      status: "updated",
      actorRole: "teacher",
      actorName: teacher.full_name,
      note: "Assignment settings updated",
    });
    return { ok: true };
  });

// ── Teacher: delete an assignment ────────────────────────────────────────────
export const deleteObjectiveAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ assignmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const { admin } = await import("./objective-assignments.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const db = await admin();
    const owned = await db
      .from("objective_assignments")
      .select("id, teacher_id")
      .eq("id", data.assignmentId)
      .maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data || owned.data.teacher_id !== teacher.id) {
      throw new Error("You can only delete your own assignments.");
    }
    const del = await db.from("objective_assignments").delete().eq("id", data.assignmentId);
    if (del.error) throw new Error(del.error.message);
    return { ok: true };
  });

// ── Teacher: full workspace payload ──────────────────────────────────────────
export const listTeacherObjectiveAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTeacherForUser } = await import("./learning.server");
    const { admin, studentDirectory } = await import("./objective-assignments.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const db = await admin();

    const { data, error } = await db
      .from("objective_assignments")
      .select(
        "*, objective_questions(id, question_text, question_type, options, correct_answers, marks, order_index), objective_targets(student_id), objective_attempts(id, student_id, attempt_no, answers, per_question_result, auto_score, final_score, passed, remarks, status, started_at, submitted_at, reviewed_at)",
      )
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const roster = await studentDirectory(teacher.school_id);

    const assignments = (data ?? []).map((a) => {
      const audience =
        a.target_kind === "class"
          ? roster.filter(
              (s) =>
                (!a.target_class || s.class_name === a.target_class) &&
                (!a.target_section || s.section === a.target_section),
            )
          : roster.filter((s) =>
              (a.objective_targets ?? []).some((t: { student_id: string }) => t.student_id === s.id),
            );

      const questions = [...(a.objective_questions ?? [])].sort(
        (x: { order_index: number }, y: { order_index: number }) => x.order_index - y.order_index,
      );
      const attempts = a.objective_attempts ?? [];
      const latestByStudent = new Map<string, (typeof attempts)[number]>();
      for (const at of attempts) {
        const prev = latestByStudent.get(at.student_id);
        if (!prev || at.attempt_no > prev.attempt_no) latestByStudent.set(at.student_id, at);
      }

      const scored = attempts.filter((at) => at.status !== "in_progress");
      const finals = scored.map((at) => Number(at.final_score ?? at.auto_score ?? 0));
      const overdue =
        a.due_at && new Date(a.due_at).getTime() < Date.now()
          ? audience.filter((s) => {
              const at = latestByStudent.get(s.id);
              return !at || at.status === "in_progress";
            }).length
          : 0;

      const questionAccuracy = questions.map((q: { id: string; question_text: string }) => {
        let correct = 0;
        let answered = 0;
        for (const at of scored) {
          const rows = (at.per_question_result ?? []) as Array<{ questionId: string; correct: boolean }>;
          const r = rows.find((x) => x.questionId === q.id);
          if (r) {
            answered += 1;
            if (r.correct) correct += 1;
          }
        }
        return {
          questionId: q.id,
          questionText: q.question_text,
          answered,
          correct,
          accuracy: answered ? Math.round((correct / answered) * 100) : 0,
        };
      });

      return {
        ...a,
        questions,
        audience,
        attempts,
        analytics: {
          assigned: audience.length,
          completed: latestByStudent.size
            ? Array.from(latestByStudent.values()).filter((at) => at.status !== "in_progress").length
            : 0,
          pending:
            audience.length -
            Array.from(latestByStudent.values()).filter((at) => at.status !== "in_progress").length,
          overdue,
          awaitingReview: Array.from(latestByStudent.values()).filter(
            (at) => at.status === "submitted" || at.status === "auto_scored",
          ).length,
          published: Array.from(latestByStudent.values()).filter((at) => at.status === "published").length,
          average: finals.length ? Math.round((finals.reduce((x, y) => x + y, 0) / finals.length) * 100) / 100 : 0,
          highest: finals.length ? Math.max(...finals) : 0,
          lowest: finals.length ? Math.min(...finals) : 0,
          passRate: finals.length
            ? Math.round(
                (finals.filter((f) => f >= Number(a.passing_marks)).length / finals.length) * 100,
              )
            : 0,
          questionAccuracy,
        },
      };
    });

    return { assignments, roster };
  });

// ── Student: my assignments ──────────────────────────────────────────────────
export const listStudentObjectiveAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStudentForUser } = await import("./learning.server");
    const { admin, asStringArray } = await import("./objective-assignments.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const db = await admin();

    const direct = await db.from("objective_targets").select("assignment_id").eq("student_id", student.id);
    if (direct.error) throw new Error(direct.error.message);
    const directIds = (direct.data ?? []).map((r) => r.assignment_id);

    const { data, error } = await db
      .from("objective_assignments")
      .select("*, teachers(full_name), objective_questions(id, question_text, correct_answers, marks, order_index)")
      .eq("school_id", student.school_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const mine = (data ?? []).filter((a) => {
      if (a.target_kind === "students") return directIds.includes(a.id);
      const classOk = !a.target_class || a.target_class === student.class_name;
      const sectionOk = !a.target_section || a.target_section === student.section;
      return classOk && sectionOk;
    });
    if (mine.length === 0) return [];

    const attempts = await db
      .from("objective_attempts")
      .select("id, assignment_id, attempt_no, status, auto_score, final_score, passed, remarks, per_question_result, started_at, submitted_at, reviewed_at")
      .eq("student_id", student.id)
      .in("assignment_id", mine.map((a) => a.id))
      .order("attempt_no", { ascending: true });
    if (attempts.error) throw new Error(attempts.error.message);

    return mine.map((a) => {
      const mineAttempts = (attempts.data ?? []).filter((at) => at.assignment_id === a.id);
      const latest = mineAttempts.length ? mineAttempts[mineAttempts.length - 1] : null;
      const published = latest?.status === "published";
      const revealAnswers = published && a.show_correct_answers;
      const questionMeta = [...(a.objective_questions ?? [])]
        .sort((x: { order_index: number }, y: { order_index: number }) => x.order_index - y.order_index)
        .map((q: { id: string; question_text: string; correct_answers: unknown; marks: number }) => ({
          id: q.id,
          questionText: q.question_text,
          marks: q.marks,
          correctAnswers: revealAnswers ? asStringArray(q.correct_answers) : null,
        }));
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        technology: a.technology,
        assignmentType: a.assignment_type,
        totalMarks: Number(a.total_marks),
        passingMarks: Number(a.passing_marks),
        dueAt: a.due_at,
        timeLimitMinutes: a.time_limit_minutes,
        allowMultipleAttempts: a.allow_multiple_attempts,
        maxAttempts: a.max_attempts,
        showCorrectAnswers: a.show_correct_answers,
        createdAt: a.created_at,
        questionCount: (a.objective_questions ?? []).length,
        teacherName: (a.teachers as unknown as { full_name: string } | null)?.full_name ?? "Your teacher",
        attempts: mineAttempts.map((at) => ({
          ...at,
          per_question_result: at.status === "published" ? at.per_question_result : [],
          auto_score: at.status === "published" ? at.auto_score : null,
          final_score: at.status === "published" ? at.final_score : null,
          passed: at.status === "published" ? at.passed : null,
          remarks: at.status === "published" ? at.remarks : null,
        })),
        questionMeta,
      };
    });
  });

// ── Student: begin (or resume) an attempt ────────────────────────────────────
export const startObjectiveAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ assignmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { getStudentForUser } = await import("./learning.server");
    const { admin, assertStudentCanAccess, loadQuestions, logEvent, shuffle, asStringArray } = await import(
      "./objective-assignments.server"
    );
    const student = await getStudentForUser(context.supabase, context.userId);
    const assignment = await assertStudentCanAccess(data.assignmentId, student);
    const db = await admin();

    if (assignment.due_at && new Date(assignment.due_at).getTime() < Date.now()) {
      throw new Error("The due date for this assignment has passed.");
    }

    const prior = await db
      .from("objective_attempts")
      .select("id, attempt_no, status, question_order, started_at")
      .eq("assignment_id", data.assignmentId)
      .eq("student_id", student.id)
      .order("attempt_no", { ascending: true });
    if (prior.error) throw new Error(prior.error.message);
    const rows = prior.data ?? [];
    const open = rows.find((r) => r.status === "in_progress");
    const maxAttempts = assignment.allow_multiple_attempts ? assignment.max_attempts : 1;
    if (!open && rows.length >= maxAttempts) {
      throw new Error("You have used all the attempts allowed for this assignment.");
    }

    const questions = await loadQuestions(data.assignmentId);
    if (questions.length === 0) throw new Error("This assignment has no questions yet.");

    let attemptId = open?.id ?? null;
    let attemptNo = open?.attempt_no ?? rows.length + 1;
    let startedAt = open?.started_at ?? new Date().toISOString();
    let order = (open?.question_order ?? []) as string[];

    if (!open) {
      const seed =
        (assignment.randomize_per_student ? student.id : assignment.id) + ":" + attemptNo;
      const ordered =
        assignment.shuffle_questions || assignment.randomize_per_student
          ? shuffle(questions, seed)
          : questions;
      order = ordered.map((q) => q.id);
      const ins = await db
        .from("objective_attempts")
        .insert({
          assignment_id: data.assignmentId,
          student_id: student.id,
          attempt_no: attemptNo,
          question_order: order,
          status: "in_progress",
          started_at: startedAt,
        })
        .select("id, attempt_no, started_at")
        .single();
      if (ins.error) throw new Error(ins.error.message);
      attemptId = ins.data.id;
      attemptNo = ins.data.attempt_no;
      startedAt = ins.data.started_at;
      await logEvent({
        assignmentId: data.assignmentId,
        studentId: student.id,
        attemptId,
        status: "in_progress",
        actorRole: "student",
        actorName: student.full_name,
        note: `Attempt ${attemptNo} started`,
      });
    }

    const byId = new Map(questions.map((q) => [q.id, q]));
    const sequence = (order.length ? order : questions.map((q) => q.id))
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof questions;

    return {
      attemptId: attemptId as string,
      attemptNo,
      startedAt,
      timeLimitMinutes: assignment.time_limit_minutes,
      dueAt: assignment.due_at,
      title: assignment.title,
      totalMarks: Number(assignment.total_marks),
      questions: sequence.map((q) => ({
        id: q.id,
        questionText: q.question_text,
        questionType: q.question_type,
        marks: Number(q.marks),
        options: assignment.shuffle_options
          ? shuffle(asStringArray(q.options), q.id + ":" + student.id)
          : asStringArray(q.options),
      })),
    };
  });

// ── Student: submit an attempt (auto-scored server-side) ─────────────────────
export const submitObjectiveAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getStudentForUser, notify } = await import("./learning.server");
    const { admin, loadQuestions, scoreAnswers, logEvent } = await import("./objective-assignments.server");
    const student = await getStudentForUser(context.supabase, context.userId);
    const db = await admin();

    const attempt = await db
      .from("objective_attempts")
      .select("id, assignment_id, student_id, attempt_no, status, started_at")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (attempt.error) throw new Error(attempt.error.message);
    if (!attempt.data || attempt.data.student_id !== student.id) throw new Error("Attempt not found.");
    if (attempt.data.status !== "in_progress") throw new Error("This attempt has already been submitted.");

    const assignmentRes = await db
      .from("objective_assignments")
      .select("*")
      .eq("id", attempt.data.assignment_id)
      .single();
    if (assignmentRes.error) throw new Error(assignmentRes.error.message);
    const assignment = assignmentRes.data;

    const questions = await loadQuestions(assignment.id);
    const { results, score, total } = scoreAnswers(questions, data.answers);
    const passed = score >= Number(assignment.passing_marks);
    const publishNow = assignment.auto_publish;

    const upd = await db
      .from("objective_attempts")
      .update({
        answers: data.answers,
        per_question_result: results,
        auto_score: score,
        final_score: score,
        passed,
        status: publishNow ? "published" : "auto_scored",
        submitted_at: new Date().toISOString(),
        reviewed_at: publishNow ? new Date().toISOString() : null,
      })
      .eq("id", data.attemptId)
      .select("id")
      .single();
    if (upd.error) throw new Error(upd.error.message);

    await logEvent({
      assignmentId: assignment.id,
      studentId: student.id,
      attemptId: data.attemptId,
      status: "submitted",
      actorRole: "student",
      actorName: student.full_name,
      note: `Attempt ${attempt.data.attempt_no} submitted · auto-score ${score}/${total}`,
    });
    if (publishNow) {
      await logEvent({
        assignmentId: assignment.id,
        studentId: student.id,
        attemptId: data.attemptId,
        status: "published",
        actorRole: "system",
        actorName: "Auto-publish",
        note: `Result published automatically: ${score}/${total}`,
      });
    }

    const teacher = await db.from("teachers").select("user_id").eq("id", assignment.teacher_id).maybeSingle();
    if (teacher.data?.user_id) {
      await notify(
        [teacher.data.user_id],
        "submission",
        `Assignment submitted: ${assignment.title}`,
        `${student.full_name} scored ${score}/${total} automatically. Tap to review.`,
        `/teacher/assignments?attempt=${data.attemptId}`,
      );
    }
    if (publishNow) {
      const me = await db.from("students").select("user_id").eq("id", student.id).maybeSingle();
      if (me.data?.user_id) {
        await notify(
          [me.data.user_id],
          "graded",
          `Result: ${assignment.title}`,
          `You scored ${score}/${total} — ${passed ? "Passed" : "Not passed"}.`,
          `/student/assignments?focus=${assignment.id}`,
        );
      }
    }

    return { ok: true, score, total, passed, published: publishNow };
  });

// ── Teacher: adjust marks, add remarks, publish the result ───────────────────
export const reviewObjectiveAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => reviewSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { getTeacherForUser, notify } = await import("./learning.server");
    const { admin, loadAttemptForTeacher, logEvent } = await import("./objective-assignments.server");
    const teacher = await getTeacherForUser(context.supabase, context.userId);
    const { attempt, assignment, student } = await loadAttemptForTeacher(data.attemptId, teacher.id);
    const db = await admin();

    if (attempt.status === "in_progress") throw new Error("This student has not submitted yet.");

    const results = ((attempt.per_question_result ?? []) as Array<{
      questionId: string;
      answer: string;
      correct: boolean;
      awarded: number;
      marks: number;
      overridden?: boolean;
    }>).map((r) => {
      const o = data.overrides.find((x) => x.questionId === r.questionId);
      if (!o) return r;
      const capped = Math.min(o.awarded, r.marks);
      return { ...r, awarded: capped, overridden: capped !== (r.correct ? r.marks : 0) };
    });
    const finalScore = results.reduce((sum, r) => sum + Number(r.awarded), 0);
    const total = Number(assignment.total_marks);
    const passed = finalScore >= Number(assignment.passing_marks);

    const upd = await db
      .from("objective_attempts")
      .update({
        per_question_result: results,
        final_score: finalScore,
        passed,
        remarks: data.remarks || null,
        status: data.publish ? "published" : attempt.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: teacher.id,
      })
      .eq("id", data.attemptId);
    if (upd.error) throw new Error(upd.error.message);

    await logEvent({
      assignmentId: assignment.id,
      studentId: student.id,
      attemptId: data.attemptId,
      status: data.publish ? "published" : "reviewed",
      actorRole: "teacher",
      actorName: teacher.full_name,
      note: data.publish
        ? `Result published: ${finalScore}/${total}`
        : `Marks reviewed: ${finalScore}/${total}`,
    });

    if (data.publish) {
      await notify(
        [student.user_id],
        "graded",
        `Result: ${assignment.title}`,
        `You scored ${finalScore}/${total} — ${passed ? "Passed" : "Not passed"}.${data.remarks ? " Tap to read your teacher's remarks." : ""}`,
        `/student/assignments?focus=${assignment.id}`,
      );
    }

    return { ok: true, finalScore, total, passed, published: data.publish };
  });

// ── Assignment history ───────────────────────────────────────────────────────
export const listObjectiveHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ assignmentId: z.string().uuid(), studentId: z.string().uuid().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("objective_events")
      .select("id, status, actor_role, actor_name, note, created_at, student_id")
      .eq("assignment_id", data.assignmentId)
      .order("created_at", { ascending: false })
      .limit(150);
    if (data.studentId) query = query.eq("student_id", data.studentId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });