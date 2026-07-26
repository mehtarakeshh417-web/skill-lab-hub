import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { PendingSchoolsPanel } from "@/components/pending-schools-panel";
import { getSchoolDashboardData } from "@/lib/schools.functions";
import { listSalesReps } from "@/lib/sales-reps.functions";
import { listSchoolRegistrations } from "@/lib/registrations.functions";
import { useAuth } from "@/lib/auth";
import { School2, Users, UserCog, Plus, CheckCircle2, Clock, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/manager/")({
  head: () => ({ meta: [{ title: "Portal Manager · Avartan Skill Lab" }] }),
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const { session } = useAuth();
  const getSchools = useServerFn(getSchoolDashboardData);
  const getReps = useServerFn(listSalesReps);
  const getRegs = useServerFn(listSchoolRegistrations);
  const { data } = useQuery({
    queryKey: ["schools", "dashboard"],
    queryFn: () => getSchools(),
    enabled: Boolean(session),
    retry: false,
  });
  const { data: repsData } = useQuery({
    queryKey: ["sales-reps", "list"],
    queryFn: () => getReps(),
    enabled: Boolean(session),
    retry: false,
  });
  const { data: regsData } = useQuery({
    queryKey: ["school-registrations"],
    queryFn: () => getRegs(),
    enabled: Boolean(session),
    retry: false,
  });
  const schools = data?.schools ?? [];

  return (
    <AppShell requireRole="portal_manager" title="Operations">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total schools" value={data?.counts.schools ?? schools.length} icon={School2} to="/manager/directory" search={{ tab: "schools" }} hint="Open school directory" />
        <StatCard label="Pending approvals" value={regsData?.counts.pending ?? 0} icon={ClipboardList} to="/manager/pending-schools" hint="Review registrations" />
        <StatCard label="Students" value={data?.counts.students ?? 0} icon={Users} to="/manager/directory" search={{ tab: "students" }} hint="Open student directory" />
        <StatCard label="Sales reps" value={repsData?.counts.total ?? 0} icon={UserCog} to="/manager/sales-hierarchy" hint="View sales hierarchy" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <div className="font-display text-lg font-semibold">Pending school approvals</div>
          </div>
          <div className="text-sm text-muted-foreground">
            Approve to activate the school login, or reject to keep it inactive.
          </div>
        </div>
        <div className="mt-5">
          <PendingSchoolsPanel audience="manager" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">Your schools</div>
              <div className="text-sm text-muted-foreground">Schools you've onboarded or approved. Contact details are partly hidden for privacy.</div>
            </div>
            <Button variant="hero" size="sm" asChild>
              <Link to="/manager/onboard-school"><Plus className="h-4 w-4" /> Onboard school</Link>
            </Button>
          </div>
          {schools.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 py-12 text-center">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div className="mt-2 font-medium">No schools yet</div>
              <div className="text-sm text-muted-foreground">Once you onboard a school or approve a registration, it will appear here.</div>
              <Button variant="hero" size="sm" className="mt-4" asChild>
                <Link to="/manager/onboard-school"><Plus className="h-4 w-4" /> Onboard your first school</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {schools.map((school) => (
                <Link
                  key={school.id}
                  to="/manager/directory"
                  search={{ tab: "schools", status: "all" }}
                  className="grid gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
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
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <div className="font-display text-lg font-semibold">Quick actions</div>
          <div className="mt-4 space-y-2">
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/directory" search={{ tab: "schools", status: "all" }}><School2 className="h-4 w-4" /> Browse directory</Link>
            </Button>
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/onboard-school"><School2 className="h-4 w-4" /> Create school</Link>
            </Button>
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/pending-schools">
                <ClipboardList className="h-4 w-4" /> Pending approvals
                {regsData?.counts.pending ? (
                  <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    {regsData.counts.pending}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/create-sales-rep"><UserCog className="h-4 w-4" /> Add sales rep</Link>
            </Button>
            <Button variant="soft" className="w-full justify-start" asChild>
              <Link to="/manager/sales-hierarchy"><Users className="h-4 w-4" /> View sales hierarchy</Link>
            </Button>
          </div>
        </div>
      </div>

      <Link
        to="/manager/audit-logs"
        className="mt-6 block rounded-2xl border border-border bg-card p-6 shadow-elegant transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <div className="font-display text-lg font-semibold">Audit trail</div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Your activity is being recorded safely. Open the audit trail to review it.
        </div>
      </Link>
    </AppShell>
  );
}