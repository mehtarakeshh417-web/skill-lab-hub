import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/school")({
  head: () => ({ meta: [{ title: "School · Avartan Skill Lab" }] }),
  component: () => (
    <AppShell requireRole="school" title="School Dashboard">
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <div className="font-display text-xl font-semibold">School module coming soon</div>
        <p className="mt-2 text-sm text-muted-foreground">Manage teachers, classes, sections, and student progress.</p>
      </div>
    </AppShell>
  ),
});