import type { Database } from "@/integrations/supabase/types";

export type AuditRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export type AuditFilters = {
  dateFrom?: string | null;
  dateTo?: string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  actorRole?: string | null;
  targetRole?: string | null;
  actorSearch?: string | null;
  targetSearch?: string | null;
  entityType?: string | null;
  module?: string | null;
  action?: string | null;
  status?: string | null;
  search?: string | null;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

/** Action key -> human label + coarse action category. */
export const ACTION_CATALOG: Record<string, { label: string; type: string }> = {
  "auth.login": { label: "Signed in", type: "Login" },
  "auth.login.failed": { label: "Failed sign-in attempt", type: "Login failed" },
  "auth.logout": { label: "Signed out", type: "Logout" },
  "security.setup.complete": { label: "Security PIN & question set up", type: "Security setup" },
  "security.pin.change": { label: "Security PIN changed", type: "Security change" },
  "security.question.change": { label: "Security question changed", type: "Security change" },
  "security.password.change": { label: "Password changed by user", type: "Password change" },
  "security.password.recover": { label: "Password recovered", type: "Password reset" },
  "security.password.recover.failed": { label: "Password recovery failed", type: "Password reset" },
  "admin.password.reset": { label: "Password reset by administrator", type: "Password reset" },
  "admin.username.change": { label: "Username changed", type: "Update" },
  "admin.user.profile.update": { label: "Profile details updated", type: "Update" },
  "admin.user.activate": { label: "Account unblocked", type: "Unblock" },
  "admin.user.deactivate": { label: "Account blocked", type: "Block" },
  "admin.user.delete": { label: "Account deleted", type: "Delete" },
  "admin.security.reset": { label: "Security setup reset", type: "Security change" },
  "admin.user.bulk": { label: "Bulk account operation", type: "Bulk operation" },
  "school.onboard": { label: "School onboarded", type: "Create" },
  "school.delete": { label: "School deleted", type: "Delete" },
  "registration.submit": { label: "School registration submitted", type: "Create" },
  "registration.approve": { label: "School registration approved", type: "Approval" },
  "registration.reject": { label: "School registration rejected", type: "Rejection" },
  "teacher.create": { label: "Teacher created", type: "Create" },
  "teacher.delete": { label: "Teacher deleted", type: "Delete" },
  "student.create": { label: "Student created", type: "Create" },
  "student.delete": { label: "Student deleted", type: "Delete" },
  "student.bulk_upload": { label: "Bulk student upload", type: "Bulk operation" },
  "sales.rep.create": { label: "Sales representative created", type: "Create" },
  "sales.rep.delete": { label: "Sales representative deleted", type: "Delete" },
  "sales.hierarchy.change": { label: "Reporting hierarchy changed", type: "Update" },
  "directory.person.delete": { label: "Directory record deleted", type: "Delete" },
};

export function describeAction(action: string): { label: string; type: string } {
  const hit = ACTION_CATALOG[action];
  if (hit) return hit;
  const tail = action.split(".").pop() ?? action;
  const type =
    /delete|remove/.test(tail) ? "Delete"
    : /create|add|onboard|submit/.test(tail) ? "Create"
    : /approve/.test(tail) ? "Approval"
    : /reject/.test(tail) ? "Rejection"
    : /login/.test(action) ? "Login"
    : /logout/.test(action) ? "Logout"
    : /password/.test(action) ? "Password change"
    : /block|deactivate/.test(tail) ? "Block"
    : /activate|unblock/.test(tail) ? "Unblock"
    : "Update";
  const label = action.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  return { label, type };
}

export const ACTION_TYPES = Array.from(
  new Set(Object.values(ACTION_CATALOG).map((a) => a.type)),
).sort();

export async function assertAuditViewer(userId: string) {
  const { getActorRoles } = await import("./security.server");
  const roles = await getActorRoles(userId);
  if (!roles.isAdmin && !roles.isManager) {
    throw new Error("You do not have permission to view the audit trail.");
  }
  return roles;
}

function combine(date: string, time: string | null | undefined, endOfDay: boolean) {
  const t = time && /^\d{2}:\d{2}$/.test(time) ? `${time}:${endOfDay ? "59.999" : "00.000"}` : endOfDay ? "23:59:59.999" : "00:00:00.000";
  return new Date(`${date}T${t}`).toISOString();
}

export async function queryAuditTrail(filters: AuditFilters) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const page = Math.max(1, filters.page ?? 1);
  const size = Math.min(200, Math.max(10, filters.pageSize ?? 25));
  const rangeFrom = (page - 1) * size;

  let q = supabaseAdmin.from("audit_logs").select("*", { count: "exact" });

  if (filters.dateFrom) q = q.gte("created_at", combine(filters.dateFrom, filters.timeFrom, false));
  if (filters.dateTo) q = q.lte("created_at", combine(filters.dateTo, filters.timeTo, true));
  if (filters.actorRole && filters.actorRole !== "all") q = q.eq("actor_role", filters.actorRole);
  if (filters.targetRole && filters.targetRole !== "all") q = q.eq("target_role", filters.targetRole);
  if (filters.entityType && filters.entityType !== "all") q = q.eq("entity_type", filters.entityType);
  if (filters.module && filters.module !== "all") q = q.eq("module", filters.module);
  if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters.actorSearch?.trim()) q = q.ilike("actor_username", `%${filters.actorSearch.trim()}%`);
  if (filters.targetSearch?.trim()) q = q.ilike("entity_label", `%${filters.targetSearch.trim()}%`);

  if (filters.action && filters.action !== "all") {
    const keys = Object.entries(ACTION_CATALOG)
      .filter(([, v]) => v.type === filters.action)
      .map(([k]) => k);
    if (keys.length) q = q.in("action", keys);
    else q = q.eq("action", filters.action);
  }

  if (filters.search?.trim()) {
    const s = `%${filters.search.trim()}%`;
    q = q.or(
      [
        `actor_username.ilike.${s}`,
        `entity_label.ilike.${s}`,
        `remarks.ilike.${s}`,
        `action.ilike.${s}`,
        `module.ilike.${s}`,
        `entity_type.ilike.${s}`,
        `ip_address.ilike.${s}`,
      ].join(","),
    );
  }

  q = q.order("created_at", { ascending: filters.sort === "oldest" }).range(rangeFrom, rangeFrom + size - 1);

  const { data, count, error } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((r) => {
    const row = r as AuditRow & { audit_ref?: number | null; module?: string | null; target_role?: string | null };
    const meta = describeAction(row.action);
    return {
      id: row.id,
      auditRef: row.audit_ref ?? null,
      createdAt: row.created_at,
      actorUsername: row.actor_username,
      actorRole: row.actor_role,
      action: row.action,
      actionLabel: meta.label,
      actionType: meta.type,
      module: row.module ?? "Portal",
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityLabel: row.entity_label,
      targetRole: row.target_role ?? null,
      previousValue: row.previous_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      status: row.status,
      remarks: row.remarks,
    };
  });

  return { rows, count: count ?? 0, page, pageSize: size };
}

export async function auditFacets() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("audit_logs")
    .select("module, entity_type, actor_role, target_role")
    .limit(5000);
  const uniq = (vals: Array<string | null | undefined>) =>
    Array.from(new Set(vals.filter((v): v is string => Boolean(v)))).sort();
  const rows = (data ?? []) as Array<{ module: string | null; entity_type: string | null; actor_role: string | null; target_role: string | null }>;
  return {
    modules: uniq(rows.map((r) => r.module)),
    entityTypes: uniq(rows.map((r) => r.entity_type)),
    actorRoles: uniq(rows.map((r) => r.actor_role)),
    targetRoles: uniq(rows.map((r) => r.target_role)),
    actionTypes: ACTION_TYPES,
  };
}
