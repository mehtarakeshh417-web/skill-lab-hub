import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthedClient = SupabaseClient<Database>;

export type ClassSectionRecord = {
  id: string;
  className: string;
  sectionName: string;
  teacherId: string | null;
  teacherUsername: string | null;
  teacherName: string | null;
};

export type SectionInput = {
  className: string;
  sectionName: string;
  teacherUsername: string | null;
};

export type StudentTeacherAssignmentRecord = {
  id: string;
  teacherId: string;
  studentId: string;
};

/** Normalised comparison key so "Section A" / "a" and "Class 6" / "6" line up. */
export function sectionKey(value: string | null | undefined): string {
  const raw = (value ?? "").trim().toLowerCase().replace(/^section\s+/, "");
  return raw.replace(/[^a-z0-9]/g, "");
}

export function classKey(value: string | null | undefined): string {
  const raw = (value ?? "").trim().toLowerCase();
  const digits = raw.match(/\d+/);
  if (digits) return digits[0];
  return raw.replace(/[^a-z0-9]/g, "");
}

async function getSchoolForActor(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("id, name, school_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only signed-in Schools can manage classes.");
  return data;
}

async function loadSections(schoolId: string): Promise<ClassSectionRecord[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [sections, teachers] = await Promise.all([
    supabaseAdmin
      .from("class_sections")
      .select("id, class_name, section_name, teacher_id")
      .eq("school_id", schoolId)
      .order("class_name", { ascending: true })
      .order("section_name", { ascending: true }),
    supabaseAdmin.from("teachers").select("id, username, full_name").eq("school_id", schoolId),
  ]);
  if (sections.error) throw new Error(sections.error.message);
  if (teachers.error) throw new Error(teachers.error.message);
  const byId = new Map((teachers.data ?? []).map((t) => [t.id, t]));
  return (sections.data ?? []).map((row) => {
    const teacher = row.teacher_id ? byId.get(row.teacher_id) : undefined;
    return {
      id: row.id,
      className: row.class_name,
      sectionName: row.section_name,
      teacherId: row.teacher_id,
      teacherUsername: teacher?.username ?? null,
      teacherName: teacher?.full_name ?? null,
    };
  });
}

export async function listClassSectionsForSchoolActor(
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  return { schoolId: school.id, sections: await loadSections(school.id) };
}

export async function listStudentTeacherAssignmentsForSchoolActor(
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("student_teacher_assignments")
    .select("id, teacher_id, student_id")
    .eq("school_id", school.id);
  if (error) throw new Error(error.message);
  return {
    schoolId: school.id,
    assignments: (data ?? []).map((row) => ({
      id: row.id,
      teacherId: row.teacher_id,
      studentId: row.student_id,
    })),
  };
}

