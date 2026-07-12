import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { getSchoolDashboardData } from "@/lib/schools.functions";
import { listMySchoolTeachers } from "@/lib/teachers.functions";
import {
  getMockAccount,
  listMockAccounts,
  subscribeMockAccounts,
  type MockAccount,
} from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

// ============================================================================
// Curated Unsplash imagery (kids coding, STEM labs, digital interfaces).
// ============================================================================
const IMG = {
  heroBanner:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
  teachers:
    "https://images.unsplash.com/photo-1610484826967-09c5720778c7?auto=format&fit=crop&w=1200&q=80",
  structure:
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  monitor:
    "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
  treeKids:
    "https://images.unsplash.com/photo-1596496050755-c923e73e42e3?auto=format&fit=crop&w=900&q=80",
  emptyKids:
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
};

export const Route = createFileRoute("/school/")({
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
  const { user, session } = useAuth();
  const getSchools = useServerFn(getSchoolDashboardData);
  const { data: backendData } = useQuery({
    queryKey: ["schools", "dashboard", "mine"],
    queryFn: () => getSchools(),
    enabled: Boolean(session),
    retry: false,
  });
  const fetchTeachers = useServerFn(listMySchoolTeachers);
  const { data: backendTeachers } = useQuery({
    queryKey: ["school-teachers"],
    queryFn: () => fetchTeachers(),
    enabled: Boolean(session),
    retry: false,
  });
  const backendSchool = backendData?.schools[0];
  const username = (user?.user_metadata as { username?: string } | undefined)?.username
    ?? user?.email?.split("@")[0]
    ?? "school";

  const myAccount = getMockAccount(username);
  const schoolCode = (backendSchool?.schoolCode ?? myAccount?.schoolCode ?? "SCHOOL").toUpperCase();
  const schoolName = backendSchool?.schoolName ?? myAccount?.schoolName ?? myAccount?.fullName ?? "Avartan Test Academy";

  const [accounts, setAccounts] = useState<MockAccount[]>(() => listMockAccounts());
  useEffect(() => subscribeMockAccounts(() => setAccounts(listMockAccounts())), []);

  const [classes, setClasses] = useState<ClassEntry[]>(() => loadClasses(schoolCode));
  useEffect(() => {
    setClasses(loadClasses(schoolCode));
  }, [schoolCode]);
  useEffect(() => {
    saveClasses(schoolCode, classes);
  }, [classes, schoolCode]);

  const teachers = useMemo(() => {
    const mock = accounts.filter(
      (a) =>
        a.role === "teacher" &&
        (a.schoolCode?.toUpperCase() ?? "").trim() === schoolCode
    );
    const backend: MockAccount[] = (backendTeachers?.teachers ?? []).map((t) => ({
      username: t.username,
      password: "",
      role: "teacher",
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      schoolCode,
      teacherId: t.employeeId || t.id.slice(0, 6).toUpperCase(),
    } as MockAccount));
    const seen = new Set<string>();
    return [...backend, ...mock].filter((t) => {
      const k = t.username.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [accounts, backendTeachers, schoolCode]);
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
      {/* Premium image-led hero banner */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-indigo-950/30">
        <img
          src={IMG.heroBanner}
          alt="School kids collaborating in a digital coding lab"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-indigo-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.35),transparent_60%)]" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-6 sm:flex sm:flex-wrap sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.55)] ring-1 ring-white/30">
              <School2 className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200/90">
                {schoolCode} · Institution Console
              </div>
              <h2 className="truncate font-display text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl">
                {schoolName}
              </h2>
              <p className="mt-1 hidden text-xs text-indigo-100/80 sm:block">
                Steer every classroom, teacher, and lab from one elite command surface.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_currentColor]" />
              Live
            </span>
            <Button
              size="sm"
              onClick={() => exportSummaryCsv(schoolCode, classes, teachers, students)}
              className="bg-white/10 text-white backdrop-blur-md ring-1 ring-white/20 hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" /> Export summary
            </Button>
          </div>
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
    <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl">
      <div className="relative overflow-hidden border-b border-border/60">
        <img
          src={IMG.teachers}
          alt="Teacher mentoring students in a digital coding classroom"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/30" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5 sm:flex sm:justify-between sm:p-6">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500">Faculty</div>
            <h3 className="truncate font-display text-lg font-bold">Teacher roster &amp; allocation</h3>
            <p className="text-xs text-muted-foreground">Create teachers for your school and assign them to sections.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search teachers"
                className="h-11 w-44 pl-10 text-sm sm:w-64"
              />
            </div>
            <Button size="sm" variant="hero" asChild>
              <Link to="/school/create-teacher"><Plus className="h-3.5 w-3.5" /> Create Teacher</Link>
            </Button>
          </div>
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          body="Click Create Teacher to add the first faculty member for your school."
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
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Setup terminal — God-level premium card */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-8 shadow-2xl shadow-indigo-950/20 ring-1 ring-white/5 backdrop-blur-xl lg:col-span-3">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-transparent blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-500/25 to-transparent blur-3xl"
        />

        {/* Header with kids-coding micro hero */}
        <div className="relative mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-indigo-500/10 via-card to-sky-500/5 p-5">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
              Structural setup
            </div>
            <h3 className="truncate font-display text-xl font-bold tracking-tight">
              Register classes &amp; attach sections
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Build the academic spine of your campus — every section can be assigned a lead instructor.
            </p>
          </div>
          <div className="hidden h-20 w-32 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 sm:block">
            <img
              src={IMG.structure}
              alt="Diverse students learning to code together"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Premium "+ Class" input row */}
        <div className="relative mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Input
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addClass()}
              placeholder="New class (e.g. Class 9)"
              className="h-14 rounded-xl px-6 text-lg font-medium shadow-inner shadow-black/5 transition-all focus-visible:shadow-[0_0_0_4px_rgba(99,102,241,0.18),0_0_30px_rgba(99,102,241,0.25)]"
            />
          </div>
          <Button
            onClick={addClass}
            className="h-14 shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all hover:shadow-2xl hover:shadow-indigo-500/60 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Class
          </Button>
        </div>

        <ul className="relative space-y-4">
          {classes.map((c) => (
            <li
              key={c.id}
              className="group rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 via-background/40 to-background/20 p-5 shadow-lg shadow-black/5 ring-1 ring-white/5 backdrop-blur-md transition-all hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 font-display text-sm font-bold text-white shadow-md shadow-indigo-500/40">
                    {c.grade.replace(/\D/g, "") || "•"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-bold">{c.grade}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.sections.length} section{c.sections.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => addSection(c.id)}
                    className="h-10 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 text-xs font-semibold text-white shadow-md shadow-sky-500/40 transition-all hover:shadow-lg hover:shadow-sky-500/50 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" /> Section
                  </Button>
                  <button
                    onClick={() => removeClass(c.id)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-sm transition-all hover:bg-rose-500/20 hover:shadow-md hover:shadow-rose-500/30 active:scale-90"
                    aria-label={`Remove ${c.grade}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {c.sections.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/50 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:border-indigo-500/30 hover:bg-card"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_10px_currentColor]" />
                      <span className="truncate text-sm font-semibold">{s.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={s.teacherUsername ?? ""}
                        onChange={(e) => updateTeacher(c.id, s.id, e.target.value)}
                        className="h-10 max-w-[180px] rounded-xl border border-border/70 bg-background/60 px-3 text-xs font-medium backdrop-blur-md outline-none transition-all focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
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
                        className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 active:scale-90"
                        aria-label={`Remove ${s.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Tree view — premium */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-2xl shadow-indigo-950/20 ring-1 ring-white/5 backdrop-blur-xl lg:col-span-2">
        <div className="relative mb-4 h-28 overflow-hidden rounded-2xl ring-1 ring-white/10">
          <img
            src={IMG.treeKids}
            alt="Kids in a digital skill lab"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur-md ring-1 ring-white/30">
              <TreePine className="h-4 w-4 text-white" />
            </div>
            <div className="font-display text-base font-bold text-white drop-shadow">Allocation tree</div>
          </div>
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
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-xl shadow-indigo-950/20">
        <img
          src={IMG.monitor}
          alt="Students collaborating around computers"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-indigo-900/30" />
        <div className="relative flex items-center justify-between gap-4 p-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200">Performance</div>
            <h3 className="font-display text-xl font-bold text-white drop-shadow">Lifecycle &amp; outcomes</h3>
            <p className="mt-1 max-w-md text-xs text-indigo-100/80">
              Track every learner&apos;s completion rate, marks distribution, and outstanding work across classes.
            </p>
          </div>
          <TrendingUp className="hidden h-12 w-12 text-indigo-300/80 drop-shadow sm:block" />
        </div>
      </div>
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
            <Button size="sm" variant="hero" asChild className="shrink-0">
              <Link to="/school/bulk-students"><Upload className="h-3.5 w-3.5" /> Bulk Upload</Link>
            </Button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students match"
            body="Use Bulk Upload to add students from an Excel file, or adjust your filters above."
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
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="relative h-28 w-44 overflow-hidden rounded-2xl ring-1 ring-border/60 shadow-lg">
        <img
          src={IMG.emptyKids}
          alt="Students learning together"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute bottom-2 left-2 grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-md ring-1 ring-white/30">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="font-display text-base font-bold">{title}</div>
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