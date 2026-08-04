import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PendingSchoolsPanel } from "@/components/pending-schools-panel";

export const Route = createFileRoute("/admin/pending-schools")({
  head: () => ({ meta: [{ title: "Pending school approvals · Avartan Skill Lab" }] }),
  component: () => (
    <AppShell requireRole="admin" title="Pending school approvals">
      <PendingSchoolsPanel audience="admin" />
    </AppShell>
  ),
});