import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SchoolOnboardingInput } from "./schools.schema";

type AuthedClient = SupabaseClient<Database>;

export type SchoolDashboardRecord = {
  id: string;
  schoolCode: string;
  schoolName: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  principalName: string;
  designation: string;
  region: string;
  status: string;
  createdAt: string;
};

type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];

async function getRoleFlags(supabase: AuthedClient, userId: string) {
  const [admin, manager, school] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "portal_manager" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "school" }),
  ]);

  return {
    isAdmin: Boolean(admin.data),
    isManager: Boolean(manager.data),
    isSchool: Boolean(school.data),
  };
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function toRecord(row: SchoolRow, audience: "admin" | "manager" | "school"): SchoolDashboardRecord {
  return {
    id: row.id,
    schoolCode: row.school_code,
    schoolName: row.name,
    username: row.username,
    email: audience === "manager" ? maskEmail(row.email) : row.email,
    phone: audience === "manager" ? maskPhone(row.phone ?? "") : row.phone ?? "",
    address: row.address ?? row.area ?? "",
    principalName: row.principal_name ?? "",
    designation: row.designation ?? "",
    region: [row.city, row.state].filter(Boolean).join(" / ") || row.area || "",
    status: row.status,
    createdAt: row.created_at,
  };
}

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

export async function createSchoolForActor(input: SchoolOnboardingInput, actorSupabase: AuthedClient, actorUserId: string) {
  const flags = await getRoleFlags(actorSupabase, actorUserId);
  if (!flags.isAdmin && !flags.isManager) {
    throw new Error("Only admins and portal managers can onboard schools.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const username = normalizeUsername(input.username);
  const schoolCode = normalizeCode(input.schoolCode);
  const loginEmail = `${username}@avartan.app`;
  const contactEmail = input.email.trim().toLowerCase();

  const [codeCheck, usernameCheck, profileCheck, emailCheck] = await Promise.all([
    supabaseAdmin.from("schools").select("id").ilike("school_code", schoolCode).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("profiles").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("email", contactEmail).maybeSingle(),
  ]);

  if (codeCheck.data) throw new Error("School code already exists.");
  if (usernameCheck.data || profileCheck.data) throw new Error("Username already exists.");
  if (emailCheck.data) throw new Error("Email address is already attached to another school.");

  const created = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: input.schoolName.trim(),
      school_code: schoolCode,
      contact_email: contactEmail,
    },
  });

  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Could not create school login.");
  }

  const userId = created.data.user.id;

  try {
    const roleInsert = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "school" });
    if (roleInsert.error) throw new Error(roleInsert.error.message);

    const schoolInsert = await supabaseAdmin
      .from("schools")
      .insert({
        user_id: userId,
        school_code: schoolCode,
        name: input.schoolName.trim(),
        username,
        email: contactEmail,
        phone: input.phone.trim(),
        address: input.address?.trim() || null,
        area: input.region?.trim() || null,
        principal_name: input.principalName?.trim() || null,
        designation: input.designation?.trim() || "Principal",
        notes: input.notes?.trim() || null,
        status: "active",
      })
      .select("*")
      .single();

    if (schoolInsert.error) throw new Error(schoolInsert.error.message);
    return toRecord(schoolInsert.data, flags.isAdmin ? "admin" : "manager");
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw error;
  }
}

export async function listSchoolsForActor(actorSupabase: AuthedClient, actorUserId: string) {
  const flags = await getRoleFlags(actorSupabase, actorUserId);

  if (flags.isAdmin || flags.isManager) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    const audience = flags.isAdmin ? "admin" : "manager";
    return {
      role: audience,
      counts: { schools: data.length, teachers: 0, students: 0 },
      schools: data.map((row) => toRecord(row, audience)),
    };
  }

  if (flags.isSchool) {
    const { data, error } = await actorSupabase
      .from("schools")
      .select("*")
      .eq("user_id", actorUserId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return {
      role: "school" as const,
      counts: { schools: data.length, teachers: 0, students: 0 },
      schools: data.map((row) => toRecord(row, "school")),
    };
  }

  throw new Error("You do not have access to school records.");
}
