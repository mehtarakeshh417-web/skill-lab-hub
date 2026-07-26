import { createFileRoute, Link } from "@tanstack/react-router";
import { friendlyError } from "@/lib/messages";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/lib/auth";
import { getSalesRepDashboard } from "@/lib/sales-reps.functions";
import { School2, CheckCircle2, XCircle, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/sales-rep")({
  head: () => ({ meta: [{ title: "Sales Rep · Avartan Skill Lab" }] }),
  component: SalesRepDashboard,
});

function SalesRepDashboard() {
  const { session } = useAuth();
  const fetchDashboard = useServerFn(getSalesRepDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["sales-rep", "dashboard"],
    queryFn: () => fetchDashboard(),
    enabled: Boolean(session),
    retry: false,
  });

  return (
    <AppShell requireRole="sales_rep" title={data?.profile.fullName ?? "Sales Representative"}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools assigned" value={data?.counts.total ?? 0} icon={School2} hash="my-schools" hint="See the full list" />
        <StatCard label="Active" value={data?.counts.active ?? 0} icon={CheckCircle2} hash="my-schools" hint="See active schools" />
        <StatCard label="Inactive" value={data?.counts.inactive ?? 0} icon={XCircle} hash="my-schools" hint="See inactive schools" />
        <StatCard label="Added this month" value={data?.counts.thisMonth ?? 0} icon={CalendarClock} hash="my-schools" hint="See recent additions" />
      </div>

      <div id="my-schools" className="mt-6 scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="font-display text-lg font-semibold">My schools</div>
        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading your schools…</div>
        ) : error ? (
          <div className="mt-4 text-sm text-destructive">
            {friendlyError(error, "We couldn't load your schools right now. Please refresh the page and try again.")}
          </div>
        ) : (data?.schools ?? []).length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">
            You don't have any schools assigned yet. Your manager will assign schools to you as they are onboarded.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">School</th>
                  <th className="px-3 py-2 text-left">City</th>
                  <th className="px-3 py-2 text-left">State</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.schools ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-accent/30">
                    <td className="px-3 py-3 font-semibold">{s.name}</td>
                    <td className="px-3 py-3">{s.city}</td>
                    <td className="px-3 py-3">{s.state}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-elegant">
        <div className="font-display text-lg font-semibold">My profile</div>
        {data?.profile && (
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div><span className="text-muted-foreground">Username:</span> <span className="font-mono">{data.profile.username}</span></div>
            <div><span className="text-muted-foreground">Designation:</span> {data.profile.designation}</div>
            <div><span className="text-muted-foreground">Email:</span> {data.profile.email}</div>
            <div><span className="text-muted-foreground">Phone:</span> {data.profile.phone}</div>
            {data.profile.employeeId && (
              <div><span className="text-muted-foreground">Employee ID:</span> {data.profile.employeeId}</div>
            )}
          </div>
        )}
        <Link to="/" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">Back to home</Link>
      </div>
    </AppShell>
  );
}