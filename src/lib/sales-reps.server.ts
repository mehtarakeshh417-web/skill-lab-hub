import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SalesRepCreateInput } from "./sales-reps.schema";

type AuthedClient = SupabaseClient<Database>;

export type SalesRepRecord = {
  id: string;
  userId: string;
  fullName: string;
  employeeId: string;
  username: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  reportingManagerId: string | null;
  reportingManagerName: string;
  status: string;
  schoolsCount: number;
  createdAt: string;
};

export type SalesRepTreeNode = SalesRepRecord & { children: SalesRepTreeNode[] };

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

async function getRoleFlags(_supabase: AuthedClient, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = new Set((data ?? []).map((r) => r.role as string));
  return {
    isAdmin: roles.has("admin"),
    isManager: roles.has("portal_manager"),
    isSalesRep: roles.has("sales_rep"),
  };
}

type SalesRepRow = {
  id: string;
  user_id: string;
  full_name: string;
  employee_id: string | null;
  username: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string;
  reporting_manager_id: string | null;
  status: string;
  created_at: string;
};

function toRecord(
  row: SalesRepRow,
  managerName: string,
  schoolsCount: number,
  audience: "admin" | "manager" | "self" | "other",
): SalesRepRecord {
  const mask = audience === "manager" || audience === "other";
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    employeeId: row.employee_id ?? "",
    username: row.username,
    email: mask ? maskEmail(row.email) : row.email,
    phone: mask ? maskPhone(row.phone ?? "") : row.phone ?? "",
    designation: row.designation ?? "",
    department: row.department,
    reportingManagerId: row.reporting_manager_id,
    reportingManagerName: managerName,
    status: row.status,
    schoolsCount,
    createdAt: row.created_at,
  };
}

export async function createSalesRepForActor(
  input: SalesRepCreateInput,
  actorSupabase: AuthedClient,
  actorUserId: string,
) {
  const flags = await getRoleFlags(actorSupabase, actorUserId);
  if (!flags.isAdmin && !flags.isManager) {
    throw new Error("Only admins and portal managers can create sales representatives.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const username = input.username.trim().toLowerCase();
  const loginEmail = `${username}@avartan.app`;
  const contactEmail = input.email.trim().toLowerCase();

  const [uCheck, pCheck, sCheck] = await Promise.all([
    supabaseAdmin.from("sales_reps").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("profiles").select("id").ilike("username", username).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("username", username).maybeSingle(),
  ]);
  if (uCheck.data || pCheck.data || sCheck.data) {
    throw new Error("Username already exists.");
  }

  if (input.reportingManagerId) {
    const mgr = await supabaseAdmin
      .from("sales_reps")
      .select("id")
      .eq("id", input.reportingManagerId)
      .maybeSingle();
    if (!mgr.data) throw new Error("Selected reporting manager does not exist.");
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: input.fullName.trim(),
    },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Could not create sales rep login.");
  }
  const userId = created.data.user.id;

  try {
    const roleInsert = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "sales_rep" });
    if (roleInsert.error) throw new Error(roleInsert.error.message);

    const insert = await supabaseAdmin
      .from("sales_reps")
      .insert({
        user_id: userId,
        full_name: input.fullName.trim(),
        employee_id: input.employeeId?.trim() || null,
        username,
        email: contactEmail,
        phone: input.phone.trim(),
        designation: input.designation.trim(),
        department: input.department?.trim() || "Sales",
        reporting_manager_id: input.reportingManagerId ?? null,
        status: input.status,
        created_by: actorUserId,
      })
      .select("*")
      .single();

    if (insert.error) throw new Error(insert.error.message);
    const { writeAudit } = await import("./security.server");
    await writeAudit({
      actorUserId,
      actorRole: flags.isAdmin ? "admin" : "portal_manager",
      action: "sales.rep.create",
      module: "Sales Network",
      entityType: "sales_rep",
      entityId: userId,
      entityLabel: input.fullName.trim(),
      targetUserId: userId,
      targetRole: "sales_rep",
      newValue: {
        username,
        designation: input.designation.trim(),
        employeeId: input.employeeId?.trim() || null,
        reportingManagerId: input.reportingManagerId ?? null,
        status: input.status,
      },
      remarks: input.reportingManagerId
        ? "Sales representative created and placed in the reporting hierarchy"
        : "Sales representative created reporting to Admin",
    });
    return toRecord(insert.data as SalesRepRow, "Admin", 0, flags.isAdmin ? "admin" : "manager");
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    const { writeAudit } = await import("./security.server");
    await writeAudit({
      actorUserId,
      actorRole: flags.isAdmin ? "admin" : "portal_manager",
      action: "sales.rep.create",
      module: "Sales Network",
      entityType: "sales_rep",
      entityLabel: input.fullName.trim(),
      status: "failure",
      remarks: error instanceof Error ? error.message : "Sales representative creation failed",
    });
    throw error;
  }
}

