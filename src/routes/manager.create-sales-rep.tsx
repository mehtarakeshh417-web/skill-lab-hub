import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SalesRepForm } from "@/components/sales-rep-form";

export const Route = createFileRoute("/manager/create-sales-rep")({
  head: () => ({ meta: [{ title: "Create Sales Rep · Manager" }] }),
  component: () => (
    <AppShell requireRole="portal_manager" title="Create Sales Representative">
      <SalesRepForm backTo="/manager/sales-hierarchy" backLabel="Back to hierarchy" />
    </AppShell>
  ),
});
