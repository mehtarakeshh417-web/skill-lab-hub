import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { PendingSchoolsPanel } from "@/components/pending-schools-panel";
import { getSchoolDashboardData } from "@/lib/schools.functions";
import { listSchoolRegistrations } from "@/lib/registrations.functions";
import { useAuth } from "@/lib/auth";
import { School2, Users, GraduationCap, TrendingUp, BarChart3, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Avartan Skill Lab" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { session } = useAuth();
  const getSchools = useServerFn(getSchoolDashboardData);
  const getRegs = useServerFn(listSchoolRegistrations);
  const { data } = useQuery({
    queryKey: ["schools", "dashboard"],
    queryFn: () => getSchools(),
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
    <AppShell requireRole="admin" title="Platform Overview">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools onboarded" value={data?.counts.schools ?? schools.length} icon={School2} trend="Live backend count" />
        <StatCard label="Pending approvals" value={regsData?.counts.pending ?? 0} icon={ClipboardList} trend={`${regsData?.counts.rejected ?? 0} rejected`} />
        <StatCard label="Students" value={data?.counts.students ?? 0} icon={Users} />
        <StatCard label="Teachers" value={data?.counts.teachers ?? 0} icon={GraduationCap} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="hero" size="sm" asChild>
          <Link to="/admin/pending-schools"><ClipboardList className="h-4 w-4" /> Review pending schools ({regsData?.counts.pending ?? 0})</Link>
        </Button>
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
          <PendingSchoolsPanel audience="admin" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-semibold">Engagement trend</div>
              <div className="text-sm text-muted-foreground">Last 30 days</div>
            </div>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-brand opacity-60 transition-opacity hover:opacity-100"
                style={{ height: `${20 + ((i * 7) % 80)}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <div className="font-display text-lg font-semibold">Technology mix</div>
          <div className="mt-4 space-y-3">
            {["HTML", "Python", "Scratch", "MySQL", "Java"].map((t, i) => (
              <div key={t}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t}</span>
                  <span className="text-muted-foreground">{[42, 31, 28, 18, 11][i]}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-gradient-brand" style={{ width: `${[42, 31, 28, 18, 11][i]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="font-display text-lg font-semibold">Schools registry</div>
        </div>
        {schools.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">
            No schools onboarded yet. Once schools are created, complete contact details appear here.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">School</th>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-accent/30">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{school.schoolName}</div>
                      <div className="text-xs text-muted-foreground">{school.schoolCode}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{school.username}</td>
                    <td className="px-3 py-3">{school.email}</td>
                    <td className="px-3 py-3">{school.phone}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                        {school.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}