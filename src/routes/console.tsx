import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Bell, ShieldCheck, Users, School2, GraduationCap, Briefcase,
  CheckCircle2, XCircle, Search, ChevronDown, Eye, EyeOff,
  ToggleLeft, ToggleRight, History, Sparkles, AlertTriangle,
  Trash2, Filter, Download, MoreHorizontal, Lock,
  Pencil, Check, Plus, Layers, BookOpen, Save, Link2,
  UserPlus, Mail, Phone, Power, PowerOff,
  Upload, FileSpreadsheet, Loader2, Calendar as CalendarIcon, UserCircle2,
  ClipboardList, FolderKanban, Send, FileText, Target, Users2, Clock, Archive, FileCheck2, Hash, Award,
  BellRing, Megaphone, AlarmClock, MessageSquare, CheckCheck, Rocket, TrendingUp, Trophy, Flame,
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
              <div className="space-y-4">
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
                {isManager && <TeacherManagementPanel maskPII />}
              </div>
            ) : role === "school" ? (
              <div className="space-y-4">
                <SchoolAdminPanel />
                <TeacherManagementPanel maskPII={false} />
                <StudentManagementPanel canEdit />
              </div>
            ) : role === "teacher" ? (
              <div className="space-y-4">
                <StudentManagementPanel canEdit />
                <TaskManagementPanel />
              </div>
            ) : role === "student" ? (
              <StudentDashboardPanel />
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

// =========================================================================
// Shared School Store (teachers + classes)
// =========================================================================

const TECHS = [
  "Scratch Junior", "Scratch", "HTML", "Python", "Java", "MySQL",
  "Word Processor", "Spreadsheet", "Presentation", "Paint",
] as const;
type Tech = typeof TECHS[number];

type SchoolTeacher = {
  id: string;
  code: string;
  name: string;
  expertise: Tech[];
  sectionIds: string[];
  status: "Active" | "Inactive";
  email: string;
  mobile: string;
};

let _teachers: SchoolTeacher[] = [
  { id: "t1", code: "EMP-014-01", name: "Anita Rao",      expertise: ["Python", "MySQL"],           sectionIds: ["c6-A", "c9-A"], status: "Active",   email: "anita@mta.in",   mobile: "+91 98765 11111" },
  { id: "t2", code: "EMP-014-02", name: "Rakesh Verma",   expertise: ["HTML", "Scratch"],            sectionIds: ["c1-A", "c2-A"], status: "Active",   email: "rakesh@mta.in",  mobile: "+91 98765 22222" },
  { id: "t3", code: "EMP-014-03", name: "Priya Sharma",   expertise: ["Java"],                       sectionIds: ["c9-A"],          status: "Active",   email: "priya@mta.in",   mobile: "+91 98765 33333" },
  { id: "t4", code: "EMP-014-04", name: "Sandeep Mehta",  expertise: ["Word Processor", "Spreadsheet", "Presentation"], sectionIds: ["c7-A", "c8-A"], status: "Inactive", email: "sandeep@mta.in", mobile: "+91 98765 44444" },
  { id: "t5", code: "EMP-014-05", name: "Neha Kapoor",    expertise: ["Paint", "HTML"],              sectionIds: ["c3-A"],          status: "Active",   email: "neha@mta.in",    mobile: "+91 98765 55555" },
  { id: "t6", code: "EMP-014-06", name: "Vikram Joshi",   expertise: ["Scratch Junior", "Scratch"],  sectionIds: ["c1-B", "c2-B"], status: "Active",   email: "vikram@mta.in",  mobile: "+91 98765 66666" },
];
const teacherListeners = new Set<() => void>();
function setTeachers(updater: (t: SchoolTeacher[]) => SchoolTeacher[]) {
  _teachers = updater(_teachers);
  teacherListeners.forEach((l) => l());
}
function useTeachers() {
  return useSyncExternalStore(
    (cb) => { teacherListeners.add(cb); return () => teacherListeners.delete(cb); },
    () => _teachers,
    () => _teachers,
  );
}

type SectionRec = { id: string; defaultLabel: string; label: string; students: number };
type ClassRec = { grade: number; sections: SectionRec[] };

function buildInitialClasses(): ClassRec[] {
  const letters = ["A", "B", "C", "D"];
  return Array.from({ length: 12 }, (_, i) => {
    const grade = i + 1;
    const secCount = grade <= 5 ? 4 : grade <= 8 ? 3 : 2;
    return {
      grade,
      sections: Array.from({ length: secCount }, (_, j) => ({
        id: `c${grade}-${letters[j]}`,
        defaultLabel: letters[j],
        label: letters[j],
        students: 18 + ((grade * 7 + j * 11) % 22),
      })),
    };
  });
}

type Mapping = { id: string; classGrade: number; sectionId: string; teacherId: string; tech: Tech };

function SchoolAdminPanel() {
  const [classes, setClasses] = useState<ClassRec[]>(() => buildInitialClasses());
  const teachers = useTeachers();
  const [activeGrade, setActiveGrade] = useState<number>(1);
  const [editingSec, setEditingSec] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mappings, setMappings] = useState<Mapping[]>([
    { id: "m1", classGrade: 1, sectionId: "c1-A", teacherId: "t2", tech: "Scratch" },
    { id: "m2", classGrade: 1, sectionId: "c1-B", teacherId: "t6", tech: "Scratch" },
    { id: "m3", classGrade: 6, sectionId: "c6-A", teacherId: "t1", tech: "Python" },
    { id: "m4", classGrade: 9, sectionId: "c9-A", teacherId: "t3", tech: "Java" },
  ]);
  const [savedFlash, setSavedFlash] = useState(false);

  const totalStudents = useMemo(
    () => classes.reduce((sum, c) => sum + c.sections.reduce((s, x) => s + x.students, 0), 0),
    [classes]
  );
  const totalSections = classes.reduce((s, c) => s + c.sections.length, 0);
  const activeClass = classes.find((c) => c.grade === activeGrade)!;
  const maxStudents = Math.max(...classes.flatMap((c) => c.sections.map((s) => s.students)));

  const renameSection = (sectionId: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setClasses((cs) =>
      cs.map((c) => ({
        ...c,
        sections: c.sections.map((s) => (s.id === sectionId ? { ...s, label: trimmed } : s)),
      }))
    );
    setEditingSec(null);
  };

  const addSection = (grade: number) => {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    setClasses((cs) =>
      cs.map((c) => {
        if (c.grade !== grade) return c;
        const nextLetter = letters[c.sections.length] ?? `S${c.sections.length + 1}`;
        return {
          ...c,
          sections: [
            ...c.sections,
            { id: `c${grade}-${nextLetter}-${Date.now()}`, defaultLabel: nextLetter, label: nextLetter, students: 0 },
          ],
        };
      })
    );
  };

  const addMapping = () => {
    const firstSec = activeClass.sections[0];
    setMappings((m) => [
      ...m,
      { id: `m${Date.now()}`, classGrade: activeGrade, sectionId: firstSec.id, teacherId: teachers[0]?.id ?? "", tech: TECHS[0] },
    ]);
  };
  const updateMapping = (id: string, patch: Partial<Mapping>) =>
    setMappings((arr) => arr.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMapping = (id: string) => setMappings((arr) => arr.filter((m) => m.id !== id));

  const saveMappings = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const sectionsLookup = (grade: number) => classes.find((c) => c.grade === grade)?.sections ?? [];

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <section>
        <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">School Dashboard</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Teachers", value: teachers.length, icon: GraduationCap, color: "from-violet-500/20 to-violet-500/0" },
            { label: "Students", value: totalStudents, icon: Users, color: "from-sky-500/20 to-sky-500/0" },
            { label: "Classes", value: classes.length, icon: BookOpen, color: "from-indigo-500/20 to-indigo-500/0" },
            { label: "Sections", value: totalSections, icon: Layers, color: "from-emerald-500/20 to-emerald-500/0" },
          ].map((c) => (
            <div key={c.label} className="relative overflow-hidden rounded-lg border border-border/60 bg-card/40 p-3 backdrop-blur">
              <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-40", c.color)} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums">{c.value}</div>
                </div>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Class-wise distribution */}
      <section className="rounded-lg border border-border/60 bg-card/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div>
            <h2 className="font-display text-sm font-semibold">Class-wise Student Allocation</h2>
            <p className="text-[10px] text-muted-foreground">Live distribution across all 12 classes</p>
          </div>
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">{totalStudents} total</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {classes.map((c) => {
            const total = c.sections.reduce((s, x) => s + x.students, 0);
            return (
              <button
                key={c.grade}
                onClick={() => setActiveGrade(c.grade)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-left transition",
                  activeGrade === c.grade
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-background/40 hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Class {c.grade}</span>
                  <span className="tabular-nums">{total}</span>
                </div>
                <div className="mt-1 flex h-1.5 gap-0.5">
                  {c.sections.map((s) => (
                    <div
                      key={s.id}
                      title={`${s.label}: ${s.students}`}
                      className="flex-1 rounded-sm bg-gradient-to-r from-primary/60 to-primary/30"
                      style={{ opacity: 0.35 + (s.students / maxStudents) * 0.65 }}
                    />
                  ))}
                </div>
                <div className="mt-1 text-[9px] text-muted-foreground">{c.sections.length} sections</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Class & Section editor */}
      <section className="rounded-lg border border-border/60 bg-card/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div>
            <h2 className="font-display text-sm font-semibold">Class &amp; Section Management</h2>
            <p className="text-[10px] text-muted-foreground">Click any section label to rename it (e.g. Red, Lotus, Alpha)</p>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Class</label>
            <select
              value={activeGrade}
              onChange={(e) => setActiveGrade(Number(e.target.value))}
              className="h-7 rounded-md border border-border/60 bg-background/60 px-2 text-xs outline-none focus:border-primary/60"
            >
              {classes.map((c) => (
                <option key={c.grade} value={c.grade}>Class {c.grade}</option>
              ))}
            </select>
            <button
              onClick={() => addSection(activeGrade)}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] font-semibold hover:border-primary/50"
            >
              <Plus className="h-3 w-3" /> Add Section
            </button>
          </div>
        </div>

        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeClass.sections.map((s) => {
            const isEditing = editingSec === s.id;
            const isCustom = s.label !== s.defaultLabel;
            return (
              <div key={s.id} className="group relative overflow-hidden rounded-md border border-border/60 bg-background/40 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Class {activeGrade} · Section
                  </div>
                  {isCustom && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">renamed</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameSection(s.id, draft);
                          if (e.key === "Escape") setEditingSec(null);
                        }}
                        placeholder="e.g. Red, Lotus"
                        className="h-7 w-full rounded-md border border-primary/50 bg-background px-2 font-display text-sm font-bold outline-none"
                      />
                      <button onClick={() => renameSection(s.id, draft)} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-1 text-emerald-300">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={() => setEditingSec(null)} className="rounded-md border border-border/60 p-1">
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingSec(s.id); setDraft(s.label); }}
                      className="flex flex-1 items-center justify-between rounded-md px-1 py-0.5 text-left hover:bg-accent/40"
                    >
                      <span className="font-display text-lg font-bold tracking-tight">{s.label}</span>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{s.students} students</span>
                  <span className="font-mono">{s.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mapping grid */}
      <section className="rounded-lg border border-border/60 bg-card/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-primary" />
            <div>
              <h2 className="font-display text-sm font-semibold">Class · Section · Teacher · Technology Mapping</h2>
              <p className="text-[10px] text-muted-foreground">Assign teachers and subjects to each section</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={addMapping} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] font-semibold hover:border-primary/50">
              <Plus className="h-3 w-3" /> Add Row
            </button>
            <button
              onClick={saveMappings}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold transition",
                savedFlash
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
              )}
            >
              {savedFlash ? <><Check className="h-3 w-3" /> Saved</> : <><Save className="h-3 w-3" /> Save Mapping</>}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Class</th>
                <th className="px-3 py-2 text-left font-semibold">Section</th>
                <th className="px-3 py-2 text-left font-semibold">Teacher</th>
                <th className="px-3 py-2 text-left font-semibold">Technology</th>
                <th className="px-3 py-2 text-left font-semibold">Expertise</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mappings.map((m, i) => {
                const teacher = teachers.find((t) => t.id === m.teacherId);
                const compatible = teacher ? teacher.expertise.includes(m.tech) : false;
                const secs = sectionsLookup(m.classGrade);
                return (
                  <tr key={m.id} className="hover:bg-accent/20">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-3 py-1.5">
                      <select
                        value={m.classGrade}
                        onChange={(e) => {
                          const g = Number(e.target.value);
                          const firstSec = classes.find((c) => c.grade === g)!.sections[0].id;
                          updateMapping(m.id, { classGrade: g, sectionId: firstSec });
                        }}
                        className="h-7 rounded-md border border-border/60 bg-background/60 px-1.5 text-xs outline-none focus:border-primary/60"
                      >
                        {classes.map((c) => <option key={c.grade} value={c.grade}>Class {c.grade}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={m.sectionId}
                        onChange={(e) => updateMapping(m.id, { sectionId: e.target.value })}
                        className="h-7 rounded-md border border-border/60 bg-background/60 px-1.5 text-xs outline-none focus:border-primary/60"
                      >
                        {secs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={m.teacherId}
                        onChange={(e) => updateMapping(m.id, { teacherId: e.target.value })}
                        className="h-7 rounded-md border border-border/60 bg-background/60 px-1.5 text-xs outline-none focus:border-primary/60"
                      >
                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={m.tech}
                        onChange={(e) => updateMapping(m.id, { tech: e.target.value as Tech })}
                        className={cn(
                          "h-7 rounded-md border bg-background/60 px-1.5 text-xs outline-none",
                          compatible ? "border-border/60 focus:border-primary/60" : "border-amber-500/50 text-amber-300"
                        )}
                      >
                        {TECHS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {(teacher?.expertise ?? []).map((e: Tech) => (
                          <span key={e} className={cn(
                            "rounded-full border px-1.5 py-0.5 text-[9px] font-mono",
                            e === m.tech ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"
                          )}>{e}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => removeMapping(m.id)} className="inline-flex items-center rounded-md border border-border/60 p-1 hover:border-rose-500/50 hover:text-rose-300">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {mappings.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No mappings yet — click <span className="font-semibold text-foreground">Add Row</span> to start.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
          {mappings.length} allocations · {new Set(mappings.map((m) => m.teacherId)).size} teachers assigned · {new Set(mappings.map((m) => m.tech)).size} technologies in use
        </div>
      </section>
    </div>
  );
}

// =========================================================================
// Teacher Management Panel (Portal Manager + School Admin)
// =========================================================================

function TeacherManagementPanel({ maskPII }: { maskPII: boolean }) {
  const teachers = useTeachers();
  // Local class structure to map section IDs to friendly labels
  const classes = useMemo(() => buildInitialClasses(), []);
  const sectionLabel = (sid: string) => {
    for (const c of classes) {
      const s = c.sections.find((x) => x.id === sid);
      if (s) return `${c.grade}-${s.label}`;
    }
    return sid;
  };

  const activeCount = teachers.filter((t) => t.status === "Active").length;
  const expertiseCount = new Set(teachers.flatMap((t) => t.expertise)).size;

  // Form state
  const blankForm = () => ({
    code: "",
    name: "",
    email: "",
    mobile: "",
    expertise: [] as Tech[],
    sectionIds: [] as string[],
    status: "Active" as "Active" | "Inactive",
  });
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<number>(1);

  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const startEdit = (t: SchoolTeacher) => {
    setEditingId(t.id);
    setForm({
      code: t.code, name: t.name, email: t.email, mobile: t.mobile,
      expertise: [...t.expertise], sectionIds: [...t.sectionIds], status: t.status,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => { setEditingId(null); setForm(blankForm()); setError(null); };

  const submit = () => {
    if (!form.code.trim() || !form.name.trim()) { setError("Employee Code and Full Name are required."); return; }
    if (form.expertise.length === 0) { setError("Select at least one expertise."); return; }
    const codeClash = teachers.some((t) => t.code.toLowerCase() === form.code.trim().toLowerCase() && t.id !== editingId);
    if (codeClash) { setError("Employee Code must be unique."); return; }

    if (editingId) {
      setTeachers((arr) => arr.map((t) => t.id === editingId ? { ...t, ...form, code: form.code.trim(), name: form.name.trim() } : t));
    } else {
      const id = `t${Date.now()}`;
      setTeachers((arr) => [
        ...arr,
        { id, code: form.code.trim(), name: form.name.trim(), email: form.email.trim(), mobile: form.mobile.trim(),
          expertise: form.expertise, sectionIds: form.sectionIds, status: form.status },
      ]);
    }
    cancelEdit();
  };

  const toggleStatus = (id: string) => {
    setTeachers((arr) => arr.map((t) => t.id === id ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" } : t));
  };
  const remove = (id: string) => {
    if (!confirm("Remove this teacher from the roster?")) return;
    setTeachers((arr) => arr.filter((t) => t.id !== id));
    if (editingId === id) cancelEdit();
  };

  const mask = (v: string) => v ? "•".repeat(Math.min(10, Math.max(6, v.length))) : "—";

  return (
    <div className="space-y-4">
      {/* Header / metrics */}
      <section className="rounded-lg border border-border/60 bg-card/40 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <div>
              <h2 className="font-display text-sm font-semibold">Teacher Creation &amp; Management</h2>
              <p className="text-[10px] text-muted-foreground">
                {maskPII ? "Portal Manager view · personal contact data masked" : "School Admin view · full roster control"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span><b className="text-foreground tabular-nums">{teachers.length}</b> total</span>
            <span><b className="text-emerald-300 tabular-nums">{activeCount}</b> active</span>
            <span><b className="text-foreground tabular-nums">{expertiseCount}</b> expertise</span>
          </div>
        </div>

        {/* Onboarding Form — hidden for Portal Manager (read-only operational view) */}
        {!maskPII && (
          <div className="border-b border-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {editingId ? "Edit Teacher" : "New Teacher Onboarding"}
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="text-[10px] text-muted-foreground hover:text-foreground">Cancel edit</button>
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-12">
              {/* Basic */}
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Employee Code*</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.slice(0, 20) })}
                  placeholder="EMP-014-07"
                  className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background/60 px-2 font-mono text-xs outline-none focus:border-primary/60"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name*</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, 80) })}
                  placeholder="Jane Doe"
                  className="mt-1 h-8 w-full rounded-md border border-border/60 bg-background/60 px-2 text-xs outline-none focus:border-primary/60"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value.slice(0, 120) })}
                    placeholder="jane@school.edu"
                    className="h-8 w-full rounded-md border border-border/60 bg-background/60 pl-7 pr-2 text-xs outline-none focus:border-primary/60"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mobile</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.slice(0, 20) })}
                    placeholder="+91 98765 ..."
                    className="h-8 w-full rounded-md border border-border/60 bg-background/60 pl-7 pr-2 font-mono text-xs outline-none focus:border-primary/60"
                  />
                </div>
              </div>

              {/* Expertise */}
              <div className="lg:col-span-7">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Primary Expertise* ({form.expertise.length})</label>
                <div className="mt-1 flex flex-wrap gap-1 rounded-md border border-border/60 bg-background/40 p-1.5">
                  {TECHS.map((tech) => {
                    const on = form.expertise.includes(tech);
                    return (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => setForm({ ...form, expertise: toggleArr(form.expertise, tech) })}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition",
                          on ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {on && <Check className="h-2.5 w-2.5" />} {tech}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: form.status === "Active" ? "Inactive" : "Active" })}
                  className={cn(
                    "mt-1 flex h-8 w-full items-center justify-between rounded-md border px-2 text-xs font-semibold",
                    form.status === "Active" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  )}
                >
                  <span>{form.status}</span>
                  {form.status === "Active" ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
              </div>

              {/* Submit */}
              <div className="flex items-end lg:col-span-3">
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-3 text-xs font-semibold text-primary hover:bg-primary/25"
                >
                  {editingId ? <><Save className="h-3 w-3" /> Update Teacher</> : <><UserPlus className="h-3 w-3" /> Create Teacher</>}
                </button>
              </div>

              {/* Class & Section assignment */}
              <div className="lg:col-span-12">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Class &amp; Section Assignment ({form.sectionIds.length} selected)
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>Class</span>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(Number(e.target.value))}
                      className="h-6 rounded border border-border/60 bg-background/60 px-1 text-[10px] outline-none focus:border-primary/60"
                    >
                      {classes.map((c) => <option key={c.grade} value={c.grade}>Class {c.grade}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-1 rounded-md border border-border/60 bg-background/40 p-1.5">
                  {(classes.find((c) => c.grade === classFilter)?.sections ?? []).map((s) => {
                    const on = form.sectionIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm({ ...form, sectionIds: toggleArr(form.sectionIds, s.id) })}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-mono",
                          on ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {on && <Check className="h-2.5 w-2.5" />} Class {classFilter}-{s.label}
                      </button>
                    );
                  })}
                </div>
                {form.sectionIds.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {form.sectionIds.map((sid) => (
                      <span key={sid} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono text-primary">
                        {sectionLabel(sid)}
                        <button onClick={() => setForm({ ...form, sectionIds: form.sectionIds.filter((x) => x !== sid) })}>
                          <XCircle className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
                <AlertTriangle className="h-3 w-3" /> {error}
              </div>
            )}
          </div>
        )}

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Employee Code</th>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">Expertise</th>
                <th className="px-3 py-2 text-left font-semibold">Class · Section</th>
                {!maskPII && <th className="px-3 py-2 text-left font-semibold">Email</th>}
                {!maskPII && <th className="px-3 py-2 text-left font-semibold">Mobile</th>}
                {maskPII && <th className="px-3 py-2 text-left font-semibold">Contact</th>}
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {teachers.map((t) => (
                <tr key={t.id} className={cn("hover:bg-accent/20", t.status === "Inactive" && "opacity-60")}>
                  <td className="px-3 py-1.5 font-mono text-[11px] font-semibold text-primary">{t.code}</td>
                  <td className="px-3 py-1.5">{t.name}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex flex-wrap gap-1">
                      {t.expertise.slice(0, 4).map((e) => (
                        <span key={e} className="rounded-full border border-border/60 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">{e}</span>
                      ))}
                      {t.expertise.length > 4 && <span className="text-[9px] text-muted-foreground">+{t.expertise.length - 4}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    {t.sectionIds.length === 0 ? <span className="text-[10px] text-muted-foreground">Unassigned</span> : (
                      <div className="flex flex-wrap gap-1">
                        {t.sectionIds.slice(0, 4).map((sid) => (
                          <span key={sid} className="rounded border border-primary/30 bg-primary/10 px-1 py-0.5 font-mono text-[9px] text-primary">
                            {sectionLabel(sid)}
                          </span>
                        ))}
                        {t.sectionIds.length > 4 && <span className="text-[9px] text-muted-foreground">+{t.sectionIds.length - 4}</span>}
                      </div>
                    )}
                  </td>
                  {!maskPII && <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{t.email || "—"}</td>}
                  {!maskPII && <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{t.mobile || "—"}</td>}
                  {maskPII && (
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" /> <span className="font-mono">{mask(t.email)}</span> · <span className="font-mono">{mask(t.mobile)}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-1.5"><StatusPill s={t.status} /></td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-1">
                      {!maskPII && (
                        <button onClick={() => startEdit(t)} title="Edit Profile" className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] font-semibold hover:border-primary/50">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => toggleStatus(t.id)}
                        title={t.status === "Active" ? "Deactivate" : "Activate"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
                          t.status === "Active"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        )}
                      >
                        {t.status === "Active" ? <><PowerOff className="h-3 w-3" /> Deactivate</> : <><Power className="h-3 w-3" /> Activate</>}
                      </button>
                      {!maskPII && (
                        <button onClick={() => remove(t.id)} title="Remove Teacher" className="inline-flex items-center rounded-md border border-border/60 p-1 hover:border-rose-500/50 hover:text-rose-300">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr><td colSpan={maskPII ? 6 : 7} className="px-3 py-6 text-center text-muted-foreground">No teachers onboarded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// =========================================================================
// Student Management Panel (School Admin + Teacher)
// =========================================================================

type Gender = "Male" | "Female" | "Other";
type Student = {
  id: string;
  roll: string;
  name: string;
  sectionId: string;
  classGrade: number;
  gender: Gender;
  dob: string;
  status: "Active" | "Inactive";
};

let _students: Student[] = [
  { id: "st1", roll: "ADM-2206", name: "Ira Khanna",   sectionId: "c8-A", classGrade: 8, gender: "Female", dob: "2016-04-12", status: "Active" },
  { id: "st2", roll: "ADM-2289", name: "Veer Singh",   sectionId: "c9-A", classGrade: 9, gender: "Male",   dob: "2015-09-03", status: "Active" },
  { id: "st3", roll: "ADM-3101", name: "Tara Mehta",   sectionId: "c6-A", classGrade: 6, gender: "Female", dob: "2018-01-21", status: "Inactive" },
  { id: "st4", roll: "ADM-3110", name: "Arjun Nair",   sectionId: "c1-A", classGrade: 1, gender: "Male",   dob: "2023-07-15", status: "Active" },
  { id: "st5", roll: "ADM-3144", name: "Sara Joseph",  sectionId: "c1-B", classGrade: 1, gender: "Female", dob: "2023-11-02", status: "Active" },
  { id: "st6", roll: "ADM-3201", name: "Kabir Bose",   sectionId: "c2-A", classGrade: 2, gender: "Male",   dob: "2022-05-09", status: "Active" },
];
const studentListeners = new Set<() => void>();
function setStudents(updater: (s: Student[]) => Student[]) {
  _students = updater(_students);
  studentListeners.forEach((l) => l());
}
function useStudents() {
  return useSyncExternalStore(
    (cb) => { studentListeners.add(cb); return () => studentListeners.delete(cb); },
    () => _students,
    () => _students,
  );
}

function StudentManagementPanel({ canEdit }: { canEdit: boolean }) {
  const students = useStudents();
  const classes = useMemo(() => buildInitialClasses(), []);
  const sectionLabel = (sid: string) => {
    for (const c of classes) {
      const s = c.sections.find((x) => x.id === sid);
      if (s) return `${c.grade}-${s.label}`;
    }
    return sid;
  };

  const blank = () => ({
    roll: "", name: "", classGrade: 1, sectionId: classes[0].sections[0].id,
    gender: "Male" as Gender, dob: "", status: "Active" as "Active" | "Inactive",
  });
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Upload zone state
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ rows: number; file: string } | null>(null);

  const sectionsFor = (g: number) => classes.find((c) => c.grade === g)?.sections ?? [];

  const startEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({ roll: s.roll, name: s.name, classGrade: s.classGrade, sectionId: s.sectionId, gender: s.gender, dob: s.dob, status: s.status });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancel = () => { setEditingId(null); setForm(blank()); setError(null); };

  const submit = () => {
    if (!form.roll.trim() || !form.name.trim()) { setError("Roll Number and Full Name are required."); return; }
    if (!form.dob) { setError("Date of Birth is required."); return; }
    const clash = students.some((s) => s.roll.toLowerCase() === form.roll.trim().toLowerCase() && s.id !== editingId);
    if (clash) { setError("Roll Number must be unique."); return; }

    setSubmitting(true);
    setTimeout(() => {
      if (editingId) {
        setStudents((arr) => arr.map((s) => s.id === editingId ? { ...s, ...form, roll: form.roll.trim(), name: form.name.trim() } : s));
      } else {
        setStudents((arr) => [
          { id: `st${Date.now()}`, ...form, roll: form.roll.trim(), name: form.name.trim() },
          ...arr,
        ]);
      }
      setSubmitting(false);
      cancel();
    }, 500);
  };

  const toggleStatus = (id: string) =>
    setStudents((arr) => arr.map((s) => s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s));
  const remove = (id: string) => {
    if (!confirm("Remove this student from the roster?")) return;
    setStudents((arr) => arr.filter((s) => s.id !== id));
  };

  const handleFile = (file: File) => {
    setUploading(true);
    setUploadResult(null);
    setTimeout(() => {
      const synthetic = Array.from({ length: 5 }, (_, i) => {
        const sec = classes[i % classes.length].sections[0];
        return {
          id: `st-imp-${Date.now()}-${i}`,
          roll: `ADM-${Math.floor(4000 + Math.random() * 999)}`,
          name: ["Imported A", "Imported B", "Imported C", "Imported D", "Imported E"][i],
          classGrade: classes[i % classes.length].grade,
          sectionId: sec.id,
          gender: (["Male", "Female", "Other"] as Gender[])[i % 3],
          dob: `201${(i + 5) % 10}-0${(i % 9) + 1}-1${i + 1}`,
          status: "Active" as const,
        };
      });
      setStudents((arr) => [...synthetic, ...arr]);
      setUploading(false);
      setUploadResult({ rows: synthetic.length, file: file.name });
    }, 1400);
  };

  const downloadTemplate = () => {
    const csv = "roll,name,class,section,gender,dob,status\nADM-9001,Sample Name,5,A,Female,2017-03-15,Active\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "avartan_student_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = students.filter((s) => {
    if (filterClass !== "all" && String(s.classGrade) !== filterClass) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (query) {
      const q = query.toLowerCase();
      return s.roll.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    total: students.length,
    active: students.filter((s) => s.status === "Active").length,
    classes: new Set(students.map((s) => s.classGrade)).size,
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <section
        className="relative overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl"
        style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 50px -22px rgba(99,102,241,0.35)" }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/30">
              <UserCircle2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold tracking-tight">Student Management System</h2>
              <p className="text-[10px] text-muted-foreground">Unified roster · onboarding · bulk import</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-muted-foreground"><b className="text-foreground tabular-nums">{counts.total}</b> students</span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300"><b className="tabular-nums">{counts.active}</b> active</span>
            <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-muted-foreground"><b className="text-foreground tabular-nums">{counts.classes}</b> classes</span>
          </div>
        </div>

        {/* Form */}
        {canEdit && (
          <div className="relative grid gap-3 p-4 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Roll Number*</label>
              <input
                value={form.roll}
                onChange={(e) => setForm({ ...form, roll: e.target.value.slice(0, 20) })}
                placeholder="ADM-3204"
                className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-background/40 px-2.5 font-mono text-xs outline-none ring-primary/30 transition focus:border-primary/60 focus:ring-2"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name*</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, 80) })}
                placeholder="Aanya Kapoor"
                className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-background/40 px-2.5 text-xs outline-none ring-primary/30 transition focus:border-primary/60 focus:ring-2"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Class</label>
              <select
                value={form.classGrade}
                onChange={(e) => {
                  const g = Number(e.target.value);
                  setForm({ ...form, classGrade: g, sectionId: sectionsFor(g)[0].id });
                }}
                className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-background/40 px-2.5 text-xs outline-none focus:border-primary/60"
              >
                {classes.map((c) => <option key={c.grade} value={c.grade}>Class {c.grade}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Section</label>
              <select
                value={form.sectionId}
                onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-background/40 px-2.5 text-xs outline-none focus:border-primary/60"
              >
                {sectionsFor(form.classGrade).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                className="mt-1 h-9 w-full rounded-lg border border-border/60 bg-background/40 px-1.5 text-xs outline-none focus:border-primary/60"
              >
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date of Birth*</label>
              <div className="relative mt-1">
                <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border/60 bg-background/40 pl-7 pr-2 text-xs outline-none focus:border-primary/60"
                />
              </div>
            </div>

            <div className="lg:col-span-12 flex flex-wrap items-end gap-3">
              {/* Premium status toggle */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: form.status === "Active" ? "Inactive" : "Active" })}
                  className={cn(
                    "mt-1 flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-semibold transition",
                    form.status === "Active"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_-4px_rgba(16,185,129,0.6)]"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  )}
                >
                  <span className={cn(
                    "flex h-4 w-7 items-center rounded-full border border-border/60 bg-background/60 px-0.5 transition",
                  )}>
                    <span className={cn(
                      "h-3 w-3 rounded-full bg-gradient-to-br shadow-sm transition-transform duration-300",
                      form.status === "Active" ? "translate-x-3 from-emerald-300 to-emerald-500" : "translate-x-0 from-rose-300 to-rose-500"
                    )} />
                  </span>
                  {form.status}
                </button>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {editingId && (
                  <button onClick={cancel} className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:border-primary/40">Cancel</button>
                )}
                <button
                  onClick={submit}
                  disabled={submitting}
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground transition",
                    "bg-gradient-to-r from-primary via-violet-500 to-primary",
                    "shadow-[0_8px_24px_-8px_rgba(99,102,241,0.7)] hover:shadow-[0_10px_30px_-6px_rgba(99,102,241,0.9)]",
                    "disabled:opacity-60"
                  )}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingId ? <Save className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {submitting ? "Saving…" : editingId ? "Update Student" : "Add Student"}
                </button>
              </div>
            </div>

            {error && (
              <div className="lg:col-span-12 flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5" /> {error}
              </div>
            )}
          </div>
        )}

        {/* Bulk Upload */}
        {canEdit && (
          <div className="relative grid gap-3 border-t border-border/60 p-4 md:grid-cols-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
              }}
              className={cn(
                "group relative md:col-span-2 flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition",
                dragOver
                  ? "border-primary/70 bg-primary/10 shadow-[0_0_40px_-10px_rgba(99,102,241,0.8)]"
                  : "border-border/60 bg-background/30 hover:border-primary/40"
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-violet-500/10 opacity-0 transition group-hover:opacity-100" />
              {uploading ? (
                <>
                  <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
                  <div className="text-xs font-semibold">Processing rows…</div>
                  <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-border/60">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-primary to-violet-500" />
                  </div>
                </>
              ) : uploadResult ? (
                <>
                  <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="text-xs font-semibold text-emerald-300">Imported {uploadResult.rows} students</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{uploadResult.file}</div>
                  <button onClick={() => setUploadResult(null)} className="mt-2 text-[10px] text-primary hover:underline">Upload another file</button>
                </>
              ) : (
                <>
                  <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 ring-1 ring-primary/30">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-display text-sm font-semibold">Drag &amp; drop Excel / CSV</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">or</div>
                  <label className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20">
                    <FileSpreadsheet className="h-3 w-3" /> Browse file
                    <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                  <div className="mt-2 text-[10px] text-muted-foreground">Accepts .csv .xls .xlsx · max 20MB</div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/30 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Template</div>
              <div className="text-xs leading-snug">
                Download a pre-formatted CSV template with all required columns, then bulk import your entire class roster in one go.
              </div>
              <button
                onClick={downloadTemplate}
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs font-semibold transition hover:border-primary/40 hover:bg-primary/10"
              >
                <Download className="h-3.5 w-3.5" /> Download CSV Template
              </button>
              <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground">
                {["roll", "name", "class", "section", "gender", "dob", "status"].map((c) => (
                  <span key={c} className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-center font-mono">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Roster Table */}
      <section className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <h3 className="font-display text-sm font-semibold">Student Directory</h3>
          <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">{filtered.length} of {students.length}</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roll / name…"
                className="h-8 w-52 rounded-md border border-border/60 bg-background/60 pl-6 pr-2 text-xs outline-none focus:border-primary/60"
              />
            </div>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="h-8 rounded-md border border-border/60 bg-background/60 px-1.5 text-xs outline-none focus:border-primary/60">
              <option value="all">All Classes</option>
              {classes.map((c) => <option key={c.grade} value={c.grade}>Class {c.grade}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-8 rounded-md border border-border/60 bg-background/60 px-1.5 text-xs outline-none focus:border-primary/60">
              <option value="all">All Status</option><option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Roll No.</th>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">Class · Section</th>
                <th className="px-3 py-2 text-left font-semibold">Gender</th>
                <th className="px-3 py-2 text-left font-semibold">DOB</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((s) => (
                <tr key={s.id} className={cn("group transition hover:bg-primary/5", s.status === "Inactive" && "opacity-60")}>
                  <td className="px-3 py-1.5 font-mono text-[11px] font-semibold text-primary">{s.roll}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold uppercase",
                        s.gender === "Female" ? "bg-pink-500/15 text-pink-300" :
                        s.gender === "Male" ? "bg-sky-500/15 text-sky-300" :
                        "bg-violet-500/15 text-violet-300"
                      )}>{s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px]">Class {s.classGrade}-{sectionLabel(s.sectionId).split("-")[1] ?? ""}</span>
                  </td>
                  <td className="px-3 py-1.5 text-[10px] text-muted-foreground">{s.gender}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{s.dob || "—"}</td>
                  <td className="px-3 py-1.5"><StatusPill s={s.status} /></td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                      {canEdit && (
                        <button onClick={() => startEdit(s)} title="Edit Profile" className="inline-flex items-center rounded-md border border-border/60 p-1.5 hover:border-primary/50 hover:text-primary">
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleStatus(s.id)}
                        title={s.status === "Active" ? "Deactivate" : "Activate"}
                        className={cn(
                          "inline-flex items-center rounded-md border p-1.5",
                          s.status === "Active"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        )}
                      >
                        {s.status === "Active" ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                      </button>
                      {canEdit && (
                        <button onClick={() => remove(s.id)} title="Remove" className="inline-flex items-center rounded-md border border-border/60 p-1.5 hover:border-rose-500/50 hover:text-rose-300">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No students match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// =========================================================================
// Task Management Panel (Teacher) — Projects & Assignments
// =========================================================================

type TaskType = "project" | "assignment";
type TaskStatus = "active" | "draft" | "archived";
type TaskTargets = {
  classGrades: number[];
  sectionIds: string[];
  studentIds: string[];
  groups: string[];
};
export type Task = {
  id: string;
  type: TaskType;
  title: string;
  instructions: string;
  maxMarks: number;
  deadline: string; // YYYY-MM-DD
  status: TaskStatus;
  targets: TaskTargets;
  totalRecipients: number;
  submissions: number;
  pendingEval: number;
  createdAt: string;
};

const STUDENT_GROUPS = ["Coding Club", "Robotics Squad", "Design Studio", "Math Olympiad"] as const;

function daysUntil(date: string): number {
  const t = new Date(date).getTime();
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((t - now.getTime()) / 86400000);
}

let _tasks: Task[] = [
  {
    id: "tk1", type: "assignment", title: "HTML Form Validation Worksheet",
    instructions: "Build a sign-up form with client-side validation. Submit the HTML file with comments.",
    maxMarks: 20, deadline: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [9], sectionIds: ["c9-A"], studentIds: [], groups: [] },
    totalRecipients: 25, submissions: 14, pendingEval: 9, createdAt: "2026-06-18",
  },
  {
    id: "tk2", type: "project", title: "Scratch — Interactive Story Capstone",
    instructions: "Design a 3-scene interactive story with at least 4 sprites and sound effects.",
    maxMarks: 50, deadline: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [1], sectionIds: ["c1-A", "c1-B"], studentIds: [], groups: ["Coding Club"] },
    totalRecipients: 42, submissions: 11, pendingEval: 11, createdAt: "2026-06-15",
  },
  {
    id: "tk3", type: "assignment", title: "Python — Loops Practice Set",
    instructions: "Complete the 10 loop exercises. Paste outputs as screenshots.",
    maxMarks: 30, deadline: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [6], sectionIds: ["c6-A"], studentIds: [], groups: [] },
    totalRecipients: 22, submissions: 19, pendingEval: 4, createdAt: "2026-06-10",
  },
  {
    id: "tk4", type: "project", title: "MySQL Mini-DB Schema (Draft)",
    instructions: "Design schema for a school library system. ER diagram + DDL.",
    maxMarks: 40, deadline: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
    status: "draft",
    targets: { classGrades: [9], sectionIds: ["c9-A"], studentIds: [], groups: [] },
    totalRecipients: 0, submissions: 0, pendingEval: 0, createdAt: "2026-06-20",
  },
];
const taskListeners = new Set<() => void>();
function setTasks(updater: (t: Task[]) => Task[]) {
  _tasks = updater(_tasks);
  taskListeners.forEach((l) => l());
}
function useTasks() {
  return useSyncExternalStore(
    (cb) => { taskListeners.add(cb); return () => taskListeners.delete(cb); },
    () => _tasks,
    () => _tasks,
  );
}

function TaskManagementPanel() {
  const tasks = useTasks();
  const students = useStudents();
  const classes = useMemo(() => buildInitialClasses(), []);

  const blank = () => ({
    type: "assignment" as TaskType,
    title: "",
    instructions: "",
    maxMarks: 20,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    targets: { classGrades: [] as number[], sectionIds: [] as string[], studentIds: [] as string[], groups: [] as string[] },
  });
  const [form, setForm] = useState(blank);
  const [tab, setTab] = useState<TaskStatus>("active");
  const [flash, setFlash] = useState<string | null>(null);

  const sectionLabel = (sid: string) => {
    for (const c of classes) {
      const s = c.sections.find((x) => x.id === sid);
      if (s) return `Gr ${c.grade}-${s.label}`;
    }
    return sid;
  };
  const sectionsForSelectedGrades = useMemo(() => {
    const grades = form.targets.classGrades.length ? form.targets.classGrades : classes.map((c) => c.grade);
    return classes.filter((c) => grades.includes(c.grade));
  }, [classes, form.targets.classGrades]);

  const recipientsCount = useMemo(() => {
    const fromSections = students.filter((s) => form.targets.sectionIds.includes(s.sectionId)).length;
    const fromClasses = students.filter((s) => form.targets.classGrades.includes(s.classGrade) && !form.targets.sectionIds.includes(s.sectionId)).length;
    const fromIds = form.targets.studentIds.length;
    const fromGroups = form.targets.groups.length * 8; // mock group size
    return Math.max(0, fromSections + fromClasses + fromIds + fromGroups);
  }, [students, form.targets]);

  const toggleIn = <T,>(arr: T[], val: T): T[] => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const publish = (status: TaskStatus) => {
    if (!form.title.trim()) { setFlash("Title is required."); setTimeout(() => setFlash(null), 1800); return; }
    const id = `tk${Date.now()}`;
    const total = status === "draft" ? 0 : recipientsCount;
    setTasks((t) => [
      {
        id, type: form.type, title: form.title.trim(),
        instructions: form.instructions.trim(), maxMarks: form.maxMarks,
        deadline: form.deadline, status,
        targets: { ...form.targets },
        totalRecipients: total, submissions: 0, pendingEval: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...t,
    ]);
    setForm(blank());
    setFlash(status === "draft" ? "Saved as draft." : `Published to ${total} recipient${total === 1 ? "" : "s"}.`);
    setTimeout(() => setFlash(null), 2200);
  };

  const removeTask = (id: string) => setTasks((t) => t.filter((x) => x.id !== id));
  const archiveTask = (id: string) => setTasks((t) => t.map((x) => x.id === id ? { ...x, status: "archived" } : x));
  const publishDraft = (id: string) => setTasks((t) => t.map((x) => x.id === id ? { ...x, status: "active", totalRecipients: Math.max(x.totalRecipients, 1) } : x));

  const filtered = useMemo(() => {
    if (tab === "archived") {
      return tasks.filter((t) => t.status === "archived" || (t.status === "active" && daysUntil(t.deadline) < 0));
    }
    if (tab === "draft") return tasks.filter((t) => t.status === "draft");
    return tasks.filter((t) => t.status === "active" && daysUntil(t.deadline) >= 0);
  }, [tasks, tab]);

  const counts = {
    active: tasks.filter((t) => t.status === "active" && daysUntil(t.deadline) >= 0).length,
    draft: tasks.filter((t) => t.status === "draft").length,
    archived: tasks.filter((t) => t.status === "archived" || (t.status === "active" && daysUntil(t.deadline) < 0)).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight">Project &amp; Assignment Engine</h2>
          <p className="text-[11px] text-muted-foreground">Create, target and track learning tasks across your classroom.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5"><Sparkles className="h-3 w-3 text-indigo-300" /> Live sync · students</span>
        </div>
      </div>

      {/* Creation Panel */}
      <section className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-indigo-950/30 p-4 shadow-[0_10px_40px_-20px_rgba(99,102,241,0.45)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: form */}
          <div className="space-y-3">
            {/* Type toggle */}
            <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1 backdrop-blur">
              {([
                { id: "assignment" as const, label: "Assignment", icon: ClipboardList },
                { id: "project" as const, label: "Project", icon: FolderKanban },
              ]).map(({ id, label, icon: Icon }) => {
                const active = form.type === id;
                return (
                  <button
                    key={id}
                    onClick={() => setForm((f) => ({ ...f, type: id }))}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-300",
                      active
                        ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_6px_20px_-6px_rgba(99,102,241,0.7)]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={form.type === "project" ? "e.g. Scratch — Interactive Story Capstone" : "e.g. HTML Form Validation Worksheet"}
                className="w-full rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none transition-all focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Instructions / Guidelines</label>
              <textarea
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                rows={4}
                placeholder="Describe deliverables, rubric and submission format…"
                className="w-full resize-none rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none transition-all focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Max Marks</label>
                <div className="relative">
                  <Award className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-300" />
                  <input
                    type="number" min={1} max={100}
                    value={form.maxMarks}
                    onChange={(e) => setForm((f) => ({ ...f, maxMarks: Math.max(1, Number(e.target.value) || 0) }))}
                    className="w-full rounded-lg border border-border/60 bg-background/70 pl-8 pr-3 py-2 text-sm outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Deadline</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-300" />
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    className="w-full rounded-lg border border-border/60 bg-background/70 pl-8 pr-3 py-2 text-sm outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: distribution */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                <Target className="h-3.5 w-3.5 text-indigo-300" /> Targeted Distribution
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
                <Users2 className="h-3 w-3" /> {recipientsCount} recipient{recipientsCount === 1 ? "" : "s"}
              </span>
            </div>

            {/* Classes */}
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Classes</div>
              <div className="flex flex-wrap gap-1">
                {classes.map((c) => {
                  const active = form.targets.classGrades.includes(c.grade);
                  return (
                    <button
                      key={c.grade}
                      onClick={() => setForm((f) => ({ ...f, targets: { ...f.targets, classGrades: toggleIn(f.targets.classGrades, c.grade) } }))}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all",
                        active
                          ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-100 shadow-[0_0_12px_-2px_rgba(99,102,241,0.6)]"
                          : "border-border/60 bg-background/60 text-muted-foreground hover:border-indigo-400/40 hover:text-foreground"
                      )}
                    >
                      Gr {c.grade}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sections */}
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sections</div>
              <div className="flex flex-wrap gap-1">
                {sectionsForSelectedGrades.flatMap((c) =>
                  c.sections.map((s) => {
                    const active = form.targets.sectionIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setForm((f) => ({ ...f, targets: { ...f.targets, sectionIds: toggleIn(f.targets.sectionIds, s.id) } }))}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all",
                          active
                            ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-100"
                            : "border-border/60 bg-background/60 text-muted-foreground hover:border-fuchsia-400/40 hover:text-foreground"
                        )}
                      >
                        {c.grade}-{s.label}
                      </button>
                    );
                  })
                )}
                {sectionsForSelectedGrades.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">Pick a class to see sections.</span>
                )}
              </div>
            </div>

            {/* Groups */}
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Specialised Groups</div>
              <div className="flex flex-wrap gap-1">
                {STUDENT_GROUPS.map((g) => {
                  const active = form.targets.groups.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => setForm((f) => ({ ...f, targets: { ...f.targets, groups: toggleIn(f.targets.groups, g) } }))}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] transition-all",
                        active
                          ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                          : "border-border/60 bg-background/60 text-muted-foreground hover:border-emerald-400/40 hover:text-foreground"
                      )}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual students */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Individual Students</div>
                {form.targets.studentIds.length > 0 && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, targets: { ...f.targets, studentIds: [] } }))}
                    className="text-[10px] text-rose-300 hover:underline"
                  >Clear</button>
                )}
              </div>
              <div className="max-h-28 overflow-y-auto rounded-md border border-border/60 bg-background/60 p-1">
                {students.length === 0 && <div className="px-2 py-1 text-[10px] text-muted-foreground">No students yet.</div>}
                {students.map((s) => {
                  const active = form.targets.studentIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setForm((f) => ({ ...f, targets: { ...f.targets, studentIds: toggleIn(f.targets.studentIds, s.id) } }))}
                      className={cn(
                        "flex w-full items-center justify-between rounded px-2 py-1 text-[11px] transition-colors",
                        active ? "bg-indigo-500/15 text-indigo-100" : "hover:bg-muted/40"
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">· {sectionLabel(s.sectionId)}</span>
                      </span>
                      {active && <Check className="h-3 w-3 text-indigo-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
          <div className="text-[11px] text-muted-foreground">
            {flash ? (
              <span className="inline-flex items-center gap-1 text-emerald-300"><Check className="h-3 w-3" /> {flash}</span>
            ) : (
              <>Targeting <strong className="text-foreground">{recipientsCount}</strong> {form.type === "project" ? "project" : "assignment"} recipient{recipientsCount === 1 ? "" : "s"}.</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => publish("draft")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-[11px] font-medium hover:border-indigo-400/50"
            >
              <FileText className="h-3.5 w-3.5" /> Save Draft
            </button>
            <button
              onClick={() => publish("active")}
              className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /> Publish Now
            </button>
          </div>
        </div>
      </section>

      {/* Tabs + tracking */}
      <section className="rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1">
            {([
              { id: "active" as const, label: "Active Tasks", icon: Sparkles, count: counts.active },
              { id: "draft" as const, label: "Drafts", icon: FileText, count: counts.draft },
              { id: "archived" as const, label: "Overdue / Archived", icon: Archive, count: counts.archived },
            ]).map(({ id, label, icon: Icon, count }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/90 text-white shadow-[0_4px_16px_-6px_rgba(99,102,241,0.7)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                  <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-white/20" : "bg-muted/60 text-foreground")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const dleft = daysUntil(t.deadline);
            const overdue = dleft < 0;
            const rate = t.totalRecipients > 0 ? Math.min(100, Math.round((t.submissions / t.totalRecipients) * 100)) : 0;
            const typeMeta = t.type === "project"
              ? { label: "Project", icon: FolderKanban, cls: "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200" }
              : { label: "Assignment", icon: ClipboardList, cls: "border-indigo-400/40 bg-indigo-500/10 text-indigo-200" };
            const TypeIcon = typeMeta.icon;
            return (
              <article
                key={t.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-slate-900/60 to-slate-900/30 p-3 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-[0_12px_40px_-15px_rgba(99,102,241,0.5)]"
              >
                <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", typeMeta.cls)}>
                        <TypeIcon className="h-3 w-3" /> {typeMeta.label}
                      </span>
                      {t.status === "draft" && (
                        <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-200">Draft</span>
                      )}
                      {overdue && t.status !== "draft" && (
                        <span className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-rose-200">Overdue</span>
                      )}
                    </div>
                    <h3 className="mt-1.5 truncate text-sm font-semibold">{t.title}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-muted-foreground">Max</div>
                    <div className="text-sm font-bold text-indigo-200">{t.maxMarks}</div>
                  </div>
                </div>

                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{t.instructions || "No instructions provided."}</p>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3 w-3" /> {t.submissions}/{t.totalRecipients} Submitted</span>
                    <span className="font-semibold text-foreground">{rate}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-700"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                {/* Micro metrics */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                  <div className="rounded-md border border-border/60 bg-background/40 p-1.5 text-center">
                    <div className="text-muted-foreground">Pending Eval</div>
                    <div className="text-sm font-bold text-amber-300">{t.pendingEval}</div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/40 p-1.5 text-center">
                    <div className="text-muted-foreground">Days Left</div>
                    <div className={cn("text-sm font-bold inline-flex items-center justify-center gap-1", overdue ? "text-rose-300" : dleft <= 2 ? "text-amber-300" : "text-emerald-300")}>
                      <Clock className="h-3 w-3" /> {overdue ? `${Math.abs(dleft)}d ago` : `${dleft}d`}
                    </div>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/40 p-1.5 text-center">
                    <div className="text-muted-foreground">Recipients</div>
                    <div className="text-sm font-bold text-indigo-200">{t.totalRecipients}</div>
                  </div>
                </div>

                {/* Targets pills */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.targets.classGrades.map((g) => (
                    <span key={`g${g}`} className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] text-indigo-200">Gr {g}</span>
                  ))}
                  {t.targets.sectionIds.slice(0, 3).map((sid) => (
                    <span key={sid} className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] text-fuchsia-200">{sectionLabel(sid)}</span>
                  ))}
                  {t.targets.groups.map((g) => (
                    <span key={g} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-200">{g}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
                  <div className="text-[10px] text-muted-foreground">Due {t.deadline}</div>
                  <div className="flex items-center gap-1">
                    {t.status === "draft" && (
                      <button onClick={() => publishDraft(t.id)} className="inline-flex items-center gap-1 rounded-md border border-indigo-400/40 bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-500/20">
                        <Send className="h-3 w-3" /> Publish
                      </button>
                    )}
                    {t.status !== "archived" && (
                      <button onClick={() => archiveTask(t.id)} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] hover:border-amber-400/50 hover:text-amber-200">
                        <Archive className="h-3 w-3" /> Archive
                      </button>
                    )}
                    <button onClick={() => removeTask(t.id)} className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[10px] hover:border-rose-500/50 hover:text-rose-300">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-background/30 p-8 text-center text-[12px] text-muted-foreground">
              No tasks in this view yet. Create one above to get started.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}