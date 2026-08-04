import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UserManagementPanel } from "@/components/user-management-panel";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User management · Avartan Skill Lab" }] }),
  component: () => (
    <AppShell requireRole="admin" title="User Management">
      <UserManagementPanel actor="admin" />
    </AppShell>
  ),
});