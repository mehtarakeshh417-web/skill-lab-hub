import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  Users,
  Layers,
  School2,
  Search,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Edit3,
  X,
  TreePine,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  getMockAccount,
  listMockAccounts,
  subscribeMockAccounts,
  type MockAccount,
} from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/school")({
  head: () => ({ meta: [{ title: "School · Avartan Skill Lab" }] }),
  component: SchoolDashboard,
});

// ============================================================================
// Local class / section state — persisted per school so the structure
// survives refresh.
// ============================================================================

type ClassEntry = {
  id: string;
  grade: string;
  sections: { id: string; name: string; teacherUsername?: string }[];
};

const DEFAULT_CLASSES: ClassEntry[] = [
  {
    id: "cl-6",
    grade: "Class 6",
    sections: [
      { id: "sec-6a", name: "Section A", teacherUsername: "teacher" },
      { id: "sec-6b", name: "Section B" },
    ],
  },
  {
    id: "cl-7",
    grade: "Class 7",
    sections: [{ id: "sec-7a", name: "Section A" }],
  },
  {
    id: "cl-8",
    grade: "Class 8",
    sections: [
      { id: "sec-8r", name: "Section Red" },
      { id: "sec-8b", name: "Section Blue" },
    ],
  },
];

function classesKey(schoolCode: string) {
  return `avartan.school.classes.${schoolCode.toLowerCase()}.v1`;
}

function loadClasses(schoolCode: string): ClassEntry[] {
  if (typeof window === "undefined") return DEFAULT_CLASSES;
  try {
    const raw = window.localStorage.getItem(classesKey(schoolCode));
    if (!raw) {
      window.localStorage.setItem(
        classesKey(schoolCode),
        JSON.stringify(DEFAULT_CLASSES)
      );
      return DEFAULT_CLASSES;
    }
    return JSON.parse(raw) as ClassEntry[];
  } catch {
    return DEFAULT_CLASSES;
  }
}

function saveClasses(schoolCode: string, classes: ClassEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(classesKey(schoolCode), JSON.stringify(classes));
}

// ============================================================================
// Helpers — derive a synthetic technology-expertise badge per teacher so the
// roster always shows tags even when the Portal Manager hasn't customised it.
// ============================================================================

const TECH_POOL = ["HTML", "Python", "Scratch", "MySQL", "Java", "Paint", "Spreadsheet"];
function inferExpertise(username: string): string[] {
  let h = 0;
  for (const c of username) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const count = 2 + (h % 2); // 2 or 3 tags
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(TECH_POOL[(h + i * 7) % TECH_POOL.length]);
  }
  return Array.from(new Set(out));
}

// ============================================================================
// Main dashboard
// ============================================================================

function SchoolDashboard() {
  return (
    <AppShell requireRole="school" title="School Operations">
      <SchoolWorkspace />
    </AppShell>
  );
}

