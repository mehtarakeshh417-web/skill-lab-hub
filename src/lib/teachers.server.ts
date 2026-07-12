import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { TeacherCreateInput } from "./teachers.schema";

type AuthedClient = SupabaseClient<Database>;

export type TeacherRecord = {
  id: string;
  userId: string;
  schoolId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  employeeId: string;
  subject: string;
  department: string;
  qualification: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  status: string;
  createdAt: string;
};

function toRecord(row: Database["public"]["Tables"]["teachers"]["Row"]): TeacherRecord {
  return {
    id: row.id,
    userId: row.user_id,
    schoolId: row.school_id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    phone: row.phone ?? "",
    employeeId: row.employee_id ?? "",
    subject: row.subject ?? "",
    department: row.department ?? "",
    qualification: row.qualification ?? "",
    gender: row.gender ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    address: row.address ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

async function getSchoolForActor(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only signed-in Schools can manage teachers.");
  return data;
}

export async function createTeacherForSchool(
  input: TeacherCreateInput,
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const username = input.username.trim().toLowerCase();
  const loginEmail = `${username}@avartan.app`;
  const contactEmail = input.email.trim().toLowerCase();

  const [uCheck, pCheck, sCheck, rCheck] = await Promise.all([
    supabaseAdmin.from("teachers").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("profiles").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("sales_reps").select("id").ilike("username", username).maybeSingle(),
  ]);
  if (uCheck.data || pCheck.data || sCheck.data || rCheck.data) {
    throw new Error("Username already exists.");
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: input.fullName.trim(),
      school_id: school.id,
    },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Could not create teacher login.");
  }
  const userId = created.data.user.id;

  try {
    const roleInsert = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "teacher" });
    if (roleInsert.error) throw new Error(roleInsert.error.message);

    const insert = await supabaseAdmin
      .from("teachers")
      .insert({
        user_id: userId,
        school_id: school.id,
        full_name: input.fullName.trim(),
        username,
        email: contactEmail,
        phone: input.phone?.trim() || null,
        employee_id: input.employeeId?.trim() || null,
        subject: input.subject?.trim() || null,
        department: input.department?.trim() || null,
        qualification: input.qualification?.trim() || null,
        gender: input.gender?.trim() || null,
        date_of_birth: input.dateOfBirth?.trim() || null,
        address: input.address?.trim() || null,
        status: input.status,
        created_by: actorUserId,
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);
    return toRecord(insert.data);
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw error;
  }
}

export async function listTeachersForSchoolActor(
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("teachers")
    .select("*")
    .eq("school_id", school.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return {
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.school_code,
    teachers: (data ?? []).map(toRecord),
  };
}