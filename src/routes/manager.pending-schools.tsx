import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PendingSchoolsPanel } from "@/components/pending-schools-panel";

export const Route = createFileRoute("/manager/pending-schools")({
  head: () => ({ meta: [{ title: "Pending School Approvals · Manager" }] }),
  component: () => (
    <AppShell requireRole="portal_manager" title="Pending School Approvals">
      <PendingSchoolsPanel audience="manager" />
    </AppShell>
  ),
});