import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell, ShieldCheck, Users, School2, GraduationCap, Briefcase,
  CheckCircle2, XCircle, Search, ChevronDown, Eye, EyeOff,
  ToggleLeft, ToggleRight, History, Sparkles, AlertTriangle,
  Trash2, Filter, Download, MoreHorizontal, Lock,
  Pencil, Check, Plus, Layers, BookOpen, Save, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/console")({
  head: () => ({ meta: [{ title: "Console · Avartan Skill Lab" }] }),
  component: ConsolePage,
});

// ---------- Types & Mock Data ----------
type Role = "admin" | "portal_manager" | "school" | "teacher" | "student";
type SchoolStatus = "Pending" | "Approved" | "Rejected";
type Notif = { id: string; title: string; time: string; kind: "info" | "warn" | "ok" };

const ROLES: { id: Role; label: string; icon: typeof ShieldCheck }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck },
  { id: "portal_manager", label: "Portal Manager", icon: Briefcase },
  { id: "school", label: "School Admin", icon: School2 },
  { id: "teacher", label: "Teacher", icon: GraduationCap },
  { id: "student", label: "Student", icon: Users },
];

const seedSchools = [
  { id: "s1", code: "SCH-DEL-001", name: "Delhi Public Pilot", city: "Delhi", status: "Pending" as SchoolStatus, email: "principal@dpspilot.edu", mobile: "+91 98100 12345", created: "2026-06-18", disabled: false },
  { id: "s2", code: "SCH-MUM-014", name: "Mumbai Tech Academy", city: "Mumbai", status: "Approved" as SchoolStatus, email: "admin@mta.in", mobile: "+91 98200 55512", created: "2026-06-15", disabled: false },
  { id: "s3", code: "SCH-BLR-022", name: "Bengaluru Skills Hub", city: "Bengaluru", status: "Pending" as SchoolStatus, email: "ops@bskhub.org", mobile: "+91 98450 99123", created: "2026-06-12", disabled: false },
  { id: "s4", code: "SCH-HYD-007", name: "Hyderabad Coders School", city: "Hyderabad", status: "Rejected" as SchoolStatus, email: "head@hcs.edu.in", mobile: "+91 97000 11111", created: "2026-06-09", disabled: true },
  { id: "s5", code: "SCH-PUN-031", name: "Pune Innovation Lab", city: "Pune", status: "Approved" as SchoolStatus, email: "lab@pil.school", mobile: "+91 99220 32145", created: "2026-06-05", disabled: false },
];

const seedTeachers = [
  { id: "t1", school_id: "s2", code: "EMP-014-01", name: "Anita Rao", expertise: ["Python", "MySQL"], classes: ["VIII-A", "IX-B"], status: "Active", mobile: "+91 98765 11111", email: "anita@mta.in", disabled: false },
  { id: "t2", school_id: "s5", code: "EMP-031-04", name: "Rakesh Verma", expertise: ["HTML", "Scratch"], classes: ["VI-A"], status: "Active", mobile: "+91 98765 22222", email: "rakesh@pil.school", disabled: false },
];

const seedStudents = [
  { id: "st1", school_id: "s2", class: "VIII-A", admission: "ADM-2206", name: "Ira Khanna", status: "Active", mobile: "+91 90000 11111", email: "ira@parent.com", disabled: false },
  { id: "st2", school_id: "s2", class: "IX-B", admission: "ADM-2289", name: "Veer Singh", status: "Active", mobile: "+91 90000 22222", email: "veer@parent.com", disabled: false },
  { id: "st3", school_id: "s5", class: "VI-A", admission: "ADM-3101", name: "Tara Mehta", status: "Suspended", mobile: "+91 90000 33333", email: "tara@parent.com", disabled: true },
];

const seedNotifs: Notif[] = [
  { id: "n1", title: "3 new school registrations awaiting approval", time: "2m ago", kind: "warn" },
  { id: "n2", title: "Backup completed successfully", time: "1h ago", kind: "ok" },
  { id: "n3", title: "Portal Manager logged in from new device", time: "3h ago", kind: "info" },
  { id: "n4", title: "Storage quota at 72%", time: "Yesterday", kind: "warn" },
];

