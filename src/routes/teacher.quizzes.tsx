import { createFileRoute } from "@tanstack/react-router";
import { friendlyError } from "@/lib/messages";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  createQuiz,
  generateQuizWithAI,
  listMyStudentsForTeacher,
  listTeacherQuizzes,
} from "@/lib/learning.functions";
import { Loader2, Plus, Sparkles, Trash2, Users, GraduationCap, Wand2 } from "lucide-react";

export const Route = createFileRoute("/teacher/quizzes")({
  head: () => ({ meta: [{ title: "Quizzes · Teacher · Avartan" }] }),
  component: TeacherQuizzesPage,
});

type StudentRow = { id: string; full_name: string; roll_number: string | null; class_name: string | null; section: string | null };
type QType = "mcq" | "true_false" | "fill_blank";
type Draft = {
  questionText: string; questionType: QType;
  options: string[]; correctAnswer: string; marks: number;
};
type QuizRow = {
  id: string; title: string; subject: string | null; grade_level: string | null;
  source: string; target_kind: string; target_class: string | null; target_section: string | null;
  created_at: string;
  quiz_questions: Array<{ id: string }>;
  quiz_attempts: Array<{ id: string; score: number; total: number; submitted_at: string; students: { full_name: string; roll_number: string | null } }>;
};

function blankQ(type: QType = "mcq"): Draft {
  if (type === "mcq") return { questionText: "", questionType: "mcq", options: ["", "", "", ""], correctAnswer: "", marks: 1 };
  if (type === "true_false") return { questionText: "", questionType: "true_false", options: ["True", "False"], correctAnswer: "True", marks: 1 };
  return { questionText: "", questionType: "fill_blank", options: [], correctAnswer: "", marks: 1 };
}