export async function assignTeacherToSectionForSchoolActor(
  input: { sectionId: string; teacherId: string | null },
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (input.teacherId) {
    const teacher = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("id", input.teacherId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (teacher.error) throw new Error(teacher.error.message);
    if (!teacher.data) throw new Error("That teacher does not belong to your school.");
  }

  const update = await supabaseAdmin
    .from("class_sections")
    .update({ teacher_id: input.teacherId })
    .eq("id", input.sectionId)
    .eq("school_id", school.id)
    .select("id")
    .maybeSingle();
  if (update.error) throw new Error(update.error.message);
  if (!update.data) throw new Error("Section not found for this school.");

  return { schoolId: school.id, sections: await loadSections(school.id) };
}

export async function setStudentTeacherAssignmentForSchoolActor(
  input: { teacherId: string; studentId: string; assigned: boolean },
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [teacher, student] = await Promise.all([
    supabaseAdmin.from("teachers").select("id").eq("id", input.teacherId).eq("school_id", school.id).maybeSingle(),
    supabaseAdmin.from("students").select("id").eq("id", input.studentId).eq("school_id", school.id).maybeSingle(),
  ]);
  if (teacher.error) throw new Error(teacher.error.message);
  if (student.error) throw new Error(student.error.message);
  if (!teacher.data || !student.data) throw new Error("Teacher and student must belong to your school.");

  if (input.assigned) {
    const { error } = await supabaseAdmin.from("student_teacher_assignments").upsert(
      { school_id: school.id, teacher_id: input.teacherId, student_id: input.studentId },
      { onConflict: "teacher_id,student_id" },
    );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from("student_teacher_assignments")
      .delete()
      .eq("school_id", school.id)
      .eq("teacher_id", input.teacherId)
      .eq("student_id", input.studentId);
    if (error) throw new Error(error.message);
  }

  return listStudentTeacherAssignmentsForSchoolActor(_actorSupabase, actorUserId);
}

/** Replace the school's whole class/section structure with the supplied list. */
export async function saveClassSectionsForSchoolActor(
  sections: SectionInput[],
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const teacherRows = await supabaseAdmin
    .from("teachers")
    .select("id, username")
    .eq("school_id", school.id);
  if (teacherRows.error) throw new Error(teacherRows.error.message);
  const teacherIdByUsername = new Map(
    (teacherRows.data ?? []).map((t) => [t.username.toLowerCase(), t.id]),
  );

  const seen = new Set<string>();
  const rows = sections
    .map((s) => ({
      school_id: school.id,
      class_name: s.className.trim(),
      section_name: s.sectionName.trim(),
      teacher_id: s.teacherUsername
        ? teacherIdByUsername.get(s.teacherUsername.trim().toLowerCase()) ?? null
        : null,
    }))
    .filter((r) => {
      if (!r.class_name || !r.section_name) return false;
      const k = `${r.class_name.toLowerCase()}::${r.section_name.toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  const del = await supabaseAdmin.from("class_sections").delete().eq("school_id", school.id);
  if (del.error) throw new Error(del.error.message);

  if (rows.length) {
    const ins = await supabaseAdmin.from("class_sections").insert(rows);
    if (ins.error) throw new Error(ins.error.message);
  }

  return { schoolId: school.id, sections: await loadSections(school.id) };
}

export type TeacherWorkspaceSummary = {
  teacherId: string;
  teacherName: string;
  schoolId: string;
  sections: Array<{
    id: string;
    className: string;
    sectionName: string;
    studentCount: number;
  }>;
  students: Array<{
    id: string;
    fullName: string;
    username: string;
    rollNumber: string;
    className: string;
    section: string;
    status: string;
    allocationSource: "section" | "direct" | "section_and_direct";
  }>;
};

/** Sections allocated to the signed-in teacher, plus the students inside them. */
export async function getTeacherWorkspaceForActor(
  actorSupabase: AuthedClient,
  actorUserId: string,
): Promise<TeacherWorkspaceSummary> {
  const { getTeacherForUser } = await import("./learning.server");
  const teacher = await getTeacherForUser(actorSupabase, actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [sectionRows, studentRows, assignmentRows] = await Promise.all([
    supabaseAdmin
      .from("class_sections")
      .select("id, class_name, section_name")
      .eq("school_id", teacher.school_id)
      .eq("teacher_id", teacher.id)
      .order("class_name", { ascending: true }),
    supabaseAdmin
      .from("students")
      .select("id, full_name, username, roll_number, class_name, section, status")
      .eq("school_id", teacher.school_id)
      .order("class_name", { ascending: true }),
    supabaseAdmin
      .from("student_teacher_assignments")
      .select("student_id")
      .eq("school_id", teacher.school_id)
      .eq("teacher_id", teacher.id),
  ]);
  if (sectionRows.error) throw new Error(sectionRows.error.message);
  if (studentRows.error) throw new Error(studentRows.error.message);
  if (assignmentRows.error) throw new Error(assignmentRows.error.message);

  const allocated = sectionRows.data ?? [];
  const allocatedKeys = new Set(
    allocated.map((s) => `${classKey(s.class_name)}::${sectionKey(s.section_name)}`),
  );

  const directStudentIds = new Set((assignmentRows.data ?? []).map((row) => row.student_id));
  const mine = (studentRows.data ?? []).filter((s) => {
    const sectionAssigned = allocatedKeys.has(`${classKey(s.class_name)}::${sectionKey(s.section)}`);
    return sectionAssigned || directStudentIds.has(s.id);
  });

  const countByKey = new Map<string, number>();
  mine.forEach((s) => {
    const k = `${classKey(s.class_name)}::${sectionKey(s.section)}`;
    countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
  });

  return {
    teacherId: teacher.id,
    teacherName: teacher.full_name,
    schoolId: teacher.school_id,
    sections: allocated.map((s) => ({
      id: s.id,
      className: s.class_name,
      sectionName: s.section_name,
      studentCount: countByKey.get(`${classKey(s.class_name)}::${sectionKey(s.section_name)}`) ?? 0,
    })),
    students: mine.map((s) => ({
      id: s.id,
      fullName: s.full_name,
      username: s.username,
      rollNumber: s.roll_number ?? "",
      className: s.class_name ?? "",
      section: s.section ?? "",
      status: s.status,
      allocationSource: allocatedKeys.has(`${classKey(s.class_name)}::${sectionKey(s.section)}`)
        ? directStudentIds.has(s.id) ? "section_and_direct" : "section"
        : "direct",
    })),
  };
}