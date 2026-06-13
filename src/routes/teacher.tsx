import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher · Avartan Skill Lab" }] }),
  component: () => (
    <AppShell requireRole="teacher" title="Teacher Dashboard">
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <div className="font-display text-xl font-semibold">Teacher module coming soon</div>
        <p className="mt-2 text-sm text-muted-foreground">Assign projects, evaluate submissions, track your students.</p>
      </div>
    </AppShell>
  ),
});