import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AuditTrailWorkspace } from "@/components/audit-trail-workspace";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit trail · Avartan Skill Lab" },
      { name: "description", content: "Complete, searchable activity history of every action performed across the Avartan Skill Lab portal." },
      { property: "og:title", content: "Audit trail · Avartan Skill Lab" },
      { property: "og:description", content: "Portal activity history for administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell requireRole="admin" title="Audit Trail">
      <AuditTrailWorkspace />
    </AppShell>
  ),
});