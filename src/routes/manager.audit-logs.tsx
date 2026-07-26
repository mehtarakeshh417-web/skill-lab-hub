import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuditTrailPlaceholder } from "@/components/audit-trail-placeholder";

export const Route = createFileRoute("/manager/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Trail — Avartan Manager Console" },
      { name: "description", content: "Activity history for portal managers on the Avartan Skill Lab portal. The detailed audit trail view is being prepared." },
      { property: "og:title", content: "Audit Trail — Avartan Manager Console" },
      { property: "og:description", content: "Portal activity history for managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell requireRole="portal_manager" title="Audit Trail">
      <AuditTrailPlaceholder />
    </AppShell>
  ),
});