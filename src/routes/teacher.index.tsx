import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useRef, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { ProjectsWidget } from "@/components/projects-widget";
import { AssignmentsWidget } from "@/components/assignments-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { StudentLoginDetailsButton } from "@/components/student-login-details";
import { useAuth } from "@/lib/auth";
import { listMockAccounts, registerMockAccount, subscribeMockAccounts, type MockAccount } from "@/lib/mock-auth";
import { getMyTeacherWorkspace } from "@/lib/classes.functions";
import { toast } from "sonner";
import {
  KeyRound, CheckCircle2, AlertTriangle, Plus, Upload, Download, GraduationCap,
  ClipboardList, Inbox, Settings2, Users, Trash2, Send, BookOpen, Layers,
} from "lucide-react";

export const Route = createFileRoute("/teacher/")({
  head: () => ({ meta: [{ title: "Teacher · Avartan Skill Lab" }] }),
  component: TeacherWorkspace,
});

// ─────────────────────────────────────────────────────────────────────────────
// Domain constants
// ─────────────────────────────────────────────────────────────────────────────
const TECH_STREAMS = [
  "Scratch Junior", "Scratch", "HTML", "Python", "Java", "MySQL",
  "Word Processor", "Spreadsheet", "Presentation", "Paint",
] as const;
type Tech = (typeof TECH_STREAMS)[number];

