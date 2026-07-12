import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";

/* ==============================================================
 * SECURITY / FORGOT PASSWORD / AUDIT / USER MANAGEMENT
 * ============================================================== */

export const getMySecurityStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("user_security")
      .select("must_setup_security, is_active, security_question, username")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!row) {
      // Auto-provision on first access
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const username =
        (u.user?.user_metadata?.username as string) ||
        (u.user?.email?.split("@")[0] ?? "user");
      await supabaseAdmin.from("user_security").insert({
        user_id: context.userId,
        username: username.toLowerCase(),
        must_setup_security: true,
        is_active: true,
      });
      return { mustSetupSecurity: true, isActive: true, hasQuestion: false, username };
    }
    return {
      mustSetupSecurity: row.must_setup_security,
      isActive: row.is_active,
      hasQuestion: !!row.security_question,
      username: row.username ?? "",
    };
  });

export const completeSecuritySetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { pin: string; question: string; answer: string }) => {
    if (!/^\d{4,8}$/.test(d.pin)) throw new Error("PIN must be 4–8 digits.");
    if (!d.question || d.question.length < 4) throw new Error("Choose a security question.");
    if (!d.answer || d.answer.trim().length < 2) throw new Error("Enter a security answer.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { hashSecret, writeAudit } = await import("./security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_security")
      .upsert(
        {
          user_id: context.userId,
          security_pin_hash: hashSecret(data.pin),
          security_question: data.question,
          security_answer_hash: hashSecret(data.answer.trim().toLowerCase()),
          must_setup_security: false,
        },
        { onConflict: "user_id" },
      );
    await writeAudit({
      actorUserId: context.userId,
      action: "security.setup.complete",
      entityType: "user",
      entityId: context.userId,
      ipAddress: getRequestHeader("x-forwarded-for") ?? null,
    });
    return { ok: true };
  });

/* Forgot-password: step 1 — lookup identifier */
export const startForgotPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string }) => d)
  .handler(async ({ data }) => {
    const { resolveIdentifier } = await import("./security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hit = await resolveIdentifier(data.identifier);
    if (!hit) throw new Error("No account matches that username or email.");
    const { data: sec } = await supabaseAdmin
      .from("user_security")
      .select("security_question, must_setup_security, is_active")
      .eq("user_id", hit.userId)
      .maybeSingle();
    return {
      username: hit.username,
      question: sec?.security_question ?? null,
      hasPin: !!sec && !sec.must_setup_security,
      isActive: sec?.is_active ?? true,
    };
  });

/* Forgot-password: step 2 — verify + reset */
export const resetPasswordWithSecret = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string; method: "pin" | "question"; secret: string; newPassword: string }) => {
    if (!d.newPassword || d.newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
    return d;
  })
  .handler(async ({ data }) => {
    const { resolveIdentifier, verifySecret, writeAudit } = await import("./security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hit = await resolveIdentifier(data.identifier);
    if (!hit) throw new Error("Account not found.");
    const { data: sec } = await supabaseAdmin
      .from("user_security")
      .select("security_pin_hash, security_answer_hash, is_active")
      .eq("user_id", hit.userId)
      .maybeSingle();
    if (!sec) throw new Error("This account has not completed security setup yet.");
    if (!sec.is_active) throw new Error("This account is deactivated.");

    const ok =
      data.method === "pin"
        ? verifySecret(data.secret, sec.security_pin_hash)
        : verifySecret(data.secret.trim().toLowerCase(), sec.security_answer_hash);

    if (!ok) {
      await writeAudit({
        actorUserId: hit.userId,
        actorUsername: hit.username,
        action: `password.reset.${data.method}`,
        entityType: "user",
        entityId: hit.userId,
        status: "failure",
        remarks: "Incorrect secret",
      });
      throw new Error(data.method === "pin" ? "Incorrect Security PIN." : "Incorrect answer to security question.");
    }
    const upd = await supabaseAdmin.auth.admin.updateUserById(hit.userId, { password: data.newPassword });
    if (upd.error) throw new Error(upd.error.message);
    await writeAudit({
      actorUserId: hit.userId,
      actorUsername: hit.username,
      action: `password.reset.${data.method}`,
      entityType: "user",
      entityId: hit.userId,
      status: "success",
    });
    return { ok: true };
  });

/* Change password from within the app */
export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { currentPassword: string; newPassword: string }) => {
    if (!d.newPassword || d.newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAudit } = await import("./security.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = u.user?.email;
    if (!email) throw new Error("Account email missing.");

    const { createClient } = await import("@supabase/supabase-js");
    const probe = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signErr } = await probe.auth.signInWithPassword({ email, password: data.currentPassword });
    if (signErr) {
      await writeAudit({ actorUserId: context.userId, action: "password.change", status: "failure", remarks: "Bad current password" });
      throw new Error("Current password is incorrect.");
    }
    const upd = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.newPassword });
    if (upd.error) throw new Error(upd.error.message);
    await writeAudit({ actorUserId: context.userId, action: "password.change", entityType: "user", entityId: context.userId });
    return { ok: true };
  });

