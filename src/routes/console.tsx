import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore, useRef, useEffect, createContext, useContext, useCallback } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/lib/theme";
import { QuickTourTrigger } from "@/components/quick-tour";
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
  Code2, Database, Coffee, Cat, Baby, FileType2, Sheet, Presentation, Palette, Play, Square, FlagTriangleRight,
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, Eraser, Brush, ChevronLeft, ChevronRight,
  Paperclip, Image as ImageIcon, ChevronUp,
  Activity, BarChart3, LineChart, FileType, Server, Globe2, Cpu, Zap, ShieldAlert, KeyRound, RefreshCw,
  Wand2, BrainCircuit, ListChecks, Type as TypeIcon, Shuffle, CircleDot, CircleCheck, X as XIcon,
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
  { id: "a6", ts: "2026-06-20 09:42", actor: "teacher:anita", action: "PUBLISHED_ASSIGNMENT", target: "task:Python Loops" },
  { id: "a7", ts: "2026-06-19 18:27", actor: "system", action: "BACKUP_COMPLETED", target: "snapshot:nightly-0619" },
  { id: "a8", ts: "2026-06-19 16:11", actor: "admin", action: "API_KEY_ROTATED", target: "key:gemini-prod" },
  { id: "a9", ts: "2026-06-19 12:03", actor: "school:s2", action: "ADDED_TEACHER", target: "EMP-014-06" },
  { id: "a10", ts: "2026-06-18 21:48", actor: "system", action: "RATE_LIMIT_RESET", target: "gateway:gemini" },
  { id: "a11", ts: "2026-06-18 15:30", actor: "teacher:rakesh", action: "EVALUATED_SUBMISSION", target: "portfolio:pf-2206-html" },
  { id: "a12", ts: "2026-06-18 10:15", actor: "school:s5", action: "ENROLLED_STUDENTS", target: "batch:c1-A x12" },
  { id: "a13", ts: "2026-06-17 23:55", actor: "system", action: "STORAGE_THRESHOLD", target: "bucket:portfolio @ 72%" },
  { id: "a14", ts: "2026-06-17 17:09", actor: "manager", action: "EXPORTED_REPORT", target: "csv:platform-weekly" },
  { id: "a15", ts: "2026-06-17 09:22", actor: "admin", action: "GRANTED_ROLE", target: "manager:ops-priya" },
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
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
              <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(16,185,129,0.7)]" /> live
            </span>
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
              <NotificationsBell
                open={notifsOpen}
                onOpenChange={setNotifsOpen}
                pendingCount={pendingCount}
              />

              <ThemeToggle />
              <QuickTourTrigger />

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
                {isAdmin && (
                  <SuperAdminControlCenter
                    schools={schools}
                    audit={audit}
                    onToggleSchool={toggleDisabled}
                  />
                )}
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
// Super-Admin Control Center
// =========================================================================
type GlobalUserRow = {
  id: string;
  name: string;
  email: string;
  role: "School Admin" | "Portal Manager" | "Teacher" | "Student" | "Super Admin";
  school: string;
  schoolCode: string;
  lastActive: string;
  blocked: boolean;
};

const SUPER_ADMIN_USERS: GlobalUserRow[] = [
  { id: "u-sa1", name: "Aarav Mehta",     email: "aarav@avartan.io",       role: "Super Admin",    school: "Avartan HQ",            schoolCode: "AVRT-HQ",     lastActive: "2m ago", blocked: false },
  { id: "u-pm1", name: "Ritika Nair",     email: "ritika@avartan.io",      role: "Portal Manager", school: "Avartan HQ",            schoolCode: "AVRT-HQ",     lastActive: "18m ago", blocked: false },
  { id: "u-pm2", name: "Karan Patel",     email: "karan@avartan.io",       role: "Portal Manager", school: "Avartan HQ",            schoolCode: "AVRT-HQ",     lastActive: "3h ago",  blocked: false },
  { id: "u-sc1", name: "Sunita Bhat",     email: "principal@mta.in",       role: "School Admin",   school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "9m ago",  blocked: false },
  { id: "u-sc2", name: "Dr. Joseph Lal",  email: "lab@pil.school",         role: "School Admin",   school: "Pune Innovation Lab",   schoolCode: "SCH-PUN-031", lastActive: "1d ago",  blocked: false },
  { id: "u-sc3", name: "Meena Iyer",      email: "ops@bskhub.org",         role: "School Admin",   school: "Bengaluru Skills Hub",  schoolCode: "SCH-BLR-022", lastActive: "5h ago",  blocked: true  },
  { id: "u-t1",  name: "Anita Rao",       email: "anita@mta.in",           role: "Teacher",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "11m ago", blocked: false },
  { id: "u-t2",  name: "Rakesh Verma",    email: "rakesh@mta.in",          role: "Teacher",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "44m ago", blocked: false },
  { id: "u-t3",  name: "Priya Sharma",    email: "priya@mta.in",           role: "Teacher",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "2h ago",  blocked: false },
  { id: "u-t4",  name: "Sandeep Mehta",   email: "sandeep@mta.in",         role: "Teacher",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "yesterday", blocked: true },
  { id: "u-t5",  name: "Neha Kapoor",     email: "neha@mta.in",            role: "Teacher",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "6h ago",  blocked: false },
  { id: "u-t6",  name: "Vikram Joshi",    email: "vikram@pil.school",      role: "Teacher",        school: "Pune Innovation Lab",   schoolCode: "SCH-PUN-031", lastActive: "1h ago",  blocked: false },
  { id: "u-st1", name: "Ira Khanna",      email: "ira@parent.com",         role: "Student",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "8m ago",  blocked: false },
  { id: "u-st2", name: "Veer Singh",      email: "veer@parent.com",        role: "Student",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "22m ago", blocked: false },
  { id: "u-st3", name: "Tara Mehta",      email: "tara@parent.com",        role: "Student",        school: "Pune Innovation Lab",   schoolCode: "SCH-PUN-031", lastActive: "3d ago",  blocked: true  },
  { id: "u-st4", name: "Arjun Nair",      email: "arjun@parent.com",       role: "Student",        school: "Bengaluru Skills Hub",  schoolCode: "SCH-BLR-022", lastActive: "1h ago",  blocked: false },
  { id: "u-st5", name: "Sara Joseph",     email: "sara@parent.com",        role: "Student",        school: "Delhi Public Pilot",    schoolCode: "SCH-DEL-001", lastActive: "30m ago", blocked: false },
  { id: "u-st6", name: "Rohan Gupta",     email: "rohan@parent.com",       role: "Student",        school: "Mumbai Tech Academy",   schoolCode: "SCH-MUM-014", lastActive: "4h ago",  blocked: false },
  { id: "u-st7", name: "Mihika Roy",      email: "mihika@parent.com",      role: "Student",        school: "Pune Innovation Lab",   schoolCode: "SCH-PUN-031", lastActive: "12m ago", blocked: false },
];

const LAB_USAGE = [
  { name: "Scratch",     volume: 4820, color: "from-amber-400 to-orange-500",   accent: "text-amber-300" },
  { name: "Scratch Jr",  volume: 3915, color: "from-pink-400 to-fuchsia-500",   accent: "text-fuchsia-300" },
  { name: "HTML & CSS",  volume: 3672, color: "from-rose-400 to-rose-600",     accent: "text-rose-300" },
  { name: "Python",      volume: 3120, color: "from-sky-400 to-blue-500",      accent: "text-sky-300" },
  { name: "Spreadsheet", volume: 2580, color: "from-emerald-400 to-teal-500",  accent: "text-emerald-300" },
  { name: "Word",        volume: 2240, color: "from-indigo-400 to-blue-500",   accent: "text-indigo-300" },
  { name: "SQL",         volume: 1980, color: "from-cyan-400 to-sky-500",      accent: "text-cyan-300" },
  { name: "Java",        volume: 1410, color: "from-orange-400 to-amber-500",  accent: "text-orange-300" },
  { name: "Presentation",volume: 1295, color: "from-rose-400 to-pink-500",     accent: "text-pink-300" },
  { name: "Paint",       volume: 1060, color: "from-fuchsia-400 to-violet-500",accent: "text-violet-300" },
];

