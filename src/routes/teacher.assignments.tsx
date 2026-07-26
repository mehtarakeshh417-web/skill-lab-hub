import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { friendlyError } from "@/lib/messages";
import { QuestionEditor } from "@/components/objective-question-editor";
import {
  ASSIGNMENT_TECHNOLOGIES,
  ASSIGNMENT_TYPES,
  ATTEMPT_STATUS_META,
  blankQuestion,
  type AssignmentType,
  type AttemptStatus,
  type QuestionInput,
} from "@/lib/objective-assignments.schema";
import {
  createObjectiveAssignment,
  deleteObjectiveAssignment,
  listObjectiveHistory,
  listTeacherObjectiveAssignments,
  reviewObjectiveAttempt,
} from "@/lib/objective-assignments.functions";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/teacher/assignments")({
  validateSearch: (s: Record<string, unknown>): { attempt?: string } => ({
    attempt: typeof s.attempt === "string" ? s.attempt : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assignments Studio · Teacher · Avartan Skill Lab" },
      { name: "description", content: "Create objective assignments, auto-score attempts, review marks and publish results." },
      { property: "og:title", content: "Assignments Studio · Teacher · Avartan Skill Lab" },
      { property: "og:description", content: "Create objective assignments, auto-score attempts, review marks and publish results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherAssignmentsPage,
});

type StudentRow = { id: string; full_name: string; roll_number: string | null; class_name: string | null; section: string | null };
type QuestionRow = { id: string; question_text: string; question_type: string; options: string[]; correct_answers: string[]; marks: number; order_index: number };
type AttemptRow = {
  id: string; student_id: string; attempt_no: number; answers: Record<string, string>;
  per_question_result: Array<{ questionId: string; answer: string; correct: boolean; awarded: number; marks: number }>;
  auto_score: number | null; final_score: number | null; passed: boolean | null; remarks: string | null;
  status: Exclude<AttemptStatus, "not_started">; started_at: string; submitted_at: string | null; reviewed_at: string | null;
};
type Analytics = {
  assigned: number; completed: number; pending: number; overdue: number; awaitingReview: number; published: number;
  average: number; highest: number; lowest: number; passRate: number;
  questionAccuracy: Array<{ questionId: string; questionText: string; answered: number; correct: number; accuracy: number }>;
};
type AssignmentRow = {
  id: string; title: string; description: string | null; technology: string | null; assignment_type: AssignmentType;
  total_marks: number; passing_marks: number; due_at: string | null; time_limit_minutes: number | null;
  shuffle_questions: boolean; shuffle_options: boolean; randomize_per_student: boolean;
  allow_multiple_attempts: boolean; max_attempts: number; show_correct_answers: boolean; auto_publish: boolean;
  target_kind: string; target_class: string | null; target_section: string | null; created_at: string;
  questions: QuestionRow[]; audience: StudentRow[]; attempts: AttemptRow[]; analytics: Analytics;
};

function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString() : "—";
}

