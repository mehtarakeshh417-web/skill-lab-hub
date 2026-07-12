import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { listStudentQuizzes, submitQuizAttempt } from "@/lib/learning.functions";
import { Loader2, Play, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/student/quizzes")({
  head: () => ({ meta: [{ title: "My Quizzes · Avartan" }] }),
  component: StudentQuizzesPage,
});

type Question = { id: string; question_text: string; question_type: "mcq" | "true_false" | "fill_blank"; options: string[] | null; marks: number; order_index: number };
type Quiz = {
  id: string; title: string; subject: string | null; grade_level: string | null; description: string | null;
  time_limit_minutes: number | null; created_at: string;
  teachers: { full_name: string };
  quiz_questions: Question[];
  attempt: null | { id: string; score: number; total: number; submitted_at: string };
};

function StudentQuizzesPage() {
  const load = useServerFn(listStudentQuizzes);
  const [rows, setRows] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try { setRows((await load()) as Quiz[]); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <AppShell requireRole="student" title="My Quizzes">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Quizzes & Assessments</h2>
        <p className="text-sm text-muted-foreground">Attempt quizzes assigned by your teachers.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No quizzes yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{q.title}</CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      By {q.teachers.full_name}
                      {q.subject && " · " + q.subject}
                      {q.time_limit_minutes && " · " + q.time_limit_minutes + " min"}
                      {" · "}{q.quiz_questions.length} questions
                    </div>
                  </div>
                  {q.attempt ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mr-1 h-3 w-3" />{q.attempt.score}/{q.attempt.total}</Badge>
                  ) : (
                    <Badge variant="secondary">Not attempted</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {q.description && <p className="mb-3 text-sm text-muted-foreground">{q.description}</p>}
                <AttemptDialog quiz={q} onDone={refresh} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function AttemptDialog({ quiz, onDone }: { quiz: Quiz; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const submit = useServerFn(submitQuizAttempt);

  useEffect(() => { if (!open) setAnswers({}); }, [open]);

  const sorted = [...quiz.quiz_questions].sort((a, b) => a.order_index - b.order_index);

  async function onSubmit() {
    const missing = sorted.find((q) => !(answers[q.id] ?? "").trim());
    if (missing) { toast.error("Answer every question first"); return; }
    setSaving(true);
    try {
      const r = await submit({ data: { quizId: quiz.id, answers } }) as { score: number; total: number };
      toast.success(`You scored ${r.score}/${r.total}`);
      setOpen(false);
      onDone();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Submit failed"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant={quiz.attempt ? "outline" : "default"}>
          <Play className="mr-1.5 h-4 w-4" />{quiz.attempt ? "Review attempt" : "Start quiz"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{quiz.title}</DialogTitle></DialogHeader>

        {quiz.attempt ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
            You already submitted this quiz. Score: <strong>{quiz.attempt.score}/{quiz.attempt.total}</strong>.
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((q, i) => (
              <div key={q.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">Q{i + 1}. {q.question_text}</div>
                  <Badge variant="outline">{q.marks} mark{q.marks === 1 ? "" : "s"}</Badge>
                </div>
                {q.question_type === "mcq" && q.options && (
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted">
                        <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.question_type === "true_false" && (
                  <div className="flex gap-2">
                    {["True", "False"].map((v) => (
                      <label key={v} className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted">
                        <input type="radio" name={q.id} checked={answers[q.id] === v} onChange={() => setAnswers((p) => ({ ...p, [q.id]: v }))} />
                        <span className="text-sm">{v}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.question_type === "fill_blank" && (
                  <Input value={answers[q.id] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="Your answer" />
                )}
              </div>
            ))}
          </div>
        )}

        {!quiz.attempt && (
          <DialogFooter>
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit quiz"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}