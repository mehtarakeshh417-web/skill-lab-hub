import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PendingSchoolsPanel } from "@/components/pending-schools-panel";

export const Route = createFileRoute("/admin/pending-schools")({
  head: () => ({ meta: [{ title: "Pending School Approvals · Admin" }] }),
  component: () => (
    <AppShell requireRole="admin" title="Pending School Approvals">
      <PendingSchoolsPanel audience="admin" />
    </AppShell>
  ),
});