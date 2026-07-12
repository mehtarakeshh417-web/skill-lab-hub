import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export async function getTeacherForUser(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, school_id, full_name, username")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You must be signed in as a teacher.");
  return data;
}

export async function getStudentForUser(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("id, school_id, full_name, username, class_name, section")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You must be signed in as a student.");
  return data;
}

export async function notify(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  if (userIds.length === 0) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows = userIds.map((uid) => ({
    user_id: uid,
    type,
    title,
    message,
    link: link ?? null,
  }));
  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) console.error("[notify]", error.message);
}

/** Resolve the set of student rows (id + user_id) targeted by an assignment/quiz spec. */
export async function resolveTargetStudents(
  schoolId: string,
  target: {
    kind: "students" | "class";
    studentIds?: string[];
    className?: string | null;
    section?: string | null;
  },
): Promise<Array<{ id: string; user_id: string }>> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (target.kind === "students") {
    if (!target.studentIds || target.studentIds.length === 0) return [];
    const { data, error } = await supabaseAdmin
      .from("students")
      .select("id, user_id")
      .eq("school_id", schoolId)
      .in("id", target.studentIds);
    if (error) throw new Error(error.message);
    return data ?? [];
  }
  let q = supabaseAdmin
    .from("students")
    .select("id, user_id")
    .eq("school_id", schoolId)
    .eq("status", "active");
  if (target.className) q = q.eq("class_name", target.className);
  if (target.section) q = q.eq("section", target.section);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}