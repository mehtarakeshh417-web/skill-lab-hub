import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { PendingSchoolsPanel } from "@/components/pending-schools-panel";
import { getDirectory } from "@/lib/directory.functions";
import { exportXlsx, type ExportColumn } from "@/lib/export-report";
import { useAuth } from "@/lib/auth";
import type { SchoolRow } from "@/lib/directory.server";
import {
  School2, Users, GraduationCap, ClipboardList, Briefcase, ShieldAlert,
  UserCog, ScrollText, FileSpreadsheet, LayoutGrid, Building2, ArrowRight, PlusCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Avartan Skill Lab" },
      { name: "description", content: "Owner console for the Avartan Skill Lab portal: live school, teacher and student counts, approvals, account controls and downloadable reports." },
      { property: "og:title", content: "Admin Console — Avartan Skill Lab" },
      { property: "og:description", content: "Live portal metrics, school approvals, directory and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { session } = useAuth();
  const load = useServerFn(getDirectory);
  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => load({ data: {} }),
    enabled: Boolean(session),
    retry: false,
  });

  const totals = data?.totals;
  const schools = data?.schools ?? [];
  const recentSchools = schools.slice(0, 6);

  function downloadPortalReport() {
    const cols: ExportColumn<SchoolRow>[] = [
      { header: "School", value: (r) => r.name },
      { header: "Code", value: (r) => r.schoolCode },
      { header: "Username", value: (r) => r.username },
      { header: "Email", value: (r) => r.email },
      { header: "Phone", value: (r) => r.phone },
      { header: "City", value: (r) => r.city },
      { header: "State", value: (r) => r.state },
      { header: "Teachers", value: (r) => r.teacherCount },
      { header: "Students", value: (r) => r.studentCount },
      { header: "Status", value: (r) => r.status },
    ];
    exportXlsx(schools, cols, `avartan-portal-report-${new Date().toISOString().slice(0, 10)}`, [
      ["Schools", totals?.schools ?? 0],
      ["Teachers", totals?.teachers ?? 0],
      ["Students", totals?.students ?? 0],
      ["Sales representatives", totals?.salesReps ?? 0],
      ["Pending registrations", totals?.pendingRegistrations ?? 0],
      ["Rejected registrations", totals?.rejectedRegistrations ?? 0],
      ["Deactivated accounts", totals?.inactiveAccounts ?? 0],
    ]);
  }

  return (
    <AppShell requireRole="admin" title="Platform Overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Schools" value={totals?.schools ?? 0} icon={School2} trend="Live" />
        <StatCard label="Teachers" value={totals?.teachers ?? 0} icon={GraduationCap} />
        <StatCard label="Students" value={totals?.students ?? 0} icon={Users} />
        <StatCard label="Sales reps" value={totals?.salesReps ?? 0} icon={Briefcase} />
        <StatCard label="Pending approvals" value={totals?.pendingRegistrations ?? 0} icon={ClipboardList} trend={`${totals?.rejectedRegistrations ?? 0} rejected`} />
        <StatCard label="Deactivated" value={totals?.inactiveAccounts ?? 0} icon={ShieldAlert} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <QuickAction to="/admin/directory" icon={LayoutGrid} label="Portal directory" hint="Schools, teachers, students" />
        <QuickAction to="/admin/pending-schools" icon={ClipboardList} label="Approvals" hint={`${totals?.pendingRegistrations ?? 0} awaiting review`} />
        <QuickAction to="/admin/users" icon={UserCog} label="User management" hint="Passwords & access" />
        <QuickAction to="/admin/create-sales-rep" icon={PlusCircle} label="Add sales rep" hint="Grow the field team" />
        <QuickAction to="/admin/audit-logs" icon={ScrollText} label="Audit trail" hint="Activity history" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <HealthTile label="Accounts pending security setup" value={totals?.pendingSecurity ?? 0} />
        <HealthTile label="Schools with zero students" value={totals?.schoolsWithoutStudents ?? 0} />
        <HealthTile label="Deactivated accounts" value={totals?.inactiveAccounts ?? 0} />
      </div>

      <div className="mt-6 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl lg:p-8">
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

      <div className="mt-6 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div className="font-display text-lg font-semibold">Recently onboarded schools</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={downloadPortalReport}>
              <FileSpreadsheet className="h-4 w-4" /> Download portal report
            </Button>
            <Button variant="hero" className="rounded-xl" asChild>
              <Link to="/admin/directory">Open directory <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        {recentSchools.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
            No schools onboarded yet. Approved registrations appear here instantly.
          </div>
        ) : (
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {recentSchools.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border/50 bg-background/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.schoolCode} · {[s.city, s.state].filter(Boolean).join(", ") || "—"}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{s.teacherCount} teachers · {s.studentCount} students</div>
                    <div>{new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span>{s.email || "—"}</span>
                  <span className="text-muted-foreground">{s.phone || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function QuickAction({ to, icon: Icon, label, hint }: { to: string; icon: typeof School2; label: string; hint: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border/60 bg-card/70 p-5 shadow-elegant backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </Link>
  );
}

function HealthTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 px-6 py-5 backdrop-blur-xl">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}