type AuditEntry = { id: string; ts: string; actor: string; action: string; target: string };
const seedAudit: AuditEntry[] = [
  { id: "a1", ts: "2026-06-22 09:14", actor: "admin", action: "DELETED_USER", target: "student:ADM-1199" },
  { id: "a2", ts: "2026-06-22 08:51", actor: "manager", action: "APPROVED_SCHOOL", target: "SCH-MUM-014" },
  { id: "a3", ts: "2026-06-21 17:32", actor: "admin", action: "DISABLED_USER", target: "school:SCH-HYD-007" },
  { id: "a4", ts: "2026-06-21 14:08", actor: "manager", action: "REJECTED_SCHOOL", target: "SCH-HYD-007" },
  { id: "a5", ts: "2026-06-20 11:00", actor: "system", action: "PURGED_DELETED_ENTRIES", target: "batch:2026-06-W3" },
];

// ---------- Helpers ----------
const mask = (v: string) => "•".repeat(Math.max(6, Math.min(10, v.length)));

function StatusPill({ s }: { s: SchoolStatus | string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    Active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Suspended: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", map[s] ?? "bg-muted text-muted-foreground border-border")}>{s}</span>;
}

// ---------- Page ----------
function ConsolePage() {
  const [role, setRole] = useState<Role>("admin");
  const [schools, setSchools] = useState(seedSchools);
  const [audit, setAudit] = useState(seedAudit);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const isManager = role === "portal_manager";
  const showUnified = isAdmin || isManager;

  const pendingCount = schools.filter((s) => s.status === "Pending").length;
  const stats = useMemo(() => ({
    schools: schools.length,
    teachers: seedTeachers.length,
    students: seedStudents.length,
    salesReps: 4,
  }), [schools]);

  const filteredSchools = schools.filter((s) =>
    !query || s.code.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase())
  );

  const log = (action: string, target: string) => {
    setAudit((a) => [
      { id: `a${Date.now()}`, ts: new Date().toISOString().slice(0, 16).replace("T", " "), actor: role, action, target },
      ...a,
    ]);
  };

  const updateStatus = (id: string, status: SchoolStatus) => {
    setSchools((arr) => arr.map((s) => (s.id === id ? { ...s, status } : s)));
    const sc = schools.find((s) => s.id === id);
    if (sc) log(status === "Approved" ? "APPROVED_SCHOOL" : "REJECTED_SCHOOL", sc.code);
  };

  const toggleDisabled = (id: string) => {
    setSchools((arr) => arr.map((s) => (s.id === id ? { ...s, disabled: !s.disabled } : s)));
    const sc = schools.find((s) => s.id === id);
    if (sc) log(sc.disabled ? "ENABLED_USER" : "DISABLED_USER", `school:${sc.code}`);
  };

  const RoleIcon = ROLES.find((r) => r.id === role)!.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar + Main */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl lg:flex">
          <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-brand">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="font-display text-sm font-bold tracking-tight">Avartan Lab</div>
            <span className="ml-auto rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">v1</span>
          </div>

          {/* Dev Role Selector */}
          <div className="border-b border-border/60 p-3">
            <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-amber-400" /> Dev Role Selector
            </div>
            <button
              onClick={() => setRoleOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-md border border-border/60 bg-background/60 px-2.5 py-2 text-left text-sm hover:border-primary/50"
            >
              <span className="flex items-center gap-2">
                <RoleIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{ROLES.find((r) => r.id === role)!.label}</span>
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", roleOpen && "rotate-180")} />
            </button>
            {roleOpen && (
              <div className="mt-1 overflow-hidden rounded-md border border-border/60 bg-popover">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setRole(r.id); setRoleOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-accent",
                      r.id === role && "bg-accent/60 text-primary"
                    )}
                  >
                    <r.icon className="h-3.5 w-3.5" />
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav (contextual placeholder) */}
          <nav className="flex-1 space-y-0.5 p-2 text-sm">
            {[
              { label: "Overview", icon: ShieldCheck, active: true },
              { label: "Schools", icon: School2 },
              { label: "Teachers", icon: GraduationCap },
              { label: "Students", icon: Users },
              { label: "Audit Log", icon: History },
            ].map((n) => (
              <div key={n.label} className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5",
                n.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}>
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </div>
            ))}
          </nav>

          <div className="border-t border-border/60 p-3 text-[10px] text-muted-foreground">
            Mock data · No backend writes
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {ROLES.find((r) => r.id === role)!.label} Console
                </div>
                <h1 className="font-display text-sm font-semibold tracking-tight">
                  {showUnified ? "Operations Control Panel" : `${ROLES.find((r) => r.id === role)!.label} Workspace`}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search schools, codes…"
                  className="h-8 w-64 rounded-md border border-border/60 bg-background/60 pl-7 pr-2 text-xs outline-none focus:border-primary/60"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setNotifsOpen((o) => !o)}>
                  <Bell className="h-4 w-4" />
                  {pendingCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </Button>
                {notifsOpen && (
                  <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-lg border border-border/60 bg-popover shadow-xl">
                    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                      <div className="text-xs font-semibold">Notifications</div>
                      <button className="text-[10px] text-muted-foreground hover:text-foreground">Mark all read</button>
                    </div>
                    <div className="max-h-80 divide-y divide-border/60 overflow-y-auto">
                      {seedNotifs.map((n) => (
                        <div key={n.id} className="flex items-start gap-2 px-3 py-2 hover:bg-accent/40">
                          <span className={cn(
                            "mt-1 h-1.5 w-1.5 rounded-full",
                            n.kind === "warn" && "bg-amber-400",
                            n.kind === "ok" && "bg-emerald-400",
                            n.kind === "info" && "bg-sky-400",
                          )} />
                          <div className="flex-1">
                            <div className="text-xs leading-snug">{n.title}</div>
                            <div className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                  <RoleIcon className="h-3 w-3 text-primary" />
                </div>
                <div className="text-[10px] leading-tight">
                  <div className="font-medium">{role === "admin" ? "admin" : role === "portal_manager" ? "manager" : role}</div>
                  <div className="text-muted-foreground">{ROLES.find((r) => r.id === role)!.label}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Body */}
          <main className="p-4 lg:p-6">
            {showUnified ? (
              <UnifiedAdminPanel
                isAdmin={isAdmin}
                stats={stats}
                schools={filteredSchools}
                onApprove={(id) => updateStatus(id, "Approved")}
                onReject={(id) => updateStatus(id, "Rejected")}
                onToggleDisable={toggleDisabled}
                drilldown={drilldown}
                setDrilldown={setDrilldown}
                audit={audit}
              />
            ) : role === "school" ? (
              <SchoolAdminPanel />
            ) : (
              <PlaceholderPanel role={role} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ---------- Unified Admin / Manager Panel ----------
function UnifiedAdminPanel({
  isAdmin, stats, schools, onApprove, onReject, onToggleDisable, drilldown, setDrilldown, audit,
}: {
  isAdmin: boolean;
  stats: { schools: number; teachers: number; students: number; salesReps: number };
  schools: typeof seedSchools;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleDisable: (id: string) => void;
  drilldown: string | null;
  setDrilldown: (id: string | null) => void;
  audit: AuditEntry[];
}) {
  const [revealSensitive, setRevealSensitive] = useState(false);
  const open = drilldown ? schools.find((s) => s.id === drilldown) ?? null : null;

  return (
    <div className="space-y-4">
      {/* Role guardrail banner */}
      <div className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
        isAdmin
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-amber-500/30 bg-amber-500/5 text-amber-300"
      )}>
        {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        <span className="font-medium">
          {isAdmin
            ? "Admin mode — full drill-down, disable controls and audit access enabled."
            : "Portal Manager mode — sensitive PII masked, aggregate counts are static (no drill-down)."}
        </span>
      </div>

      {/* Operations Summary */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operations Summary</h2>
          {isAdmin && (
            <button
              onClick={() => setRevealSensitive((r) => !r)}
              className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] font-medium hover:border-primary/50"
            >
              {revealSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {revealSensitive ? "Hide PII" : "Reveal PII"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Schools", value: stats.schools, icon: School2, color: "from-indigo-500/20 to-indigo-500/0" },
            { label: "Teachers", value: stats.teachers, icon: GraduationCap, color: "from-violet-500/20 to-violet-500/0" },
            { label: "Students", value: stats.students, icon: Users, color: "from-sky-500/20 to-sky-500/0" },
            { label: "Sales Reps", value: stats.salesReps, icon: Briefcase, color: "from-emerald-500/20 to-emerald-500/0" },
          ].map((c) => (
            <div
              key={c.label}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-border/60 bg-card/40 p-3 backdrop-blur",
                isAdmin ? "cursor-pointer hover:border-primary/50" : "cursor-not-allowed opacity-95"
              )}
              title={isAdmin ? "Click to drill down" : "Drill-down disabled for Portal Manager"}
            >
              <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-40", c.color)} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums">{c.value}</div>
                </div>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {!isAdmin && (
                <div className="relative mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> static
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* School Registration Queue */}
      <section className="rounded-lg border border-border/60 bg-card/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div>
            <h2 className="font-display text-sm font-semibold">School Self-Registration Queue</h2>
            <p className="text-[10px] text-muted-foreground">Public sign-ups awaiting approval</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]"><Filter className="mr-1 h-3 w-3" />Filter</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]"><Download className="mr-1 h-3 w-3" />Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">School Code</th>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">City</th>
                <th className="px-3 py-2 text-left font-semibold">Email</th>
                <th className="px-3 py-2 text-left font-semibold">Mobile</th>
                <th className="px-3 py-2 text-left font-semibold">Created</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {schools.map((s) => (
                <tr key={s.id} className={cn("hover:bg-accent/20", s.disabled && "opacity-60")}>
                  <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary">
                    {isAdmin ? (
                      <button className="hover:underline" onClick={() => setDrilldown(s.id)}>{s.code}</button>
                    ) : (
                      <span>{s.code}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.city}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                    {isAdmin && revealSensitive ? s.email : mask(s.email)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
                    {isAdmin && revealSensitive ? s.mobile : mask(s.mobile)}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-muted-foreground">{s.created}</td>
                  <td className="px-3 py-2"><StatusPill s={s.status} /></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {s.status === "Pending" && (
                        <>
                          <button
                            onClick={() => onApprove(s.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => onReject(s.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/20"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => onToggleDisable(s.id)}
                          title={s.disabled ? "Enable user" : "Disable user"}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
                            s.disabled
                              ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                              : "border-border/60 hover:border-primary/50"
                          )}
                        >
                          {s.disabled ? <ToggleLeft className="h-3 w-3" /> : <ToggleRight className="h-3 w-3" />}
                          {s.disabled ? "Disabled" : "Enabled"}
                        </button>
                      )}
                      {isAdmin && (
                        <button className="inline-flex items-center rounded-md border border-border/60 p-1 hover:border-primary/50">
                          <MoreHorizontal className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No schools match the search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin-only Audit Trail */}
      {isAdmin && (
        <section className="rounded-lg border border-border/60 bg-card/40 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <History className="h-3.5 w-3.5 text-primary" />
              <h2 className="font-display text-sm font-semibold">Audit Trail · Deleted Entries Log</h2>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Admin only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Timestamp</th>
                  <th className="px-3 py-2 text-left font-semibold">Actor</th>
                  <th className="px-3 py-2 text-left font-semibold">Action</th>
                  <th className="px-3 py-2 text-left font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {audit.map((a) => (
                  <tr key={a.id} className="hover:bg-accent/20">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{a.ts}</td>
                    <td className="px-3 py-1.5"><span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px]">{a.actor}</span></td>
                    <td className="px-3 py-1.5">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                        a.action.startsWith("DELETED") || a.action.startsWith("REJECTED") || a.action.startsWith("DISABLED")
                          ? "bg-rose-500/15 text-rose-300"
                          : a.action.startsWith("APPROVED") || a.action.startsWith("ENABLED")
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-sky-500/15 text-sky-300"
                      )}>{a.action}</span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[10px]">{a.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Drill-down modal (admin) */}
      {isAdmin && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setDrilldown(null)}>
          <div className="w-full max-w-lg rounded-lg border border-border/60 bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">School Detail</div>
                <h3 className="font-display text-lg font-semibold">{open.name}</h3>
                <div className="mt-0.5 font-mono text-xs text-primary">{open.code}</div>
              </div>
              <button onClick={() => setDrilldown(null)} className="rounded-md border border-border/60 p-1 hover:border-primary/50"><XCircle className="h-4 w-4" /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-muted-foreground">City</dt><dd className="font-medium">{open.city}</dd></div>
              <div><dt className="text-muted-foreground">Status</dt><dd><StatusPill s={open.status} /></dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd className="font-mono">{open.email}</dd></div>
              <div><dt className="text-muted-foreground">Mobile</dt><dd className="font-mono">{open.mobile}</dd></div>
              <div><dt className="text-muted-foreground">Created</dt><dd>{open.created}</dd></div>
              <div><dt className="text-muted-foreground">Account</dt><dd>{open.disabled ? "Disabled" : "Active"}</dd></div>
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => onToggleDisable(open.id)} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-1.5 text-xs font-semibold hover:border-primary/50">
                {open.disabled ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                {open.disabled ? "Enable" : "Disable"} User
              </button>
              <button className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderPanel({ role }: { role: Role }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/30 p-12 text-center">
      <Sparkles className="mb-3 h-6 w-6 text-primary" />
      <h3 className="font-display text-base font-semibold capitalize">{role.replace("_", " ")} workspace</h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">
        Switch to <span className="font-semibold text-foreground">Admin</span> or <span className="font-semibold text-foreground">Portal Manager</span> in the Dev Role Selector to see the unified operations control panel built for this step.
      </p>
    </div>
  );
}