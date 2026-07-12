import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { listStudentAssignments, submitAssignment } from "@/lib/learning.functions";
import { Loader2, Upload, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({ meta: [{ title: "My Assignments · Avartan" }] }),
  component: StudentAssignmentsPage,
});

type Row = {
  id: string; title: string; kind: string; description: string | null;
  due_date: string | null; max_marks: number | null; created_at: string;
  teachers: { full_name: string };
  submission: null | {
    id: string; status: string; grade: number | null; feedback: string | null;
    content: string | null; file_url: string | null; file_name: string | null;
    submitted_at: string; reviewed_at: string | null;
  };
};

function statusLabel(row: Row) {
  const s = row.submission;
  if (!s) return { label: "Assigned", cls: "" };
  if (s.status === "submitted") return { label: "Submitted", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" };
  if (s.status === "reviewed" || s.status === "returned") return { label: "Reviewed", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" };
  if (s.status === "completed") return { label: "Completed", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" };
  return { label: s.status, cls: "" };
}

function StudentAssignmentsPage() {
  const load = useServerFn(listStudentAssignments);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try { setRows((await load()) as Row[]); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <AppShell requireRole="student" title="My Assignments">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Assignments & Projects</h2>
        <p className="text-sm text-muted-foreground">Work assigned to you by your teachers.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">Nothing assigned to you yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const st = statusLabel(r);
            return (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {r.title}
                        <Badge variant="secondary" className="capitalize">{r.kind}</Badge>
                      </CardTitle>
                      <div className="mt-1 text-xs text-muted-foreground">
                        By {r.teachers.full_name}
                        {r.due_date && <> · Due {new Date(r.due_date).toLocaleDateString()}</>}
                        {" · "}Max {r.max_marks ?? 100} marks
                      </div>
                    </div>
                    <Badge className={st.cls}>{st.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  {r.submission?.status === "reviewed" || r.submission?.status === "returned" || r.submission?.status === "completed" ? (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
                      <div className="font-semibold">Grade: {r.submission.grade}/{r.max_marks ?? 100}</div>
                      {r.submission.feedback && <div className="mt-1 text-muted-foreground">{r.submission.feedback}</div>}
                    </div>
                  ) : null}
                  <SubmitDialog row={r} onDone={refresh} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function SubmitDialog({ row, onDone }: { row: Row; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(row.submission?.content ?? "");
  const [fileUrl, setFileUrl] = useState(row.submission?.file_url ?? "");
  const [fileName, setFileName] = useState(row.submission?.file_name ?? "");
  const [saving, setSaving] = useState(false);
  const doSubmit = useServerFn(submitAssignment);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("File must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setFileUrl(String(reader.result)); setFileName(f.name); };
    reader.readAsDataURL(f);
  }

  async function save() {
    if (!content.trim() && !fileUrl) { toast.error("Add text or a file"); return; }
    setSaving(true);
    try {
      await doSubmit({ data: {
        assignmentId: row.id,
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
      }});
      toast.success("Submitted");
      setOpen(false);
      onDone();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Submit failed"); }
    finally { setSaving(false); }
  }

  const done = row.submission?.status === "completed";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={row.submission ? "outline" : "default"} className="w-full" disabled={done}>
          <ClipboardCheck className="mr-1.5 h-4 w-4" />
          {row.submission ? "Update submission" : "Open & submit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{row.title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Your work</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Type or paste your submission here" />
          </div>
          <div>
            <Label>Attach a file (optional, up to 2MB)</Label>
            <Input type="file" onChange={onFile} />
            {fileName && <div className="mt-1 text-xs text-muted-foreground">Attached: {fileName}</div>}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-1.5 h-4 w-4" />Submit</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}