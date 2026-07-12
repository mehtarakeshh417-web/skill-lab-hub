import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getSchoolDashboardData } from "@/lib/schools.functions";
import { useAuth } from "@/lib/auth";
import { School2, Users, GraduationCap, UserCog, Plus, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/manager/")({
  head: () => ({ meta: [{ title: "Portal Manager · Avartan Skill Lab" }] }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const { session } = useAuth();
  const getSchools = useServerFn(getSchoolDashboardData);
  const { data } = useQuery({
    queryKey: ["schools", "dashboard"],
    queryFn: () => getSchools(),
    enabled: Boolean(session),
    retry: false,
  });
  const schools = data?.schools ?? [];

  return (
    <AppShell requireRole="portal_manager" title="Operations">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools" value={data?.counts.schools ?? schools.length} icon={School2} />
        <StatCard label="Teachers" value={data?.counts.teachers ?? 0} icon={GraduationCap} />
        <StatCard label="Students" value={data?.counts.students ?? 0} icon={Users} />
        <StatCard label="Sales reps" value={0} icon={UserCog} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">Pending school registrations</div>
              <div className="text-sm text-muted-foreground">Review self-registered schools</div>
            </div>
            <Button variant="hero" size="sm" asChild>
              <Link to="/manager/onboard-school"><Plus className="h-4 w-4" /> Onboard school</Link>
            </Button>
          </div>
          {schools.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 py-12 text-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div className="mt-2 font-medium">No schools onboarded</div>
              <div className="text-sm text-muted-foreground">Created schools appear here with masked contact details.</div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {schools.map((school) => (
                <div key={school.id} className="grid gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-bold">{school.schoolName}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{school.schoolCode}</span>
                      <span>@{school.username}</span>
                      <span>{school.email}</span>
                      <span>{school.phone}</span>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                    {school.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <div className="font-display text-lg font-semibold">Quick actions</div>
          <div className="mt-4 space-y-2">
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/onboard-school"><School2 className="h-4 w-4" /> Create school</Link>
            </Button>
            <Button variant="soft" className="w-full justify-start"><GraduationCap className="h-4 w-4" /> Add teacher</Button>
            <Button variant="soft" className="w-full justify-start"><Users className="h-4 w-4" /> Bulk upload students</Button>
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/create-sales-rep"><UserCog className="h-4 w-4" /> Add sales rep</Link>
            </Button>
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/sales-hierarchy"><Users className="h-4 w-4" /> View sales hierarchy</Link>
            </Button>
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