function sparkPath(values: number[], w = 120, h = 32): string {
  if (values.length === 0) return "";
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1 || 1);
  return values.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function Sparkline({ values, color = "#a5b4fc", up = true }: { values: number[]; color?: string; up?: boolean }) {
  const d = sparkPath(values);
  const w = 120, h = 32;
  const area = `${d} L${w},${h} L0,${h} Z`;
  const gradId = useMemo(() => `sg-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={(() => {
        const min = Math.min(...values), max = Math.max(...values);
        const range = max - min || 1;
        return h - ((values[values.length - 1] - min) / range) * (h - 4) - 2;
      })()} r="2.5" fill={color} className={cn(up ? "" : "opacity-80")} />
    </svg>
  );
}

type ToastKind = "ok" | "info" | "warn";
function SuperAdminControlCenter({
  schools, audit, onToggleSchool,
}: {
  schools: typeof seedSchools;
  audit: AuditEntry[];
  onToggleSchool: (id: string) => void;
}) {
  const [users, setUsers] = useState<GlobalUserRow[]>(SUPER_ADMIN_USERS);
  const [q, setQ] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<"all" | "active" | "blocked">("all");

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
  const showToast = (kind: ToastKind, msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync block state of "School Admin" rows with the global schools state
  // (when admin toggles a school from the queue, the directory reflects it).
  useEffect(() => {
    setUsers((prev) => prev.map((u) => {
      if (u.role !== "School Admin") return u;
      const sc = schools.find((s) => s.code === u.schoolCode);
      return sc ? { ...u, blocked: sc.disabled } : u;
    }));
  }, [schools]);

  const totals = useMemo(() => {
    const teachers = users.filter((u) => u.role === "Teacher").length;
    const students = users.filter((u) => u.role === "Student").length;
    const blocked = users.filter((u) => u.blocked).length;
    return {
      schools: schools.length,
      licenses: schools.filter((s) => !s.disabled && s.status !== "Rejected").length,
      teachers,
      students,
      blocked,
    };
  }, [users, schools]);

  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (schoolFilter !== "all" && u.schoolCode !== schoolFilter) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (stateFilter !== "all" && (stateFilter === "blocked" ? !u.blocked : u.blocked)) return false;
      if (!term) return true;
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.school.toLowerCase().includes(term);
    });
  }, [users, q, schoolFilter, roleFilter, stateFilter]);

  const toggleBlock = (id: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      const next = { ...u, blocked: !u.blocked };
      // Stream a synthetic audit entry into the toast
      showToast(next.blocked ? "warn" : "ok",
        `${next.blocked ? "Blocked" : "Unblocked"} ${u.name} (${u.role}) — ${u.school}`);
      return next;
    }));
  };

  // Activity log — extends the global audit + adds simulated streaming entries.
  const STREAM_LOG: AuditEntry[] = [
    { id: "sa1", ts: "2026-06-22 09:42", actor: "super_admin", action: "BACKUP_COMPLETED",  target: "snapshot:nightly-2026-06-22" },
    { id: "sa2", ts: "2026-06-22 09:31", actor: "super_admin", action: "USER_BLOCKED",      target: "teacher:EMP-014-04" },
    { id: "sa3", ts: "2026-06-22 09:18", actor: "manager",     action: "APPROVED_SCHOOL",   target: "SCH-MUM-014" },
    { id: "sa4", ts: "2026-06-22 08:55", actor: "system",      action: "LICENSE_RENEWED",   target: "school:SCH-PUN-031" },
    { id: "sa5", ts: "2026-06-22 08:21", actor: "super_admin", action: "TEACHER_CREATED",   target: "EMP-031-04" },
    { id: "sa6", ts: "2026-06-22 07:50", actor: "system",      action: "API_KEY_ROTATED",   target: "gateway:lab-stream" },
    { id: "sa7", ts: "2026-06-21 22:14", actor: "system",      action: "BACKUP_COMPLETED",  target: "snapshot:nightly-2026-06-21" },
    { id: "sa8", ts: "2026-06-21 18:09", actor: "super_admin", action: "USER_UNBLOCKED",    target: "student:ADM-3101" },
    { id: "sa9", ts: "2026-06-21 14:32", actor: "manager",     action: "REJECTED_SCHOOL",   target: "SCH-HYD-007" },
  ];
  const liveAudit = useMemo(() => [...audit, ...STREAM_LOG].slice(0, 24), [audit]);

  // ---- Export helpers ----
  const buildCsv = (): string => {
    const header = ["id","name","email","role","school","schoolCode","lastActive","blocked"].join(",");
    const rows = filteredUsers.map((u) => [u.id,u.name,u.email,u.role,JSON.stringify(u.school),u.schoolCode,u.lastActive,u.blocked].join(","));
    return [header, ...rows].join("\n");
  };
  const triggerDownload = (filename: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const runExport = (kind: "csv" | "xlsx" | "pdf") => {
    setExportOpen(false);
    setExporting(kind);
    setTimeout(() => {
      const ts = new Date().toISOString().slice(0, 10);
      if (kind === "csv") {
        triggerDownload(`avartan-users-${ts}.csv`, "text/csv;charset=utf-8", buildCsv());
      } else if (kind === "xlsx") {
        // mock XLSX = CSV with .xls extension (Excel will open it cleanly)
        triggerDownload(`avartan-users-${ts}.xls`, "application/vnd.ms-excel", buildCsv());
      } else {
        const txt = `AVARTAN SKILL LAB — Global System Summary\nGenerated: ${new Date().toLocaleString()}\n\nSchools: ${totals.schools}\nActive licenses: ${totals.licenses}\nTeachers: ${totals.teachers}\nStudents: ${totals.students}\nBlocked accounts: ${totals.blocked}\n\n(mock PDF stream)`;
        triggerDownload(`avartan-summary-${ts}.txt`, "text/plain", txt);
      }
      setExporting(null);
      showToast("ok", kind === "csv" ? "CSV stream built and downloaded." : kind === "xlsx" ? "Excel layout exported successfully." : "PDF summary report generated.");
    }, 1400);
  };

  const uniqueSchoolCodes = useMemo(
    () => Array.from(new Set(users.map((u) => `${u.schoolCode}|${u.school}`))).map((k) => {
      const [code, name] = k.split("|"); return { code, name };
    }),
    [users]
  );
  const uniqueRoles: GlobalUserRow["role"][] = ["Super Admin", "Portal Manager", "School Admin", "Teacher", "Student"];

  const sparkSeries = {
    schools:  [12, 13, 14, 14, 16, 17, 18, 19, 20, 22, 23, 24],
    licenses: [10, 11, 13, 13, 15, 16, 17, 18, 18, 20, 21, 22],
    teachers: [60, 62, 66, 70, 74, 78, 81, 84, 88, 91, 94, 98],
    students: [820, 870, 905, 960, 1020, 1080, 1130, 1190, 1240, 1300, 1360, 1420],
  };

  const maxLab = Math.max(...LAB_USAGE.map((l) => l.volume));
  const ROLE_COLOR: Record<GlobalUserRow["role"], string> = {
    "Super Admin":   "border-amber-400/40 bg-amber-500/10 text-amber-200",
    "Portal Manager":"border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200",
    "School Admin":  "border-indigo-400/40 bg-indigo-500/10 text-indigo-200",
    "Teacher":       "border-sky-400/40 bg-sky-500/10 text-sky-200",
    "Student":       "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  };

  return (
    <div className="space-y-4">
      {/* Hero / Header with Export */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/60 via-slate-950/70 to-fuchsia-950/30 p-5 shadow-[0_24px_60px_-30px_rgba(99,102,241,0.55)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              <ShieldCheck className="h-3 w-3" /> Super-Admin Control Center
            </div>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight">Global platform analytics &amp; system health</h2>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3 text-emerald-300" /> All regions nominal</span>
              <span className="inline-flex items-center gap-1"><Server className="h-3 w-3 text-indigo-300" /> Edge p95 142ms</span>
              <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3 text-fuchsia-300" /> DB load 38%</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              disabled={!!exporting}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_12px_28px_-12px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-70"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {exporting ? <Loader2 className="relative h-4 w-4 animate-spin" /> : <Download className="relative h-4 w-4" />}
              <span className="relative">{exporting ? `Building ${exporting.toUpperCase()}…` : "Export Global System Data"}</span>
              {!exporting && <ChevronDown className={cn("relative h-3.5 w-3.5 transition-transform", exportOpen && "rotate-180")} />}
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-slate-950/90 shadow-[0_30px_60px_-20px_rgba(99,102,241,0.55)] backdrop-blur-xl">
                {[
                  { id: "csv"  as const, label: "Download CSV",         hint: ".csv", Icon: FileText },
                  { id: "xlsx" as const, label: "Download Excel Layout",hint: ".xls", Icon: FileSpreadsheet },
                  { id: "pdf"  as const, label: "Export PDF Summary",   hint: ".pdf", Icon: FileType },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => runExport(opt.id)}
                    className="group/opt flex w-full items-center justify-between gap-2 border-b border-white/5 px-3 py-2 text-left text-[12px] last:border-b-0 hover:bg-white/[0.05]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-indigo-200 group-hover/opt:border-indigo-400/50">
                        <opt.Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium">{opt.label}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{opt.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scorecards */}
        <div className="relative mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Registered Schools",  value: totals.schools,  delta: "+8% MoM",  color: "#a5b4fc", series: sparkSeries.schools,  Icon: School2 },
            { label: "Active Licenses",     value: totals.licenses, delta: "+5% MoM",  color: "#34d399", series: sparkSeries.licenses, Icon: KeyRound },
            { label: "Registered Teachers", value: totals.teachers, delta: "+12% MoM", color: "#f472b6", series: sparkSeries.teachers, Icon: GraduationCap },
            { label: "Active Students",     value: totals.students, delta: "+18% MoM", color: "#7dd3fc", series: sparkSeries.students, Icon: Users },
          ].map((c) => (
            <div key={c.label} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-white/[0.05]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <c.Icon className="h-3 w-3" /> {c.label}
                  </div>
                  <div className="mt-1 font-display text-2xl font-bold tabular-nums">{c.value.toLocaleString()}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                  <TrendingUp className="h-2.5 w-2.5" /> {c.delta}
                </span>
              </div>
              <div className="mt-2 -mx-1">
                <Sparkline values={c.series} color={c.color} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lab adoption + System health */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_24px_60px_-30px_rgba(99,102,241,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-300" />
              <h3 className="font-display text-sm font-semibold">Platform adoption by lab technology</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">last 30 days · sessions</span>
          </div>
          <div className="space-y-2">
            {LAB_USAGE.map((l) => {
              const pct = (l.volume / maxLab) * 100;
              return (
                <div key={l.name} className="group grid grid-cols-[110px_1fr_60px] items-center gap-3">
                  <div className={cn("text-[11px] font-semibold", l.accent)}>{l.name}</div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r shadow-[0_0_18px_-4px_rgba(99,102,241,0.6)] transition-all duration-700", l.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">{l.volume.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_24px_60px_-30px_rgba(217,70,239,0.35)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-fuchsia-300" />
              <h3 className="font-display text-sm font-semibold">System health</h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(16,185,129,0.7)]" /> Operational
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: "API gateway",      pct: 99.98, color: "from-emerald-400 to-teal-500", Icon: Globe2 },
              { label: "Database cluster", pct: 99.92, color: "from-sky-400 to-indigo-500",   Icon: Server },
              { label: "Lab compile farm", pct: 98.40, color: "from-amber-400 to-orange-500", Icon: Zap },
              { label: "Auth & sessions",  pct: 99.99, color: "from-fuchsia-400 to-pink-500", Icon: ShieldCheck },
            ].map((h) => (
              <div key={h.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground"><h.Icon className="h-3 w-3" /> {h.label}</span>
                  <span className="font-mono tabular-nums text-foreground">{h.pct.toFixed(2)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                  <div className={cn("h-full rounded-full bg-gradient-to-r", h.color)} style={{ width: `${h.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global User Directory */}
      <section className="rounded-2xl border border-white/10 bg-slate-950/60 shadow-[0_24px_60px_-30px_rgba(99,102,241,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-indigo-300" />
            <div>
              <h3 className="font-display text-sm font-semibold">Global User Directory · Master Block List</h3>
              <p className="text-[10px] text-muted-foreground">{filteredUsers.length} of {users.length} accounts · {totals.blocked} blocked</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, school…"
                className="h-8 w-56 rounded-lg border border-white/10 bg-slate-950/70 pl-7 pr-2 text-[11px] outline-none focus:border-indigo-400/60"
              />
            </div>
            <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="h-8 rounded-lg border border-white/10 bg-slate-950/70 px-2 text-[11px] outline-none focus:border-indigo-400/60">
              <option value="all">All schools</option>
              {uniqueSchoolCodes.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-8 rounded-lg border border-white/10 bg-slate-950/70 px-2 text-[11px] outline-none focus:border-indigo-400/60">
              <option value="all">All roles</option>
              {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
              {(["all", "active", "blocked"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStateFilter(s)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                    stateFilter === s
                      ? s === "blocked"
                        ? "bg-rose-500/20 text-rose-200 shadow-[0_4px_16px_-8px_rgba(244,63,94,0.7)]"
                        : "bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_4px_16px_-6px_rgba(99,102,241,0.7)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">User</th>
                <th className="px-3 py-2 text-left font-semibold">Role</th>
                <th className="px-3 py-2 text-left font-semibold">School</th>
                <th className="px-3 py-2 text-left font-semibold">Last Active</th>
                <th className="px-3 py-2 text-right font-semibold">Account Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id} className={cn("transition-colors hover:bg-white/[0.03]", u.blocked && "opacity-80")}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-bold",
                          u.blocked ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : "border-white/10 bg-slate-900/80 text-indigo-200"
                        )}>
                          {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        {!u.blocked && <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_6px_1px_rgba(16,185,129,0.7)]" />}
                      </div>
                      <div className="min-w-0">
                        <div className={cn("truncate font-semibold", u.blocked && "line-through decoration-rose-400/60 decoration-1")}>{u.name}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold", ROLE_COLOR[u.role])}>{u.role}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="truncate">{u.school}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{u.schoolCode}</div>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{u.lastActive}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider", u.blocked ? "text-rose-300" : "text-emerald-300")}>
                        {u.blocked ? "Blocked" : "Active"}
                      </span>
                      <button
                        onClick={() => {
                          toggleBlock(u.id);
                          // Reflect School Admin block into the schools state too
                          if (u.role === "School Admin") {
                            const sc = schools.find((s) => s.code === u.schoolCode);
                            if (sc) onToggleSchool(sc.id);
                          }
                        }}
                        role="switch"
                        aria-checked={!u.blocked}
                        aria-label={`Account access: ${u.blocked ? "Blocked" : "Active"}`}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/50",
                          u.blocked
                            ? "border-rose-400/40 bg-gradient-to-r from-rose-500/40 to-rose-600/40 shadow-[inset_0_0_10px_rgba(244,63,94,0.4)]"
                            : "border-emerald-400/40 bg-gradient-to-r from-emerald-500/50 to-teal-500/50 shadow-[0_0_14px_-2px_rgba(16,185,129,0.55)]"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform duration-300",
                          u.blocked ? "translate-x-0.5" : "translate-x-[22px]"
                        )} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-[12px] text-muted-foreground">No accounts match the active filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit trail */}
      <section className="rounded-2xl border border-white/10 bg-slate-950/60 shadow-[0_24px_60px_-30px_rgba(99,102,241,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-300" />
            <div>
              <h3 className="font-display text-sm font-semibold">Audit Trail · Streaming Activity Log</h3>
              <p className="text-[10px] text-muted-foreground">Cross-platform administrative timeline</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "4s" }} /> live
          </span>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-[11.5px]">
            <thead className="sticky top-0 bg-slate-950/95 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Timestamp</th>
                <th className="px-3 py-2 text-left font-semibold">Actor</th>
                <th className="px-3 py-2 text-left font-semibold">Event</th>
                <th className="px-3 py-2 text-left font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {liveAudit.map((a) => {
                const action = a.action;
                const tone =
                  action.startsWith("DELETED") || action.startsWith("REJECTED") || action.startsWith("DISABLED") || action.includes("BLOCKED")
                    ? "bg-rose-500/15 text-rose-200 border-rose-400/30"
                    : action.startsWith("APPROVED") || action.startsWith("ENABLED") || action.includes("UNBLOCKED") || action.includes("COMPLETED") || action.includes("RENEWED") || action.includes("CREATED")
                    ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
                    : action.includes("ROTATED")
                    ? "bg-amber-500/15 text-amber-200 border-amber-400/30"
                    : "bg-sky-500/15 text-sky-200 border-sky-400/30";
                return (
                  <tr key={a.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{a.ts}</td>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px]">
                        <UserCircle2 className="h-3 w-3 text-indigo-300" /> {a.actor}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold", tone)}>{action.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{a.target}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[60] animate-in fade-in slide-in-from-bottom-2">
          <div className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl",
            toast.kind === "ok"   && "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
            toast.kind === "warn" && "border-amber-400/40 bg-amber-500/15 text-amber-100",
            toast.kind === "info" && "border-indigo-400/40 bg-indigo-500/15 text-indigo-100",
          )}>
            {toast.kind === "ok"   && <CheckCircle2 className="h-4 w-4" />}
            {toast.kind === "warn" && <ShieldAlert  className="h-4 w-4" />}
            {toast.kind === "info" && <Sparkles    className="h-4 w-4" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
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
    const code = form.code.trim();
    const name = form.name.trim();
    const email = form.email.trim();
    const mobile = form.mobile.trim();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!code || !name) { setError("Employee Code and Full Name are required."); toast.error("Missing required fields"); return; }
    if (email && !emailRx.test(email)) { setError("Enter a valid email address."); toast.error("Invalid email format"); return; }
    if (mobile && mobile.replace(/\D/g, "").length < 7) { setError("Mobile number looks too short."); toast.error("Invalid mobile number"); return; }
    if (form.expertise.length === 0) { setError("Select at least one expertise."); toast.error("Pick at least one expertise area"); return; }
    const codeClash = teachers.some((t) => t.code.toLowerCase() === code.toLowerCase() && t.id !== editingId);
    if (codeClash) { setError("Employee Code must be unique."); toast.error("Employee Code already in use"); return; }

    if (editingId) {
      setTeachers((arr) => arr.map((t) => t.id === editingId ? { ...t, ...form, code, name, email, mobile } : t));
      toast.success("Teacher profile updated", { description: `${name} · ${code}` });
    } else {
      const id = `t${Date.now()}`;
      setTeachers((arr) => [
        ...arr,
        { id, code, name, email, mobile,
          expertise: form.expertise, sectionIds: form.sectionIds, status: form.status },
      ]);
      toast.success("Teacher onboarded", { description: `${name} added with ${form.expertise.length} skill area${form.expertise.length === 1 ? "" : "s"}` });
    }
    cancelEdit();
  };

  const toggleStatus = (id: string) => {
    setTeachers((arr) => arr.map((t) => t.id === id ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" } : t));
    const t = _teachers.find((x) => x.id === id);
    if (t) toast.success("Account Status Updated", { description: `${t.name} → ${t.status === "Active" ? "Inactive" : "Active"}` });
  };
  const remove = (id: string) => {
    if (!confirm("Remove this teacher from the roster?")) return;
    setTeachers((arr) => arr.filter((t) => t.id !== id));
    if (editingId === id) cancelEdit();
    toast.success("Teacher removed from roster");
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

const _seedStudentRoster: Student[] = [
  { id: "st1",  roll: "ADM-2206", name: "Ira Khanna",     sectionId: "c8-A", classGrade: 8, gender: "Female", dob: "2016-04-12", status: "Active" },
  { id: "st2",  roll: "ADM-2289", name: "Veer Singh",     sectionId: "c9-A", classGrade: 9, gender: "Male",   dob: "2015-09-03", status: "Active" },
  { id: "st3",  roll: "ADM-3101", name: "Tara Mehta",     sectionId: "c6-A", classGrade: 6, gender: "Female", dob: "2018-01-21", status: "Inactive" },
  { id: "st4",  roll: "ADM-3110", name: "Arjun Nair",     sectionId: "c1-A", classGrade: 1, gender: "Male",   dob: "2023-07-15", status: "Active" },
  { id: "st5",  roll: "ADM-3144", name: "Sara Joseph",    sectionId: "c1-B", classGrade: 1, gender: "Female", dob: "2023-11-02", status: "Active" },
  { id: "st6",  roll: "ADM-3201", name: "Kabir Bose",     sectionId: "c2-A", classGrade: 2, gender: "Male",   dob: "2022-05-09", status: "Active" },
  { id: "st7",  roll: "ADM-3215", name: "Aanya Iyer",     sectionId: "c2-B", classGrade: 2, gender: "Female", dob: "2022-08-22", status: "Active" },
  { id: "st8",  roll: "ADM-3322", name: "Rohan Patel",    sectionId: "c3-A", classGrade: 3, gender: "Male",   dob: "2021-02-14", status: "Active" },
  { id: "st9",  roll: "ADM-3408", name: "Meera Pillai",   sectionId: "c3-B", classGrade: 3, gender: "Female", dob: "2021-06-30", status: "Active" },
  { id: "st10", roll: "ADM-3501", name: "Dev Malhotra",   sectionId: "c4-A", classGrade: 4, gender: "Male",   dob: "2020-04-05", status: "Active" },
  { id: "st11", roll: "ADM-3580", name: "Saanvi Reddy",   sectionId: "c4-B", classGrade: 4, gender: "Female", dob: "2020-11-19", status: "Active" },
  { id: "st12", roll: "ADM-3611", name: "Ayaan Khan",     sectionId: "c5-A", classGrade: 5, gender: "Male",   dob: "2019-03-08", status: "Active" },
  { id: "st13", roll: "ADM-3640", name: "Zara Ali",       sectionId: "c5-B", classGrade: 5, gender: "Female", dob: "2019-07-27", status: "Inactive" },
  { id: "st14", roll: "ADM-3712", name: "Vihaan Gupta",   sectionId: "c6-A", classGrade: 6, gender: "Male",   dob: "2018-02-11", status: "Active" },
  { id: "st15", roll: "ADM-3744", name: "Anaya Sen",      sectionId: "c6-B", classGrade: 6, gender: "Female", dob: "2018-09-04", status: "Active" },
  { id: "st16", roll: "ADM-3801", name: "Reyansh Das",    sectionId: "c7-A", classGrade: 7, gender: "Male",   dob: "2017-05-22", status: "Active" },
  { id: "st17", roll: "ADM-3833", name: "Pari Saxena",    sectionId: "c7-B", classGrade: 7, gender: "Female", dob: "2017-10-15", status: "Active" },
  { id: "st18", roll: "ADM-3902", name: "Krishna Menon",  sectionId: "c8-A", classGrade: 8, gender: "Male",   dob: "2016-01-30", status: "Active" },
  { id: "st19", roll: "ADM-3960", name: "Aaradhya Roy",   sectionId: "c8-B", classGrade: 8, gender: "Female", dob: "2016-06-08", status: "Active" },
  { id: "st20", roll: "ADM-4011", name: "Aditya Shah",    sectionId: "c9-A", classGrade: 9, gender: "Male",   dob: "2015-04-19", status: "Active" },
  { id: "st21", roll: "ADM-4055", name: "Diya Kulkarni",  sectionId: "c9-B", classGrade: 9, gender: "Female", dob: "2015-12-01", status: "Active" },
  { id: "st22", roll: "ADM-4108", name: "Yash Choudhary", sectionId: "c10-A", classGrade: 10, gender: "Male",   dob: "2014-08-17", status: "Active" },
  { id: "st23", roll: "ADM-4144", name: "Riya Bhatt",     sectionId: "c10-B", classGrade: 10, gender: "Female", dob: "2014-11-25", status: "Active" },
  { id: "st24", roll: "ADM-4203", name: "Ishaan Pandey",  sectionId: "c11-A", classGrade: 11, gender: "Male",   dob: "2013-07-09", status: "Active" },
  { id: "st25", roll: "ADM-4290", name: "Myra Bansal",    sectionId: "c12-A", classGrade: 12, gender: "Female", dob: "2012-02-28", status: "Active" },
];
let _students: Student[] = [..._seedStudentRoster];
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
    const roll = form.roll.trim();
    const name = form.name.trim();
    if (!roll || !name) { setError("Roll Number and Full Name are required."); toast.error("Missing required fields"); return; }
    if (!form.dob) { setError("Date of Birth is required."); toast.error("Date of birth is required"); return; }
    if (new Date(form.dob).getTime() > Date.now()) { setError("Date of Birth cannot be in the future."); toast.error("Invalid date of birth"); return; }
    const clash = students.some((s) => s.roll.toLowerCase() === roll.toLowerCase() && s.id !== editingId);
    if (clash) { setError("Roll Number must be unique."); toast.error("Roll number already exists"); return; }

    setSubmitting(true);
    setTimeout(() => {
      if (editingId) {
        setStudents((arr) => arr.map((s) => s.id === editingId ? { ...s, ...form, roll, name } : s));
        toast.success("Student profile updated", { description: `${name} · ${roll}` });
      } else {
        setStudents((arr) => [
          { id: `st${Date.now()}`, ...form, roll, name },
          ...arr,
        ]);
        toast.success("Student added to roster", { description: `${name} · Grade ${form.classGrade}` });
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
  quiz?: QuizQuestion[];
  quizMeta?: { structure: QuizStructure; marksPerQuestion: number; source: "manual" | "gemini"; topic?: string; difficulty?: "easy" | "medium" | "hard" };
};

export type QuizStructure = "mcq" | "tf" | "fill" | "hybrid";
export type QuizKind = "mcq" | "tf" | "fill";
export type QuizQuestion = {
  id: string;
  kind: QuizKind;
  question: string;
  options?: string[];            // mcq
  correctIndex?: number;         // mcq
  correctBool?: boolean;         // tf
  answer?: string;               // fill
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
// Extra realistic timeline entries (6 more → 10 total)
_tasks.push(
  {
    id: "tk5", type: "assignment", title: "CSS Flexbox Layout Challenge",
    instructions: "Recreate the provided dashboard layout using Flexbox only. No grid or absolute positioning.",
    maxMarks: 25, deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [7], sectionIds: ["c7-A", "c7-B"], studentIds: [], groups: ["Design Studio"] },
    totalRecipients: 38, submissions: 21, pendingEval: 12, createdAt: "2026-06-19",
  },
  {
    id: "tk6", type: "project", title: "MS Excel — Class Budget Tracker",
    instructions: "Build a working budget tracker with SUM/AVG formulas across 12 monthly columns.",
    maxMarks: 35, deadline: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [8], sectionIds: ["c8-A", "c8-B"], studentIds: [], groups: [] },
    totalRecipients: 31, submissions: 8, pendingEval: 8, createdAt: "2026-06-17",
  },
  {
    id: "tk7", type: "assignment", title: "Java — OOP Basics (Quiz)",
    instructions: "Auto-graded quiz on classes, inheritance and polymorphism. 10 mixed questions.",
    maxMarks: 20, deadline: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [10], sectionIds: ["c10-A"], studentIds: [], groups: [] },
    totalRecipients: 18, submissions: 16, pendingEval: 2, createdAt: "2026-06-08",
  },
  {
    id: "tk8", type: "project", title: "Scratch Jr — My Family Story",
    instructions: "A 2-page interactive story introducing each family member with sound.",
    maxMarks: 20, deadline: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    status: "active",
    targets: { classGrades: [2], sectionIds: ["c2-A", "c2-B"], studentIds: [], groups: [] },
    totalRecipients: 24, submissions: 5, pendingEval: 5, createdAt: "2026-06-16",
  },
  {
    id: "tk9", type: "assignment", title: "PowerPoint — Persuasive Pitch Deck",
    instructions: "5-slide pitch deck on a club idea. Use consistent theme + speaker notes.",
    maxMarks: 30, deadline: new Date(Date.now() + 11 * 86400000).toISOString().slice(0, 10),
    status: "draft",
    targets: { classGrades: [11], sectionIds: ["c11-A"], studentIds: [], groups: ["Math Olympiad"] },
    totalRecipients: 0, submissions: 0, pendingEval: 0, createdAt: "2026-06-21",
  },
  {
    id: "tk10", type: "assignment", title: "Paint — Logo Design Sprint",
    instructions: "Design an original logo for your section. Export as PNG with a one-line concept note.",
    maxMarks: 15, deadline: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10),
    status: "archived",
    targets: { classGrades: [3], sectionIds: ["c3-A"], studentIds: [], groups: [] },
    totalRecipients: 20, submissions: 18, pendingEval: 0, createdAt: "2026-06-02",
  },
);
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

// ========================================================================
// Portfolio store + Lab → Assignment snapshot registry
// ========================================================================
export type LabKind = "html" | "sql" | "java" | "scratch" | "scratchjr" | "word" | "excel" | "ppt" | "paint";
export type LabSnapshot = {
  kind: LabKind;
  labName: string;
  payload: unknown;
  preview?: string; // html string OR data URL OR text
  previewKind?: "html" | "image" | "text" | "grid" | "slides" | "blocks";
  bytes: number;
};
export type PortfolioStatus = "draft" | "submitted" | "evaluated";
export type PortfolioItem = {
  id: string;
  studentId: string;
  taskId?: string;
  taskTitle?: string;
  status: PortfolioStatus;
  createdAt: number;
  grade?: number;
  snapshot: LabSnapshot;
};
const _seedPortfolio: PortfolioItem[] = [
  {
    id: "pf1", studentId: "st20", taskId: "tk1", taskTitle: "HTML Form Validation Worksheet",
    status: "evaluated", createdAt: Date.now() - 86400000 * 6, grade: 18,
    snapshot: { kind: "html", labName: "HTML & CSS Lab",
      payload: { html: "<form><input required type='email' placeholder='Email'/><button>Submit</button></form>", css: "form{display:flex;gap:.5rem}input{padding:.5rem;border:1px solid #6366f1}" },
      preview: "<form style=\"display:flex;gap:.5rem;font-family:sans-serif\"><input type='email' placeholder='Email' style='padding:.5rem;border:1px solid #6366f1'/><button style='padding:.5rem 1rem;background:#6366f1;color:#fff;border:0;border-radius:6px'>Submit</button></form>",
      previewKind: "html", bytes: 412 } },
  {
    id: "pf2", studentId: "st21", taskId: "tk1", taskTitle: "HTML Form Validation Worksheet",
    status: "submitted", createdAt: Date.now() - 86400000 * 2,
    snapshot: { kind: "html", labName: "HTML & CSS Lab",
      payload: { html: "<h1>Sign Up</h1><form><label>Email <input type='email'/></label></form>", css: "h1{color:#4f46e5}" },
      preview: "<div style='font-family:sans-serif'><h1 style='color:#4f46e5'>Sign Up</h1><form><label>Email <input type='email' style='padding:.4rem'/></label></form></div>",
      previewKind: "html", bytes: 318 } },
  {
    id: "pf3", studentId: "st14", taskId: "tk3", taskTitle: "Python — Loops Practice Set",
    status: "evaluated", createdAt: Date.now() - 86400000 * 9, grade: 27,
    snapshot: { kind: "sql", labName: "SQL Lab",
      payload: { query: "SELECT name, marks FROM students WHERE marks > 80;", cols: ["name", "marks"],
        rows: [{ name: "Ira Khanna", marks: 92 }, { name: "Veer Singh", marks: 88 }, { name: "Aanya Iyer", marks: 84 }] },
      preview: "SELECT name, marks FROM students WHERE marks > 80;", previewKind: "grid", bytes: 264 } },
  {
    id: "pf4", studentId: "st22", taskId: "tk4", taskTitle: "MySQL Mini-DB Schema (Draft)",
    status: "draft", createdAt: Date.now() - 86400000 * 1,
    snapshot: { kind: "sql", labName: "SQL Lab",
      payload: { query: "CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(120), author VARCHAR(80));", cols: ["info"], rows: [{ info: "Statement queued" }] },
      preview: "CREATE TABLE books (id INT PRIMARY KEY, title VARCHAR(120));", previewKind: "text", bytes: 198 } },
  {
    id: "pf5", studentId: "st4", taskId: "tk10", taskTitle: "Paint — Logo Design Sprint",
    status: "evaluated", createdAt: Date.now() - 86400000 * 10, grade: 14,
    snapshot: { kind: "paint", labName: "MS Paint Lab",
      payload: { strokes: [
        { x: 32, y: 40, x2: 120, y2: 40, color: "#6366f1", size: 6 },
        { x: 120, y: 40, x2: 120, y2: 120, color: "#6366f1", size: 6 },
        { x: 32, y: 40, x2: 32, y2: 120, color: "#f59e0b", size: 6 },
        { x: 32, y: 120, x2: 120, y2: 120, color: "#10b981", size: 6 },
      ] },
      preview: "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect x='32' y='40' width='88' height='80' fill='none' stroke='#6366f1' stroke-width='6'/></svg>"),
      previewKind: "image", bytes: 612 } },
  {
    id: "pf6", studentId: "st12", taskId: "tk6", taskTitle: "MS Excel — Class Budget Tracker",
    status: "submitted", createdAt: Date.now() - 86400000 * 3,
    snapshot: { kind: "excel", labName: "Excel Lab",
      payload: { cells: { A1: "Month", B1: "Income", C1: "Expense", A2: "Jan", B2: "12000", C2: "8500", A3: "Feb", B3: "11500", C3: "9000", A4: "Total", B4: "=SUM(B2:B3)", C4: "=SUM(C2:C3)" } },
      preview: "Jan/Feb budget · SUM formulas", previewKind: "grid", bytes: 540 } },
  {
    id: "pf7", studentId: "st8", taskId: "tk2", taskTitle: "Scratch — Interactive Story Capstone",
    status: "evaluated", createdAt: Date.now() - 86400000 * 7, grade: 44,
    snapshot: { kind: "scratch", labName: "Scratch Lab",
      payload: { blocks: [
        { type: "motion", text: "move 10 steps" },
        { type: "looks", text: "say Hello! for 2 seconds" },
        { type: "sound", text: "play sound meow" },
        { type: "motion", text: "turn 15 degrees" },
      ] },
      preview: "4 blocks · cat sprite story", previewKind: "blocks", bytes: 220 } },
  {
    id: "pf8", studentId: "st18", taskId: "tk9", taskTitle: "PowerPoint — Persuasive Pitch Deck",
    status: "draft", createdAt: Date.now() - 86400000 * 0.5,
    snapshot: { kind: "ppt", labName: "PowerPoint Lab",
      payload: { slides: [
        { title: "Robotics Club", body: "Pitch to launch an after-school robotics squad." },
        { title: "Why Now?", body: "STEM enrolment up 32% across our sections." },
        { title: "Ask", body: "Budget of ₹40k + 2 mentor hours / week." },
      ] },
      preview: "3 slides · pitch deck draft", previewKind: "slides", bytes: 410 } },
];
let _portfolio: PortfolioItem[] = [..._seedPortfolio];
const portfolioListeners = new Set<() => void>();
function setPortfolio(updater: (p: PortfolioItem[]) => PortfolioItem[]) {
  _portfolio = updater(_portfolio);
  portfolioListeners.forEach((l) => l());
}
function usePortfolio() {
  return useSyncExternalStore(
    (cb) => { portfolioListeners.add(cb); return () => portfolioListeners.delete(cb); },
    () => _portfolio,
    () => _portfolio,
  );
}

type SnapshotGetter = () => LabSnapshot | null;
const LabSnapshotCtx = createContext<{ register: (g: SnapshotGetter | null) => void }>({ register: () => {} });
function useRegisterSnapshot(getter: SnapshotGetter, deps: ReadonlyArray<unknown>) {
  const { register } = useContext(LabSnapshotCtx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { register(getter); return () => register(null); }, deps);
}

function approxBytes(v: unknown): number {
  try { return new Blob([typeof v === "string" ? v : JSON.stringify(v)]).size; } catch { return 0; }
}
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
const LAB_ICON: Record<LabKind, typeof Code2> = {
  html: Code2, sql: Database, java: Coffee, scratch: Cat, scratchjr: Baby,
  word: FileType2, excel: Sheet, ppt: Presentation, paint: Palette,
};
const LAB_TINT: Record<LabKind, string> = {
  html: "from-orange-500/30 to-rose-500/20",
  sql: "from-sky-500/30 to-indigo-500/20",
  java: "from-amber-500/30 to-orange-500/20",
  scratch: "from-amber-400/30 to-yellow-500/20",
  scratchjr: "from-pink-500/30 to-fuchsia-500/20",
  word: "from-blue-500/30 to-indigo-500/20",
  excel: "from-emerald-500/30 to-teal-500/20",
  ppt: "from-rose-500/30 to-orange-500/20",
  paint: "from-fuchsia-500/30 to-violet-500/20",
};

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

  // ===== Quiz Builder State =====
  const [quizStructure, setQuizStructure] = useState<QuizStructure>("mcq");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [marksPerQ, setMarksPerQ] = useState<number>(2);
  const [method, setMethod] = useState<"manual" | "gemini">("manual");
  const [aiTopic, setAiTopic] = useState<string>("");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);

  const newQid = () => `q${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  const blankQuestionOfKind = (kind: QuizKind): QuizQuestion => {
    if (kind === "mcq") return { id: newQid(), kind, question: "", options: ["", "", "", ""], correctIndex: 0 };
    if (kind === "tf")  return { id: newQid(), kind, question: "", correctBool: true };
    return { id: newQid(), kind: "fill", question: "The capital of France is ____.", answer: "" };
  };
  const pickKindForStructure = (s: QuizStructure, i: number): QuizKind => {
    if (s === "hybrid") return (["mcq", "tf", "fill"] as QuizKind[])[i % 3];
    return s as QuizKind;
  };
  const seedManualQuiz = () => {
    const next: QuizQuestion[] = [];
    for (let i = 0; i < numQuestions; i++) next.push(blankQuestionOfKind(pickKindForStructure(quizStructure, i)));
    setQuiz(next);
  };
  const updateQuestion = (id: string, patch: Partial<QuizQuestion>) =>
    setQuiz((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } as QuizQuestion : q)));
  const updateOption = (id: string, idx: number, value: string) =>
    setQuiz((qs) => qs.map((q) => q.id === id && q.options ? { ...q, options: q.options.map((o, i) => i === idx ? value : o) } : q));
  const deleteQuestion = (id: string) => setQuiz((qs) => qs.filter((q) => q.id !== id));
  const addQuestion = (kind: QuizKind) => setQuiz((qs) => [...qs, blankQuestionOfKind(kind)]);

  const generateWithGemini = async () => {
    if (!aiTopic.trim()) { setAiError("Enter a topic to generate."); toast.error("Topic is required"); return; }
    if (numQuestions <= 0 || marksPerQ <= 0) { setAiError("Question count and marks per question must be greater than 0."); toast.error("Counts must be > 0"); return; }
    setAiLoading(true); setAiError(null);
    const structureDesc = quizStructure === "hybrid"
      ? "a mix of multiple-choice, true/false, and fill-in-the-blank"
      : quizStructure === "mcq" ? "multiple-choice questions only"
      : quizStructure === "tf" ? "true/false questions only"
      : "fill-in-the-blank questions only";
    const schema = `Each item in the array MUST match one of these shapes exactly:
{"kind":"mcq","question":"...","options":["A","B","C","D"],"correctIndex":0}
{"kind":"tf","question":"...","correctBool":true}
{"kind":"fill","question":"sentence with ____ blank","answer":"..."}`;
    const sys = `You are an assessment generator. Return ONLY a JSON array (no prose, no markdown fences) of exactly ${numQuestions} questions about "${aiTopic.trim()}" at ${aiDifficulty.toUpperCase()} difficulty. Use ${structureDesc}. ${schema}`;
    try {
      const apiKey = "AIzaSyDO1AYYJEn8Xs16v93_sMeyT_n3wJEp1JM";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: sys }] }],
          generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const arr = JSON.parse(cleaned);
      if (!Array.isArray(arr)) throw new Error("Bad response shape");
      const normalized: QuizQuestion[] = arr.slice(0, numQuestions).map((q: any) => {
        const kind: QuizKind = q.kind === "tf" || q.kind === "fill" ? q.kind : "mcq";
        if (kind === "mcq") {
          const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options.slice(0, 4).map(String) : ["", "", "", ""];
          while (opts.length < 4) opts.push("");
          return { id: newQid(), kind, question: String(q.question ?? ""), options: opts, correctIndex: Math.max(0, Math.min(opts.length - 1, Number(q.correctIndex) || 0)) };
        }
        if (kind === "tf") {
          return { id: newQid(), kind, question: String(q.question ?? ""), correctBool: Boolean(q.correctBool) };
        }
        return { id: newQid(), kind: "fill", question: String(q.question ?? ""), answer: String(q.answer ?? "") };
      });
      if (normalized.length === 0) throw new Error("No questions returned");
      setQuiz(normalized);
      toast.success("AI Assignment Generated Successfully", { description: `${normalized.length} ${quizStructure.toUpperCase()} questions on "${aiTopic.trim()}"` });
    } catch (e: any) {
      const msg = e?.message ?? "Generation failed. Try a different topic.";
      setAiError(msg);
      toast.error("AI generation failed", { description: msg });
    } finally {
      setAiLoading(false);
    }
  };

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
    if (!form.title.trim()) { setFlash("Title is required."); setTimeout(() => setFlash(null), 1800); toast.error("Title is required"); return; }
    if (form.maxMarks <= 0) { setFlash("Max Marks must be greater than 0."); setTimeout(() => setFlash(null), 1800); toast.error("Max Marks must be > 0"); return; }
    if (quiz.length > 0) {
      if (marksPerQ <= 0) { toast.error("Marks per question must be > 0"); return; }
      const bad = quiz.find((q) => !q.question.trim());
      if (bad) { toast.error("Every quiz question needs a stem"); return; }
    }
    const id = `tk${Date.now()}`;
    const total = status === "draft" ? 0 : recipientsCount;
    const hasQuiz = quiz.length > 0;
    const computedMarks = hasQuiz ? quiz.length * marksPerQ : form.maxMarks;
    setTasks((t) => [
      {
        id, type: form.type, title: form.title.trim(),
        instructions: form.instructions.trim(), maxMarks: computedMarks,
        deadline: form.deadline, status,
        targets: { ...form.targets },
        totalRecipients: total, submissions: 0, pendingEval: 0,
        createdAt: new Date().toISOString().slice(0, 10),
        quiz: hasQuiz ? quiz : undefined,
        quizMeta: hasQuiz ? { structure: quizStructure, marksPerQuestion: marksPerQ, source: method, topic: aiTopic || undefined, difficulty: method === "gemini" ? aiDifficulty : undefined } : undefined,
      },
      ...t,
    ]);
    setForm(blank());
    setQuiz([]); setAiTopic(""); setAiError(null);
    setFlash(status === "draft" ? "Saved as draft." : `Published to ${total} recipient${total === 1 ? "" : "s"}.`);
    setTimeout(() => setFlash(null), 2200);
    if (status === "draft") toast.success("Draft saved", { description: form.title.trim() });
    else toast.success("Assignment published", { description: `Sent to ${total} recipient${total === 1 ? "" : "s"}` });
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

        {/* ===== Quiz Builder + AI Generation ===== */}
        <div className="relative mt-4 rounded-xl border border-border/60 bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-indigo-950/40 p-3 backdrop-blur-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
              <BrainCircuit className="h-3.5 w-3.5 text-indigo-300" /> Quiz Structure & Generation
              <span className="ml-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-indigo-200">Beta</span>
            </div>
            {quiz.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                <CheckCheck className="h-3 w-3" /> {quiz.length} q · {quiz.length * marksPerQ} marks
              </span>
            )}
          </div>

          {/* Structure segmented controller */}
          <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {([
              { id: "mcq" as const, label: "MCQ", icon: ListChecks },
              { id: "tf" as const, label: "True / False", icon: ToggleRight },
              { id: "fill" as const, label: "Fill Blanks", icon: TypeIcon },
              { id: "hybrid" as const, label: "Hybrid Mix", icon: Shuffle },
            ]).map(({ id, label, icon: Icon }) => {
              const active = quizStructure === id;
              return (
                <button
                  key={id}
                  onClick={() => setQuizStructure(id)}
                  className={cn(
                    "group inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-all duration-300",
                    active
                      ? "border-indigo-400/60 bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 text-white shadow-[0_8px_24px_-10px_rgba(99,102,241,0.7)]"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:border-indigo-400/40 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active && "text-indigo-200")} /> {label}
                </button>
              );
            })}
          </div>

          {/* Numeric + method controls */}
          <div className="grid gap-2 md:grid-cols-3">
            <div className="grid gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Questions</label>
              <input type="number" min={1} max={30} value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-full rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Marks / Question</label>
              <input type="number" min={1} max={20} value={marksPerQ}
                onChange={(e) => setMarksPerQ(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-full rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Methodology</label>
              <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1">
                {([
                  { id: "manual" as const, label: "Manual", icon: Pencil },
                  { id: "gemini" as const, label: "Gemini AI", icon: Wand2 },
                ]).map(({ id, label, icon: Icon }) => {
                  const active = method === id;
                  return (
                    <button key={id} onClick={() => setMethod(id)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_4px_16px_-6px_rgba(99,102,241,0.7)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}>
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI sub-form */}
          {method === "gemini" && (
            <div className="relative mt-3 rounded-xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent p-3">
              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
                <div className="grid gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-indigo-200/80">Topic / Concept</label>
                  <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Photosynthesis · CSS Flexbox · World War II"
                    className="w-full rounded-lg border border-indigo-400/30 bg-background/70 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider text-indigo-200/80">Difficulty</label>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-background/60 p-1">
                    {(["easy", "medium", "hard"] as const).map((d) => {
                      const active = aiDifficulty === d;
                      const tones = d === "easy" ? "from-emerald-500 to-teal-500" : d === "medium" ? "from-amber-500 to-orange-500" : "from-rose-500 to-fuchsia-500";
                      return (
                        <button key={d} onClick={() => setAiDifficulty(d)}
                          className={cn(
                            "flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold capitalize transition-all",
                            active ? `bg-gradient-to-r ${tones} text-white shadow-[0_4px_16px_-6px_rgba(0,0,0,0.5)]` : "text-muted-foreground hover:text-foreground"
                          )}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={generateWithGemini} disabled={aiLoading}
                    className="group inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-3 text-[11px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(139,92,246,0.8)] transition-transform hover:scale-[1.02] disabled:opacity-60 md:w-auto">
                    <Wand2 className={cn("h-3.5 w-3.5", aiLoading && "animate-pulse")} /> {aiLoading ? "Generating…" : "Generate"}
                  </button>
                </div>
              </div>
              {aiError && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
                  <AlertTriangle className="h-3 w-3" /> {aiError}
                </div>
              )}
            </div>
          )}

          {method === "manual" && quiz.length === 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-3">
              <div className="text-[11px] text-muted-foreground">Start building a {numQuestions}-question {quizStructure.toUpperCase()} set manually.</div>
              <button onClick={seedManualQuiz}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-[0_6px_20px_-8px_rgba(99,102,241,0.7)]">
                <Plus className="h-3 w-3" /> Seed Blank Questions
              </button>
            </div>
          )}

          {/* Editable Review Canvas */}
          {quiz.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                  <Pencil className="h-3.5 w-3.5 text-indigo-300" /> Editable Review Canvas
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => addQuestion("mcq")} className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] font-medium hover:border-indigo-400/50">+ MCQ</button>
                  <button onClick={() => addQuestion("tf")} className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] font-medium hover:border-indigo-400/50">+ T/F</button>
                  <button onClick={() => addQuestion("fill")} className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] font-medium hover:border-indigo-400/50">+ Fill</button>
                  <button onClick={() => setQuiz([])} className="ml-1 inline-flex items-center gap-1 rounded-md border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-200 hover:bg-rose-500/20">
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                {quiz.map((q, qi) => (
                  <div key={q.id} className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-slate-900/60 to-slate-900/30 p-3 backdrop-blur transition-all hover:border-indigo-400/40 hover:shadow-[0_10px_30px_-15px_rgba(99,102,241,0.5)]">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500/20 px-1.5 text-[10px] font-bold text-indigo-200">{qi + 1}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {q.kind === "mcq" ? <ListChecks className="h-3 w-3" /> : q.kind === "tf" ? <ToggleRight className="h-3 w-3" /> : <TypeIcon className="h-3 w-3" />}
                          {q.kind}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {marksPerQ} mk</span>
                      </div>
                      <button onClick={() => deleteQuestion(q.id)} className="rounded-md p-1 text-rose-300 opacity-0 transition-opacity hover:bg-rose-500/10 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                      rows={2}
                      placeholder="Question stem…"
                      className="w-full resize-none rounded-md border border-border/60 bg-background/70 px-2.5 py-1.5 text-[12px] outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
                    />

                    {q.kind === "mcq" && q.options && (
                      <div className="mt-2 grid gap-1.5">
                        {q.options.map((opt, oi) => {
                          const correct = q.correctIndex === oi;
                          return (
                            <div key={oi} className={cn("flex items-center gap-2 rounded-md border px-2 py-1 transition-all",
                              correct ? "border-emerald-400/60 bg-emerald-500/10" : "border-border/60 bg-background/60")}>
                              <button onClick={() => updateQuestion(q.id, { correctIndex: oi })} className="shrink-0">
                                {correct ? <CircleCheck className="h-4 w-4 text-emerald-300" /> : <CircleDot className="h-4 w-4 text-muted-foreground" />}
                              </button>
                              <input
                                value={opt}
                                onChange={(e) => updateOption(q.id, oi, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                className="w-full bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/60"
                              />
                              {q.options!.length > 2 && (
                                <button onClick={() => updateQuestion(q.id, { options: q.options!.filter((_, i) => i !== oi), correctIndex: q.correctIndex === oi ? 0 : (q.correctIndex! > oi ? q.correctIndex! - 1 : q.correctIndex) })}
                                  className="text-rose-300/70 hover:text-rose-300"><XIcon className="h-3 w-3" /></button>
                              )}
                            </div>
                          );
                        })}
                        {q.options.length < 6 && (
                          <button onClick={() => updateQuestion(q.id, { options: [...q.options!, ""] })}
                            className="self-start rounded-md border border-dashed border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:border-indigo-400/40 hover:text-foreground">
                            + Add option
                          </button>
                        )}
                      </div>
                    )}

                    {q.kind === "tf" && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1">
                        {([true, false] as const).map((b) => {
                          const active = q.correctBool === b;
                          return (
                            <button key={String(b)} onClick={() => updateQuestion(q.id, { correctBool: b })}
                              className={cn("rounded-md px-3 py-1 text-[11px] font-semibold transition-all",
                                active
                                  ? b ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.7)]"
                                      : "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-[0_4px_14px_-4px_rgba(244,63,94,0.7)]"
                                  : "text-muted-foreground hover:text-foreground"
                              )}>
                              {b ? "True" : "False"}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.kind === "fill" && (
                      <div className="mt-2 grid gap-1">
                        <label className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Correct Answer (replaces ____)</label>
                        <input
                          value={q.answer ?? ""}
                          onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
                          placeholder="Expected answer"
                          className="w-full rounded-md border border-emerald-400/30 bg-emerald-500/5 px-2 py-1 text-[12px] outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Loading Overlay */}
          {aiLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-slate-950/70 backdrop-blur-md">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-slate-900/60 px-6 py-5 shadow-[0_20px_60px_-20px_rgba(99,102,241,0.8)]">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500">
                    <Wand2 className="h-5 w-5 animate-pulse text-white" />
                  </div>
                </div>
                <div className="text-[12px] font-semibold text-white">AI Prompting in Progress…</div>
                <div className="text-[10px] text-indigo-200/80">Crafting {numQuestions} {quizStructure.toUpperCase()} questions on "{aiTopic || "your topic"}"</div>
              </div>
            </div>
          )}
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
              className={cn(
                "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]",
                quiz.length > 0
                  ? "bg-gradient-to-r from-emerald-500 via-indigo-500 to-fuchsia-500 shadow-[0_12px_36px_-10px_rgba(16,185,129,0.7)]"
                  : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.7)]"
              )}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Send className="relative h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              <span className="relative">{quiz.length > 0 ? "Approve & Publish Assignment" : "Publish Now"}</span>
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
// =========================================================================
// Dynamic Notifications (derived from tasks)
// =========================================================================

type NotifKind = "new" | "deadline" | "evaluated" | "feedback";
type SystemNotif = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "1d ago";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function buildNotifications(tasks: Task[]): SystemNotif[] {
  const out: SystemNotif[] = [];
  tasks.forEach((t) => {
    if (t.status === "draft") return;
    const dleft = daysUntil(t.deadline);
    // New publish (within 5d)
    const sinceCreate = (Date.now() - new Date(t.createdAt).getTime()) / 86400000;
    if (sinceCreate <= 5) {
      out.push({
        id: `n-new-${t.id}`,
        kind: "new",
        title: `New ${t.type === "project" ? "Project" : "Assignment"} Published`,
        detail: `“${t.title}” · max ${t.maxMarks} marks`,
        time: relTime(t.createdAt),
        unread: sinceCreate <= 2,
      });
    }
    // Approaching deadline
    if (dleft >= 0 && dleft <= 3) {
      out.push({
        id: `n-due-${t.id}`,
        kind: "deadline",
        title: "Approaching Deadline",
        detail: `“${t.title}” due in ${dleft === 0 ? "<1d" : `${dleft}d`}`,
        time: dleft === 0 ? "today" : `${dleft}d left`,
        unread: true,
      });
    }
    // Evaluated (proxy: pendingEval = 0 && submissions > 0)
    if (t.submissions > 0 && t.pendingEval === 0) {
      out.push({
        id: `n-eval-${t.id}`,
        kind: "evaluated",
        title: t.type === "project" ? "Project Evaluated" : "Assignment Evaluated",
        detail: `“${t.title}” · ${t.submissions} submission${t.submissions === 1 ? "" : "s"} graded`,
        time: relTime(t.createdAt),
        unread: false,
      });
    }
    // Feedback (proxy: half-graded items)
    if (t.submissions > 0 && t.pendingEval > 0 && t.pendingEval < t.submissions) {
      out.push({
        id: `n-fb-${t.id}`,
        kind: "feedback",
        title: "Teacher Feedback Added",
        detail: `Comments posted on “${t.title}”`,
        time: relTime(t.createdAt),
        unread: true,
      });
    }
  });
  return out.slice(0, 12);
}

const NOTIF_META: Record<NotifKind, { icon: typeof Bell; cls: string; ring: string }> = {
  new:        { icon: Megaphone,     cls: "text-indigo-300 bg-indigo-500/15 border-indigo-400/30",  ring: "shadow-[0_0_14px_-2px_rgba(99,102,241,0.55)]" },
  deadline:   { icon: AlarmClock,    cls: "text-amber-300 bg-amber-500/15 border-amber-400/30",     ring: "shadow-[0_0_14px_-2px_rgba(251,191,36,0.55)]" },
  evaluated:  { icon: CheckCheck,    cls: "text-emerald-300 bg-emerald-500/15 border-emerald-400/30", ring: "shadow-[0_0_14px_-2px_rgba(16,185,129,0.55)]" },
  feedback:   { icon: MessageSquare, cls: "text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-400/30", ring: "shadow-[0_0_14px_-2px_rgba(217,70,239,0.55)]" },
};

function NotificationsBell({
  open, onOpenChange, pendingCount,
}: { open: boolean; onOpenChange: (v: boolean) => void; pendingCount: number }) {
  const tasks = useTasks();
  const derived = useMemo(() => buildNotifications(tasks), [tasks]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const items = derived.filter((n) => !dismissed.has(n.id));
  const unread = items.filter((n) => n.unread).length + pendingCount;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => onOpenChange(!open)}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 px-1 text-[9px] font-bold text-white shadow-[0_0_10px_-1px_rgba(244,63,94,0.8)]">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-[22rem] overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5 text-indigo-300" />
              <div className="text-xs font-semibold">Live Notifications</div>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-200">{items.length}</span>
            </div>
            <button onClick={() => setDismissed(new Set(derived.map((n) => n.id)))} className="text-[10px] text-muted-foreground hover:text-foreground">Mark all read</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-3 py-8 text-center text-[11px] text-muted-foreground">You're all caught up.</div>
            )}
            {items.map((n) => {
              const meta = NOTIF_META[n.kind];
              const Icon = meta.icon;
              return (
                <div key={n.id} className="group flex items-start gap-2.5 border-b border-white/5 px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
                  <div className={cn("mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border", meta.cls, meta.ring)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate text-[12px] font-semibold leading-tight">{n.title}</div>
                      {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_1px_rgba(99,102,241,0.7)]" />}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.detail}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground/80">{n.time}</div>
                  </div>
                  <button
                    onClick={() => setDismissed((d) => new Set([...d, n.id]))}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Dismiss"
                  >
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Student Dashboard Panel (role: student)
// =========================================================================

type StudentSubState = "submitted" | "evaluated";
type SubmissionMap = Record<string, StudentSubState | undefined>;

function ProgressRing({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c - (c * Math.min(100, Math.max(0, value))) / 100;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" className="text-white/5" strokeWidth="5" />
          <circle
            cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">{Math.round(value)}%</div>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function StudentDashboardPanel() {
  const tasks = useTasks();
  const students = useStudents();
  const teachers = useTeachers();
  const classes = useMemo(() => buildInitialClasses(), []);
  const me = students.find((s) => s.status === "Active") ?? students[0];
  const [tab, setTab] = useState<"active" | "completed" | "overdue">("active");
  const [submissions, setSubmissions] = useState<SubmissionMap>({});

  if (!me) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/30 p-8 text-center text-xs text-muted-foreground">
        No active student found. Add a student in the School Admin view first.
      </div>
    );
  }

  const sectionLabel = (sid: string) => {
    for (const c of classes) {
      const s = c.sections.find((x) => x.id === sid);
      if (s) return `Grade ${c.grade} · Section ${s.label}`;
    }
    return sid;
  };
  const teacherName = (id?: string) => teachers.find((t) => t.id === id)?.name ?? "Class Teacher";

  // tasks targeting me
  const myTasks = useMemo(() => tasks.filter((t) =>
    t.status !== "draft" && (
      t.targets.studentIds.includes(me.id) ||
      t.targets.sectionIds.includes(me.sectionId) ||
      t.targets.classGrades.includes(me.classGrade)
    )
  ), [tasks, me]);

  const counts = useMemo(() => {
    let assigned = 0, completed = 0, pending = 0, overdue = 0;
    myTasks.forEach((t) => {
      assigned++;
      const sub = submissions[t.id];
      const dleft = daysUntil(t.deadline);
      if (sub === "submitted" || sub === "evaluated") completed++;
      else if (dleft < 0) overdue++;
      else pending++;
    });
    return { assigned, completed, pending, overdue };
  }, [myTasks, submissions]);

  const completionPct = counts.assigned ? (counts.completed / counts.assigned) * 100 : 0;

  const filtered = useMemo(() => {
    return myTasks.filter((t) => {
      const sub = submissions[t.id];
      const dleft = daysUntil(t.deadline);
      if (tab === "completed") return sub === "submitted" || sub === "evaluated";
      if (tab === "overdue") return dleft < 0 && !sub;
      return dleft >= 0 && !sub;
    });
  }, [myTasks, tab, submissions]);

  const submit = (id: string) => setSubmissions((m) => ({ ...m, [id]: "submitted" }));

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950/60 via-slate-950/70 to-fuchsia-950/40 p-5 shadow-[0_20px_60px_-30px_rgba(99,102,241,0.6)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-amber-400 opacity-60 blur" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-slate-950 text-lg font-bold">
                {me.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight">{me.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(16,185,129,0.7)]" /> Online
                </span>
              </div>
              <div className="text-[12px] text-muted-foreground">{sectionLabel(me.sectionId)} · Roll {me.roll}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {["Scratch", "HTML", "Python"].map((tech, i) => (
                  <span key={tech} className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    ["border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
                     "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200",
                     "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"][i]
                  )}>{tech}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Streak / overall */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Flame className="h-3 w-3 text-amber-300" /> Streak</div>
              <div className="mt-0.5 text-xl font-bold text-amber-200">7d</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Trophy className="h-3 w-3 text-fuchsia-300" /> XP</div>
              <div className="mt-0.5 text-xl font-bold text-fuchsia-200">2,840</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><TrendingUp className="h-3 w-3 text-indigo-300" /> Overall</div>
              <div className="mt-0.5 text-xl font-bold text-indigo-200">{Math.round(completionPct)}%</div>
            </div>
          </div>
        </div>

        {/* Metric rings */}
        <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Assigned",  value: counts.assigned ? 100 : 0, color: "#a5b4fc", count: counts.assigned },
            { label: "Completed", value: counts.assigned ? (counts.completed / counts.assigned) * 100 : 0, color: "#34d399", count: counts.completed },
            { label: "Pending",   value: counts.assigned ? (counts.pending / counts.assigned) * 100 : 0, color: "#fbbf24", count: counts.pending },
            { label: "Overdue",   value: counts.assigned ? (counts.overdue / counts.assigned) * 100 : 0, color: "#f87171", count: counts.overdue },
          ].map((m) => (
            <div key={m.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur transition-all hover:border-indigo-400/40 hover:bg-white/[0.05]">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</div>
                <div className="text-2xl font-bold">{m.count}</div>
              </div>
              <ProgressRing value={m.value} label="" color={m.color} />
            </div>
          ))}
        </div>
      </section>

      {/* Task board */}
      <section className="rounded-xl border border-border/60 bg-background/40 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold">My Task Track</h3>
          <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1">
            {([
              { id: "active" as const, label: "Active", count: counts.pending },
              { id: "completed" as const, label: "Completed", count: counts.completed },
              { id: "overdue" as const, label: "Overdue", count: counts.overdue },
            ]).map(({ id, label, count }) => {
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
                  {label}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-white/20" : "bg-muted/60 text-foreground")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {filtered.map((t) => {
            const dleft = daysUntil(t.deadline);
            const overdue = dleft < 0;
            const sub = submissions[t.id];
            const typeMeta = t.type === "project"
              ? { label: "Project", icon: FolderKanban, cls: "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200" }
              : { label: "Assignment", icon: ClipboardList, cls: "border-indigo-400/40 bg-indigo-500/10 text-indigo-200" };
            const TypeIcon = typeMeta.icon;
            return (
              <article
                key={t.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-[0_18px_50px_-15px_rgba(99,102,241,0.45)]"
              >
                <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", typeMeta.cls)}>
                        <TypeIcon className="h-3 w-3" /> {typeMeta.label}
                      </span>
                      {overdue && !sub && (
                        <span className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-rose-200">Overdue</span>
                      )}
                      {sub === "evaluated" && (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-200">Evaluated</span>
                      )}
                      {sub === "submitted" && (
                        <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-indigo-200">Submitted</span>
                      )}
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold">{t.title}</h4>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <UserCircle2 className="h-3 w-3" /> {teacherName()}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-muted-foreground">Total</div>
                    <div className="text-base font-bold text-indigo-200">{t.maxMarks}</div>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{t.instructions || "Guidelines will appear here."}</p>

                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                  <div className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold",
                    overdue ? "text-rose-300" : dleft <= 2 ? "text-amber-300" : "text-emerald-300"
                  )}>
                    <Clock className="h-3 w-3" />
                    {overdue ? `${Math.abs(dleft)}d overdue` : dleft === 0 ? "Due today" : `${dleft}d left`}
                    <span className="text-muted-foreground">· {t.deadline}</span>
                  </div>
                  {tab === "active" ? (
                    <button
                      onClick={() => submit(t.id)}
                      className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.03] active:scale-[0.97]"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                      <Rocket className="relative h-3.5 w-3.5" />
                      <span className="relative">{t.type === "project" ? "Launch Workspace" : "Submit Task"}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
                      <FileCheck2 className="h-3 w-3" /> {sub === "evaluated" ? "Graded" : sub === "submitted" ? "Awaiting evaluation" : "Closed"}
                    </span>
                  )}
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-background/30 p-8 text-center text-[12px] text-muted-foreground">
              Nothing here yet — switch tabs or wait for your teacher to publish new tasks.
            </div>
          )}
        </div>
      </section>

      {/* Practice Labs */}
      <PracticeLabsPanel student={me} />

      {/* Digital Portfolio Hub */}
      <PortfolioHub studentId={me.id} />
    </div>
  );
}

// =========================================================================
// Practice Labs — 10 interactive workspaces
// =========================================================================

type LabId = "html" | "sql" | "java" | "scratch" | "scratchjr" | "word" | "excel" | "ppt" | "paint";

const LABS: { id: LabId; name: string; tag: string; icon: typeof Code2; tint: string }[] = [
  { id: "html",      name: "HTML & CSS Lab",   tag: "Web Playground",    icon: Code2,        tint: "from-orange-500/30 to-rose-500/20"   },
  { id: "sql",       name: "SQL Lab",          tag: "Query Console",     icon: Database,     tint: "from-sky-500/30 to-indigo-500/20"    },
  { id: "java",      name: "Java Lab",         tag: "Compiler",          icon: Coffee,       tint: "from-amber-500/30 to-orange-500/20"  },
  { id: "scratch",   name: "Scratch Lab",      tag: "Block Sandbox",     icon: Cat,          tint: "from-amber-400/30 to-yellow-500/20"  },
  { id: "scratchjr", name: "Scratch Jr Lab",   tag: "Junior Blocks",     icon: Baby,         tint: "from-pink-500/30 to-fuchsia-500/20"  },
  { id: "word",      name: "Word Processor",   tag: "Rich Text",         icon: FileType2,    tint: "from-blue-500/30 to-indigo-500/20"   },
  { id: "excel",     name: "Spreadsheet",      tag: "Formula Engine",    icon: Sheet,        tint: "from-emerald-500/30 to-teal-500/20"  },
  { id: "ppt",       name: "Presentation",     tag: "Slide Studio",      icon: Presentation, tint: "from-rose-500/30 to-orange-500/20"   },
  { id: "paint",     name: "Paint Studio",     tag: "Canvas",            icon: Palette,      tint: "from-fuchsia-500/30 to-violet-500/20"},
];

function PracticeLabsPanel({ student }: { student: Student }) {
  const [active, setActive] = useState<LabId | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const tasks = useTasks();
  const portfolio = usePortfolio();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const getterRef = useRef<SnapshotGetter | null>(null);
  const register = useCallback((g: SnapshotGetter | null) => { getterRef.current = g; }, []);

  const submittedSet = useMemo(
    () => new Set(portfolio.filter((p) => p.studentId === student.id && (p.status === "submitted" || p.status === "evaluated") && p.taskId).map((p) => p.taskId!)),
    [portfolio, student.id]
  );
  const eligibleTasks = useMemo(
    () => tasks.filter((t) =>
      t.status === "active"
      && !submittedSet.has(t.id)
      && (t.targets.studentIds.includes(student.id)
        || t.targets.sectionIds.includes(student.sectionId)
        || t.targets.classGrades.includes(student.classGrade))
    ),
    [tasks, submittedSet, student]
  );

  useEffect(() => {
    if (selectedTaskId && !eligibleTasks.some((t) => t.id === selectedTaskId)) setSelectedTaskId("");
    if (!selectedTaskId && eligibleTasks[0]) setSelectedTaskId(eligibleTasks[0].id);
  }, [eligibleTasks, selectedTaskId]);

  const flash = (msg: string) => { setSavedFlash(msg); setTimeout(() => setSavedFlash(null), 2400); };

  const captureSnapshot = (): LabSnapshot | null => {
    const snap = getterRef.current?.();
    if (!snap) return null;
    return snap;
  };

  const saveDraft = () => {
    const snap = captureSnapshot();
    if (!snap) { flash("Open a lab first to save a draft."); return; }
    setPortfolio((p) => [{
      id: `pf${Date.now()}`, studentId: student.id, status: "draft",
      createdAt: Date.now(), snapshot: snap,
    }, ...p]);
    flash("Draft saved to your portfolio.");
  };

  const attachAsset = () => {
    if (!selectedTaskId) { flash("Pick an assignment to attach to."); return; }
    const snap = captureSnapshot();
    if (!snap) { flash("Open a lab first to attach."); return; }
    const task = tasks.find((t) => t.id === selectedTaskId);
    setPortfolio((p) => [{
      id: `pf${Date.now()}`, studentId: student.id,
      taskId: selectedTaskId, taskTitle: task?.title,
      status: "draft", createdAt: Date.now(), snapshot: snap,
    }, ...p]);
    flash(`Attached to “${task?.title ?? selectedTaskId}”.`);
  };

  const submitAssignment = () => {
    if (!selectedTaskId) { flash("Pick an assignment to submit to."); return; }
    const snap = captureSnapshot();
    if (!snap) { flash("Open a lab to capture your work first."); return; }
    const task = tasks.find((t) => t.id === selectedTaskId);
    setPortfolio((p) => [{
      id: `pf${Date.now()}`, studentId: student.id,
      taskId: selectedTaskId, taskTitle: task?.title,
      status: "submitted", createdAt: Date.now(), snapshot: snap,
    }, ...p]);
    setTasks((all) => all.map((t) =>
      t.id === selectedTaskId
        ? { ...t, submissions: Math.min(t.totalRecipients, t.submissions + 1), pendingEval: t.pendingEval + 1 }
        : t
    ));
    flash(`✓ Submitted “${task?.title ?? "assignment"}” to teacher inbox.`);
  };

  const activeMeta = active ? LABS.find((l) => l.id === active) : null;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <LabSnapshotCtx.Provider value={{ register }}>
      <section className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 to-indigo-950/30 p-4 shadow-[0_24px_60px_-30px_rgba(99,102,241,0.55)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
            <Sparkles className="h-3 w-3" /> Technology Practice Labs
          </div>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight">Hey {student.name.split(" ")[0]} — pick a lab and build something live.</h3>
        </div>
        <div className="flex items-center gap-2">
          {savedFlash && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
              <Check className="h-3 w-3" /> {savedFlash}
            </span>
          )}
          <button
            onClick={saveDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold backdrop-blur transition-all hover:border-indigo-400/40 hover:bg-white/[0.07]"
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>
          <button
            onClick={submitAssignment}
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Send className="relative h-3.5 w-3.5" />
            <span className="relative">Submit Assignment</span>
          </button>
        </div>
      </div>

      {/* Selector */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {LABS.map((lab) => {
          const Icon = lab.icon;
          const sel = active === lab.id;
          return (
            <button
              key={lab.id}
              onClick={() => setActive(lab.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300",
                sel
                  ? "border-indigo-400/60 bg-indigo-500/10 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]"
                  : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-white/[0.05]"
              )}
            >
              <div className={cn("pointer-events-none absolute -inset-12 rounded-full bg-gradient-to-br blur-3xl transition-opacity", lab.tint, sel ? "opacity-100" : "opacity-0 group-hover:opacity-60")} />
              <div className="relative flex items-center gap-2">
                <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-950/60 backdrop-blur", sel && "ring-1 ring-indigo-400/60")}>
                  <Icon className="h-4 w-4 text-indigo-200" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold">{lab.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{lab.tag}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workspace */}
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur">
        {!active && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-2xl" />
              <Rocket className="relative h-8 w-8 text-indigo-300" />
            </div>
            <p className="mt-3 text-sm font-semibold">Pick a lab above to launch its workspace.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Every lab runs live in your browser — no install needed.</p>
          </div>
        )}
        {active && activeMeta && (
          <div>
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
              <div className="inline-flex items-center gap-2 text-[12px] font-semibold">
                <activeMeta.icon className="h-3.5 w-3.5 text-indigo-300" /> {activeMeta.name}
              </div>
              <button onClick={() => setActive(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Close ×</button>
            </div>
            <div className="p-3">
              {active === "html" && <HtmlCssLab />}
              {active === "sql" && <SqlLab />}
              {active === "java" && <JavaLab />}
              {active === "scratch" && <ScratchLab />}
              {active === "scratchjr" && <ScratchJrLab />}
              {active === "word" && <WordLab />}
              {active === "excel" && <ExcelLab />}
              {active === "ppt" && <PowerPointLab />}
              {active === "paint" && <PaintLab />}
            </div>
          </div>
        )}
      </div>

      {/* Floating "Link to Assignment" drawer */}
      {active && (
        <div className={cn(
          "pointer-events-none absolute bottom-4 right-4 z-30 flex max-w-[92%] flex-col items-end gap-2 transition-all",
        )}>
          <div className={cn(
            "pointer-events-auto w-[340px] origin-bottom-right overflow-hidden rounded-2xl border border-indigo-400/30 bg-slate-950/85 shadow-[0_30px_60px_-20px_rgba(99,102,241,0.55)] backdrop-blur-xl transition-all duration-300",
            drawerOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0 translate-y-2"
          )}>
            <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-200">
                <Paperclip className="h-3.5 w-3.5" /> Link to Assignment
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active tasks for you</div>
              {eligibleTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-3 text-[11px] text-muted-foreground">
                  Nothing pending — every active assignment is already submitted. Saved work goes straight to your portfolio.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-2 pr-7 text-[12px] outline-none focus:border-indigo-400/60"
                  >
                    {eligibleTasks.map((t) => {
                      const d = daysUntil(t.deadline);
                      const tag = d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "due today" : `${d}d left`;
                      return <option key={t.id} value={t.id}>{t.title} · {tag}</option>;
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
              {selectedTask && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[10.5px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-indigo-200"><ClipboardList className="h-3 w-3" /> {selectedTask.type === "project" ? "Project" : "Assignment"}</span>
                    <span>{selectedTask.maxMarks} marks</span>
                  </div>
                  <div className="mt-0.5 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedTask.deadline}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={attachAsset}
                  disabled={!selectedTaskId}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-semibold hover:border-indigo-400/40 hover:bg-white/[0.07] disabled:opacity-50"
                >
                  <Paperclip className="h-3.5 w-3.5" /> Attach Asset
                </button>
                <button
                  onClick={submitAssignment}
                  disabled={!selectedTaskId}
                  className="group relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.03] disabled:opacity-50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Send className="relative h-3.5 w-3.5" /> <span className="relative">Submit</span>
                </button>
              </div>
            </div>
          </div>

          {!drawerOpen && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="pointer-events-auto group inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-slate-950/85 px-3 py-2 text-[11px] font-semibold text-indigo-100 shadow-[0_10px_25px_-10px_rgba(99,102,241,0.7)] backdrop-blur transition-all hover:scale-[1.03]"
            >
              <Paperclip className="h-3.5 w-3.5" /> Link to Assignment
              <span className="inline-flex items-center justify-center rounded-full bg-indigo-500/30 px-1.5 text-[10px]">{eligibleTasks.length}</span>
              <ChevronUp className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </section>
    </LabSnapshotCtx.Provider>
  );
}

// ---------- HTML & CSS Lab ----------
function HtmlCssLab() {
  const [html, setHtml] = useState(`<!doctype html>\n<html>\n  <body>\n    <h1>Hello, Avartan!</h1>\n    <p class="tag">Edit the code on the left to update this preview.</p>\n    <button onclick="alert('It works!')">Click me</button>\n  </body>\n</html>`);
  const [css, setCss] = useState(`body { font-family: system-ui; background: #0b1020; color: #e2e8f0; padding: 24px; }\nh1 { color: #a5b4fc; }\n.tag { color: #c4b5fd; }\nbutton { background: linear-gradient(90deg,#6366f1,#d946ef); color: white; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; }`);
  const [srcDoc, setSrcDoc] = useState("");
  const run = () => setSrcDoc(`${html}\n<style>${css}</style>`);
  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);
  useRegisterSnapshot(() => {
    const doc = `${html}\n<style>${css}</style>`;
    return { kind: "html", labName: "HTML & CSS", payload: { html, css }, preview: doc, previewKind: "html", bytes: approxBytes(doc) };
  }, [html, css]);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>HTML</span><span className="text-indigo-300">index.html</span></div>
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} spellCheck={false} className="w-full resize-none rounded-lg border border-white/10 bg-slate-900/80 p-3 font-mono text-[11px] text-emerald-200 outline-none focus:border-indigo-400/50" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>CSS</span><span className="text-fuchsia-300">styles.css</span></div>
          <textarea value={css} onChange={(e) => setCss(e.target.value)} rows={8} spellCheck={false} className="w-full resize-none rounded-lg border border-white/10 bg-slate-900/80 p-3 font-mono text-[11px] text-sky-200 outline-none focus:border-fuchsia-400/50" />
        </div>
        <button onClick={run} className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-2 text-[11px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.02]">
          <Play className="h-3.5 w-3.5" /> Run Web Code
        </button>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>Live Preview</span><span>iframe sandbox</span></div>
        <iframe title="preview" srcDoc={srcDoc} sandbox="allow-scripts allow-modals" className="h-[420px] w-full rounded-lg border border-white/10 bg-white" />
      </div>
    </div>
  );
}