function SchoolWorkspace() {
  const { user } = useAuth();
  const username = (user?.user_metadata as { username?: string } | undefined)?.username
    ?? user?.email?.split("@")[0]
    ?? "school";

  const myAccount = getMockAccount(username);
  const schoolCode = (myAccount?.schoolCode ?? "SCHOOL").toUpperCase();
  const schoolName = myAccount?.schoolName ?? myAccount?.fullName ?? "Avartan Test Academy";

  const [accounts, setAccounts] = useState<MockAccount[]>(() => listMockAccounts());
  useEffect(() => subscribeMockAccounts(() => setAccounts(listMockAccounts())), []);

  const [classes, setClasses] = useState<ClassEntry[]>(() => loadClasses(schoolCode));
  useEffect(() => {
    saveClasses(schoolCode, classes);
  }, [classes, schoolCode]);

  const teachers = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.role === "teacher" &&
          (a.schoolCode?.toUpperCase() ?? "").trim() === schoolCode
      ),
    [accounts, schoolCode]
  );
  const students = useMemo(
    () =>
      accounts.filter(
        (a) =>
          a.role === "student" &&
          (a.schoolCode?.toUpperCase() ?? "").trim() === schoolCode
      ),
    [accounts, schoolCode]
  );

  const totalSections = classes.reduce((n, c) => n + c.sections.length, 0);
  const assignedTeacherCount = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) =>
      c.sections.forEach((s) => s.teacherUsername && set.add(s.teacherUsername))
    );
    return set.size;
  }, [classes]);

  const [tab, setTab] = useState<"teachers" | "structure" | "monitor">("teachers");

  const tabs = [
    { id: "teachers" as const, label: "Teacher Allocation", icon: GraduationCap },
    { id: "structure" as const, label: "Classes & Sections", icon: Layers },
    { id: "monitor" as const, label: "Performance Monitor", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-border bg-gradient-to-br from-indigo-500/10 via-card to-card p-5 shadow-elegant sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-primary-foreground shadow-glow">
            <School2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {schoolCode} · Institution Console
            </div>
            <h2 className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
              {schoolName}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]" />
            Online
          </span>
          <Button variant="outline" size="sm" onClick={() => exportSummaryCsv(schoolCode, classes, teachers, students)}>
            <Download className="h-3.5 w-3.5" /> Export summary
          </Button>
        </div>
      </header>

      {/* Stat ribbon */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Class configurations" value={classes.length} icon={School2} trend="Mapped grades" />
        <StatCard label="Section counts" value={totalSections} icon={Layers} trend={`Across ${classes.length} classes`} />
        <StatCard
          label="Active assigned teachers"
          value={assignedTeacherCount}
          icon={GraduationCap}
          trend={`${teachers.length} on roster`}
        />
        <StatCard label="Enrolled students" value={students.length} icon={Users} trend="Live registry" />
      </div>

      {/* Tabs */}
      <nav className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-elegant sm:inline-flex sm:w-auto">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all sm:text-sm",
                active
                  ? "bg-gradient-to-br from-indigo-500 to-sky-500 text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </nav>

      {tab === "teachers" && (
        <TeacherPanel
          teachers={teachers}
          classes={classes}
          onAssign={(username, classId, sectionId) =>
            setClasses((arr) =>
              arr.map((c) =>
                c.id === classId
                  ? {
                      ...c,
                      sections: c.sections.map((s) =>
                        s.id === sectionId ? { ...s, teacherUsername: username } : s
                      ),
                    }
                  : c
              )
            )
          }
        />
      )}
      {tab === "structure" && (
        <StructurePanel
          classes={classes}
          setClasses={setClasses}
          teachers={teachers}
        />
      )}
      {tab === "monitor" && (
        <MonitorPanel students={students} classes={classes} teachers={teachers} />
      )}
    </div>
  );
}

// ============================================================================
// 2. Teacher Allocation Panel
// ============================================================================