export async function listSalesRepsForActor(actorSupabase: AuthedClient, actorUserId: string) {
  const flags = await getRoleFlags(actorSupabase, actorUserId);
  if (!flags.isAdmin && !flags.isManager && !flags.isSalesRep) {
    throw new Error("Not authorized.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: reps, error } = await supabaseAdmin
    .from("sales_reps")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: schoolCounts } = await supabaseAdmin
    .from("schools")
    .select("sales_rep_id");
  const counts = new Map<string, number>();
  (schoolCounts ?? []).forEach((s) => {
    if (s.sales_rep_id) counts.set(s.sales_rep_id, (counts.get(s.sales_rep_id) ?? 0) + 1);
  });

  const byId = new Map((reps ?? []).map((r) => [r.id, r]));
  const audience: "admin" | "manager" | "self" | "other" = flags.isAdmin
    ? "admin"
    : flags.isManager
    ? "manager"
    : "self";

  const records: SalesRepRecord[] = (reps ?? []).map((row) => {
    const mgr = row.reporting_manager_id ? byId.get(row.reporting_manager_id) : null;
    const managerName = mgr ? mgr.full_name : "Admin";
    let aud: "admin" | "manager" | "self" | "other" = audience;
    if (flags.isSalesRep && !flags.isAdmin && !flags.isManager) {
      aud = row.user_id === actorUserId ? "self" : "other";
    }
    return toRecord(row as SalesRepRow, managerName, counts.get(row.id) ?? 0, aud);
  });

  const active = records.filter((r) => r.status === "active");
  return {
    role: flags.isAdmin ? "admin" : flags.isManager ? "portal_manager" : "sales_rep",
    reps: records,
    counts: {
      total: records.length,
      active: active.length,
      inactive: records.length - active.length,
    },
  };
}

export async function listActiveSalesRepsBrief(actorSupabase: AuthedClient, actorUserId: string) {
  const flags = await getRoleFlags(actorSupabase, actorUserId);
  if (!flags.isAdmin && !flags.isManager) throw new Error("Not authorized.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("sales_reps")
    .select("id, full_name, username, designation, status")
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    username: r.username,
    designation: r.designation ?? "",
    status: r.status,
  }));
}

export async function getSalesRepDashboardData(actorSupabase: AuthedClient, actorUserId: string) {
  const rep = await actorSupabase
    .from("sales_reps")
    .select("*")
    .eq("user_id", actorUserId)
    .maybeSingle();
  if (rep.error) throw new Error(rep.error.message);
  if (!rep.data) throw new Error("Sales rep profile not found.");

  const schools = await actorSupabase
    .from("schools")
    .select("*")
    .eq("sales_rep_id", rep.data.id)
    .order("created_at", { ascending: false });
  if (schools.error) throw new Error(schools.error.message);

  const rows = schools.data ?? [];
  const active = rows.filter((s) => s.status === "active");
  const now = Date.now();
  const thisMonth = rows.filter((s) => {
    const t = new Date(s.created_at).getTime();
    return now - t < 1000 * 60 * 60 * 24 * 30;
  });

  return {
    profile: {
      id: rep.data.id,
      fullName: rep.data.full_name,
      username: rep.data.username,
      email: rep.data.email,
      phone: rep.data.phone ?? "",
      designation: rep.data.designation ?? "",
      employeeId: rep.data.employee_id ?? "",
    },
    counts: {
      total: rows.length,
      active: active.length,
      inactive: rows.length - active.length,
      thisMonth: thisMonth.length,
    },
    schools: rows.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city ?? "",
      state: s.state ?? "",
      status: s.status,
      createdAt: s.created_at,
    })),
  };
}