// ---------- SQL Lab ----------
type SqlRow = Record<string, string | number>;
const SQL_TABLES: Record<string, SqlRow[]> = {
  students: [
    { id: 1, name: "Ira Khanna",  class: "VIII-A", marks: 92 },
    { id: 2, name: "Veer Singh",  class: "IX-B",   marks: 78 },
    { id: 3, name: "Tara Mehta",  class: "VI-A",   marks: 65 },
    { id: 4, name: "Arjun Nair",  class: "I-A",    marks: 88 },
    { id: 5, name: "Sara Joseph", class: "I-B",    marks: 95 },
  ],
  teachers: [
    { id: 1, name: "Anita Rao",    subject: "Python" },
    { id: 2, name: "Rakesh Verma", subject: "HTML" },
    { id: 3, name: "Priya Sharma", subject: "Java" },
  ],
};

function runSql(q: string): { cols: string[]; rows: SqlRow[]; error?: string } {
  const s = q.trim().replace(/;$/, "");
  const m = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(\w+)\s*(=|>|<|>=|<=)\s*('([^']*)'|"([^"]*)"|(\S+)))?$/i.exec(s);
  if (!m) return { cols: [], rows: [], error: "Only basic: SELECT <cols|*> FROM <table> [WHERE col OP value]" };
  const colsRaw = m[1].trim();
  const table = m[2].toLowerCase();
  const data = SQL_TABLES[table];
  if (!data) return { cols: [], rows: [], error: `Unknown table “${table}”. Try students, teachers.` };
  let rows = [...data];
  if (m[3]) {
    const col = m[3], op = m[4]; const raw = m[6] ?? m[7] ?? m[8];
    const num = Number(raw); const isNum = !isNaN(num) && raw !== "" && !m[6] && !m[7];
    rows = rows.filter((r) => {
      const v = r[col]; if (v === undefined) return false;
      const left = isNum ? Number(v) : String(v);
      const right = isNum ? num : String(raw);
      switch (op) { case "=": return left === right; case ">": return left > right; case "<": return left < right; case ">=": return left >= right; case "<=": return left <= right; }
      return false;
    });
  }
  const cols = colsRaw === "*" ? Object.keys(data[0]) : colsRaw.split(",").map((c) => c.trim());
  rows = rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
  return { cols, rows };
}

