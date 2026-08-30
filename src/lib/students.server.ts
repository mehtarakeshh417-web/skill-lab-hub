import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { StudentCreateInput } from "./students.schema";

type AuthedClient = SupabaseClient<Database>;

export type StudentRecord = {
  id: string;
  userId: string;
  schoolId: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  rollNumber: string;
  className: string;
  section: string;
  gender: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  status: string;
  createdAt: string;
};

function toRecord(row: Database["public"]["Tables"]["students"]["Row"]): StudentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    schoolId: row.school_id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    phone: row.phone ?? "",
    rollNumber: row.roll_number ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    gender: row.gender ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    guardianName: row.guardian_name ?? "",
    guardianPhone: row.guardian_phone ?? "",
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
  if (!data) throw new Error("Only signed-in Schools can manage students.");
  return data;
}

async function usernameTaken(username: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [a, b, c, d, e] = await Promise.all([
    supabaseAdmin.from("students").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("teachers").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("profiles").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("sales_reps").select("id").ilike("username", username).maybeSingle(),
  ]);
  return Boolean(a.data || b.data || c.data || d.data || e.data);
}

/** jane.doe3417 — readable, name-derived, unique across every portal account. */
function usernameSeed(fullName: string): string {
  const slug = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 24);
  return slug || "student";
}

async function generateUniqueUsername(fullName: string): Promise<string> {
  const seed = usernameSeed(fullName);
  for (let attempt = 0; attempt < 25; attempt++) {
    const suffix = String(1000 + Math.floor(Math.random() * 9000));
    const candidate = `${seed}${suffix}`;
    if (!(await usernameTaken(candidate))) return candidate;
  }
  throw new Error("Could not generate a unique username. Please try again.");
}

/** 10 characters, ambiguous glyphs (0/O/1/l/I) excluded so it can be read out loud. */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function provisionStudent(
  input: StudentCreateInput,
  schoolId: string,
  actorUserId: string,
): Promise<{ record: StudentRecord; password: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { encryptSecret } = await import("./registrations.server");
  const username = await generateUniqueUsername(input.fullName);
  const password = generatePassword();
  const loginEmail = `${username}@avartan.app`;
  const contactEmail = input.email.trim().toLowerCase();

  const created = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: input.fullName.trim(),
      school_id: schoolId,
    },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Could not create student login.");
  }
  const userId = created.data.user.id;

  try {
    const roleInsert = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "student" });
    if (roleInsert.error) throw new Error(roleInsert.error.message);

    const insert = await supabaseAdmin
      .from("students")
      .insert({
        user_id: userId,
        school_id: schoolId,
        full_name: input.fullName.trim(),
        username,
        email: contactEmail,
        phone: input.phone?.trim() || null,
        roll_number: input.rollNumber?.trim() || null,
        class_name: input.className?.trim() || null,
        section: input.section?.trim() || null,
        gender: input.gender?.trim() || null,
        date_of_birth: input.dateOfBirth?.trim() || null,
        guardian_name: input.guardianName?.trim() || null,
        guardian_phone: input.guardianPhone?.trim() || null,
        address: input.address?.trim() || null,
        status: input.status,
        created_by: actorUserId,
        initial_password_enc: encryptSecret(password),
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);
    return { record: toRecord(insert.data), password };
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw error;
  }
}

export type CreatedStudent = StudentRecord & { generatedPassword: string };

export async function createStudentForSchool(
  input: StudentCreateInput,
  _actorSupabase: AuthedClient,
  actorUserId: string,
): Promise<CreatedStudent> {
  const school = await getSchoolForActor(actorUserId);
  const { record: rec, password } = await provisionStudent(input, school.id, actorUserId);
  const { writeAudit } = await import("./security.server");
  await writeAudit({
    actorUserId,
    action: "student.create",
    module: "Students",
    entityType: "student",
    entityId: rec.userId,
    entityLabel: rec.fullName,
    targetUserId: rec.userId,
    targetRole: "student",
    newValue: { username: rec.username, fullName: rec.fullName, schoolId: school.id },
    remarks: "Student account created with a system-generated login",
  });
  return { ...rec, generatedPassword: password };
}

export type BulkResult = {
  createdCount: number;
  created: CreatedStudent[];
  errors: Array<{ row: number; field?: string; message: string }>;
};

export async function bulkCreateStudentsForSchool(
  inputs: StudentCreateInput[],
  _actorSupabase: AuthedClient,
  actorUserId: string,
): Promise<BulkResult> {
  const school = await getSchoolForActor(actorUserId);
  const { writeAudit } = await import("./security.server");

  const created: CreatedStudent[] = [];
  for (let i = 0; i < inputs.length; i++) {
    try {
      const { record, password } = await provisionStudent(inputs[i], school.id, actorUserId);
      created.push({ ...record, generatedPassword: password });
    } catch (e) {
      // Roll back everything created in this batch
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await Promise.all(
        created.map((c) => supabaseAdmin.auth.admin.deleteUser(c.userId).catch(() => null)),
      );
      await writeAudit({
        actorUserId,
        action: "student.bulk_upload",
        module: "Students",
        entityType: "student_batch",
        entityLabel: `${inputs.length} rows`,
        status: "failure",
        remarks: `Bulk upload rolled back at row ${i + 2}: ${e instanceof Error ? e.message : "unknown error"}`,
      });
      return {
        createdCount: 0,
        created: [],
        errors: [
          {
            row: i + 2,
            message: e instanceof Error ? e.message : "Failed to create student",
          },
        ],
      };
    }
  }
  await writeAudit({
    actorUserId,
    action: "student.bulk_upload",
    module: "Students",
    entityType: "student_batch",
    entityLabel: `${created.length} students`,
    newValue: { createdCount: created.length, usernames: created.map((c) => c.username).slice(0, 100), schoolId: school.id },
    remarks: `Bulk upload created ${created.length} student account${created.length === 1 ? "" : "s"}`,
  });
  return { createdCount: created.length, created, errors: [] };
}

export async function listStudentsForSchoolActor(
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("school_id", school.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return {
    schoolId: school.id,
    schoolName: school.name,
    students: (data ?? []).map(toRecord),
  };
}