function TeacherQuizzesPage() {
  const load = useServerFn(listTeacherQuizzes);
  const loadStudents = useServerFn(listMyStudentsForTeacher);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [q, s] = await Promise.all([load(), loadStudents()]);
      setQuizzes(q as QuizRow[]); setStudents(s as StudentRow[]);
    } catch (e) { toast.error("We couldn't load your quizzes", { description: friendlyError(e) }); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <AppShell requireRole="teacher" title="Quiz Builder">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Quizzes & Assessments</h2>
          <p className="text-sm text-muted-foreground">Build quizzes manually or generate them with AI.</p>
        </div>
        <CreateQuizDialog students={students} onCreated={refresh} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : quizzes.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No quizzes yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {q.title}
                      <Badge variant={q.source === "ai" ? "default" : "secondary"} className="capitalize">
                        {q.source === "ai" ? <><Sparkles className="mr-1 h-3 w-3" />AI</> : "Manual"}
                      </Badge>
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {q.subject || "—"}{q.grade_level ? " · " + q.grade_level : ""}
                      {" · "}{q.quiz_questions.length} questions
                      {" · "}{q.target_kind === "class" ? `${q.target_class ?? ""}${q.target_section ? "-" + q.target_section : ""}` : "Selected students"}
                    </div>
                  </div>
                  <Badge variant="outline">{q.quiz_attempts.length} attempts</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {q.quiz_attempts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No attempts yet.</div>
                ) : (
                  <div className="space-y-1">
                    {q.quiz_attempts.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <div>{a.students.full_name}{a.students.roll_number ? " · #" + a.students.roll_number : ""}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground text-xs">{new Date(a.submitted_at).toLocaleString()}</span>
                          <Badge variant="outline">{a.score}/{a.total}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function CreateQuizDialog({ students, onCreated }: { students: StudentRow[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [questions, setQuestions] = useState<Draft[]>([blankQ("mcq")]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiBusy, setAiBusy] = useState(false);
  const [audienceMode, setAudienceMode] = useState<"class" | "students">("class");
  const [targetClass, setTargetClass] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const doCreate = useServerFn(createQuiz);
  const doAi = useServerFn(generateQuizWithAI);

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name).filter(Boolean))) as string[], [students]);
  const sections = useMemo(() => Array.from(new Set(students.filter((s) => !targetClass || s.class_name === targetClass).map((s) => s.section).filter(Boolean))) as string[], [students, targetClass]);

  function updateQ(i: number, patch: Partial<Draft>) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }
  function setType(i: number, t: QType) { setQuestions((prev) => prev.map((q, idx) => idx === i ? blankQ(t) : q)); }
  function updateOption(i: number, oi: number, v: string) {
    setQuestions((prev) => prev.map((q, idx) => {
      if (idx !== i) return q;
      const opts = [...q.options]; opts[oi] = v;
      return { ...q, options: opts };
    }));
  }

  async function runAi() {
    if (!aiTopic.trim()) { toast.error("Please enter a topic", { description: "Tell us what the quiz should be about, for example \"Photosynthesis\"." }); return; }
    setAiBusy(true);
    try {
      const r = await doAi({ data: { topic: aiTopic, subject, gradeLevel, count: Number(aiCount) || 5, types: ["mcq", "true_false", "fill_blank"] } }) as { questions: Draft[] };
      const normalized: Draft[] = r.questions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.questionType === "mcq" ? (q.options ?? ["", "", "", ""]).slice(0, 4).concat(Array(Math.max(0, 4 - (q.options?.length ?? 0))).fill("")) : q.questionType === "true_false" ? ["True", "False"] : [],
        correctAnswer: q.correctAnswer,
        marks: q.marks ?? 1,
      }));
      setQuestions(normalized);
      if (!title) setTitle(aiTopic);
      toast.success(`Generated ${normalized.length} questions`);
    } catch (e) { toast.error("We couldn't generate the questions", { description: friendlyError(e, "Please try again in a moment, or add the questions manually.") }); }
    finally { setAiBusy(false); }
  }

  function toggle(id: string) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function submit() {
    if (!title.trim()) { toast.error("Please add a quiz title", { description: "Students will see this title on their dashboard." }); return; }
    const bad = questions.find((q) => !q.questionText.trim() || !q.correctAnswer.trim() || (q.questionType === "mcq" && q.options.some((o) => !o.trim())));
    if (bad) { toast.error("Some questions are incomplete", { description: "Each question needs its text, all options and the correct answer." }); return; }
    if (audienceMode === "class" && !targetClass) { toast.error("Please choose a class", { description: "Select which class should receive this quiz." }); return; }
    if (audienceMode === "students" && selected.size === 0) { toast.error("Please select at least one student", { description: "Choose who should receive this quiz." }); return; }
    setSaving(true);
    try {
      const r = await doCreate({ data: {
        title, subject, gradeLevel, description,
        source: mode,
        timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
        target: audienceMode === "class"
          ? { kind: "class", className: targetClass, section: targetSection || null }
          : { kind: "students", studentIds: Array.from(selected) },
        questions: questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === "fill_blank" ? undefined : q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        })),
      }}) as { id: string; assignedCount: number };
      toast.success(`Quiz assigned to ${r.assignedCount} student${r.assignedCount === 1 ? "" : "s"}`);
      setOpen(false);
      setTitle(""); setSubject(""); setGradeLevel(""); setDescription(""); setQuestions([blankQ("mcq")]); setSelected(new Set());
      onCreated();
    } catch (e) { toast.error("We couldn't assign this quiz", { description: friendlyError(e) }); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1.5 h-4 w-4" />New quiz</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>New quiz</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "ai")}>
            <TabsList>
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="ai"><Sparkles className="mr-1.5 h-4 w-4" />AI generator</TabsTrigger>
            </TabsList>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Computer Science" /></div>
              <div><Label>Grade level</Label><Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="e.g. Class 8" /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
              <div><Label>Time limit (minutes, optional)</Label><Input value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} /></div>
            </div>

            <TabsContent value="ai" className="mt-4 rounded-lg border p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label>Topic</Label><Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. Introduction to Python loops" /></div>
                <div><Label>Number of questions</Label><Input value={aiCount} onChange={(e) => setAiCount(e.target.value)} /></div>
              </div>
              <Button className="mt-3" onClick={runAi} disabled={aiBusy}>
                {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wand2 className="mr-1.5 h-4 w-4" />Generate questions</>}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Questions ({questions.length})</Label>
              <Button size="sm" variant="outline" onClick={() => setQuestions((p) => [...p, blankQ("mcq")])}>
                <Plus className="mr-1.5 h-4 w-4" />Add question
              </Button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                  <Select value={q.questionType} onValueChange={(v) => setType(i, v as QType)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple choice</SelectItem>
                      <SelectItem value="true_false">True / False</SelectItem>
                      <SelectItem value="fill_blank">Fill in the blank</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="w-20" value={String(q.marks)} onChange={(e) => updateQ(i, { marks: Number(e.target.value) || 1 })} placeholder="Marks" />
                  <Button size="icon" variant="ghost" onClick={() => setQuestions((p) => p.filter((_, idx) => idx !== i))} disabled={questions.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea value={q.questionText} onChange={(e) => updateQ(i, { questionText: e.target.value })} placeholder="Question text" rows={2} />
                {q.questionType === "mcq" && (
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" checked={q.correctAnswer === o && o !== ""} onChange={() => updateQ(i, { correctAnswer: o })} />
                        <Input value={o} onChange={(e) => { updateOption(i, oi, e.target.value); if (q.correctAnswer === q.options[oi]) updateQ(i, { correctAnswer: e.target.value }); }} placeholder={`Option ${oi + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                {q.questionType === "true_false" && (
                  <Select value={q.correctAnswer} onValueChange={(v) => updateQ(i, { correctAnswer: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="True">True</SelectItem><SelectItem value="False">False</SelectItem></SelectContent>
                  </Select>
                )}
                {q.questionType === "fill_blank" && (
                  <Input value={q.correctAnswer} onChange={(e) => updateQ(i, { correctAnswer: e.target.value })} placeholder="Correct answer" />
                )}
              </div>
            ))}
          </div>

          <Tabs value={audienceMode} onValueChange={(v) => setAudienceMode(v as "class" | "students")}>
            <TabsList>
              <TabsTrigger value="class"><Users className="mr-1.5 h-4 w-4" />Whole class</TabsTrigger>
              <TabsTrigger value="students"><GraduationCap className="mr-1.5 h-4 w-4" />Pick students</TabsTrigger>
            </TabsList>
            <TabsContent value="class" className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <Label>Class</Label>
                <Select value={targetClass} onValueChange={setTargetClass}>
                  <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section (optional)</Label>
                <Select value={targetSection || "__all"} onValueChange={(v) => setTargetSection(v === "__all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All sections</SelectItem>
                    {sections.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="students" className="pt-3">
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2">
                {students.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No students found.</div>
                ) : students.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                    <div className="flex-1"><div className="text-sm font-medium">{s.full_name}</div><div className="text-xs text-muted-foreground">{s.class_name}{s.section ? "-" + s.section : ""}</div></div>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{selected.size} selected</div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}