function SqlLab() {
  const [q, setQ] = useState("SELECT * FROM students WHERE marks > 80;");
  const [result, setResult] = useState(() => runSql("SELECT * FROM students;"));
  const exec = () => setResult(runSql(q));
  useRegisterSnapshot(() => ({
    kind: "sql", labName: "SQL Lab",
    payload: { query: q, cols: result.cols, rows: result.rows, error: result.error },
    preview: q, previewKind: "grid", bytes: approxBytes({ q, result }),
  }), [q, result]);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-slate-900/80">
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Query Console · tables: students, teachers</span>
          <button onClick={exec} className="inline-flex items-center gap-1 rounded bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-1 text-[10px] font-semibold text-white">
            <Play className="h-3 w-3" /> Run Query
          </button>
        </div>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3} spellCheck={false} className="w-full resize-none bg-transparent p-3 font-mono text-[12px] text-emerald-200 outline-none" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60">
        {result.error ? (
          <div className="px-3 py-3 text-[12px] text-rose-300">⚠ {result.error}</div>
        ) : result.rows.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">No rows match.</div>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-indigo-200">
              <tr>{result.cols.map((c) => <th key={c} className="px-3 py-2 text-left">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.rows.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  {result.cols.map((c) => <td key={c} className="px-3 py-1.5 font-mono">{String(r[c] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------- Java Lab (embedded + mock terminal fallback) ----------
function JavaLab() {
  const [mode, setMode] = useState<"embed" | "mock">("embed");
  const [code, setCode] = useState(`public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i <= 3; i++) {\n      System.out.println("Hello Avartan #" + i);\n    }\n  }\n}`);
  const [out, setOut] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  useRegisterSnapshot(() => ({
    kind: "java", labName: "Java Lab",
    payload: { mode, code, out },
    preview: code, previewKind: "text", bytes: approxBytes(code + out.join("\n")),
  }), [mode, code, out]);

  const compile = () => {
    setRunning(true); setOut(["» javac Main.java", "» java Main"]);
    setTimeout(() => {
      const lines: string[] = [];
      const re = /System\.out\.println\(([^)]+)\)/g; let m: RegExpExecArray | null;
      while ((m = re.exec(code))) {
        const arg = m[1].trim();
        const forMatch = /for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\d+)\s*;\s*\1\+\+\s*\)/.exec(code);
        if (forMatch && arg.includes(forMatch[1])) {
          const [, v, a, b] = forMatch;
          for (let i = Number(a); i <= Number(b); i++) {
            lines.push(arg.replace(/"([^"]*)"/g, "$1").replace(new RegExp("\\+\\s*" + v), "").trim() + i);
          }
        } else {
          lines.push(arg.replace(/"([^"]*)"/g, "$1").replace(/\s*\+\s*/g, ""));
        }
      }
      if (!lines.length) lines.push("(no output)");
      setOut((o) => [...o, ...lines, "» Program finished with exit code 0"]);
      setRunning(false);
    }, 700);
  };

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-[10px]">
        {(["embed", "mock"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("rounded-full px-2.5 py-1 font-semibold transition", mode === m ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white" : "text-muted-foreground")}>
            {m === "embed" ? "Online Compiler" : "Local Mock Terminal"}
          </button>
        ))}
      </div>
      {mode === "embed" ? (
        <iframe title="java-compiler" src="https://onecompiler.com/embed/java?hideCompleteMenu=true&hideTitle=true&theme=dark" className="h-[440px] w-full rounded-lg border border-white/10 bg-slate-900" />
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={14} spellCheck={false} className="resize-none rounded-lg border border-white/10 bg-slate-900/80 p-3 font-mono text-[11px] text-amber-200 outline-none" />
          <div className="rounded-lg border border-white/10 bg-black p-3 font-mono text-[11px] text-emerald-300 shadow-inner">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground"><span>~/lab/java $</span><button onClick={compile} disabled={running} className="inline-flex items-center gap-1 rounded bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-semibold text-white disabled:opacity-60">{running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Compile &amp; Run</button></div>
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap">{out.length === 0 ? "(terminal ready)" : out.join("\n")}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Scratch Lab ----------
function ScratchLab() {
  useRegisterSnapshot(() => ({
    kind: "scratch", labName: "Scratch Lab",
    payload: { project: "scratch.mit.edu/projects/104" },
    preview: "Scratch sandbox session", previewKind: "text", bytes: 64,
  }), []);
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Live Scratch sandbox — drag blocks, hit the green flag inside.</p>
      <iframe
        title="scratch"
        src="https://scratch.mit.edu/projects/104/embed"
        allowTransparency
        allowFullScreen
        className="h-[420px] w-full rounded-lg border border-white/10 bg-slate-900"
      />
    </div>
  );
}

// ---------- Scratch Jr Lab ----------
type JrBlock = { id: string; kind: "right" | "left" | "up" | "down" | "grow" | "shrink" | "say" };
const JR_PALETTE: { kind: JrBlock["kind"]; label: string; cls: string }[] = [
  { kind: "right",  label: "→ Right",  cls: "from-sky-500 to-indigo-500" },
  { kind: "left",   label: "← Left",   cls: "from-sky-500 to-indigo-500" },
  { kind: "up",     label: "↑ Up",     cls: "from-sky-500 to-indigo-500" },
  { kind: "down",   label: "↓ Down",   cls: "from-sky-500 to-indigo-500" },
  { kind: "grow",   label: "+ Grow",   cls: "from-fuchsia-500 to-rose-500" },
  { kind: "shrink", label: "− Shrink", cls: "from-fuchsia-500 to-rose-500" },
  { kind: "say",    label: "💬 Say Hi", cls: "from-amber-400 to-orange-500" },
];

function ScratchJrLab() {
  const [program, setProgram] = useState<JrBlock[]>([{ id: "b1", kind: "right" }, { id: "b1b", kind: "right" }, { id: "b2", kind: "grow" }, { id: "b3", kind: "say" }]);
  const [pos, setPos] = useState({ x: 20, y: 60, s: 1, msg: "" });
  const [playing, setPlaying] = useState(false);
  useRegisterSnapshot(() => ({
    kind: "scratchjr", labName: "Scratch Jr",
    payload: { program, pos },
    preview: program.map((b) => b.kind).join(" → "),
    previewKind: "blocks", bytes: approxBytes(program),
  }), [program, pos]);

  const run = async () => {
    setPlaying(true); setPos({ x: 20, y: 60, s: 1, msg: "" });
    for (const b of program) {
      await new Promise((r) => setTimeout(r, 380));
      setPos((p) => {
        const np = { ...p, msg: "" };
        if (b.kind === "right")  np.x = Math.min(280, p.x + 30);
        if (b.kind === "left")   np.x = Math.max(0,   p.x - 30);
        if (b.kind === "up")     np.y = Math.max(10,  p.y - 25);
        if (b.kind === "down")   np.y = Math.min(140, p.y + 25);
        if (b.kind === "grow")   np.s = Math.min(2.4, p.s + 0.25);
        if (b.kind === "shrink") np.s = Math.max(0.5, p.s - 0.25);
        if (b.kind === "say")    np.msg = "Hi there!";
        return np;
      });
    }
    setPlaying(false);
  };

  const add = (k: JrBlock["kind"]) => setProgram((p) => [...p, { id: `b${Date.now()}`, kind: k }]);
  const remove = (id: string) => setProgram((p) => p.filter((b) => b.id !== id));

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2">
        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-2">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Block palette · tap to add</div>
          <div className="flex flex-wrap gap-1.5">
            {JR_PALETTE.map((b) => (
              <button key={b.kind} onClick={() => add(b.kind)} className={cn("rounded-md bg-gradient-to-r px-2 py-1 text-[11px] font-semibold text-white shadow transition-transform hover:scale-105", b.cls)}>{b.label}</button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-2">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Program</span><span>{program.length} blocks</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {program.map((b) => {
              const meta = JR_PALETTE.find((x) => x.kind === b.kind)!;
              return (
                <button key={b.id} onClick={() => remove(b.id)} title="Remove" className={cn("rounded-md bg-gradient-to-r px-2 py-1 text-[11px] font-semibold text-white opacity-90 hover:opacity-100", meta.cls)}>{meta.label}</button>
              );
            })}
            {program.length === 0 && <span className="text-[11px] text-muted-foreground italic">Tap a palette block to add.</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={run} disabled={playing} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_10px_25px_-10px_rgba(16,185,129,0.7)] transition-transform hover:scale-[1.02] disabled:opacity-60">
            <FlagTriangleRight className="h-3.5 w-3.5" /> Green Flag
          </button>
          <button onClick={() => { setProgram([]); setPos({ x: 20, y: 60, s: 1, msg: "" }); }} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
            <Square className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>
      <div className="relative h-[280px] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-sky-200/20 via-emerald-200/10 to-yellow-200/10">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-emerald-500/40 to-transparent" />
        {pos.msg && (
          <div className="absolute z-10 rounded-md border border-white/30 bg-white px-2 py-1 text-[10px] font-semibold text-slate-900 shadow" style={{ left: pos.x + 30, top: pos.y - 18, transition: "all 350ms" }}>{pos.msg}</div>
        )}
        <div className="absolute text-3xl drop-shadow-lg" style={{ left: pos.x, top: pos.y, transform: `scale(${pos.s})`, transition: "all 350ms cubic-bezier(0.34,1.56,0.64,1)" }}>🐱</div>
      </div>
    </div>
  );
}

// ---------- Word Processor Lab ----------
function WordLab() {
  const ref = useRef<HTMLDivElement>(null);
  const cmd = (c: string, v?: string) => { document.execCommand(c, false, v); ref.current?.focus(); };
  const btn = "inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[11px] hover:border-indigo-400/40 hover:bg-white/[0.08]";
  useRegisterSnapshot(() => {
    const html = ref.current?.innerHTML ?? "";
    return { kind: "word", labName: "Word Processor", payload: { html }, preview: html, previewKind: "html", bytes: approxBytes(html) };
  }, []);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-slate-900/60 p-1.5">
        <button title="Bold" onClick={() => cmd("bold")} className={btn}><Bold className="h-3.5 w-3.5" /></button>
        <button title="Italic" onClick={() => cmd("italic")} className={btn}><Italic className="h-3.5 w-3.5" /></button>
        <button title="Underline" onClick={() => cmd("underline")} className={btn}><UnderlineIcon className="h-3.5 w-3.5" /></button>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <button title="Align left" onClick={() => cmd("justifyLeft")} className={btn}><AlignLeft className="h-3.5 w-3.5" /></button>
        <button title="Align center" onClick={() => cmd("justifyCenter")} className={btn}><AlignCenter className="h-3.5 w-3.5" /></button>
        <button title="Align right" onClick={() => cmd("justifyRight")} className={btn}><AlignRight className="h-3.5 w-3.5" /></button>
        <div className="mx-1 h-5 w-px bg-white/10" />
        <select onChange={(e) => cmd("fontSize", e.target.value)} defaultValue="3" className="h-7 rounded-md border border-white/10 bg-slate-950/60 px-1 text-[10px]">
          {[1,2,3,4,5,6,7].map((n) => <option key={n} value={n}>Size {n}</option>)}
        </select>
        <input type="color" onChange={(e) => cmd("foreColor", e.target.value)} className="h-7 w-8 cursor-pointer rounded border border-white/10 bg-transparent" />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[320px] rounded-lg border border-white/10 bg-white p-6 text-[13px] leading-relaxed text-slate-900 shadow-inner outline-none"
        style={{ fontFamily: "'Georgia', serif" }}
        dangerouslySetInnerHTML={{ __html: "<h2>My Essay</h2><p>Start typing here. Select any text and use the ribbon to make it <b>bold</b>, <i>italic</i> or <u>underlined</u>. Try alignment too!</p>" }}
      />
    </div>
  );
}

// ---------- Excel Lab ----------
const EX_COLS = ["A","B","C","D","E","F","G","H","I","J"] as const;
const EX_ROWS = 20;
type ExGrid = Record<string, string>;

function colIdx(letter: string) { return EX_COLS.indexOf(letter as typeof EX_COLS[number]); }
function parseRef(ref: string) { const m = /^([A-J])(\d{1,2})$/i.exec(ref.trim()); if (!m) return null; const r = Number(m[2]); if (r < 1 || r > EX_ROWS) return null; return { col: m[1].toUpperCase(), row: r }; }
function expandRange(a: string, b: string): string[] {
  const A = parseRef(a), B = parseRef(b); if (!A || !B) return [];
  const c1 = Math.min(colIdx(A.col), colIdx(B.col)), c2 = Math.max(colIdx(A.col), colIdx(B.col));
  const r1 = Math.min(A.row, B.row), r2 = Math.max(A.row, B.row);
  const out: string[] = [];
  for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) out.push(`${EX_COLS[c]}${r}`);
  return out;
}

function evalCell(addr: string, grid: ExGrid, seen: Set<string> = new Set()): string {
  if (seen.has(addr)) return "#CIRC";
  seen.add(addr);
  const raw = (grid[addr] ?? "").trim();
  if (!raw) return "";
  if (!raw.startsWith("=")) return raw;
  const expr = raw.slice(1).trim();
  try {
    // SUM / AVG / MIN / MAX / COUNT
    const fn = /^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\((.+)\)$/i.exec(expr);
    if (fn) {
      const args = fn[2].split(",").flatMap((a) => {
        const range = /^([A-J]\d{1,2}):([A-J]\d{1,2})$/i.exec(a.trim());
        return range ? expandRange(range[1], range[2]) : [a.trim()];
      });
      const nums = args.map((a) => {
        const ref = parseRef(a);
        const v = ref ? evalCell(`${ref.col}${ref.row}`, grid, new Set(seen)) : a;
        const n = Number(v); return isNaN(n) ? 0 : n;
      });
      const op = fn[1].toUpperCase();
      if (op === "SUM") return String(nums.reduce((s, n) => s + n, 0));
      if (op === "AVG" || op === "AVERAGE") return String((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2));
      if (op === "MIN") return String(Math.min(...nums));
      if (op === "MAX") return String(Math.max(...nums));
      if (op === "COUNT") return String(nums.filter((n) => n !== 0).length);
    }
    // Substitute refs and evaluate basic arithmetic
    const sub = expr.replace(/\b([A-J])(\d{1,2})\b/gi, (_, c, r) => {
      const v = evalCell(`${c.toUpperCase()}${r}`, grid, new Set(seen));
      const n = Number(v); return isNaN(n) ? "0" : String(n);
    });
    if (!/^[-+*/().\d\s]+$/.test(sub)) return "#ERR";
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict";return (${sub});`)();
    return String(val);
  } catch { return "#ERR"; }
}

function ExcelLab() {
  const [grid, setGrid] = useState<ExGrid>(() => ({
    A1: "Item", B1: "Qty", C1: "Price", D1: "Total",
    A2: "Pencil",  B2: "5",  C2: "10", D2: "=B2*C2",
    A3: "Eraser",  B3: "3",  C3: "8",  D3: "=B3*C3",
    A4: "Notebook",B4: "2",  C4: "60", D4: "=B4*C4",
    A6: "Sum",                       D6: "=SUM(D2:D4)",
  }));
  const [sel, setSel] = useState("D6");
  const setCell = (addr: string, v: string) => setGrid((g) => ({ ...g, [addr]: v }));
  useRegisterSnapshot(() => ({
    kind: "excel", labName: "Spreadsheet",
    payload: { grid }, preview: JSON.stringify(grid), previewKind: "grid", bytes: approxBytes(grid),
  }), [grid]);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/70 p-2">
        <div className="rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 font-mono text-[11px] text-indigo-200">{sel}</div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">fx</span>
        <input
          value={grid[sel] ?? ""}
          onChange={(e) => setCell(sel, e.target.value)}
          placeholder="=SUM(A1:A5) or value"
          className="flex-1 rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 font-mono text-[11px] outline-none focus:border-indigo-400/50"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="w-8 border-b border-r border-white/5 bg-slate-900/70" />
              {EX_COLS.map((c) => <th key={c} className="border-b border-r border-white/5 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-indigo-200">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: EX_ROWS }, (_, i) => i + 1).map((r) => (
              <tr key={r}>
                <td className="w-8 border-b border-r border-white/5 bg-slate-900/70 px-1 text-center text-[10px] text-muted-foreground">{r}</td>
                {EX_COLS.map((c) => {
                  const addr = `${c}${r}`;
                  const raw = grid[addr] ?? "";
                  const isFormula = raw.startsWith("=");
                  const display = isFormula ? evalCell(addr, grid) : raw;
                  const selected = sel === addr;
                  return (
                    <td key={addr} className={cn("border-b border-r border-white/5 p-0", selected && "ring-1 ring-inset ring-indigo-400/70 bg-indigo-500/10")}>
                      <input
                        value={selected ? raw : display}
                        onFocus={() => setSel(addr)}
                        onChange={(e) => setCell(addr, e.target.value)}
                        className={cn("w-20 bg-transparent px-1.5 py-1 font-mono text-[11px] outline-none", isFormula && !selected && "text-emerald-300")}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">Supports <code className="font-mono text-indigo-300">=SUM, =AVG, =MIN, =MAX, =COUNT</code>, ranges (A1:A5) and basic arithmetic.</p>
    </div>
  );
}

// ---------- PowerPoint Lab ----------
type Slide = { id: string; title: string; body: string; theme: string };
const SLIDE_THEMES = [
  "from-indigo-600/80 via-fuchsia-600/70 to-rose-500/70",
  "from-sky-600/80 via-cyan-500/70 to-emerald-500/60",
  "from-amber-500/80 via-orange-500/70 to-rose-500/70",
  "from-violet-600/80 via-purple-600/70 to-fuchsia-500/70",
];

function PowerPointLab() {
  const [slides, setSlides] = useState<Slide[]>([
    { id: "s1", title: "My Project", body: "By a future engineer", theme: SLIDE_THEMES[0] },
    { id: "s2", title: "What I Learned", body: "• HTML\n• CSS\n• Logic", theme: SLIDE_THEMES[1] },
  ]);
  const [active, setActive] = useState("s1");
  useRegisterSnapshot(() => ({
    kind: "ppt", labName: "Presentation",
    payload: { slides }, preview: slides.map((s) => s.title).join(" · "),
    previewKind: "slides", bytes: approxBytes(slides),
  }), [slides]);
  const cur = slides.find((s) => s.id === active) ?? slides[0];
  const update = (patch: Partial<Slide>) => setSlides((s) => s.map((x) => x.id === active ? { ...x, ...patch } : x));
  const add = () => { const id = `s${Date.now()}`; setSlides((s) => [...s, { id, title: "New Slide", body: "Click to edit", theme: SLIDE_THEMES[s.length % SLIDE_THEMES.length] }]); setActive(id); };
  const remove = (id: string) => { setSlides((s) => { const next = s.filter((x) => x.id !== id); if (active === id && next[0]) setActive(next[0].id); return next.length ? next : s; }); };
  return (
    <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground"><span>Slides</span><span>{slides.length}</span></div>
        <div className="space-y-1.5">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => setActive(s.id)} className={cn("group relative w-full overflow-hidden rounded-lg border text-left transition-all", active === s.id ? "border-indigo-400/60 shadow-[0_8px_20px_-10px_rgba(99,102,241,0.7)]" : "border-white/10 hover:border-indigo-400/40")}>
              <div className={cn("h-16 w-full bg-gradient-to-br p-2", s.theme)}>
                <div className="truncate text-[10px] font-bold text-white">{i + 1}. {s.title}</div>
                <div className="mt-0.5 line-clamp-2 text-[8px] text-white/80">{s.body}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="absolute right-1 top-1 rounded bg-black/40 p-0.5 opacity-0 group-hover:opacity-100"><Trash2 className="h-2.5 w-2.5 text-white" /></button>
            </button>
          ))}
        </div>
        <button onClick={add} className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 px-2 py-2 text-[11px] hover:border-indigo-400/40 hover:text-foreground">
          <Plus className="h-3 w-3" /> Add Slide
        </button>
      </div>
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br p-8 shadow-2xl", cur.theme)}>
        <input
          value={cur.title}
          onChange={(e) => update({ title: e.target.value })}
          className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/40"
        />
        <textarea
          value={cur.body}
          onChange={(e) => update({ body: e.target.value })}
          rows={6}
          className="mt-3 w-full resize-none bg-transparent text-base text-white/95 outline-none placeholder:text-white/40"
        />
        <div className="absolute bottom-3 right-4 text-[10px] text-white/60">Avartan Skill Lab · Slide</div>
      </div>
    </div>
  );
}

// ---------- Paint Lab ----------
function PaintLab() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<"pencil" | "brush" | "eraser">("pencil");
  const [color, setColor] = useState("#6366f1");
  const [size, setSize] = useState(4);
  const COLORS = ["#0f172a","#ef4444","#f59e0b","#10b981","#06b6d4","#6366f1","#d946ef","#ffffff"];
  useRegisterSnapshot(() => {
    const url = ref.current?.toDataURL("image/png") ?? "";
    return { kind: "paint", labName: "Paint Studio", payload: { dataUrl: url, tool, color, size }, preview: url, previewKind: "image", bytes: Math.round(url.length * 0.75) };
  }, []);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const at = (e: React.PointerEvent) => {
    const c = ref.current!; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = ref.current!.getContext("2d")!;
    const p = at(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "brush" ? size * 2 : tool === "eraser" ? size * 3 : size;
  };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const p = at(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = ref.current!; const ctx = c.getContext("2d")!; ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height); };
  const save = () => { const url = ref.current!.toDataURL("image/png"); const a = document.createElement("a"); a.href = url; a.download = "paint.png"; a.click(); };

  const tBtn = (t: typeof tool, Icon: typeof Brush, label: string) => (
    <button key={t} onClick={() => setTool(t)} className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition", tool === t ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-100" : "border-white/10 text-muted-foreground hover:text-foreground")}>
      <Icon className="h-3 w-3" /> {label}
    </button>
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
      <div className="space-y-2 rounded-lg border border-white/10 bg-slate-900/60 p-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tools</div>
        <div className="flex flex-wrap gap-1">
          {tBtn("pencil", Pencil, "Pencil")}
          {tBtn("brush",  Brush, "Brush")}
          {tBtn("eraser", Eraser, "Eraser")}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Size · {size}px</div>
        <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-indigo-500" />
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Colour</div>
        <div className="grid grid-cols-4 gap-1.5">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={c} className={cn("h-6 w-6 rounded-md border transition-transform hover:scale-110", color === c ? "ring-2 ring-indigo-400" : "border-white/20")} style={{ background: c }} />
          ))}
        </div>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-full cursor-pointer rounded border border-white/10 bg-transparent" />
        <div className="flex gap-1">
          <button onClick={clear} className="flex-1 rounded-md border border-white/10 px-2 py-1 text-[10px] hover:border-rose-400/50 hover:text-rose-200">Clear</button>
          <button onClick={save} className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-1 text-[10px] font-semibold text-white">
            <Download className="h-3 w-3" /> Save
          </button>
        </div>
      </div>
      <canvas
        ref={ref}
        width={780}
        height={420}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-[420px] w-full touch-none rounded-lg border border-white/10 bg-white shadow-inner"
      />
    </div>
  );
}

