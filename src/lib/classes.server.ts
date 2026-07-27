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

  const [sectionRows, studentRows] = await Promise.all([
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
  ]);
  if (sectionRows.error) throw new Error(sectionRows.error.message);
  if (studentRows.error) throw new Error(studentRows.error.message);

  const allocated = sectionRows.data ?? [];
  const allocatedKeys = new Set(
    allocated.map((s) => `${classKey(s.class_name)}::${sectionKey(s.section_name)}`),
  );

  const mine = (studentRows.data ?? []).filter((s) =>
    allocatedKeys.has(`${classKey(s.class_name)}::${sectionKey(s.section)}`),
  );

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
    })),
  };
}