const CLASS_OPTIONS = ["Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const SECTION_OPTIONS = ["A", "B", "C", "D"];

// ─────────────────────────────────────────────────────────────────────────────
// Types & local-storage helpers
// ─────────────────────────────────────────────────────────────────────────────
type TaskType = "Assignment" | "Project";
type TaskAudience = { mode: "class" | "sections" | "students"; classKey?: string; sections?: string[]; students?: string[] };
type Task = {
  id: string; type: TaskType; title: string; instructions: string;
  tech: Tech; maxMarks: number; due: string; audience: TaskAudience;
  createdAt: number; teacherUsername: string;
};
type Submission = {
  id: string; taskId: string; studentUsername: string; studentName: string;
  rollNo: string; classSection: string; submittedAt: number; content: string;
  status: "submitted" | "evaluated" | "overdue";
  marks?: number; feedback?: string;
};
type TeacherProfile = {
  username: string; fullName: string; teacherId: string; phone: string; email: string;
  schoolCode: string; expertise: Tech[]; mappings: string[]; // e.g. "Class 6 - A"
};

const K_TASKS = "avartan.teacher.tasks.v1";
const K_SUBS = "avartan.teacher.submissions.v1";
const K_PROFILE = "avartan.teacher.profile.v1";

const readLS = <T,>(k: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const r = window.localStorage.getItem(k); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
};
const writeLS = (k: string, v: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(k, JSON.stringify(v));
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
function TeacherWorkspace() {
  const { user, session } = useAuth();
  const teacherUsername = (user?.user_metadata as { username?: string } | undefined)?.username || "teacher";

  const [accounts, setAccounts] = useState<MockAccount[]>(() => listMockAccounts());
  useEffect(() => subscribeMockAccounts(() => setAccounts(listMockAccounts())), []);

  const me = accounts.find((a) => a.username === teacherUsername);
  const schoolCode = me?.schoolCode || "SCHOOL";

  // Real allocations from the backend: sections assigned to me + their students.
  const fetchWorkspace = useServerFn(getMyTeacherWorkspace);
  const { data: workspace, error: workspaceError } = useQuery({
    queryKey: ["teacher-workspace", user?.id ?? "signed-out"],
    queryFn: () => fetchWorkspace(),
    enabled: Boolean(session),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const mySections = workspace?.sections ?? [];

  // Students mapped to this teacher (backend allocations first, local mocks after)
  const myStudents = useMemo(() => {
    const backend: MockAccount[] = (workspace?.students ?? []).map((s) => ({
      username: s.username,
      password: "",
      role: "student",
      fullName: s.fullName,
      email: "",
      schoolCode,
      classSection: [s.className, s.section].filter(Boolean).join(" - "),
      databaseId: s.id,
      meta: { admissionId: s.rollNumber, allocationSource: s.allocationSource },
    } as MockAccount));
    const mock = accounts.filter(
      (a) =>
        a.role === "student" &&
        a.schoolCode === schoolCode &&
        (a.teacherId === me?.teacherId || a.teacherId === teacherUsername.toUpperCase()),
    );
    const seen = new Set<string>();
    return [...backend, ...mock].filter((s) => {
      const k = s.username.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [accounts, workspace, schoolCode, me?.teacherId, teacherUsername]);

  const [tasks, setTasks] = useState<Task[]>(() => readLS<Task[]>(K_TASKS, []));
  const [subs, setSubs] = useState<Submission[]>(() => readLS<Submission[]>(K_SUBS, []));
  useEffect(() => writeLS(K_TASKS, tasks), [tasks]);
  useEffect(() => writeLS(K_SUBS, subs), [subs]);

  // Hydrate one mock submission per task on first publish if none exists
  const [tab, setTab] = useState("tasks");

  const seedSubsForTask = useCallback((task: Task) => {
    setSubs((prev) => {
      if (prev.some((s) => s.taskId === task.id)) return prev;
      const target = myStudents.slice(0, Math.max(1, Math.min(3, myStudents.length)));
      if (target.length === 0) return prev;
      const seeded: Submission[] = target.map((st, i) => ({
        id: `${task.id}-${st.username}`,
        taskId: task.id,
        studentUsername: st.username,
        studentName: st.fullName,
        rollNo: st.meta?.admissionId || `R${10 + i}`,
        classSection: st.classSection || "VI-A",
        submittedAt: Date.now() - i * 3_600_000,
        content: `Submitted ${task.tech} work for "${task.title}". (Mock attachment preview)`,
        status: "submitted",
      }));
      return [...prev, ...seeded];
    });
  }, [myStudents]);

  return (
    <AppShell requireRole="teacher" title="Teacher Workspace">
      <div className="space-y-6">
        {workspaceError ? (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Teacher allocations could not be loaded: {workspaceError instanceof Error ? workspaceError.message : "Please refresh and try again."}
          </div>
        ) : null}
        <HeaderStats
          tasks={tasks}
          subs={subs}
          students={myStudents}
          sections={mySections}
          onOpen={setTab}
        />
        <ProjectsWidget role="teacher" />
        <AssignmentsWidget role="teacher" />
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1 backdrop-blur bg-card/60 border border-border/60">
            <TabsTrigger value="tasks"><ClipboardList className="h-4 w-4 mr-1.5" />Tasks</TabsTrigger>
            <TabsTrigger value="inbox"><Inbox className="h-4 w-4 mr-1.5" />Evaluation</TabsTrigger>
            <TabsTrigger value="students"><Users className="h-4 w-4 mr-1.5" />Students</TabsTrigger>
            <TabsTrigger value="profile"><GraduationCap className="h-4 w-4 mr-1.5" />Profile</TabsTrigger>
            <TabsTrigger value="settings"><Settings2 className="h-4 w-4 mr-1.5" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <TaskAuthoring
              teacherUsername={teacherUsername}
              students={myStudents}
              tasks={tasks}
              onPublish={(t) => { setTasks((p) => [t, ...p]); seedSubsForTask(t); toast.success(`Published: ${t.title}`); }}
              onDelete={(id) => { setTasks((p) => p.filter((t) => t.id !== id)); setSubs((p) => p.filter((s) => s.taskId !== id)); }}
            />
          </TabsContent>

          <TabsContent value="inbox">
            <EvaluationInbox
              tasks={tasks} subs={subs}
              onGrade={(id, marks, feedback) => {
                setSubs((p) => p.map((s) => s.id === id ? { ...s, marks, feedback, status: "evaluated" } : s));
                toast.success("Grade submitted — entry moved to Evaluated");
              }}
            />
          </TabsContent>

          <TabsContent value="students">
            <Card className="mb-4 backdrop-blur bg-card/60 border-border/60">
              <CardHeader><CardTitle className="text-base">My allocated sections</CardTitle></CardHeader>
              <CardContent>
                {mySections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                    No sections allocated yet. Your school admin allocates you to class sections.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {mySections.map((s) => (
                      <Badge key={s.id} variant="secondary" className="rounded-xl px-3 py-1.5 text-xs">
                        {s.className} · {s.sectionName} · {s.studentCount} student{s.studentCount === 1 ? "" : "s"}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <StudentRoster
              schoolCode={schoolCode}
              teacherUsername={teacherUsername}
              teacherId={me?.teacherId || teacherUsername.toUpperCase()}
              teacherName={me?.fullName || "Lead Instructor"}
              students={myStudents}
            />
          </TabsContent>

          <TabsContent value="profile">
            <TeacherProfilePanel
              defaults={{
                username: teacherUsername,
                fullName: me?.fullName || "",
                teacherId: me?.teacherId || teacherUsername.toUpperCase(),
                phone: me?.meta?.phone || "",
                email: me?.email || "",
                schoolCode,
              }}
            />
          </TabsContent>

          <TabsContent value="settings">
            <GeminiKeyPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header analytics
// ─────────────────────────────────────────────────────────────────────────────
type SectionSummary = { id: string; className: string; sectionName: string; studentCount: number };
type DetailKind = "tasks" | "pending" | "evaluated" | "overdue" | "students" | "sections" | "subs";

function HeaderStats({
  tasks, subs, students, sections, onOpen,
}: {
  tasks: Task[];
  subs: Submission[];
  students: MockAccount[];
  sections: SectionSummary[];
  onOpen: (tab: string) => void;
}) {
  const now = Date.now();
  const [detail, setDetail] = useState<DetailKind | null>(null);
  const total = subs.length;
  const pending = subs.filter((s) => s.status === "submitted").length;
  const evaluated = subs.filter((s) => s.status === "evaluated").length;
  const overdue = tasks.filter((t) => new Date(t.due).getTime() < now).length;
  const stats: Array<{ label: string; value: number; icon: typeof Users; tone: string; tab: string; hint: string; kind: DetailKind }> = [
    { label: "Active Tasks", value: tasks.length, icon: ClipboardList, tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-300", tab: "tasks", hint: "View task details", kind: "tasks" },
    { label: "Pending Review", value: pending, icon: Inbox, tone: "from-amber-500/20 to-amber-500/5 text-amber-300", tab: "inbox", hint: "View pending submissions", kind: "pending" },
    { label: "Evaluated", value: evaluated, icon: CheckCircle2, tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-300", tab: "inbox", hint: "View evaluated work", kind: "evaluated" },
    { label: "My Sections", value: sections.length, icon: Layers, tone: "from-violet-500/20 to-violet-500/5 text-violet-300", tab: "students", hint: "View allocated sections", kind: "sections" },
    { label: "My Students", value: students.length, icon: Users, tone: "from-sky-500/20 to-sky-500/5 text-sky-300", tab: "students", hint: "View student roster", kind: "students" },
    { label: "Overdue", value: overdue, icon: AlertTriangle, tone: "from-rose-500/20 to-rose-500/5 text-rose-300", tab: "tasks", hint: "View overdue tasks", kind: "overdue" },
    { label: "Total Subs", value: total, icon: BookOpen, tone: "from-slate-500/20 to-slate-500/5 text-slate-300", tab: "inbox", hint: "View all submissions", kind: "subs" },
  ];
  return (
    <>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
      {stats.map((s) => (
        <Button
          key={s.label}
          type="button"
          variant="ghost"
          onClick={() => setDetail(s.kind)}
          title={s.hint}
          aria-label={`${s.label}: ${s.value}. ${s.hint}`}
          className={`group h-auto min-h-28 w-full flex-col items-stretch rounded-xl border border-border/60 bg-gradient-to-br ${s.tone} p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        >
          <div className="flex items-center justify-between">
            <s.icon className="h-4 w-4 opacity-80" />
            <span className="text-2xl font-display font-semibold tabular-nums">{s.value}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          <div className="mt-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">{s.hint}</div>
        </Button>
      ))}
    </div>
    <StatDetailDialog
      kind={detail}
      onClose={() => setDetail(null)}
      onOpenTab={(tab) => { setDetail(null); onOpen(tab); }}
      tasks={tasks}
      subs={subs}
      students={students}
      sections={sections}
    />
    </>
  );
}

function StatDetailDialog({
  kind, onClose, onOpenTab, tasks, subs, students, sections,
}: {
  kind: DetailKind | null;
  onClose: () => void;
  onOpenTab: (tab: string) => void;
  tasks: Task[];
  subs: Submission[];
  students: MockAccount[];
  sections: SectionSummary[];
}) {
  const now = Date.now();
  const titles: Record<DetailKind, string> = {
    tasks: "Active tasks",
    pending: "Submissions awaiting review",
    evaluated: "Evaluated submissions",
    overdue: "Overdue tasks",
    students: "My students",
    sections: "Sections allocated to me",
    subs: "All submissions",
  };
  const tabFor: Record<DetailKind, string> = {
    tasks: "tasks", pending: "inbox", evaluated: "inbox", overdue: "tasks",
    students: "students", sections: "students", subs: "inbox",
  };
  const taskTitle = (id: string) => tasks.find((t) => t.id === id)?.title ?? "Task";

  function body() {
    if (!kind) return null;
    if (kind === "sections") {
      if (sections.length === 0) {
        return <Empty text="No sections allocated yet. Ask your school admin to allocate you to a class section." />;
      }
      return (
        <List>
          {sections.map((s) => (
            <Row
              key={s.id}
              primary={`${s.className} · ${s.sectionName}`}
              secondary={`${s.studentCount} student${s.studentCount === 1 ? "" : "s"} in this section`}
            />
          ))}
        </List>
      );
    }
    if (kind === "students") {
      if (students.length === 0) return <Empty text="No students in your allocated sections yet." />;
      return (
        <List>
          {students.map((s) => (
            <Row
              key={s.username}
              primary={s.fullName}
              secondary={`${s.classSection || "—"} · Roll ${s.meta?.admissionId || "—"}`}
              trailing={`${s.meta?.allocationSource === "direct" ? "Direct allocation" : s.meta?.allocationSource === "section_and_direct" ? "Section + direct" : "Section allocation"} · login: ${s.username}`}
            />
          ))}
        </List>
      );
    }
    const list =
      kind === "tasks" ? tasks
      : kind === "overdue" ? tasks.filter((t) => new Date(t.due).getTime() < now)
      : [];
    if (kind === "tasks" || kind === "overdue") {
      if (list.length === 0) return <Empty text={kind === "overdue" ? "No tasks are overdue." : "No tasks published yet."} />;
      return (
        <List>
          {list.map((t) => (
            <Row
              key={t.id}
              primary={t.title}
              secondary={`${t.type} · ${t.tech} · Due ${new Date(t.due).toLocaleDateString()}`}
              trailing={`${t.maxMarks} marks`}
            />
          ))}
        </List>
      );
    }
    const rows =
      kind === "pending" ? subs.filter((s) => s.status === "submitted")
      : kind === "evaluated" ? subs.filter((s) => s.status === "evaluated")
      : subs;
    if (rows.length === 0) return <Empty text="No submissions yet." />;
    return (
      <List>
        {rows.map((s) => (
          <Row
            key={s.id}
            primary={s.studentName}
            secondary={`${taskTitle(s.taskId)} · ${s.classSection}`}
            trailing={s.status === "evaluated" ? `${s.marks ?? 0} marks` : "Awaiting review"}
          />
        ))}
      </List>
    );
  }

  return (
    <Dialog open={kind !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{kind ? titles[kind] : ""}</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">{body()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {kind ? <Button variant="hero" onClick={() => onOpenTab(tabFor[kind])}>Open full workspace</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border/60">{children}</div>;
}

function Row({ primary, secondary, trailing }: { primary: string; secondary?: string; trailing?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <div className="min-w-0">
        <div className="truncate font-medium">{primary}</div>
        {secondary ? <div className="truncate text-xs text-muted-foreground">{secondary}</div> : null}
      </div>
      {trailing ? <div className="shrink-0 text-xs text-muted-foreground">{trailing}</div> : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task authoring
// ─────────────────────────────────────────────────────────────────────────────
function TaskAuthoring({
  teacherUsername, students, tasks, onPublish, onDelete,
}: {
  teacherUsername: string;
  students: MockAccount[];
  tasks: Task[];
  onPublish: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<TaskType>("Assignment");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tech, setTech] = useState<Tech>("HTML");
  const [maxMarks, setMaxMarks] = useState(100);
  const [due, setDue] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [mode, setMode] = useState<"class" | "sections" | "students">("class");
  const classKeys = Array.from(new Set(students.map((s) => s.classSection?.split("-")[0] || "VI")));
  const sectionKeys = Array.from(new Set(students.map((s) => s.classSection || "VI-A")));
  const [classKey, setClassKey] = useState(classKeys[0] || "VI");
  const [secs, setSecs] = useState<string[]>([]);
  const [stus, setStus] = useState<string[]>([]);

  const reset = () => { setTitle(""); setInstructions(""); setMaxMarks(100); setSecs([]); setStus([]); };

  const publish = () => {
    if (!title.trim()) return toast.error("Please add a title", { description: "Students will see this title on their dashboard." });
    if (!instructions.trim()) return toast.error("Please add instructions", { description: "Explain what students need to do to complete this task." });
    if (maxMarks <= 0) return toast.error("Enter the maximum marks", { description: "Maximum marks must be greater than zero." });
    const audience: TaskAudience =
      mode === "class" ? { mode, classKey } :
      mode === "sections" ? { mode, sections: secs } :
      { mode, students: stus };
    if (mode === "sections" && secs.length === 0) return toast.error("Please select at least one section", { description: "Choose which sections should receive this task." });
    if (mode === "students" && stus.length === 0) return toast.error("Please select at least one student", { description: "Choose who should receive this task." });
    const task: Task = {
      id: `T${Date.now().toString(36)}`,
      type, title: title.trim(), instructions: instructions.trim(),
      tech, maxMarks, due, audience,
      createdAt: Date.now(), teacherUsername,
    };
    onPublish(task);
    reset();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
      <Card className="backdrop-blur bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Create Task / Project</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["Assignment", "Project"] as TaskType[]).map((t) => (
              <button key={t} type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-3 py-2 text-sm transition-all ${type === t ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-border/60 bg-background/40 hover:border-border"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a personal portfolio page" />
          </div>
          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Textarea rows={5} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Rich text instructions, links, rubric, etc." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Technology</Label>
              <Select value={tech} onValueChange={(v) => setTech(v as Tech)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TECH_STREAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max Marks</Label>
              <Input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Due Date / Time</Label>
            <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Audience</Label>
            <div className="flex flex-wrap gap-2">
              {(["class", "sections", "students"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`text-xs rounded-full px-3 py-1 border ${mode === m ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-border/60"}`}>
                  {m === "class" ? "Entire Class" : m === "sections" ? "Specific Sections" : "Individual Students"}
                </button>
              ))}
            </div>

            {mode === "class" && (
              <Select value={classKey} onValueChange={setClassKey}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>{(classKeys.length ? classKeys : ["VI"]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {mode === "sections" && (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto rounded-lg border border-border/60 p-2">
                {(sectionKeys.length ? sectionKeys : ["VI-A", "VI-B"]).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={secs.includes(s)} onCheckedChange={(c) => setSecs((p) => c ? [...p, s] : p.filter((x) => x !== s))} />{s}
                  </label>
                ))}
              </div>
            )}
            {mode === "students" && (
              <div className="grid gap-1.5 max-h-48 overflow-auto rounded-lg border border-border/60 p-2">
                {students.length === 0 && <div className="text-xs text-muted-foreground p-2">No students mapped yet.</div>}
                {students.map((s) => (
                  <label key={s.username} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={stus.includes(s.username)} onCheckedChange={(c) => setStus((p) => c ? [...p, s.username] : p.filter((x) => x !== s.username))} />
                    <span>{s.fullName}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{s.classSection}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button onClick={publish} className="w-full"><Send className="h-4 w-4 mr-1.5" />Publish Task</Button>
        </CardContent>
      </Card>

      <Card className="backdrop-blur bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">Published Tasks</CardTitle></CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No tasks yet — author one on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => {
                const overdue = new Date(t.due).getTime() < Date.now();
                return (
                  <div key={t.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-emerald-400/50 text-emerald-200">{t.type}</Badge>
                          <Badge variant="outline">{t.tech}</Badge>
                          {overdue && <Badge className="bg-rose-500/20 text-rose-200 border-rose-400/40">Overdue</Badge>}
                        </div>
                        <div className="mt-1 font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{t.instructions}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Max: {t.maxMarks}</span>
                      <span>Due: {new Date(t.due).toLocaleString()}</span>
                      <span>To: {t.audience.mode === "class" ? `Class ${t.audience.classKey}` : t.audience.mode === "sections" ? (t.audience.sections || []).join(", ") : `${(t.audience.students || []).length} student(s)`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation inbox
// ─────────────────────────────────────────────────────────────────────────────
function EvaluationInbox({
  tasks, subs, onGrade,
}: {
  tasks: Task[]; subs: Submission[];
  onGrade: (id: string, marks: number, feedback: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const taskById = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks]);

  if (subs.length === 0) {
    return (
      <Card className="backdrop-blur bg-card/60 border-border/60">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          No submissions yet. Publish a task to seed mock student submissions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {subs.map((s) => {
        const task = taskById[s.taskId];
        if (!task) return null;
        const isOpen = open === s.id;
        return (
          <Card key={s.id} className="backdrop-blur bg-card/60 border-border/60">
            <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} className="w-full text-left p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.studentName}</span>
                  <Badge variant="outline" className="text-xs">{s.rollNo}</Badge>
                  <Badge variant="outline" className="text-xs">{s.classSection}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{task.title} · {task.tech} · {new Date(s.submittedAt).toLocaleString()}</div>
              </div>
              <Badge className={s.status === "evaluated"
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                : "bg-amber-500/20 text-amber-200 border-amber-400/40"}>
                {s.status === "evaluated" ? `Evaluated · ${s.marks}/${task.maxMarks}` : "Pending"}
              </Badge>
            </button>
            {isOpen && <EvaluationPanel sub={s} task={task} onGrade={onGrade} />}
          </Card>
        );
      })}
    </div>
  );
}

function EvaluationPanel({ sub, task, onGrade }: { sub: Submission; task: Task; onGrade: (id: string, marks: number, feedback: string) => void }) {
  const [marks, setMarks] = useState<number>(sub.marks ?? 0);
  const [feedback, setFeedback] = useState<string>(sub.feedback ?? "");
  const submit = () => {
    if (marks < 0 || marks > task.maxMarks) { toast.error(`Marks must be 0–${task.maxMarks}`); return; }
    onGrade(sub.id, marks, feedback.trim());
  };
  return (
    <div className="border-t border-border/60 p-4 space-y-3">
      <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
        <div className="text-xs uppercase text-muted-foreground mb-1">Submission</div>
        {sub.content}
      </div>
      <div className="grid sm:grid-cols-[140px_1fr] gap-3">
        <div className="space-y-1.5">
          <Label>Marks (/ {task.maxMarks})</Label>
          <Input type="number" min={0} max={task.maxMarks} value={marks} onChange={(e) => setMarks(Number(e.target.value) || 0)} />
        </div>
        <div className="space-y-1.5">
          <Label>Feedback / Remarks</Label>
          <Textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Constructive remarks for the student" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={submit}><CheckCircle2 className="h-4 w-4 mr-1.5" />Submit Grade</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Student roster — manual + bulk
// ─────────────────────────────────────────────────────────────────────────────
function StudentRoster({
  schoolCode, teacherUsername, teacherId, teacherName, students,
}: {
  schoolCode: string; teacherUsername: string; teacherId: string; teacherName: string; students: MockAccount[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MockAccount | null>(null);

  const generateLoginId = (name: string) => {
    const seed = name.trim().toLowerCase().replace(/[^a-z0-9\s.]/g, "").replace(/\s+/g, ".").replace(/\.+/g, ".").replace(/^\.|\.$/g, "").slice(0, 24) || "student";
    return `${seed}${1000 + Math.floor(Math.random() * 9000)}`;
  };

  const addStudent = (s: { name: string; cls: string; section: string; roll: string }) => {
    const loginId = generateLoginId(s.name);
    const res = registerMockAccount({
      username: loginId,
      password: `${loginId}123`,
      role: "student",
      fullName: s.name,
      email: `${loginId}@avartan.app`,
      schoolCode,
      schoolName: undefined,
      teacherId,
      teacherName,
      classSection: `${s.cls}-${s.section}`,
      meta: { admissionId: s.roll, grade: s.cls, section: s.section, createdBy: teacherUsername },
    });
    if (!res.ok) { toast.error("We couldn't add this student", { description: res.reason || "Please check the details and try again." }); return false; }
    toast.success(`Added ${s.name} · login: ${loginId} / ${loginId}123`);
    return true;
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      let added = 0;
      // Skip header if non-numeric in roll column
      const startIdx = lines[0]?.toLowerCase().includes("name") ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const [name, cls, section, roll] = lines[i].split(",").map((x) => x?.trim());
        if (!name) continue;
        const ok = addStudent({ name, cls: cls || "Class 6", section: section || "A", roll: roll || `R${i}` });
        if (ok) added++;
      }
      toast.success(`Bulk upload complete · ${added} student(s) added`);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = [
      "name,class,section,roll",
      "Aarav Sharma,Class 6,A,R001",
      "Isha Patel,Class 6,A,R002",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students-bulk-upload-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const downloadCredentialsCsv = () => {
    if (students.length === 0) {
      toast.error("No students to export", { description: "Add students to the roster first." });
      return;
    }
    const header = "Full Name,Class,Section,Roll Number,Username,Password,Email";
    const rows = students.map((s) => {
      const grade = s.meta?.grade || "";
      const section = s.meta?.section || "";
      const roll = s.meta?.admissionId || "";
      return `"${s.fullName}","${grade}","${section}","${roll}","${s.username}","${s.password}","${s.email}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-login-credentials.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Credentials downloaded", { description: `${students.length} student record(s) exported.` });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg font-semibold">Student Roster</div>
          <div className="text-xs text-muted-foreground">{students.length} student(s) mapped to you</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={downloadCredentialsCsv}>
            <Download className="h-4 w-4 mr-1.5" />Download Credentials
          </Button>
          <Button variant="soft" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1.5" />Download Template
          </Button>
          <Button variant="soft" onClick={() => uploadInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" />Upload CSV
          </Button>
          <input
            ref={uploadInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
              if (uploadInputRef.current) uploadInputRef.current.value = "";
            }}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />Manual Entry</Button></DialogTrigger>
            <ManualStudentDialog onSubmit={(s) => { if (addStudent(s)) setOpen(false); }} />
          </Dialog>
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-2xl border-2 border-dashed border-border/70 p-8 text-center bg-card/40 backdrop-blur transition-colors hover:bg-card/60"
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
        <div className="mt-2 text-sm">Drag & drop a CSV here to bulk-add students</div>
        <div className="text-xs text-muted-foreground mt-1">Header: <code>name,class,section,roll</code> · a username and password are generated automatically for each student</div>
      </div>

      <Card className="backdrop-blur bg-card/60 border-border/60">
        <CardHeader><CardTitle className="text-base">My Students</CardTitle></CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">No students yet.</div>
          ) : (
            <div className="divide-y divide-border/60">
              {students.map((s) => (
                <div key={s.username} className="py-2.5 flex items-center justify-between text-sm group">
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedStudent(s)}
                  >
                    <div className="font-medium group-hover:text-primary transition-colors">{s.fullName}</div>
                    <div className="text-xs text-muted-foreground">Roll {s.meta?.admissionId || "—"} · {s.classSection}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">login: {s.username}</span>
                    <StudentLoginDetailsButton
                      studentId={s.databaseId}
                      fullName={s.fullName}
                      label="View"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentDetailDialog student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}

function StudentDetailDialog({ student, onClose }: { student: MockAccount | null; onClose: () => void }) {
  if (!student) return null;
  const copyLogin = () => {
    void navigator.clipboard.writeText(
      `Name: ${student.fullName}\nUsername: ${student.username}\nPassword: ${student.password}`,
    );
    toast.success("Login details copied");
  };
  return (
    <Dialog open={Boolean(student)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Complete profile and login credentials for {student.fullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</div>
            <div className="font-semibold text-base">{student.fullName}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Class</div>
              <div className="font-semibold">{student.meta?.grade || "—"}</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Section</div>
              <div className="font-semibold">{student.meta?.section || "—"}</div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Roll Number</div>
            <div className="font-mono text-base font-semibold">{student.meta?.admissionId || "—"}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
            <div className="font-mono text-sm font-semibold break-all">{student.email}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Username</div>
            <div className="font-mono text-base font-semibold">{student.username}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Password</div>
            <div className="font-mono text-base font-semibold">{student.password}</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={copyLogin}>
            <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Copy login details
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManualStudentDialog({ onSubmit }: { onSubmit: (s: { name: string; cls: string; section: string; roll: string }) => void }) {
  const [name, setName] = useState(""); const [cls, setCls] = useState("Class 6");
  const [section, setSection] = useState("A"); const [roll, setRoll] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Manual Student Entry</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Class</Label>
            <Select value={cls} onValueChange={setCls}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CLASS_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Section</Label>
            <Select value={section} onValueChange={setSection}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SECTION_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Roll Number</Label><Input value={roll} onChange={(e) => setRoll(e.target.value)} /></div>
        <p className="text-xs text-muted-foreground">A unique username and password are generated automatically when the student is created.</p>
      </div>
      <DialogFooter>
        <Button onClick={() => {
          if (!name) { toast.error("Name is required", { description: "Enter the student's full name to create the account." }); return; }
          onSubmit({ name, cls, section, roll: roll || `R${Math.floor(Math.random()*90+10)}` });
        }}>Create Student</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher profile (defined creation schema)
// ─────────────────────────────────────────────────────────────────────────────
function TeacherProfilePanel({ defaults }: {
  defaults: { username: string; fullName: string; teacherId: string; phone: string; email: string; schoolCode: string };
}) {
  const { role } = useAuth();
  const isManager = role === "portal_manager";
  const [stored, setStored] = useState<TeacherProfile>(() => readLS<TeacherProfile>(K_PROFILE, {
    username: defaults.username, fullName: defaults.fullName, teacherId: defaults.teacherId,
    phone: defaults.phone, email: defaults.email, schoolCode: defaults.schoolCode,
    expertise: ["HTML", "Python"], mappings: ["Class 6 - A"],
  }));
  const update = (patch: Partial<TeacherProfile>) => setStored((p) => ({ ...p, ...patch }));
  const toggleExp = (t: Tech) => update({ expertise: stored.expertise.includes(t) ? stored.expertise.filter((x) => x !== t) : [...stored.expertise, t] });
  const addMap = (cls: string, sec: string) => {
    const key = `${cls} - ${sec}`;
    if (stored.mappings.includes(key)) return;
    update({ mappings: [...stored.mappings, key] });
  };
  const removeMap = (k: string) => update({ mappings: stored.mappings.filter((m) => m !== k) });

  const mask = (v: string) => isManager ? v.replace(/.(?=.{2})/g, "•") : v;

  const [mapCls, setMapCls] = useState("Class 6");
  const [mapSec, setMapSec] = useState("A");

  const save = () => { writeLS(K_PROFILE, stored); toast.success("Your profile has been saved", { description: "Your dashboard is ready to use." }); };

  return (
    <Card className="backdrop-blur bg-card/60 border-border/60">
      <CardHeader><CardTitle className="text-base">Teacher Profile & Creation Schema</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Full Name</Label>
            <Input value={stored.fullName} onChange={(e) => update({ fullName: e.target.value })} />
          </div>
          <div className="space-y-1.5"><Label>Employee / Teacher ID (unique)</Label>
            <Input value={stored.teacherId} onChange={(e) => update({ teacherId: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1.5"><Label>Primary Contact Number {isManager && <span className="text-xs text-amber-300">(masked)</span>}</Label>
            {isManager
              ? <Input value={mask(stored.phone || "0000000000")} readOnly />
              : <Input value={stored.phone} onChange={(e) => update({ phone: e.target.value })} />}
          </div>
          <div className="space-y-1.5"><Label>Email {isManager && <span className="text-xs text-amber-300">(masked)</span>}</Label>
            {isManager
              ? <Input value={mask(stored.email)} readOnly />
              : <Input type="email" value={stored.email} onChange={(e) => update({ email: e.target.value })} />}
          </div>
          <div className="space-y-1.5"><Label>Assigned School Code</Label>
            <Input value={stored.schoolCode} readOnly className="bg-muted/40" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Technology Expertise Streams</Label>
          <div className="flex flex-wrap gap-2">
            {TECH_STREAMS.map((t) => {
              const on = stored.expertise.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleExp(t)}
                  className={`text-xs rounded-full px-3 py-1 border transition-all ${on ? "border-emerald-400 bg-emerald-500/15 text-emerald-200" : "border-border/60 hover:border-border"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Academic Class & Section Mappings</Label>
          <div className="flex flex-wrap gap-2">
            {stored.mappings.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 text-xs rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 px-2.5 py-1">
                {m}
                <button type="button" onClick={() => removeMap(m)} className="ml-1 opacity-70 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2 pt-2">
            <div className="space-y-1"><Label className="text-xs">Class</Label>
              <Select value={mapCls} onValueChange={setMapCls}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{CLASS_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Section</Label>
              <Select value={mapSec} onValueChange={setMapSec}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>{SECTION_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => addMap(mapCls, mapSec)}><Plus className="h-4 w-4 mr-1" />Add Mapping</Button>
          </div>
        </div>

        <div className="flex justify-end"><Button onClick={save}>Save Profile</Button></div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini API key config
// ─────────────────────────────────────────────────────────────────────────────
function GeminiKeyPanel() {
  return (
    <Card className="backdrop-blur bg-card/60 border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />LLM Services Configuration
          <Badge className="ml-2 bg-emerald-500/20 text-emerald-200 border-emerald-400/40"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          AI quiz and assignment helpers are connected securely through the backend. Teachers no longer need to paste or manage API keys in browser settings.
        </p>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          The AI generator is ready to use from the Quiz Builder.
        </div>
      </CardContent>
    </Card>
  );
}