function TeacherAssignmentsPage() {
  const search = useSearch({ from: "/teacher/assignments" });
  const load = useServerFn(listTeacherObjectiveAssignments);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [roster, setRoster] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewAttempt, setReviewAttempt] = useState<{ assignment: AssignmentRow; attempt: AttemptRow } | null>(null);

  async function refresh() {
    try {
      const res = (await load()) as unknown as { assignments: AssignmentRow[]; roster: StudentRow[] };
      setAssignments(res.assignments ?? []);
      setRoster(res.roster ?? []);
      return res.assignments ?? [];
    } catch (e) {
      toast.error("We couldn't load your assignments", { description: friendlyError(e) });
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const list = await refresh();
      if (search.attempt) {
        for (const a of list) {
          const at = a.attempts.find((x) => x.id === search.attempt);
          if (at) {
            setReviewAttempt({ assignment: a, attempt: at });
            break;
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return assignments.reduce(
      (acc, a) => ({
        assigned: acc.assigned + a.analytics.assigned,
        pending: acc.pending + a.analytics.pending,
        completed: acc.completed + a.analytics.completed,
        overdue: acc.overdue + a.analytics.overdue,
      }),
      { assigned: 0, pending: 0, completed: 0, overdue: 0 },
    );
  }, [assignments]);

  return (
    <AppShell requireRole="teacher" title="Assignments">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold">Assignment Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build objective assignments, auto-score every attempt, review marks and publish results.
          </p>
        </div>
        <CreateAssignmentDialog roster={roster} onCreated={refresh} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={ClipboardList} label="Assigned" value={totals.assigned} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
        <StatTile icon={Clock3} label="Pending" value={totals.pending} tone="bg-amber-500/10 text-amber-600 dark:text-amber-300" />
        <StatTile icon={CheckCircle2} label="Completed" value={totals.completed} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
        <StatTile icon={CalendarClock} label="Overdue" value={totals.overdue} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <Card className="rounded-3xl border-border/60 bg-card/60 backdrop-blur">
          <CardContent className="p-12 text-center text-muted-foreground">
            No assignments yet. Use “New assignment” to build your first question set.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              onReview={(attempt) => setReviewAttempt({ assignment: a, attempt })}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      {reviewAttempt && (
        <ReviewDialog
          assignment={reviewAttempt.assignment}
          attempt={reviewAttempt.attempt}
          onClose={() => setReviewAttempt(null)}
          onSaved={async () => {
            setReviewAttempt(null);
            await refresh();
          }}
        />
      )}
    </AppShell>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: typeof Clock3; label: string; value: number; tone: string }) {
  return (
    <Card className="rounded-3xl border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="flex items-center gap-4 p-6">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></span>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentCard({
  assignment,
  onReview,
  onChanged,
}: {
  assignment: AssignmentRow;
  onReview: (attempt: AttemptRow) => void;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState("roster");
  const [history, setHistory] = useState<Array<{ id: string; status: string; actor_role: string; actor_name: string | null; note: string | null; created_at: string }> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadHistory = useServerFn(listObjectiveHistory);
  const doDelete = useServerFn(deleteObjectiveAssignment);
  const a = assignment;

  const latestByStudent = useMemo(() => {
    const m = new Map<string, AttemptRow>();
    for (const at of a.attempts) {
      const prev = m.get(at.student_id);
      if (!prev || at.attempt_no > prev.attempt_no) m.set(at.student_id, at);
    }
    return m;
  }, [a.attempts]);

  async function openHistory() {
    setTab("history");
    if (history) return;
    try {
      const rows = (await loadHistory({ data: { assignmentId: a.id } })) as NonNullable<typeof history>;
      setHistory(rows);
    } catch (e) {
      toast.error("We couldn't load the history", { description: friendlyError(e) });
    }
  }

  async function removeAssignment() {
    if (!window.confirm(`Delete “${a.title}” and all its attempts? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await doDelete({ data: { assignmentId: a.id } });
      toast.success("Assignment deleted");
      onChanged();
    } catch (e) {
      toast.error("We couldn't delete this assignment", { description: friendlyError(e) });
    } finally {
      setDeleting(false);
    }
  }

  const overdue = a.due_at ? new Date(a.due_at).getTime() < Date.now() : false;

  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              {a.title}
              <Badge variant="secondary" className="capitalize">
                {ASSIGNMENT_TYPES.find((t) => t.value === a.assignment_type)?.label}
              </Badge>
              {a.technology && <Badge variant="outline">{a.technology}</Badge>}
              {overdue && <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300">Overdue</Badge>}
            </CardTitle>
            <div className="mt-2 text-xs text-muted-foreground">
              {a.target_kind === "class"
                ? `${a.target_class ?? "All classes"}${a.target_section ? " · Section " + a.target_section : ""}`
                : "Selected students"}
              {" · "}{a.questions.length} questions · {a.total_marks} marks · pass {a.passing_marks}
              {a.time_limit_minutes ? ` · ${a.time_limit_minutes} min limit` : ""}
              {a.due_at ? ` · due ${fmt(a.due_at)}` : ""}
              {a.auto_publish ? " · results auto-published" : " · results held for review"}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={removeAssignment} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
          </Button>
        </div>
        {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => (v === "history" ? openHistory() : setTab(v))}>
          <TabsList>
            <TabsTrigger value="roster"><Users className="mr-1.5 h-4 w-4" />Roster</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="mr-1.5 h-4 w-4" />Analytics</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="space-y-2 pt-4">
            {a.audience.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No students in this audience.
              </div>
            ) : (
              a.audience.map((s) => {
                const at = latestByStudent.get(s.id);
                const status: AttemptStatus = at ? at.status : "not_started";
                const meta = ATTEMPT_STATUS_META[status];
                const score = at?.final_score ?? at?.auto_score ?? null;
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{s.full_name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {s.roll_number ? `#${s.roll_number} · ` : ""}{s.class_name}{s.section ? "-" + s.section : ""}
                        {at?.submitted_at ? ` · submitted ${fmt(at.submitted_at)}` : ""}
                        {at && at.attempt_no > 1 ? ` · attempt ${at.attempt_no}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                      {score != null && <Badge variant="outline">{score}/{a.total_marks}</Badge>}
                      {at?.passed != null && (
                        <Badge variant="outline" className={at.passed ? "border-emerald-500/30 text-emerald-600" : "border-rose-500/30 text-rose-600"}>
                          {at.passed ? "Passed" : "Not passed"}
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" disabled={!at || at.status === "in_progress"} onClick={() => at && onReview(at)}>
                        Review
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="analytics" className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Average score" value={`${a.analytics.average}/${a.total_marks}`} />
              <MiniStat label="Pass rate" value={`${a.analytics.passRate}%`} />
              <MiniStat label="Highest" value={`${a.analytics.highest}`} />
              <MiniStat label="Lowest" value={`${a.analytics.lowest}`} />
            </div>
            <div className="mt-5 space-y-2">
              <div className="text-sm font-semibold">Question accuracy</div>
              {a.analytics.questionAccuracy.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attempts scored yet.</div>
              ) : (
                a.analytics.questionAccuracy.map((q, i) => (
                  <div key={q.questionId} className="rounded-2xl border border-border/60 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">Q{i + 1}. {q.questionText}</span>
                      <span className="shrink-0 font-semibold">{q.accuracy}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${q.accuracy}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{q.correct} of {q.answered} correct</div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-2 pt-4">
            {history === null ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
            ) : (
              history.map((h) => (
                <div key={h.id} className="rounded-2xl border border-border/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold capitalize">{h.status.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground">{fmt(h.created_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {h.actor_name ?? h.actor_role}{h.note ? ` · ${h.note}` : ""}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 p-4">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ReviewDialog({
  assignment,
  attempt,
  onClose,
  onSaved,
}: {
  assignment: AssignmentRow;
  attempt: AttemptRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const r of attempt.per_question_result ?? []) m[r.questionId] = String(r.awarded);
    return m;
  });
  const [remarks, setRemarks] = useState(attempt.remarks ?? "");
  const [saving, setSaving] = useState<"save" | "publish" | null>(null);
  const doReview = useServerFn(reviewObjectiveAttempt);
  const student = assignment.audience.find((s) => s.id === attempt.student_id);
  const questions = assignment.questions;

  const total = useMemo(
    () => Object.values(marks).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [marks],
  );

  async function save(publish: boolean) {
    setSaving(publish ? "publish" : "save");
    try {
      await doReview({
        data: {
          attemptId: attempt.id,
          overrides: Object.entries(marks).map(([questionId, v]) => ({ questionId, awarded: Number(v) || 0 })),
          remarks,
          publish,
        },
      });
      toast.success(publish ? "Result published to the student" : "Marks saved");
      onSaved();
    } catch (e) {
      toast.error("We couldn't save this review", { description: friendlyError(e) });
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student?.full_name ?? "Student"} · {assignment.title}</DialogTitle>
          <DialogDescription>
            Attempt {attempt.attempt_no} · submitted {fmt(attempt.submitted_at)} · auto-score {attempt.auto_score ?? 0}/{assignment.total_marks}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const r = (attempt.per_question_result ?? []).find((x) => x.questionId === q.id);
            return (
              <div key={q.id} className="rounded-2xl border border-border/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Q{i + 1}. {q.question_text}</div>
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Answer: </span>
                      <span className={r?.correct ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                        {r?.answer?.trim() ? r.answer : "No answer"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Correct: {(q.correct_answers ?? []).join(" / ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-10 w-24"
                      value={marks[q.id] ?? "0"}
                      inputMode="decimal"
                      onChange={(e) => setMarks((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                    <span className="text-sm text-muted-foreground">/ {q.marks}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/60 p-4">
          <Label>Remarks for the student</Label>
          <Textarea className="mt-2" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional feedback" />
          <div className="mt-3 text-sm font-semibold">
            Final score: {total}/{assignment.total_marks} ·{" "}
            <span className={total >= assignment.passing_marks ? "text-emerald-600" : "text-rose-600"}>
              {total >= assignment.passing_marks ? "Passed" : "Not passed"}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => save(false)} disabled={saving !== null}>
            {saving === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save marks"}
          </Button>
          <Button onClick={() => save(true)} disabled={saving !== null}>
            {saving === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1.5 h-4 w-4" />{attempt.status === "published" ? "Republish result" : "Publish result"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateAssignmentDialog({ roster, onCreated }: { roster: StudentRow[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [technology, setTechnology] = useState<string>(ASSIGNMENT_TECHNOLOGIES[0]);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("mcq");
  const [questions, setQuestions] = useState<QuestionInput[]>([blankQuestion("mcq")]);
  const [passingMarks, setPassingMarks] = useState("0");
  const [dueAt, setDueAt] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [randomizePerStudent, setRandomizePerStudent] = useState(false);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [mode, setMode] = useState<"class" | "students">("class");
  const [targetClass, setTargetClass] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const doCreate = useServerFn(createObjectiveAssignment);

  const classes = useMemo(
    () => Array.from(new Set(roster.map((s) => s.class_name).filter(Boolean))) as string[],
    [roster],
  );
  const sections = useMemo(
    () =>
      Array.from(
        new Set(roster.filter((s) => !targetClass || s.class_name === targetClass).map((s) => s.section).filter(Boolean)),
      ) as string[],
    [roster, targetClass],
  );
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  function changeType(next: AssignmentType) {
    setAssignmentType(next);
    if (next !== "mixed") {
      setQuestions((prev) =>
        prev.length === 0 ? [blankQuestion(next)] : prev.map(() => blankQuestion(next)),
      );
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function reset() {
    setTitle(""); setDescription(""); setQuestions([blankQuestion("mcq")]); setAssignmentType("mcq");
    setPassingMarks("0"); setDueAt(""); setTimeLimit(""); setSelected(new Set());
  }

  async function submit() {
    if (!title.trim()) { toast.error("Please add a title", { description: "Students see this on their dashboard." }); return; }
    if (questions.length === 0) { toast.error("Add at least one question"); return; }
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.questionText.trim()) { toast.error(`Question ${i + 1} needs question text`); return; }
      if (q.questionType === "mcq") {
        const opts = q.options.filter((o) => o.trim().length > 0);
        if (opts.length < 2) { toast.error(`Question ${i + 1} needs at least two options`); return; }
        if (!q.correctAnswers[0] || !opts.includes(q.correctAnswers[0])) {
          toast.error(`Question ${i + 1} needs a correct option selected`); return;
        }
      }
      if (q.questionType === "fill_blank" && !q.correctAnswers.some((a) => a.trim().length > 0)) {
        toast.error(`Question ${i + 1} needs an accepted answer`); return;
      }
    }
    if (mode === "class" && !targetClass) { toast.error("Please choose a class"); return; }
    if (mode === "students" && selected.size === 0) { toast.error("Please select at least one student"); return; }

    setSaving(true);
    try {
      const r = (await doCreate({
        data: {
          title,
          description,
          technology,
          assignmentType,
          questions: questions.map((q) => ({ ...q, marks: Number(q.marks) || 1 })),
          passingMarks: Number(passingMarks) || 0,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
          shuffleQuestions,
          shuffleOptions,
          randomizePerStudent,
          allowMultipleAttempts,
          maxAttempts: Number(maxAttempts) || 1,
          showCorrectAnswers,
          autoPublish,
          target:
            mode === "class"
              ? { kind: "class" as const, className: targetClass, section: targetSection || null }
              : { kind: "students" as const, studentIds: Array.from(selected) },
        },
      })) as { assignedCount: number };
      toast.success(`Assigned to ${r.assignedCount} student${r.assignedCount === 1 ? "" : "s"}`);
      setOpen(false);
      reset();
      onCreated();
    } catch (e) {
      toast.error("We couldn't create this assignment", { description: friendlyError(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />New assignment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />New objective assignment</DialogTitle>
            <DialogDescription>Questions are auto-scored the moment a student submits.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Title</Label>
                <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Python loops — objective test" />
              </div>
              <div>
                <Label>Technology</Label>
                <Select value={technology} onValueChange={setTechnology}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TECHNOLOGIES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assignment type</Label>
                <Select value={assignmentType} onValueChange={(v) => changeType(v as AssignmentType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Instructions / description</Label>
                <Textarea className="mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <QuestionEditor assignmentType={assignmentType} questions={questions} onChange={setQuestions} />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Passing score (of {totalMarks})</Label>
                <Input className="mt-1" value={passingMarks} inputMode="decimal" onChange={(e) => setPassingMarks(e.target.value)} />
              </div>
              <div>
                <Label>Due date &amp; time</Label>
                <Input className="mt-1" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              <div>
                <Label>Time limit (minutes)</Label>
                <Input className="mt-1" value={timeLimit} inputMode="numeric" placeholder="No limit" onChange={(e) => setTimeLimit(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/60 p-4 sm:grid-cols-2">
              <ToggleRow label="Shuffle questions" checked={shuffleQuestions} onChange={setShuffleQuestions} />
              <ToggleRow label="Shuffle options" checked={shuffleOptions} onChange={setShuffleOptions} />
              <ToggleRow label="Randomize order per student" checked={randomizePerStudent} onChange={setRandomizePerStudent} />
              <ToggleRow label="Allow multiple attempts" checked={allowMultipleAttempts} onChange={setAllowMultipleAttempts} />
              {allowMultipleAttempts && (
                <div>
                  <Label className="text-xs">Maximum attempts</Label>
                  <Input className="mt-1 max-w-28" value={maxAttempts} inputMode="numeric" onChange={(e) => setMaxAttempts(e.target.value)} />
                </div>
              )}
              <ToggleRow label="Show correct answers after publication" checked={showCorrectAnswers} onChange={setShowCorrectAnswers} />
              <ToggleRow label="Auto-publish results instantly" checked={autoPublish} onChange={setAutoPublish} />
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "class" | "students")}>
              <TabsList>
                <TabsTrigger value="class"><Users className="mr-1.5 h-4 w-4" />Whole class</TabsTrigger>
                <TabsTrigger value="students"><GraduationCap className="mr-1.5 h-4 w-4" />Pick students</TabsTrigger>
              </TabsList>
              <TabsContent value="class" className="grid gap-4 pt-4 sm:grid-cols-2">
                <div>
                  <Label>Class</Label>
                  <Select value={targetClass} onValueChange={setTargetClass}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choose class" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section (optional)</Label>
                  <Select value={targetSection || "__all"} onValueChange={(v) => setTargetSection(v === "__all" ? "" : v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="All sections" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">All sections</SelectItem>
                      {sections.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="students" className="pt-4">
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border p-2">
                  {roster.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No students in your school yet.</div>
                  ) : (
                    roster.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-muted">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{s.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.class_name}{s.section ? "-" + s.section : ""}{s.roll_number ? " · #" + s.roll_number : ""}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{selected.size} selected</div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button size="lg" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Publish assignment (${totalMarks} marks)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}