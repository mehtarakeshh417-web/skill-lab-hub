import { createFileRoute } from "@tanstack/react-router";
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
  createAssignment,
  gradeSubmission,
  listMyStudentsForTeacher,
  listTeacherAssignments,
} from "@/lib/learning.functions";
import { Loader2, Plus, Users, GraduationCap, FileCheck2, Send } from "lucide-react";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({ meta: [{ title: "Assignments · Teacher · Avartan" }] }),
  component: TeacherAssignmentsPage,
});

type StudentRow = { id: string; full_name: string; roll_number: string | null; class_name: string | null; section: string | null };
type SubRow = {
  id: string; status: string; grade: number | null; feedback: string | null;
  submitted_at: string; content: string | null; file_url: string | null; file_name: string | null;
  student_id: string;
  students?: { id: string; full_name: string; roll_number: string | null; class_name: string | null; section: string | null } | null;
};
type AsgRow = {
  id: string; title: string; kind: string; description: string | null;
  due_date: string | null; max_marks: number | null;
  target_kind: string; target_class: string | null; target_section: string | null;
  created_at: string;
  submissions?: SubRow[];
};

function TeacherAssignmentsPage() {
  const load = useServerFn(listTeacherAssignments);
  const loadStudents = useServerFn(listMyStudentsForTeacher);
  const [assignments, setAssignments] = useState<AsgRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [a, s] = await Promise.all([load(), loadStudents()]);
      setAssignments(a as AsgRow[]);
      setStudents(s as StudentRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <AppShell requireRole="teacher" title="Projects & Assignments">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Assignments & Projects</h2>
          <p className="text-sm text-muted-foreground">
            Create, distribute, and review work from your class.
          </p>
        </div>
        <CreateAssignmentDialog students={students} onCreated={refresh} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No assignments yet. Create your first one above.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <AssignmentCard key={a.id} a={a} onGraded={refresh} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function AssignmentCard({ a, onGraded }: { a: AsgRow; onGraded: () => void }) {
  const submitted = (a.submissions ?? []).filter((s) => s.status === "submitted").length;
  const reviewed = (a.submissions ?? []).filter((s) => s.status !== "submitted").length;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {a.title}
              <Badge variant={a.kind === "project" ? "default" : "secondary"} className="capitalize">{a.kind}</Badge>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">
              {a.target_kind === "class"
                ? `${a.target_class ?? "All classes"} ${a.target_section ? "· Section " + a.target_section : ""}`
                : "Selected students"}
              {a.due_date && <> · Due {new Date(a.due_date).toLocaleDateString()}</>}
              {" · "}Max {a.max_marks ?? 100} marks
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{submitted} submitted</Badge>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">{reviewed} reviewed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {a.description && <p className="mb-4 text-sm text-muted-foreground">{a.description}</p>}
        <div className="space-y-2">
          {(a.submissions ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No submissions yet.</div>
          ) : (
            (a.submissions ?? []).map((s) => (
              <SubmissionRow key={s.id} sub={s} maxMarks={a.max_marks ?? 100} onGraded={onGraded} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionRow({ sub, maxMarks, onGraded }: { sub: SubRow; maxMarks: number; onGraded: () => void }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState<string>(sub.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState<string>(sub.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const doGrade = useServerFn(gradeSubmission);
  const st = sub.students;

  async function save() {
    const g = Number(grade);
    if (Number.isNaN(g) || g < 0) { toast.error("Enter a valid grade"); return; }
    setSaving(true);
    try {
      await doGrade({ data: { submissionId: sub.id, grade: g, feedback, status: "reviewed" } });
      toast.success("Feedback saved and returned to student");
      setOpen(false);
      onGraded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Grade failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{st?.full_name ?? "Student"}</div>
        <div className="truncate text-xs text-muted-foreground">
          {st?.roll_number && `#${st.roll_number} · `}{st?.class_name}{st?.section ? "-" + st.section : ""} · submitted {new Date(sub.submitted_at).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={sub.status === "submitted" ? "secondary" : "default"} className="capitalize">{sub.status}</Badge>
        {sub.grade != null && <Badge variant="outline">{sub.grade}/{maxMarks}</Badge>}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><FileCheck2 className="mr-1.5 h-4 w-4" />Review</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Review submission</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <div className="text-xs font-semibold text-muted-foreground">Submitted content</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{sub.content || <em className="text-muted-foreground">No text</em>}</div>
                {sub.file_url && (
                  <a href={sub.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline">
                    Open attachment: {sub.file_name ?? "file"}
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Grade (of {maxMarks})</Label>
                  <Input value={grade} onChange={(e) => setGrade(e.target.value)} inputMode="decimal" />
                </div>
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Comments returned to the student" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1.5 h-4 w-4" />Return to student</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function CreateAssignmentDialog({ students, onCreated }: { students: StudentRow[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"assignment" | "project">("assignment");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [mode, setMode] = useState<"class" | "students">("class");
  const [targetClass, setTargetClass] = useState<string>("");
  const [targetSection, setTargetSection] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const doCreate = useServerFn(createAssignment);

  const classes = useMemo(() => Array.from(new Set(students.map((s) => s.class_name).filter(Boolean))) as string[], [students]);
  const sections = useMemo(() => Array.from(new Set(students.filter((s) => !targetClass || s.class_name === targetClass).map((s) => s.section).filter(Boolean))) as string[], [students, targetClass]);

  function toggle(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function submit() {
    if (!title.trim()) { toast.error("Title required"); return; }
    if (mode === "class" && !targetClass) { toast.error("Choose a class"); return; }
    if (mode === "students" && selected.size === 0) { toast.error("Select at least one student"); return; }
    setSaving(true);
    try {
      const r = await doCreate({
        data: {
          title,
          description,
          kind,
          dueDate: dueDate || null,
          maxMarks: Number(maxMarks) || 100,
          target: mode === "class"
            ? { kind: "class", className: targetClass, section: targetSection || null }
            : { kind: "students", studentIds: Array.from(selected) },
        },
      }) as { id: string; assignedCount: number };
      toast.success(`Assigned to ${r.assignedCount} student${r.assignedCount === 1 ? "" : "s"}`);
      setOpen(false); setTitle(""); setDescription(""); setDueDate(""); setSelected(new Set());
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1.5 h-4 w-4" />New assignment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New assignment or project</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HTML profile page" /></div>
            <div>
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "assignment" | "project")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="assignment">Assignment</SelectItem><SelectItem value="project">Project</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div><Label>Max marks</Label><Input value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "class" | "students")}>
            <TabsList>
              <TabsTrigger value="class"><Users className="mr-1.5 h-4 w-4" />Whole class / section</TabsTrigger>
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
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {students.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No students in your school yet.</div>
                ) : students.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                    <div className="flex-1"><div className="text-sm font-medium">{s.full_name}</div><div className="text-xs text-muted-foreground">{s.class_name}{s.section ? "-" + s.section : ""}{s.roll_number ? " · #" + s.roll_number : ""}</div></div>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{selected.size} selected</div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}