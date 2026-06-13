import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { School2, Users, GraduationCap, UserCog, Plus, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/manager")({
  head: () => ({ meta: [{ title: "Portal Manager · Avartan Skill Lab" }] }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  return (
    <AppShell requireRole="portal_manager" title="Operations">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools" value={0} icon={School2} />
        <StatCard label="Teachers" value={0} icon={GraduationCap} />
        <StatCard label="Students" value={0} icon={Users} />
        <StatCard label="Sales reps" value={0} icon={UserCog} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">Pending school registrations</div>
              <div className="text-sm text-muted-foreground">Review self-registered schools</div>
            </div>
            <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Onboard school</Button>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div className="mt-2 font-medium">No pending registrations</div>
            <div className="text-sm text-muted-foreground">New school requests appear here.</div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <div className="font-display text-lg font-semibold">Quick actions</div>
          <div className="mt-4 space-y-2">
            <Button variant="soft" className="w-full justify-start"><School2 className="h-4 w-4" /> Create school</Button>
            <Button variant="soft" className="w-full justify-start"><GraduationCap className="h-4 w-4" /> Add teacher</Button>
            <Button variant="soft" className="w-full justify-start"><Users className="h-4 w-4" /> Bulk upload students</Button>
            <Button variant="soft" className="w-full justify-start"><UserCog className="h-4 w-4" /> Add sales rep</Button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <div className="font-display text-lg font-semibold">Audit trail</div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">No actions recorded yet.</div>
      </div>
    </AppShell>
  );
}