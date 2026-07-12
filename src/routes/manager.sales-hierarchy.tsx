import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SalesHierarchy } from "@/components/sales-hierarchy";
import { Button } from "@/components/ui/button";
import { UserPlus2 } from "lucide-react";

export const Route = createFileRoute("/manager/sales-hierarchy")({
  head: () => ({ meta: [{ title: "Sales Hierarchy · Manager" }] }),
  component: () => (
    <AppShell requireRole="portal_manager" title="Sales Hierarchy">
      <div className="mb-4 flex justify-end">
        <Button variant="hero" asChild>
          <Link to="/manager/create-sales-rep"><UserPlus2 className="h-4 w-4" /> New sales rep</Link>
        </Button>
      </div>
      <SalesHierarchy />
    </AppShell>
  ),
});