/* ============ Admin / Manager: user management ============ */

export type ManagedUser = {
  userId: string;
  username: string;
  email: string;
  role: string;
  fullName: string | null;
  isActive: boolean;
  mustSetupSecurity: boolean;
  createdAt: string;
};

export const listManagedUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { roleFilter?: string; search?: string }) => d)
  .handler(async ({ data, context }) => {
    const { getActorRoles } = await import("./security.server");
    const roles = await getActorRoles(context.userId);
    if (!roles.isAdmin && !roles.isManager) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    const { data: sec } = await supabaseAdmin
      .from("user_security")
      .select("user_id, username, is_active, must_setup_security");

    // Managers cannot see admin/portal_manager accounts
    const restricted = roles.isManager && !roles.isAdmin;

    const users = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    const userMap = new Map(users.data?.users?.map((u) => [u.id, u]) ?? []);
    const secMap = new Map((sec ?? []).map((s) => [s.user_id, s]));

    const list: ManagedUser[] = (rows ?? []).flatMap((r) => {
      if (restricted && (r.role === "admin" || r.role === "portal_manager")) return [];
      if (data.roleFilter && data.roleFilter !== "all" && r.role !== data.roleFilter) return [];
      const u = userMap.get(r.user_id);
      if (!u) return [];
      const s = secMap.get(r.user_id);
      const uname = (s?.username as string) || (u.user_metadata?.username as string) || (u.email?.split("@")[0] ?? "");
      if (data.search && !uname.toLowerCase().includes(data.search.toLowerCase()) && !(u.email ?? "").toLowerCase().includes(data.search.toLowerCase())) return [];
      return [{
        userId: u.id,
        username: uname,
        email: u.email ?? "",
        role: r.role,
        fullName: (u.user_metadata?.full_name as string) ?? null,
        isActive: s?.is_active ?? true,
        mustSetupSecurity: s?.must_setup_security ?? true,
        createdAt: u.created_at,
      }];
    });
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return list;
  });

function assertCanManage(actor: { isAdmin: boolean; isManager: boolean }, targetRole: string, actorUserId: string, targetUserId: string) {
  if (actor.isAdmin) {
    if (targetRole === "admin" && targetUserId === actorUserId) {
      throw new Error("You cannot modify your own admin account.");
    }
    return;
  }
  if (actor.isManager) {
    if (targetRole === "admin" || targetRole === "portal_manager") {
      throw new Error("Managers cannot manage Admin or Manager accounts.");
    }
    return;
  }
  throw new Error("Forbidden");
}

export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; newPassword: string }) => {
    if (!d.newPassword || d.newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { getActorRoles, writeAudit } = await import("./security.server");
    const actor = await getActorRoles(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    assertCanManage(actor, role?.role ?? "", context.userId, data.userId);
    const upd = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.newPassword });
    if (upd.error) throw new Error(upd.error.message);
    await writeAudit({ actorUserId: context.userId, actorRole: actor.isAdmin ? "admin" : "portal_manager", action: "admin.password.reset", entityType: "user", entityId: data.userId });
    return { ok: true };
  });

