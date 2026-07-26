import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuditTrailWorkspace } from "@/components/audit-trail-workspace";

export const Route = createFileRoute("/manager/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Trail — Avartan Manager Console" },
      { name: "description", content: "Complete, searchable activity history of portal actions available to Avartan portal managers." },
      { property: "og:title", content: "Audit Trail — Avartan Manager Console" },
      { property: "og:description", content: "Portal activity history for managers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell requireRole="portal_manager" title="Audit Trail">
      <AuditTrailWorkspace />
    </AppShell>
  ),
});