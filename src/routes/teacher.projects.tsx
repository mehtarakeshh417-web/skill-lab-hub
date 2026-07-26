import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { friendlyError } from "@/lib/messages";
import {
  createProject,
  listProjectHistory,
  listTeacherProjects,
  reviewProject,
} from "@/lib/projects.functions";
import {
  PROJECT_TECHNOLOGIES,
  PROJECT_TEMPLATES,
  STATUS_META,
  SUBMISSION_TYPES,
  templatesFor,
  type ProjectStatus,
} from "@/lib/project-templates";
import {
  Loader2, Plus, FolderKanban, Users, Clock3, CheckCircle2, FileCheck2, History, RotateCcw, Award,
} from "lucide-react";

export const Route = createFileRoute("/teacher/projects")({
  validateSearch: (search: Record<string, unknown>): { submission?: string } => ({
    submission: typeof search.submission === "string" ? search.submission : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Projects · Teacher · Avartan Skill Lab" },
      { name: "description", content: "Assign technology projects, track student progress and evaluate submissions with marks and feedback." },
      { property: "og:title", content: "Teacher Projects · Avartan Skill Lab" },
      { property: "og:description", content: "Assign, track and evaluate student technology projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherProjectsPage,
});

type Student = { id: string; full_name: string; roll_number: string | null; class_name: string | null; section: string | null };
type SignedFile = { name: string; path: string; url: string | null };
type Submission = {
  id: string; student_id: string; status: string; attempt: number; grade: number | null;
  grade_letter: string | null; feedback: string | null; content: string | null;
  source_code: string | null; files: SignedFile[]; submitted_at: string; reviewed_at: string | null;
  students: Student | null;
};
type Project = {
  id: string; title: string; description: string | null; instructions: string | null;
  technology: string | null; submission_type: string; due_date: string | null; max_marks: number | null;
  target_kind: string; target_class: string | null; target_section: string | null; created_at: string;
  audience: Student[]; submissions: Submission[];
};

function statusOf(sub: Submission | undefined): ProjectStatus {
  if (!sub) return "assigned";
  const allowed: ProjectStatus[] = ["in_progress", "submitted", "under_review", "evaluated", "resubmit_requested"];
  return (allowed.includes(sub.status as ProjectStatus) ? sub.status : "submitted") as ProjectStatus;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</Badge>;
}

function TeacherProjectsPage() {
  const { submission: focusSubmission } = Route.useSearch();
  const load = useServerFn(listTeacherProjects);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roster, setRoster] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openReview, setOpenReview] = useState<string | null>(focusSubmission ?? null);

  async function refresh() {
    try {
      const res = (await load()) as { projects: Project[]; roster: Student[] };
      setProjects(res.projects ?? []);
      setRoster(res.roster ?? []);
    } catch (e) {
      toast.error("We couldn't load your projects", { description: friendlyError(e) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if (focusSubmission) setOpenReview(focusSubmission); }, [focusSubmission]);

  const stats = useMemo(() => {
    let pending = 0, submitted = 0, evaluated = 0, assigned = 0;
    for (const p of projects) {
      for (const st of p.audience) {
        const sub = p.submissions.find((s) => s.student_id === st.id);
        const status = statusOf(sub);
        assigned += 1;
        if (status === "assigned" || status === "in_progress" || status === "resubmit_requested") pending += 1;
        if (status === "submitted" || status === "under_review") submitted += 1;
        if (status === "evaluated") evaluated += 1;
      }
    }
    return { pending, submitted, evaluated, assigned };
  }, [projects]);

  return (
    <AppShell requireRole="teacher" title="Projects">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Project Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign technology projects, follow every student's progress and evaluate their work.
          </p>
        </div>
        <CreateProjectDialog roster={roster} onCreated={refresh} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={FolderKanban} label="Total assignments" value={stats.assigned} tone="indigo" />
        <MiniStat icon={Clock3} label="Pending with students" value={stats.pending} tone="amber" />
        <MiniStat icon={FileCheck2} label="Awaiting evaluation" value={stats.submitted} tone="sky" />
        <MiniStat icon={CheckCircle2} label="Evaluated" value={stats.evaluated} tone="emerald" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : projects.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            No projects yet. Create one from a template or build your own.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              openReview={openReview}
              setOpenReview={setOpenReview}
              onChanged={refresh}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: typeof FolderKanban; label: string; value: number; tone: string }) {
  const tones: Record<string, string> = {
    indigo: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10",
    amber: "text-amber-600 dark:text-amber-300 bg-amber-500/10",
    sky: "text-sky-600 dark:text-sky-300 bg-sky-500/10",
    emerald: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10",
  };
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-4 p-6">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({
  project, openReview, setOpenReview, onChanged,
}: {
  project: Project;
  openReview: string | null;
  setOpenReview: (v: string | null) => void;
  onChanged: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const subType = SUBMISSION_TYPES.find((s) => s.value === project.submission_type)?.label ?? project.submission_type;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              {project.title}
              {project.technology && <Badge variant="secondary" className="rounded-full">{project.technology}</Badge>}
            </CardTitle>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{project.target_kind === "class" ? `${project.target_class ?? "All classes"}${project.target_section ? " · Section " + project.target_section : ""}` : "Selected students"}</span>
              <span>· {project.audience.length} students</span>
              <span>· {subType}</span>
              <span>· Max {project.max_marks ?? 100} marks</span>
              {project.due_date && <span>· Due {new Date(project.due_date).toLocaleDateString()}</span>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowHistory((v) => !v)}>
            <History className="mr-1.5 h-4 w-4" />{showHistory ? "Hide history" : "Project history"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
        {project.instructions && (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</div>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{project.instructions}</pre>
          </div>
        )}

        {showHistory && <HistoryPanel assignmentId={project.id} />}

        <div className="space-y-2">
          {project.audience.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No students currently match this audience.
            </div>
          ) : (
            project.audience.map((st) => {
              const sub = project.submissions.find((s) => s.student_id === st.id);
              const status = statusOf(sub);
              return (
                <div key={st.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{st.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {st.roll_number ? `#${st.roll_number} · ` : ""}{st.class_name}{st.section ? "-" + st.section : ""}
                      {sub?.submitted_at && sub.status !== "in_progress" && <> · submitted {new Date(sub.submitted_at).toLocaleString()}</>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                    {sub?.grade != null && (
                      <Badge variant="outline" className="rounded-full">
                        <Award className="mr-1 h-3.5 w-3.5" />{sub.grade}/{project.max_marks ?? 100}{sub.grade_letter ? ` · ${sub.grade_letter}` : ""}
                      </Badge>
                    )}
                    {sub && sub.status !== "in_progress" ? (
                      <ReviewDialog
                        submission={sub}
                        project={project}
                        student={st}
                        open={openReview === sub.id}
                        onOpenChange={(v) => setOpenReview(v ? sub.id : null)}
                        onDone={onChanged}
                      />
                    ) : (
                      <Badge variant="outline" className="rounded-full text-xs text-muted-foreground">Nothing submitted yet</Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryPanel({ assignmentId, studentId }: { assignmentId: string; studentId?: string }) {
  const load = useServerFn(listProjectHistory);
  const [rows, setRows] = useState<Array<{ id: string; status: string; actor_role: string; actor_name: string | null; note: string | null; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await load({ data: { assignmentId, studentId } });
        if (alive) setRows(r as typeof rows);
      } catch { /* history is best-effort */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, studentId]);

  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project history</div>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
      ) : (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div>
                <div className="font-medium">
                  {STATUS_META[(r.status as ProjectStatus)]?.label ?? r.status}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {r.actor_name ?? r.actor_role} · {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ReviewDialog({
  submission, project, student, open, onOpenChange, onDone,
}: {
  submission: Submission;
  project: Project;
  student: Student;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const review = useServerFn(reviewProject);
  const [marks, setMarks] = useState(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: "under_review" | "evaluate" | "resubmit") {
    if (action === "evaluate") {
      const m = Number(marks);
      if (!marks.trim() || Number.isNaN(m) || m < 0) {
        toast.error("Enter valid marks", { description: "Marks must be a number of 0 or more." });
        return;
      }
    }
    setBusy(action);
    try {
      await review({
        data: {
          submissionId: submission.id,
          action,
          marks: action === "evaluate" ? Number(marks) : null,
          feedback,
        },
      });
      toast.success(
        action === "evaluate" ? "Evaluation saved and sent to the student"
          : action === "resubmit" ? "Resubmission requested"
            : "Marked as under review",
      );
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error("We couldn't save this review", { description: friendlyError(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><FileCheck2 className="mr-1.5 h-4 w-4" />Review</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student.full_name} · {project.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="work">
          <TabsList>
            <TabsTrigger value="work">Submitted work</TabsTrigger>
            <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="work" className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="rounded-full">Attempt {submission.attempt}</Badge>
              <StatusBadge status={statusOf(submission)} />
              <span className="self-center">Submitted {new Date(submission.submitted_at).toLocaleString()}</span>
            </div>
            {submission.content && (
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer</div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{submission.content}</p>
              </div>
            )}
            {submission.source_code && (
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source code</div>
                <pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-muted/50 p-4 text-xs">{submission.source_code}</pre>
              </div>
            )}
            {submission.files.length > 0 && (
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachments</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {submission.files.map((f) => (
                    <li key={f.path}>
                      {f.url ? (
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-primary underline">{f.name}</a>
                      ) : f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!submission.content && !submission.source_code && submission.files.length === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing submitted yet.
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluate" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Marks (out of {project.max_marks ?? 100})</Label>
                <Input value={marks} onChange={(e) => setMarks(e.target.value)} inputMode="decimal" placeholder="e.g. 85" />
              </div>
              {submission.grade_letter && (
                <div className="self-end text-sm text-muted-foreground">Current grade: <strong>{submission.grade_letter}</strong></div>
              )}
            </div>
            <div>
              <Label>Feedback for the student</Label>
              <Textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What went well, what to improve…" />
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" disabled={busy !== null} onClick={() => act("under_review")}>
                {busy === "under_review" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Mark under review
              </Button>
              <Button variant="outline" disabled={busy !== null} onClick={() => act("resubmit")}>
                {busy === "resubmit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}Request resubmission
              </Button>
              <Button disabled={busy !== null} onClick={() => act("evaluate")}>
                {busy === "evaluate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Save evaluation
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="history" className="pt-4">
            <HistoryPanel assignmentId={project.id} studentId={student.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CreateProjectDialog({ roster, onCreated }: { roster: Student[]; onCreated: () => void }) {
  const create = useServerFn(createProject);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [technology, setTechnology] = useState<string>(PROJECT_TECHNOLOGIES[1]);
  const [templateKey, setTemplateKey] = useState<string>("custom");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submissionType, setSubmissionType] = useState<string>("text");
  const [maxMarks, setMaxMarks] = useState("100");
  const [dueDate, setDueDate] = useState("");
  const [targetKind, setTargetKind] = useState<"students" | "class">("class");
  const [className, setClassName] = useState<string>("");
  const [section, setSection] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const classes = useMemo(
    () => Array.from(new Set(roster.map((s) => s.class_name).filter(Boolean) as string[])).sort(),
    [roster],
  );
  const sections = useMemo(
    () => Array.from(new Set(roster.filter((s) => !className || s.class_name === className).map((s) => s.section).filter(Boolean) as string[])).sort(),
    [roster, className],
  );
  useEffect(() => { if (!className && classes.length > 0) setClassName(classes[0]); }, [classes, className]);

  function applyTemplate(key: string) {
    setTemplateKey(key);
    if (key === "custom") return;
    const t = PROJECT_TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    setTitle(t.title);
    setDescription(t.description);
    setInstructions(t.instructions);
    setSubmissionType(t.submissionType);
    setMaxMarks(String(t.maxMarks));
  }

  async function save() {
    if (!title.trim()) { toast.error("Add a project title"); return; }
    if (targetKind === "students" && selected.length === 0) { toast.error("Select at least one student"); return; }
    setSaving(true);
    try {
      const res = await create({
        data: {
          title: title.trim(),
          description,
          instructions,
          technology,
          templateKey: templateKey === "custom" ? null : templateKey,
          submissionType: submissionType as "text" | "screenshot" | "file" | "source_code" | "multi_file",
          dueDate: dueDate || null,
          maxMarks: Number(maxMarks) || 100,
          target:
            targetKind === "class"
              ? { kind: "class" as const, className: className || null, section: section === "all" ? null : section }
              : { kind: "students" as const, studentIds: selected },
        },
      });
      toast.success("Project assigned", { description: `${res.assignedCount} student(s) notified.` });
      setOpen(false);
      setTitle(""); setDescription(""); setInstructions(""); setSelected([]); setTemplateKey("custom");
      onCreated();
    } catch (e) {
      toast.error("We couldn't create this project", { description: friendlyError(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg"><Plus className="mr-2 h-5 w-5" />New project</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Create a project</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Technology</Label>
              <Select value={technology} onValueChange={(v) => { setTechnology(v); setTemplateKey("custom"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TECHNOLOGIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start from</Label>
              <Select value={templateKey} onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Build my own project</SelectItem>
                  {templatesFor(technology).map((t) => <SelectItem key={t.key} value={t.key}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Project title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Maze Escape Game" />
          </div>
          <div>
            <Label>Short description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea rows={6} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Step-by-step guidance for students" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Submission type</Label>
              <Select value={submissionType} onValueChange={setSubmissionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBMISSION_TYPES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Maximum marks</Label>
              <Input value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} inputMode="numeric" />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />Assign to</div>
            <Tabs value={targetKind} onValueChange={(v) => setTargetKind(v as "students" | "class")}>
              <TabsList>
                <TabsTrigger value="class">Whole class</TabsTrigger>
                <TabsTrigger value="students">Selected students</TabsTrigger>
              </TabsList>
              <TabsContent value="class" className="grid gap-4 pt-4 sm:grid-cols-2">
                <div>
                  <Label>Class</Label>
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sections</SelectItem>
                      {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="students" className="pt-4">
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {roster.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No students in your school yet.</div>
                  ) : roster.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-3">
                      <Checkbox
                        checked={selected.includes(s.id)}
                        onCheckedChange={(v) =>
                          setSelected((prev) => (v ? [...prev, s.id] : prev.filter((x) => x !== s.id)))
                        }
                      />
                      <span className="text-sm">
                        {s.full_name}
                        <span className="ml-2 text-xs text-muted-foreground">{s.class_name}{s.section ? "-" + s.section : ""}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <DialogFooter>
          <Button size="lg" disabled={saving} onClick={save}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Assign project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}