export const adminChangeUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; newUsername: string }) => {
    if (!d.newUsername || d.newUsername.trim().length < 3) throw new Error("Username too short.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { getActorRoles, writeAudit } = await import("./security.server");
    const actor = await getActorRoles(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    assertCanManage(actor, role?.role ?? "", context.userId, data.userId);
    const newUname = data.newUsername.trim().toLowerCase();
    const { data: existing } = await supabaseAdmin.from("user_security").select("user_id").ilike("username", newUname).maybeSingle();
    if (existing && existing.user_id !== data.userId) throw new Error("Username already in use.");
    const newEmail = `${newUname}@avartan.app`;
    const upd = await supabaseAdmin.auth.admin.updateUserById(data.userId, { email: newEmail, user_metadata: { username: newUname } });
    if (upd.error) throw new Error(upd.error.message);
    await supabaseAdmin.from("user_security").upsert({ user_id: data.userId, username: newUname }, { onConflict: "user_id" });
    await writeAudit({ actorUserId: context.userId, actorRole: actor.isAdmin ? "admin" : "portal_manager", action: "admin.username.change", entityType: "user", entityId: data.userId, newValue: { username: newUname } });
    return { ok: true };
  });

export const adminSetUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; active: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { getActorRoles, writeAudit } = await import("./security.server");
    const actor = await getActorRoles(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    assertCanManage(actor, role?.role ?? "", context.userId, data.userId);
    await supabaseAdmin.from("user_security").upsert({ user_id: data.userId, is_active: data.active }, { onConflict: "user_id" });
    // Supabase Auth: banned = deactivated
    await supabaseAdmin.auth.admin.updateUserById(data.userId, { ban_duration: data.active ? "none" : "876000h" });
    await writeAudit({ actorUserId: context.userId, actorRole: actor.isAdmin ? "admin" : "portal_manager", action: data.active ? "admin.user.activate" : "admin.user.deactivate", entityType: "user", entityId: data.userId });
    return { ok: true };
  });

export const adminResetSecurity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    const { getActorRoles, writeAudit } = await import("./security.server");
    const actor = await getActorRoles(context.userId);
    if (!actor.isAdmin) throw new Error("Only admins can reset security setup.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_security").update({
      must_setup_security: true,
      security_pin_hash: null,
      security_question: null,
      security_answer_hash: null,
    }).eq("user_id", data.userId);
    await writeAudit({ actorUserId: context.userId, actorRole: "admin", action: "admin.security.reset", entityType: "user", entityId: data.userId });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    const { getActorRoles, writeAudit } = await import("./security.server");
    const actor = await getActorRoles(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    assertCanManage(actor, role?.role ?? "", context.userId, data.userId);
    const del = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (del.error) throw new Error(del.error.message);
    await writeAudit({ actorUserId: context.userId, actorRole: actor.isAdmin ? "admin" : "portal_manager", action: "admin.user.delete", entityType: "user", entityId: data.userId });
    return { ok: true };
  });

/* ============ Audit trail listing (admin only) ============ */

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    from?: string | null; to?: string | null;
    action?: string | null; entityType?: string | null;
    role?: string | null; search?: string | null;
    sort?: "newest" | "oldest";
    page?: number; pageSize?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    const { getActorRoles } = await import("./security.server");
    const actor = await getActorRoles(context.userId);
    if (!actor.isAdmin) throw new Error("Only admins can view audit logs.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const page = Math.max(1, data.page ?? 1);
    const size = Math.min(100, Math.max(10, data.pageSize ?? 25));
    const from = (page - 1) * size;
    const to = from + size - 1;

    let q = supabaseAdmin.from("audit_logs").select("*", { count: "exact" });
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.action && data.action !== "all") q = q.eq("action", data.action);
    if (data.entityType && data.entityType !== "all") q = q.eq("entity_type", data.entityType);
    if (data.role && data.role !== "all") q = q.eq("actor_role", data.role);
    if (data.search && data.search.trim()) {
      const s = `%${data.search.trim()}%`;
      q = q.or(`actor_username.ilike.${s},entity_label.ilike.${s},remarks.ilike.${s},action.ilike.${s}`);
    }
    q = q.order("created_at", { ascending: data.sort === "oldest" }).range(from, to);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0, page, pageSize: size };
  });