// =========================================================================
// Digital Portfolio Hub + Snapshot Viewer Modal
// =========================================================================
function PortfolioHub({ studentId }: { studentId: string }) {
  const portfolio = usePortfolio();
  const mine = useMemo(
    () => portfolio.filter((p) => p.studentId === studentId).sort((a, b) => b.createdAt - a.createdAt),
    [portfolio, studentId]
  );
  const [filter, setFilter] = useState<"all" | PortfolioStatus>("all");
  const [viewing, setViewing] = useState<PortfolioItem | null>(null);
  const shown = mine.filter((p) => filter === "all" || p.status === filter);

  const counts = {
    all: mine.length,
    draft: mine.filter((p) => p.status === "draft").length,
    submitted: mine.filter((p) => p.status === "submitted").length,
    evaluated: mine.filter((p) => p.status === "evaluated").length,
  };

  const statusMeta: Record<PortfolioStatus, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "border-amber-400/40 bg-amber-500/10 text-amber-200" },
    submitted: { label: "Submitted for Review", cls: "border-indigo-400/40 bg-indigo-500/10 text-indigo-200" },
    evaluated: { label: "Graded", cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
  };

  const removeItem = (id: string) => setPortfolio((p) => p.filter((x) => x.id !== id));

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 to-fuchsia-950/20 p-4 shadow-[0_24px_60px_-30px_rgba(217,70,239,0.4)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200">
            <FolderKanban className="h-3 w-3" /> Digital Portfolio Hub
          </div>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight">Every lab artefact you've saved, in one place.</h3>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1">
          {(["all", "draft", "submitted", "evaluated"] as const).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-all capitalize",
                  active
                    ? "bg-gradient-to-r from-indigo-500/90 to-fuchsia-500/90 text-white shadow-[0_4px_16px_-6px_rgba(99,102,241,0.7)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "all" ? "All" : statusMeta[f].label}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", active ? "bg-white/20" : "bg-muted/60 text-foreground")}>{counts[f]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-background/30 p-8 text-center text-[12px] text-muted-foreground">
          Nothing here yet — open a lab, build something, then tap <span className="text-indigo-300 font-semibold">Save Draft</span> or <span className="text-fuchsia-300 font-semibold">Submit Assignment</span>.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => {
            const Icon = LAB_ICON[item.snapshot.kind];
            const tint = LAB_TINT[item.snapshot.kind];
            const sm = statusMeta[item.status];
            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-[0_18px_50px_-15px_rgba(99,102,241,0.45)]"
              >
                <div className={cn("pointer-events-none absolute -inset-12 rounded-full bg-gradient-to-br opacity-30 blur-3xl transition-opacity group-hover:opacity-60", tint)} />
                <div className="relative flex items-start gap-2.5">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-950/70 ring-1 ring-white/5">
                    <Icon className="h-4 w-4 text-indigo-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold">{item.snapshot.labName}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {item.taskTitle ? `↳ ${item.taskTitle}` : "Personal practice"}
                    </div>
                  </div>
                  <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap", sm.cls)}>{sm.label}</span>
                </div>

                <div className="relative mt-3 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(item.createdAt)}</div>
                  <div className="inline-flex items-center justify-end gap-1"><FileText className="h-3 w-3" /> {formatBytes(item.snapshot.bytes)}</div>
                </div>

                <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2.5">
                  <button
                    onClick={() => setViewing(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-semibold hover:border-indigo-400/40 hover:bg-white/[0.08]"
                  >
                    <Eye className="h-3 w-3" /> View Snapshot
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-1.5 py-1 text-muted-foreground hover:border-rose-400/50 hover:text-rose-200"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {viewing && <SnapshotViewer item={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}

function SnapshotViewer({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const s = item.snapshot;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 shadow-[0_40px_100px_-20px_rgba(99,102,241,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-indigo-200">Snapshot · {formatTime(item.createdAt)}</div>
            <div className="truncate text-sm font-semibold">{s.labName}{item.taskTitle ? ` · ${item.taskTitle}` : ""}</div>
          </div>
          <button onClick={onClose} className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">Close ×</button>
        </div>
        <div className="max-h-[72vh] overflow-auto p-4">
          <SnapshotRenderer snapshot={s} />
        </div>
      </div>
    </div>
  );
}

function SnapshotRenderer({ snapshot }: { snapshot: LabSnapshot }) {
  const s = snapshot;
  if (s.kind === "html") {
    const p = s.payload as { html: string; css: string };
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <iframe title="snap" srcDoc={s.preview} sandbox="allow-scripts allow-modals" className="h-[360px] w-full rounded-lg border border-white/10 bg-white" />
        <pre className="max-h-[360px] overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-[11px] text-emerald-200">{`${p.html}\n\n/* css */\n${p.css}`}</pre>
      </div>
    );
  }
  if (s.kind === "sql") {
    const p = s.payload as { query: string; cols: string[]; rows: Record<string, string|number>[]; error?: string };
    return (
      <div className="space-y-3">
        <pre className="rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-[12px] text-emerald-200">{p.query}</pre>
        {p.error ? (
          <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-[12px] text-rose-200">⚠ {p.error}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-[11px]">
              <thead className="bg-white/[0.04] text-[10px] uppercase text-indigo-200">
                <tr>{p.cols.map((c) => <th key={c} className="px-3 py-2 text-left">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {p.rows.map((r, i) => (
                  <tr key={i}>{p.cols.map((c) => <td key={c} className="px-3 py-1.5 font-mono">{String(r[c] ?? "")}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  if (s.kind === "java") {
    const p = s.payload as { code: string; out: string[]; mode: string };
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <pre className="max-h-[420px] overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-[11px] text-amber-200">{p.code}</pre>
        <pre className="max-h-[420px] overflow-auto rounded-lg border border-white/10 bg-black p-3 font-mono text-[11px] text-emerald-300">{p.out.length ? p.out.join("\n") : "(no output captured)"}</pre>
      </div>
    );
  }
  if (s.kind === "scratchjr") {
    const p = s.payload as { program: { kind: string }[] };
    return (
      <div className="flex flex-wrap gap-1.5">
        {p.program.map((b, i) => (
          <span key={i} className="rounded-md bg-gradient-to-r from-sky-500 to-indigo-500 px-2 py-1 text-[11px] font-semibold text-white">{b.kind}</span>
        ))}
        {p.program.length === 0 && <span className="text-[11px] text-muted-foreground">Empty program</span>}
      </div>
    );
  }
  if (s.kind === "word") {
    return (
      <div
        className="min-h-[200px] rounded-lg border border-white/10 bg-white p-6 text-[13px] leading-relaxed text-slate-900 shadow-inner"
        style={{ fontFamily: "'Georgia', serif" }}
        dangerouslySetInnerHTML={{ __html: (s.payload as { html: string }).html || "(empty document)" }}
      />
    );
  }
  if (s.kind === "excel") {
    const grid = (s.payload as { grid: Record<string, string> }).grid;
    const cells = Object.entries(grid);
    return (
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-[11px]">
          <thead className="bg-white/[0.04] text-[10px] uppercase text-indigo-200">
            <tr><th className="px-3 py-2 text-left">Cell</th><th className="px-3 py-2 text-left">Value</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cells.map(([k, v]) => (
              <tr key={k}><td className="px-3 py-1.5 font-mono text-indigo-200">{k}</td><td className="px-3 py-1.5 font-mono">{v}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (s.kind === "ppt") {
    const p = s.payload as { slides: { id: string; title: string; body: string; theme: string }[] };
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {p.slides.map((sl, i) => (
          <div key={sl.id} className={cn("aspect-video overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br p-4", sl.theme)}>
            <div className="text-[10px] text-white/70">Slide {i + 1}</div>
            <div className="mt-1 text-lg font-bold text-white">{sl.title}</div>
            <div className="mt-2 whitespace-pre-wrap text-[12px] text-white/90">{sl.body}</div>
          </div>
        ))}
      </div>
    );
  }
  if (s.kind === "paint") {
    const url = (s.payload as { dataUrl: string }).dataUrl;
    return url
      ? <img src={url} alt="snapshot" className="mx-auto max-h-[60vh] rounded-lg border border-white/10 bg-white" />
      : <div className="text-[12px] text-muted-foreground">Canvas was empty at capture.</div>;
  }
  // scratch / fallback
  return (
    <pre className="overflow-auto rounded-lg border border-white/10 bg-slate-950/70 p-3 font-mono text-[11px] text-indigo-200">
      {JSON.stringify(s.payload, null, 2)}
    </pre>
  );
}
