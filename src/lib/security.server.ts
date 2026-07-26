import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthedClient = SupabaseClient<Database>;

export const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your favourite book?",
  "What was your childhood nickname?",
  "What is the name of your best childhood friend?",
  "What was the make of your first vehicle?",
];

/* ============== Hashing (scrypt) ============== */

export function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(secret.normalize("NFKC"), salt, 64);
  return `s1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifySecret(secret: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "s1") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(secret.normalize("NFKC"), salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ============== Actor helpers ============== */

export type ActorRoles = { isAdmin: boolean; isManager: boolean };

export async function getActorRoles(userId: string): Promise<ActorRoles> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = new Set((data ?? []).map((r) => r.role as string));
  return { isAdmin: roles.has("admin"), isManager: roles.has("portal_manager") };
}

/* ============== Audit ============== */

export type AuditEntry = {
  actorUserId?: string | null;
  actorUsername?: string | null;
  actorRole?: string | null;
  action: string;
  module?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  targetUserId?: string | null;
  targetRole?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: "success" | "failure";
  remarks?: string | null;
};

/** Best-effort capture of client IP + browser from the active request. */
export function requestClientInfo(): { ipAddress: string | null; userAgent: string | null } {
  try {
    // Imported lazily so this module stays usable outside a request scope.
    const {
      getRequestHeader,
    } = require("@tanstack/react-start/server") as typeof import("@tanstack/react-start/server");
    const fwd = getRequestHeader("x-forwarded-for") ?? "";
    const ip =
      fwd.split(",")[0]?.trim() ||
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-real-ip") ||
      null;
    return { ipAddress: ip || null, userAgent: getRequestHeader("user-agent") ?? null };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/** Infer the portal module from the action key when one is not supplied. */
function inferModule(action: string): string {
  const head = action.split(".")[0];
  const map: Record<string, string> = {
    admin: "User Management",
    security: "Security",
    auth: "Authentication",
    school: "Schools",
    schools: "Schools",
    registration: "School Registrations",
    teacher: "Teachers",
    student: "Students",
    sales: "Sales Network",
    assignment: "Projects & Assignments",
    quiz: "Quizzes",
    directory: "Directory",
  };
  return map[head] ?? "Portal";
}

export async function writeAudit(entry: AuditEntry) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const client = requestClientInfo();
    let actorUsername = entry.actorUsername ?? null;
    let actorRole = entry.actorRole ?? null;
    if (entry.actorUserId && (!actorUsername || !actorRole)) {
      const { data: sec } = await supabaseAdmin
        .from("user_security")
        .select("username")
        .eq("user_id", entry.actorUserId)
        .maybeSingle();
      actorUsername = actorUsername ?? sec?.username ?? null;
      if (!actorRole) {
        const { data: r } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", entry.actorUserId)
          .maybeSingle();
        actorRole = (r?.role as string) ?? null;
      }
    }
    let targetRole = entry.targetRole ?? null;
    const targetUserId = entry.targetUserId ?? (entry.entityType === "user" ? entry.entityId : null);
    if (!targetRole && targetUserId) {
      const { data: r } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .maybeSingle();
      targetRole = (r?.role as string) ?? null;
    }
    await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: entry.actorUserId ?? null,
      actor_username: actorUsername,
      actor_role: actorRole,
      action: entry.action,
      module: entry.module ?? inferModule(entry.action),
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      entity_label: entry.entityLabel ?? null,
      target_user_id: targetUserId && /^[0-9a-f-]{36}$/i.test(targetUserId) ? targetUserId : null,
      target_role: targetRole,
      previous_value: entry.previousValue ? (entry.previousValue as never) : null,
      new_value: entry.newValue ? (entry.newValue as never) : null,
      ip_address: entry.ipAddress ?? client.ipAddress,
      user_agent: entry.userAgent ?? client.userAgent,
      status: entry.status ?? "success",
      remarks: entry.remarks ?? null,
    });
  } catch (e) {
    console.error("audit write failed", e);
  }
}

/* ============== User lookup ============== */

/** Resolve a raw identifier (username or email) to the auth user id + email. */
export async function resolveIdentifier(identifier: string): Promise<{ userId: string; email: string; username: string } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const raw = identifier.trim();
  if (!raw) return null;
  const asEmail = raw.includes("@") ? raw.toLowerCase() : `${raw.toLowerCase()}@avartan.app`;

  // Look in user_security first (username index)
  const uname = raw.toLowerCase();
  const { data: sec } = await supabaseAdmin
    .from("user_security")
    .select("user_id, username")
    .ilike("username", uname)
    .maybeSingle();
  if (sec?.user_id) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(sec.user_id);
    if (u.user) return { userId: u.user.id, email: u.user.email ?? asEmail, username: sec.username ?? uname };
  }

  // Fallback: page auth users and match email
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const hit = list?.users?.find((u) => (u.email ?? "").toLowerCase() === asEmail);
  if (hit) return { userId: hit.id, email: hit.email ?? asEmail, username: (hit.user_metadata?.username as string) ?? uname };
  return null;
}

/* ============== Ensure a security row exists for a new user ============== */

export async function ensureSecurityRow(userId: string, username: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("user_security")
    .upsert(
      { user_id: userId, username: username.toLowerCase(), must_setup_security: true, is_active: true },
      { onConflict: "user_id" },
    );
}