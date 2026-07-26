import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthedClient = SupabaseClient<Database>;

export type DirectoryAudience = "admin" | "manager";

export type DirectoryFilters = {
  search?: string;
  state?: string;
  city?: string;
  region?: string;
  schoolId?: string;
  status?: string;
};

export type SchoolRow = {
  id: string;
  userId: string | null;
  schoolCode: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  principalName: string;
  designation: string;
  address: string;
  area: string;
  city: string;
  state: string;
  salesRepId: string | null;
  salesRepName: string;
  status: string;
  createdAt: string;
  teacherCount: number;
  studentCount: number;
};

export type PersonRow = {
  id: string;
  userId: string;
  schoolId: string | null;
  schoolName: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  meta1: string;
  meta2: string;
  city: string;
  state: string;
  status: string;
  createdAt: string;
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "••••••";
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"•".repeat(Math.max(4, name.length - visible.length))}@${domain}`;
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone ? "••••" : "";
  return `${digits.slice(0, 2)}${"•".repeat(Math.max(4, digits.length - 4))}${digits.slice(-2)}`;
}

function contact(value: string, audience: DirectoryAudience, kind: "email" | "phone") {
  if (audience === "admin") return value;
  return kind === "email" ? maskEmail(value) : maskPhone(value);
}

export async function resolveAudience(_supabase: AuthedClient, userId: string): Promise<DirectoryAudience> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = new Set((data ?? []).map((r) => r.role as string));
  if (roles.has("admin")) return "admin";
  if (roles.has("portal_manager")) return "manager";
  throw new Error("Forbidden");
}

function matches(haystack: Array<string | null | undefined>, needle: string) {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => (h ?? "").toLowerCase().includes(q));
}

export async function loadDirectory(
  supabase: AuthedClient,
  userId: string,
  filters: DirectoryFilters,
) {
  const audience = await resolveAudience(supabase, userId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [schoolsRes, teachersRes, studentsRes, repsRes, secRes, regsRes] = await Promise.all([
    supabaseAdmin.from("schools").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("teachers").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("students").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("sales_reps").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("user_security").select("user_id, is_active, must_setup_security"),
    supabaseAdmin.from("school_registrations").select("id, status"),
  ]);

  const err = schoolsRes.error || teachersRes.error || studentsRes.error || repsRes.error;
  if (err) throw new Error(err.message);

  const schoolRows = schoolsRes.data ?? [];
  const teacherRows = teachersRes.data ?? [];
  const studentRows = studentsRes.data ?? [];
  const repRows = repsRes.data ?? [];
  const secRows = secRes.data ?? [];
  const regRows = regsRes.data ?? [];

  const repName = new Map(repRows.map((r) => [r.id, r.full_name]));
  const schoolById = new Map(schoolRows.map((s) => [s.id, s]));

  const teacherCount = new Map<string, number>();
  teacherRows.forEach((t) => teacherCount.set(t.school_id, (teacherCount.get(t.school_id) ?? 0) + 1));
  const studentCount = new Map<string, number>();
  studentRows.forEach((s) => studentCount.set(s.school_id, (studentCount.get(s.school_id) ?? 0) + 1));

  const search = filters.search ?? "";
  const state = filters.state && filters.state !== "all" ? filters.state : "";
  const city = filters.city && filters.city !== "all" ? filters.city : "";
  const region = filters.region && filters.region !== "all" ? filters.region : "";
  const schoolId = filters.schoolId && filters.schoolId !== "all" ? filters.schoolId : "";
  const status = filters.status && filters.status !== "all" ? filters.status : "";

  const schools: SchoolRow[] = schoolRows
    .filter((row) => (!state || row.state === state))
    .filter((row) => (!city || row.city === city))
    .filter((row) => (!region || (row.area ?? "") === region))
    .filter((row) => (!schoolId || row.id === schoolId))
    .filter((row) => (!status || row.status === status))
    .filter((row) => matches([row.name, row.school_code, row.username, row.email, row.phone, row.city, row.state, row.area, row.principal_name], search))
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      schoolCode: row.school_code,
      name: row.name,
      username: row.username,
      email: contact(row.email ?? "", audience, "email"),
      phone: contact(row.phone ?? "", audience, "phone"),
      principalName: row.principal_name ?? "",
      designation: row.designation ?? "",
      address: row.address ?? "",
      area: row.area ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      salesRepId: row.sales_rep_id ?? null,
      salesRepName: (row.sales_rep_id && repName.get(row.sales_rep_id)) || "—",
      status: row.status,
      createdAt: row.created_at,
      teacherCount: teacherCount.get(row.id) ?? 0,
      studentCount: studentCount.get(row.id) ?? 0,
    }));

  const inScope = (sid: string) => {
    const s = schoolById.get(sid);
    if (!s) return false;
    if (schoolId && sid !== schoolId) return false;
    if (state && s.state !== state) return false;
    if (city && s.city !== city) return false;
    if (region && (s.area ?? "") !== region) return false;
    return true;
  };

  const teachers: PersonRow[] = teacherRows
    .filter((row) => inScope(row.school_id))
    .filter((row) => (!status || row.status === status))
    .filter((row) => matches([row.full_name, row.username, row.email, row.phone, row.subject, row.department, row.employee_id, schoolById.get(row.school_id)?.name], search))
    .map((row) => {
      const s = schoolById.get(row.school_id);
      return {
        id: row.id,
        userId: row.user_id,
        schoolId: row.school_id,
        schoolName: s?.name ?? "—",
        fullName: row.full_name,
        username: row.username,
        email: contact(row.email ?? "", audience, "email"),
        phone: contact(row.phone ?? "", audience, "phone"),
        meta1: row.subject ?? "",
        meta2: row.department ?? "",
        city: s?.city ?? "",
        state: s?.state ?? "",
        status: row.status,
        createdAt: row.created_at,
      };
    });

  const students: PersonRow[] = studentRows
    .filter((row) => inScope(row.school_id))
    .filter((row) => (!status || row.status === status))
    .filter((row) => matches([row.full_name, row.username, row.email, row.phone, row.class_name, row.section, row.roll_number, schoolById.get(row.school_id)?.name], search))
    .map((row) => {
      const s = schoolById.get(row.school_id);
      return {
        id: row.id,
        userId: row.user_id,
        schoolId: row.school_id,
        schoolName: s?.name ?? "—",
        fullName: row.full_name,
        username: row.username,
        email: contact(row.email ?? "", audience, "email"),
        phone: contact(row.phone ?? "", audience, "phone"),
        meta1: row.class_name ?? "",
        meta2: row.section ?? "",
        city: s?.city ?? "",
        state: s?.state ?? "",
        status: row.status,
        createdAt: row.created_at,
      };
    });

  const salesReps: PersonRow[] = repRows
    .filter((row) => (!status || row.status === status))
    .filter((row) => matches([row.full_name, row.username, row.email, row.phone, row.designation, row.department, row.employee_id], search))
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      schoolId: null,
      schoolName: "—",
      fullName: row.full_name,
      username: row.username,
      email: contact(row.email ?? "", audience, "email"),
      phone: contact(row.phone ?? "", audience, "phone"),
      meta1: row.designation ?? "",
      meta2: row.department ?? "",
      city: "",
      state: "",
      status: row.status,
      createdAt: row.created_at,
    }));

  const inactiveAccounts = secRows.filter((s) => s.is_active === false).length;
  const pendingSecurity = secRows.filter((s) => s.must_setup_security).length;
  const schoolsWithoutStudents = schoolRows.filter((s) => (studentCount.get(s.id) ?? 0) === 0).length;

  return {
    audience,
    schools,
    teachers,
    students,
    salesReps,
    facets: {
      states: Array.from(new Set(schoolRows.map((s) => s.state).filter(Boolean) as string[])).sort(),
      cities: Array.from(new Set(schoolRows.filter((s) => !state || s.state === state).map((s) => s.city).filter(Boolean) as string[])).sort(),
      regions: Array.from(new Set(schoolRows.map((s) => s.area).filter(Boolean) as string[])).sort(),
      schools: schoolRows.map((s) => ({ id: s.id, name: s.name })).sort((a, b) => a.name.localeCompare(b.name)),
    },
    totals: {
      schools: schoolRows.length,
      teachers: teacherRows.length,
      students: studentRows.length,
      salesReps: repRows.length,
      pendingRegistrations: regRows.filter((r) => r.status === "pending").length,
      rejectedRegistrations: regRows.filter((r) => r.status === "rejected").length,
      inactiveAccounts,
      pendingSecurity,
      schoolsWithoutStudents,
    },
  };
}

export async function deleteSchoolCascade(supabase: AuthedClient, actorUserId: string, schoolId: string) {
  const audience = await resolveAudience(supabase, actorUserId);
  if (audience !== "admin") throw new Error("Only admins can delete schools.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { writeAudit } = await import("./security.server");

  const { data: school, error } = await supabaseAdmin.from("schools").select("*").eq("id", schoolId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!school) throw new Error("School not found.");

  const [{ data: teachers }, { data: students }] = await Promise.all([
    supabaseAdmin.from("teachers").select("id, user_id").eq("school_id", schoolId),
    supabaseAdmin.from("students").select("id, user_id").eq("school_id", schoolId),
  ]);

  const childUserIds = [...(teachers ?? []).map((t) => t.user_id), ...(students ?? []).map((s) => s.user_id)];

  await supabaseAdmin.from("students").delete().eq("school_id", schoolId);
  await supabaseAdmin.from("teachers").delete().eq("school_id", schoolId);
  await supabaseAdmin.from("schools").delete().eq("id", schoolId);

  for (const uid of childUserIds) {
    if (!uid) continue;
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_security").delete().eq("user_id", uid);
    await supabaseAdmin.auth.admin.deleteUser(uid).catch(() => undefined);
  }

  if (school.user_id) {
    await supabaseAdmin.from("user_roles").delete().eq("user_id", school.user_id);
    await supabaseAdmin.from("user_security").delete().eq("user_id", school.user_id);
    await supabaseAdmin.auth.admin.deleteUser(school.user_id).catch(() => undefined);
  }

  await writeAudit({
    actorUserId,
    actorRole: "admin",
    action: "admin.school.delete",
    entityType: "school",
    entityId: schoolId,
    entityLabel: school.name,
    newValue: { teachersDeleted: teachers?.length ?? 0, studentsDeleted: students?.length ?? 0 },
  });

  return { ok: true, teachersDeleted: teachers?.length ?? 0, studentsDeleted: students?.length ?? 0 };
}

export async function deletePersonRecord(
  supabase: AuthedClient,
  actorUserId: string,
  kind: "teacher" | "student" | "sales_rep",
  id: string,
) {
  const audience = await resolveAudience(supabase, actorUserId);
  if (audience !== "admin") throw new Error("Only admins can delete accounts here.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { writeAudit } = await import("./security.server");

  const table = kind === "teacher" ? "teachers" : kind === "student" ? "students" : "sales_reps";
  const { data: row, error } = await supabaseAdmin.from(table).select("id, user_id, full_name").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Record not found.");

  await supabaseAdmin.from(table).delete().eq("id", id);
  if (row.user_id) {
    await supabaseAdmin.from("user_roles").delete().eq("user_id", row.user_id);
    await supabaseAdmin.from("user_security").delete().eq("user_id", row.user_id);
    await supabaseAdmin.auth.admin.deleteUser(row.user_id).catch(() => undefined);
  }

  await writeAudit({
    actorUserId,
    actorRole: "admin",
    action: "admin.user.delete",
    entityType: kind,
    entityId: id,
    entityLabel: row.full_name,
  });

  return { ok: true };
}