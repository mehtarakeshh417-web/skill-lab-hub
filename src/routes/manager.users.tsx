import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { UserManagementPanel } from "@/components/user-management-panel";

export const Route = createFileRoute("/manager/users")({
  head: () => ({ meta: [{ title: "User management · Avartan Skill Lab" }] }),
  component: () => (
    <AppShell requireRole="portal_manager" title="User Management">
      <UserManagementPanel actor="manager" />
    </AppShell>
  ),
});