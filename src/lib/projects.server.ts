import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { gradeFor } from "./project-templates";

type Client = SupabaseClient<Database>;

export type ProjectFile = { name: string; path: string };

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function logEvent(row: {
  assignmentId: string;
  studentId: string;
  submissionId?: string | null;
  status: string;
  actorRole: string;
  actorName?: string | null;
  note?: string | null;
}) {
  const db = await admin();
  const { error } = await db.from("project_events").insert({
    assignment_id: row.assignmentId,
    student_id: row.studentId,
    submission_id: row.submissionId ?? null,
    status: row.status,
    actor_role: row.actorRole,
    actor_name: row.actorName ?? null,
    note: row.note ?? null,
  });
  if (error) console.error("[project_events]", error.message);
}

/** Confirm the student is in the audience of this project; returns the project row. */
export async function assertStudentCanAccess(assignmentId: string, student: {
  id: string; school_id: string; class_name: string | null; section: string | null;
}) {
  const db = await admin();
  const { data, error } = await db
    .from("assignments")
    .select("id, teacher_id, school_id, title, submission_type, max_marks, target_kind, target_class, target_section, due_date")
    .eq("id", assignmentId)
    .eq("kind", "project")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This project no longer exists.");
  if (data.school_id !== student.school_id) throw new Error("You do not have access to this project.");

  if (data.target_kind === "class") {
    const classOk = data.target_class ? data.target_class === student.class_name : true;
    const sectionOk = data.target_section ? data.target_section === student.section : true;
    if (!classOk || !sectionOk) throw new Error("This project was not assigned to your class.");
  } else {
    const { data: target, error: tErr } = await db
      .from("assignment_targets")
      .select("student_id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", student.id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!target) throw new Error("This project was not assigned to you.");
  }
  return data;
}

/** Confirm the teacher owns the submission; returns joined context. */
export async function loadSubmissionForTeacher(submissionId: string, teacherId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("submissions")
    .select(
      "id, assignment_id, student_id, status, attempt, grade, feedback, assignments!inner(id, teacher_id, title, max_marks, kind), students!inner(id, user_id, full_name)",
    )
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Submission not found.");
  const assignment = data.assignments as unknown as {
    id: string; teacher_id: string; title: string; max_marks: number | null; kind: string;
  };
  if (assignment.teacher_id !== teacherId) {
    throw new Error("You can only review submissions for your own projects.");
  }
  return {
    submission: data,
    assignment,
    student: data.students as unknown as { id: string; user_id: string; full_name: string },
  };
}

export function letterGrade(marks: number, maxMarks: number | null) {
  return gradeFor(marks, maxMarks ?? 100);
}

export async function signFiles(files: ProjectFile[]): Promise<Array<ProjectFile & { url: string | null }>> {
  if (files.length === 0) return [];
  const db = await admin();
  const out: Array<ProjectFile & { url: string | null }> = [];
  for (const f of files) {
    const { data } = await db.storage.from("project-files").createSignedUrl(f.path, 60 * 60);
    out.push({ ...f, url: data?.signedUrl ?? null });
  }
  return out;
}

export async function studentDirectory(supabase: Client, schoolId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, roll_number, class_name, section")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("class_name")
    .order("full_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}