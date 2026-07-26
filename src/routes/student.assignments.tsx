import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { friendlyError } from "@/lib/messages";
import { ATTEMPT_STATUS_META, type AttemptStatus } from "@/lib/objective-assignments.schema";
import {
  listStudentObjectiveAssignments,
  startObjectiveAttempt,
  submitObjectiveAttempt,
} from "@/lib/objective-assignments.functions";
import { CheckCircle2, Clock3, Hourglass, Loader2, PlayCircle, Timer, Trophy } from "lucide-react";

export const Route = createFileRoute("/student/assignments")({
  validateSearch: (s: Record<string, unknown>) => ({ focus: typeof s.focus === "string" ? s.focus : undefined }),
  head: () => ({
    meta: [
      { title: "My Assignments · Student · Avartan Skill Lab" },
      { name: "description", content: "Attempt objective assignments, track due dates and view your scores and feedback." },
      { property: "og:title", content: "My Assignments · Student · Avartan Skill Lab" },
      { property: "og:description", content: "Attempt objective assignments, track due dates and view your scores and feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentAssignmentsPage,
});

type Attempt = {
  id: string; attempt_no: number; status: Exclude<AttemptStatus, "not_started">;
  auto_score: number | null; final_score: number | null; passed: boolean | null; remarks: string | null;
  per_question_result: Array<{ questionId: string; answer: string; correct: boolean; awarded: number; marks: number }>;
  started_at: string; submitted_at: string | null; reviewed_at: string | null;
};
type Row = {
  id: string; title: string; description: string | null; technology: string | null;
  assignmentType: string; totalMarks: number; passingMarks: number; dueAt: string | null;
  timeLimitMinutes: number | null; allowMultipleAttempts: boolean; maxAttempts: number;
  showCorrectAnswers: boolean; createdAt: string; questionCount: number; teacherName: string;
  attempts: Attempt[];
  questionMeta: Array<{ id: string; questionText: string; marks: number; correctAnswers: string[] | null }>;
};
type RunnerQuestion = { id: string; questionText: string; questionType: string; marks: number; options: string[] };
type Runner = {
  assignmentId: string; attemptId: string; attemptNo: number; startedAt: string;
  timeLimitMinutes: number | null; dueAt: string | null; title: string; totalMarks: number;
  questions: RunnerQuestion[];
};

function latestOf(r: Row) {
  return r.attempts.length ? r.attempts[r.attempts.length - 1] : null;
}
function statusOf(r: Row): AttemptStatus {
  const l = latestOf(r);
  return l ? l.status : "not_started";
}
function isOverdue(r: Row) {
  return !!r.dueAt && new Date(r.dueAt).getTime() < Date.now();
}
function fmt(dt: string | null) {
  return dt ? new Date(dt).toLocaleString() : "—";
}

function StudentAssignmentsPage() {
  const search = useSearch({ from: "/student/assignments" });
  const load = useServerFn(listStudentObjectiveAssignments);
  const start = useServerFn(startObjectiveAttempt);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [runner, setRunner] = useState<Runner | null>(null);
  const [focused, setFocused] = useState<Row | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = (await load()) as unknown as Row[];
      setRows(res ?? []);
      return res ?? [];
    } catch (e) {
      toast.error("We couldn't load your assignments", { description: friendlyError(e) });
      return [];
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    (async () => {
      const list = await refresh();
      if (search.focus) {
        const hit = list.find((r) => r.id === search.focus);
        if (hit) setFocused(hit);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function beginAttempt(row: Row) {
    try {
      const res = (await start({ data: { assignmentId: row.id } })) as unknown as Omit<Runner, "assignmentId">;
      setFocused(null);
      setRunner({ ...res, assignmentId: row.id });
    } catch (e) {
      toast.error("We couldn't open this assignment", { description: friendlyError(e) });
    }
  }

  const buckets = useMemo(() => {
    const pending: Row[] = [];
    const upcoming: Row[] = [];
    const completed: Row[] = [];
    const graded: Row[] = [];
    for (const r of rows) {
      const s = statusOf(r);
      if (s === "published") graded.push(r);
      else if (s === "submitted" || s === "auto_scored") completed.push(r);
      else if (isOverdue(r)) upcoming.push(r);
      else pending.push(r);
    }
    return { pending, upcoming, completed, graded };
  }, [rows]);

  return (
    <AppShell requireRole="student" title="My Assignments">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold">My Assignments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Objective tests set by your teachers — answers are scored the moment you submit.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Clock3} label="Pending" value={buckets.pending.length} tone="bg-amber-500/10 text-amber-600 dark:text-amber-300" />
        <Stat icon={Hourglass} label="Overdue / closed" value={buckets.upcoming.length} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" />
        <Stat icon={CheckCircle2} label="Submitted" value={buckets.completed.length} tone="bg-sky-500/10 text-sky-600 dark:text-sky-300" />
        <Stat icon={Trophy} label="Graded" value={buckets.graded.length} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <Card className="rounded-3xl border-border/60 bg-card/60 backdrop-blur">
          <CardContent className="p-12 text-center text-muted-foreground">Nothing assigned to you yet.</CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({buckets.pending.length})</TabsTrigger>
            <TabsTrigger value="completed">Submitted ({buckets.completed.length})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({buckets.graded.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({buckets.upcoming.length})</TabsTrigger>
          </TabsList>
          {([
            ["pending", buckets.pending],
            ["completed", buckets.completed],
            ["graded", buckets.graded],
            ["closed", buckets.upcoming],
          ] as const).map(([key, list]) => (
            <TabsContent key={key} value={key} className="pt-5">
              {list.length === 0 ? (
                <Card className="rounded-3xl border-border/60 bg-card/60">
                  <CardContent className="p-10 text-center text-sm text-muted-foreground">Nothing here right now.</CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {list.map((r) => (
                    <AssignmentCard key={r.id} row={r} onOpen={() => setFocused(r)} onStart={() => beginAttempt(r)} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {focused && (
        <DetailDialog row={focused} onClose={() => setFocused(null)} onStart={() => beginAttempt(focused)} />
      )}

      {runner && (
        <AttemptRunner
          runner={runner}
          onClose={() => setRunner(null)}
          onSubmitted={async () => {
            setRunner(null);
            await refresh();
          }}
        />
      )}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Clock3; label: string; value: number; tone: string }) {
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

function AssignmentCard({ row, onOpen, onStart }: { row: Row; onOpen: () => void; onStart: () => void }) {
  const status = statusOf(row);
  const meta = ATTEMPT_STATUS_META[status];
  const latest = latestOf(row);
  const overdue = isOverdue(row);
  const attemptsUsed = row.attempts.filter((a) => a.status !== "in_progress").length;
  const maxAttempts = row.allowMultipleAttempts ? row.maxAttempts : 1;
  const canAttempt = !overdue && (status === "not_started" || status === "in_progress" || attemptsUsed < maxAttempts);

  return (
    <Card className="rounded-3xl border-border/60 bg-card/60 backdrop-blur">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              {row.title}
              {row.technology && <Badge variant="outline">{row.technology}</Badge>}
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              By {row.teacherName} · {row.questionCount} questions · {row.totalMarks} marks
              {row.timeLimitMinutes ? ` · ${row.timeLimitMinutes} min` : ""}
              {row.dueAt ? ` · due ${fmt(row.dueAt)}` : ""}
            </div>
          </div>
          <Badge variant="outline" className={overdue && status === "not_started" ? "border-rose-500/30 text-rose-600" : meta.className}>
            {overdue && status === "not_started" ? "Closed" : meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {row.description && <p className="text-sm text-muted-foreground">{row.description}</p>}
        {latest?.status === "published" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            <div className="font-semibold">
              Score {latest.final_score ?? latest.auto_score}/{row.totalMarks} ·{" "}
              <span className={latest.passed ? "text-emerald-600" : "text-rose-600"}>{latest.passed ? "Passed" : "Not passed"}</span>
            </div>
            {latest.remarks && <div className="mt-1 text-muted-foreground">{latest.remarks}</div>}
          </div>
        )}
        {(latest?.status === "submitted" || latest?.status === "auto_scored") && (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 text-sm text-muted-foreground">
            Submitted on {fmt(latest.submitted_at)}. Your result will appear once your teacher publishes it.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpen}>View details</Button>
          {canAttempt && (
            <Button onClick={onStart}>
              <PlayCircle className="mr-1.5 h-4 w-4" />
              {status === "in_progress" ? "Resume attempt" : attemptsUsed > 0 ? "New attempt" : "Start assignment"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailDialog({ row, onClose, onStart }: { row: Row; onClose: () => void; onStart: () => void }) {
  const overdue = isOverdue(row);
  const attemptsUsed = row.attempts.filter((a) => a.status !== "in_progress").length;
  const maxAttempts = row.allowMultipleAttempts ? row.maxAttempts : 1;
  const published = row.attempts.filter((a) => a.status === "published");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.title}</DialogTitle>
          <DialogDescription>
            {row.questionCount} questions · {row.totalMarks} marks · pass mark {row.passingMarks}
            {row.timeLimitMinutes ? ` · ${row.timeLimitMinutes} minute limit` : ""}
            {row.dueAt ? ` · due ${fmt(row.dueAt)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {row.description && <p className="text-sm text-muted-foreground">{row.description}</p>}

        <div className="space-y-2">
          <div className="text-sm font-semibold">Attempt history</div>
          {row.attempts.length === 0 ? (
            <div className="text-sm text-muted-foreground">You have not attempted this yet.</div>
          ) : (
            row.attempts.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border/60 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">Attempt {a.attempt_no}</span>
                  <Badge variant="outline" className={ATTEMPT_STATUS_META[a.status].className}>
                    {ATTEMPT_STATUS_META[a.status].label}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Started {fmt(a.started_at)}{a.submitted_at ? ` · submitted ${fmt(a.submitted_at)}` : ""}
                  {a.status === "published" ? ` · score ${a.final_score ?? a.auto_score}/${row.totalMarks}` : ""}
                </div>
                {a.remarks && <div className="mt-1 text-xs">{a.remarks}</div>}
              </div>
            ))
          )}
        </div>

        {published.length > 0 && row.showCorrectAnswers && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Answer review</div>
            {row.questionMeta.map((q, i) => {
              const r = published[published.length - 1].per_question_result.find((x) => x.questionId === q.id);
              return (
                <div key={q.id} className="rounded-2xl border border-border/60 p-3 text-sm">
                  <div className="font-medium">Q{i + 1}. {q.questionText}</div>
                  <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">Your answer: </span>
                    <span className={r?.correct ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                      {r?.answer?.trim() ? r.answer : "No answer"}
                    </span>
                  </div>
                  {q.correctAnswers && (
                    <div className="text-xs text-muted-foreground">Correct: {q.correctAnswers.join(" / ")}</div>
                  )}
                  <div className="text-xs text-muted-foreground">Marks: {r?.awarded ?? 0}/{q.marks}</div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          {!overdue && attemptsUsed < maxAttempts && (
            <Button onClick={onStart}><PlayCircle className="mr-1.5 h-4 w-4" />Start / resume attempt</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttemptRunner({
  runner,
  onClose,
  onSubmitted,
}: {
  runner: Runner;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const submitFn = useServerFn(submitObjectiveAttempt);
  const submittedRef = useRef(false);

  const deadline = useMemo(() => {
    const candidates: number[] = [];
    if (runner.timeLimitMinutes) {
      candidates.push(new Date(runner.startedAt).getTime() + runner.timeLimitMinutes * 60_000);
    }
    if (runner.dueAt) candidates.push(new Date(runner.dueAt).getTime());
    return candidates.length ? Math.min(...candidates) : null;
  }, [runner]);

  const [remaining, setRemaining] = useState<number | null>(deadline ? deadline - Date.now() : null);

  const doSubmit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = (await submitFn({ data: { attemptId: runner.attemptId, answers } })) as unknown as {
          score: number; total: number; published: boolean;
        };
        toast.success(
          auto ? "Time is up — your answers were submitted" : "Assignment submitted",
          {
            description: res.published
              ? `You scored ${res.score}/${res.total}.`
              : "Your teacher will publish the result after review.",
          },
        );
        onSubmitted();
      } catch (e) {
        submittedRef.current = false;
        toast.error("We couldn't submit your answers", { description: friendlyError(e) });
      } finally {
        setSubmitting(false);
      }
    },
    [answers, onSubmitted, runner.attemptId, submitFn],
  );

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        doSubmit(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, doSubmit]);

  const answered = Object.values(answers).filter((v) => v.trim().length > 0).length;
  const mm = remaining != null ? Math.max(0, Math.floor(remaining / 60000)) : 0;
  const ss = remaining != null ? Math.max(0, Math.floor((remaining % 60000) / 1000)) : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>{runner.title}</span>
            {remaining != null && (
              <Badge variant="outline" className={remaining < 60000 ? "border-rose-500/40 text-rose-600" : ""}>
                <Timer className="mr-1.5 h-4 w-4" />
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Attempt {runner.attemptNo} · {runner.questions.length} questions · {runner.totalMarks} marks · {answered} answered
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {runner.questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold">Q{i + 1}. {q.questionText}</div>
                <Badge variant="outline">{q.marks} mark{q.marks === 1 ? "" : "s"}</Badge>
              </div>
              <div className="mt-3">
                {q.questionType === "fill_blank" ? (
                  <div>
                    <Label className="text-xs">Your answer</Label>
                    <Input
                      className="mt-1"
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your answer"
                    />
                  </div>
                ) : (
                  <RadioGroup
                    value={answers[q.id] ?? ""}
                    onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    className="space-y-2"
                  >
                    {(q.options.length ? q.options : ["True", "False"]).map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 px-4 py-3 hover:bg-muted/60"
                      >
                        <RadioGroupItem value={opt} id={`${q.id}-${oi}`} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Close (save for later)</Button>
          <Button size="lg" onClick={() => doSubmit(false)} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}