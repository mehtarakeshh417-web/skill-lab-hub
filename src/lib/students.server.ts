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

export async function createStudentForSchool(
  input: StudentCreateInput,
  _actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const school = await getSchoolForActor(actorUserId);
  const username = input.username.trim().toLowerCase();
  if (await usernameTaken(username)) throw new Error("Username already exists.");
  const rec = await provisionStudent(input, school.id, actorUserId);
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
    newValue: { username, fullName: rec.fullName, schoolId: school.id },
    remarks: "Student account created",
  });
  return rec;
}

export type BulkResult = {
  createdCount: number;
  created: StudentRecord[];
  errors: Array<{ row: number; field?: string; message: string }>;
};

export async function bulkCreateStudentsForSchool(
  inputs: StudentCreateInput[],
  _actorSupabase: AuthedClient,
  actorUserId: string,
): Promise<BulkResult> {
  const school = await getSchoolForActor(actorUserId);

  // Pre-validate: duplicate usernames within the file
  const errors: Array<{ row: number; field?: string; message: string }> = [];
  const seen = new Map<string, number>();
  inputs.forEach((s, i) => {
    const uname = s.username.trim().toLowerCase();
    if (seen.has(uname)) {
      errors.push({
        row: i + 2,
        field: "username",
        message: `Duplicate username "${uname}" also on row ${seen.get(uname)}`,
      });
    } else {
      seen.set(uname, i + 2);
    }
  });

  // Pre-validate: username already taken in DB
  const uniqueNames = Array.from(seen.keys());
  const taken = await Promise.all(uniqueNames.map((u) => usernameTaken(u).then((t) => ({ u, t }))));
  const takenSet = new Set(taken.filter((t) => t.t).map((t) => t.u));
  inputs.forEach((s, i) => {
    const uname = s.username.trim().toLowerCase();
    if (takenSet.has(uname)) {
      errors.push({ row: i + 2, field: "username", message: `Username "${uname}" is already taken` });
    }
  });

  const { writeAudit } = await import("./security.server");

  if (errors.length) {
    await writeAudit({
      actorUserId,
      action: "student.bulk_upload",
      module: "Students",
      entityType: "student_batch",
      entityLabel: `${inputs.length} rows`,
      status: "failure",
      newValue: { attempted: inputs.length, errors: errors.slice(0, 20) },
      remarks: "Bulk student upload rejected during validation",
    });
    return { createdCount: 0, created: [], errors };
  }

  const created: StudentRecord[] = [];
  for (let i = 0; i < inputs.length; i++) {
    try {
      const rec = await provisionStudent(inputs[i], school.id, actorUserId);
      created.push(rec);
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