function TeacherPanel({
  teachers,
  classes,
  onAssign,
}: {
  teachers: MockAccount[];
  classes: ClassEntry[];
  onAssign: (username: string, classId: string, sectionId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [drawer, setDrawer] = useState<MockAccount | null>(null);

  const filtered = teachers.filter((t) => {
    const blob = `${t.fullName} ${t.username} ${t.teacherId ?? ""}`.toLowerCase();
    return blob.includes(q.trim().toLowerCase());
  });

  return (
    <section className="rounded-2xl border border-border bg-card shadow-elegant">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold">Faculty roster</h3>
          <p className="text-xs text-muted-foreground">Teachers provisioned for this school by the Portal Manager.</p>
        </div>
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teachers"
            className="h-9 w-40 pl-8 text-xs sm:w-56"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          body="When the Portal Manager onboards teachers for this school, they appear here automatically."
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((t) => (
            <li key={t.username} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 transition-colors hover:bg-accent/40 sm:flex sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 font-display text-sm font-bold text-indigo-500">
                  {t.fullName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.fullName}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    @{t.username} · ID {t.teacherId ?? "—"}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {inferExpertise(t.username).map((tag) => (
                      <span key={tag} className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDrawer(t)} className="shrink-0">
                <Edit3 className="h-3.5 w-3.5" /> Map
              </Button>
            </li>
          ))}
        </ul>
      )}

      {drawer && (
        <AssignDrawer
          teacher={drawer}
          classes={classes}
          onClose={() => setDrawer(null)}
          onAssign={(classId, sectionId) => {
            onAssign(drawer.username, classId, sectionId);
            toast.success("Teacher allocated", {
              description: `${drawer.fullName} now leads this section.`,
            });
            setDrawer(null);
          }}
        />
      )}
    </section>
  );
}

function AssignDrawer({
  teacher,
  classes,
  onClose,
  onAssign,
}: {
  teacher: MockAccount;
  classes: ClassEntry[];
  onClose: () => void;
  onAssign: (classId: string, sectionId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button aria-label="Close" onClick={onClose} className="flex-1 bg-slate-950/60 backdrop-blur-sm" />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Allocation wizard</div>
            <h3 className="truncate font-display text-base font-semibold">{teacher.fullName}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 text-xs font-medium text-muted-foreground">
            Pick the Class · Section this teacher should lead.
          </div>
          <ul className="space-y-2">
            {classes.flatMap((c) =>
              c.sections.map((s) => {
                const owned = s.teacherUsername === teacher.username;
                return (
                  <li key={`${c.id}-${s.id}`}>
                    <button
                      onClick={() => onAssign(c.id, s.id)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-indigo-500/5",
                        owned && "border-indigo-500/50 bg-indigo-500/10"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{c.grade} · {s.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {s.teacherUsername ? `Currently led by @${s.teacherUsername}` : "Unassigned"}
                        </div>
                      </div>
                      {owned && <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        <footer className="border-t border-border p-4 text-[11px] text-muted-foreground">
          Expertise: {inferExpertise(teacher.username).join(" · ")}
        </footer>
      </aside>
    </div>
  );
}

// ============================================================================
// 3. Class & Section Structure Panel
// ============================================================================

function StructurePanel({
  classes,
  setClasses,
  teachers,
}: {
  classes: ClassEntry[];
  setClasses: React.Dispatch<React.SetStateAction<ClassEntry[]>>;
  teachers: MockAccount[];
}) {
  const [newClass, setNewClass] = useState("");

  const addClass = () => {
    const grade = newClass.trim();
    if (!grade) return;
    if (classes.some((c) => c.grade.toLowerCase() === grade.toLowerCase())) {
      toast.error("Class already exists");
      return;
    }
    setClasses((arr) => [
      ...arr,
      { id: `cl-${Date.now()}`, grade, sections: [{ id: `sec-${Date.now()}`, name: "Section A" }] },
    ]);
    setNewClass("");
    toast.success("Class added", { description: grade });
  };

  const addSection = (classId: string) => {
    const name = window.prompt("Section name (e.g. Section C, Section Red)");
    if (!name) return;
    setClasses((arr) =>
      arr.map((c) =>
        c.id === classId
          ? {
              ...c,
              sections: [...c.sections, { id: `sec-${Date.now()}`, name: name.trim() }],
            }
          : c
      )
    );
    toast.success("Section added");
  };

  const removeSection = (classId: string, sectionId: string) => {
    setClasses((arr) =>
      arr.map((c) =>
        c.id === classId ? { ...c, sections: c.sections.filter((s) => s.id !== sectionId) } : c
      )
    );
  };

  const removeClass = (classId: string) => {
    if (!window.confirm("Remove this class and all its sections?")) return;
    setClasses((arr) => arr.filter((c) => c.id !== classId));
  };

  const updateTeacher = (classId: string, sectionId: string, username: string) => {
    setClasses((arr) =>
      arr.map((c) =>
        c.id === classId
          ? {
              ...c,
              sections: c.sections.map((s) =>
                s.id === sectionId ? { ...s, teacherUsername: username || undefined } : s
              ),
            }
          : c
      )
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Setup terminal */}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-elegant lg:col-span-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold">Structural setup</h3>
            <p className="text-xs text-muted-foreground">Register classes and attach sections.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClass()}
            placeholder="New class (e.g. Class 9)"
            className="h-9 text-sm"
          />
          <Button onClick={addClass} size="sm" variant="hero" className="shrink-0">
            <Plus className="h-3.5 w-3.5" /> Class
          </Button>
        </div>
        <ul className="space-y-3">
          {classes.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div className="truncate text-sm font-semibold">{c.grade}</div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="outline" onClick={() => addSection(c.id)}>
                    <Plus className="h-3 w-3" /> Section
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeClass(c.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <ul className="mt-2 space-y-1.5">
                {c.sections.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span className="truncate text-xs font-medium">{s.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <select
                        value={s.teacherUsername ?? ""}
                        onChange={(e) => updateTeacher(c.id, s.id, e.target.value)}
                        className="h-7 max-w-[140px] rounded-md border border-border bg-background px-2 text-[11px] outline-none focus:border-indigo-500"
                      >
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                          <option key={t.username} value={t.username}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeSection(c.id, s.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Tree view */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-elegant lg:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <TreePine className="h-4 w-4 text-indigo-500" />
          <h3 className="font-display text-base font-semibold">Allocation tree</h3>
        </div>
        <div className="space-y-3 font-mono text-xs">
          {classes.map((c) => (
            <div key={c.id}>
              <div className="flex items-center gap-2">
                <span className="text-indigo-500">▸</span>
                <span className="font-sans font-semibold">{c.grade}</span>
              </div>
              <ul className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                {c.sections.map((s) => {
                  const t = teachers.find((x) => x.username === s.teacherUsername);
                  return (
                    <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <span className="truncate font-sans text-muted-foreground">└─ {s.name}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          t
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-amber-500/15 text-amber-500"
                        )}
                      >
                        {t ? t.fullName : "Unassigned"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// 4. Performance Monitor Panel
// ============================================================================

function MonitorPanel({
  students,
  classes,
  teachers,
}: {
  students: MockAccount[];
  classes: ClassEntry[];
  teachers: MockAccount[];
}) {
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Derive synthetic-but-deterministic completion + marks per student.
  const enriched = useMemo(
    () =>
      students.map((s) => {
        let h = 0;
        for (const c of s.username) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const total = 12;
        const done = 4 + (h % 9); // 4..12
        const marks = 55 + (h % 41); // 55..95
        const teacher = teachers.find(
          (t) => t.teacherId && s.teacherId && t.teacherId === s.teacherId
        );
        return {
          account: s,
          total,
          done,
          pending: total - done,
          marks,
          teacherName: teacher?.fullName ?? s.teacherName ?? "—",
          cls: s.classSection ?? "—",
        };
      }),
    [students, teachers]
  );

  const filtered = enriched.filter((row) => {
    const blob = `${row.account.fullName} ${row.account.username} ${row.cls} ${row.teacherName}`.toLowerCase();
    if (!blob.includes(q.trim().toLowerCase())) return false;
    if (classFilter !== "all" && row.cls !== classFilter) return false;
    return true;
  });

  const avgMarks = filtered.length
    ? Math.round(filtered.reduce((a, b) => a + b.marks, 0) / filtered.length)
    : 0;
  const completion = filtered.length
    ? Math.round(
        (filtered.reduce((a, b) => a + b.done, 0) /
          filtered.reduce((a, b) => a + b.total, 0)) *
          100
      )
    : 0;
  const outstanding = filtered.reduce((a, b) => a + b.pending, 0);

  const allSections = Array.from(
    new Set(
      classes.flatMap((c) => c.sections.map((s) => `${c.grade.replace("Class ", "")}-${s.name.replace("Section ", "")[0] ?? "A"}`))
    )
  );

  const exportCsv = () => {
    const header = ["student", "username", "class", "teacher", "completed", "total", "marks"].join(",");
    const rows = filtered.map((r) =>
      [r.account.fullName, r.account.username, r.cls, r.teacherName, r.done, r.total, r.marks]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", { description: `${filtered.length} rows` });
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Avg marks distribution" value={`${avgMarks}%`} icon={TrendingUp} trend={`${filtered.length} students`} />
        <StatCard label="Assignment completion" value={`${completion}%`} icon={ClipboardList} trend="Live activity" />
        <StatCard label="Outstanding tasks" value={outstanding} icon={Layers} trend="Across filtered set" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-elegant">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border p-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold">Student lifecycle report</h3>
            <p className="text-xs text-muted-foreground">Search, filter, and export activity across the school.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-indigo-500"
            >
              <option value="all">All classes</option>
              {allSections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-9 w-32 pl-8 text-xs sm:w-44"
              />
            </div>
            <Button size="sm" variant="outline" onClick={exportCsv} className="shrink-0">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students match"
            body="Adjust filters, or wait for the Portal Manager to enroll students into this school."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Student</th>
                  <th className="px-3 py-2 text-left font-semibold">Class</th>
                  <th className="px-3 py-2 text-left font-semibold">Teacher</th>
                  <th className="px-3 py-2 text-left font-semibold">Progress</th>
                  <th className="px-3 py-2 text-right font-semibold">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.account.username} className="hover:bg-accent/40">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.account.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">@{r.account.username}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.cls}</td>
                    <td className="px-3 py-2 text-xs">{r.teacherName}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-sky-500"
                            style={{ width: `${(r.done / r.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{r.done}/{r.total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-semibold">{r.marks}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Misc
// ============================================================================

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-sm font-semibold">{title}</div>
      <p className="max-w-sm text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function exportSummaryCsv(
  schoolCode: string,
  classes: ClassEntry[],
  teachers: MockAccount[],
  students: MockAccount[]
) {
  const lines = [
    `school,${schoolCode}`,
    `classes,${classes.length}`,
    `sections,${classes.reduce((n, c) => n + c.sections.length, 0)}`,
    `teachers,${teachers.length}`,
    `students,${students.length}`,
    "",
    "grade,section,teacher",
    ...classes.flatMap((c) =>
      c.sections.map((s) => `${c.grade},${s.name},${s.teacherUsername ?? "Unassigned"}`)
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${schoolCode}-summary.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Summary exported");
}