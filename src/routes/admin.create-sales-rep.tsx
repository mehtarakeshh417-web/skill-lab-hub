import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SalesRepForm } from "@/components/sales-rep-form";

export const Route = createFileRoute("/admin/create-sales-rep")({
  head: () => ({ meta: [{ title: "Create sales representative · Avartan Skill Lab" }] }),
  component: () => (
    <AppShell requireRole="admin" title="Create Sales Representative">
      <SalesRepForm backTo="/admin/sales-hierarchy" backLabel="Back to hierarchy" />
    </AppShell>
  ),
});
