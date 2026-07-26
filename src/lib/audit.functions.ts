import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AuditFilters } from "./audit.server";

export const fetchAuditTrail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AuditFilters) => d)
  .handler(async ({ data, context }) => {
    const { assertAuditViewer, queryAuditTrail } = await import("./audit.server");
    await assertAuditViewer(context.userId);
    return queryAuditTrail(data);
  });

export const fetchAuditFacets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAuditViewer, auditFacets } = await import("./audit.server");
    await assertAuditViewer(context.userId);
    return auditFacets();
  });

/**
 * Sign-in / sign-out telemetry. Callable without a session because failed
 * sign-in attempts and sign-outs happen outside an authenticated context.
 * Only the three auth events below are accepted and all text is truncated.
 */
export const recordAuthEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { event: "login" | "logout" | "login_failed"; identifier?: string | null; reason?: string | null }) => {
    if (!["login", "logout", "login_failed"].includes(d.event)) throw new Error("Unsupported event.");
    return d;
  })
  .handler(async ({ data }) => {
    const { writeAudit, resolveIdentifier } = await import("./security.server");
    const identifier = (data.identifier ?? "").trim().slice(0, 120);
    const resolved = identifier ? await resolveIdentifier(identifier).catch(() => null) : null;
    const action =
      data.event === "login" ? "auth.login"
      : data.event === "logout" ? "auth.logout"
      : "auth.login.failed";
    await writeAudit({
      actorUserId: resolved?.userId ?? null,
      actorUsername: resolved?.username ?? (identifier || null),
      action,
      module: "Authentication",
      entityType: "session",
      entityId: resolved?.userId ?? null,
      entityLabel: resolved?.username ?? (identifier || null),
      targetUserId: resolved?.userId ?? null,
      status: data.event === "login_failed" ? "failure" : "success",
      remarks:
        data.event === "login_failed"
          ? (data.reason ?? "Invalid credentials").slice(0, 200)
          : data.event === "login"
            ? "User signed in"
            : "User signed out",
    });
    return { ok: true };
  });
