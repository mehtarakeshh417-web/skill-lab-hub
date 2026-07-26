import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuditTrailPlaceholder } from "@/components/audit-trail-placeholder";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Trail — Avartan Admin Console" },
      { name: "description", content: "Activity history for the Avartan Skill Lab portal. The detailed audit trail view is being prepared." },
      { property: "og:title", content: "Audit Trail — Avartan Admin Console" },
      { property: "og:description", content: "Portal activity history for administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell requireRole="admin" title="Audit Trail">
      <AuditTrailPlaceholder />
    </AppShell>
  ),
});