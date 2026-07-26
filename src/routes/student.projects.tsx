import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { friendlyError } from "@/lib/messages";
import { listStudentProjects, startProject, submitProject } from "@/lib/projects.functions";
import { uploadProjectFiles } from "@/lib/project-upload";
import { STATUS_META, SUBMISSION_TYPES, type ProjectStatus } from "@/lib/project-templates";
import { Award, CheckCircle2, Clock3, FileCheck2, FolderKanban, Loader2, Upload } from "lucide-react";

export const Route = createFileRoute("/student/projects")({
  validateSearch: (search: Record<string, unknown>) => ({
    focus: typeof search.focus === "string" ? search.focus : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Projects · Student · Avartan Skill Lab" },
      { name: "description", content: "View assigned technology projects, submit your work and read teacher feedback with marks and grades." },
      { property: "og:title", content: "My Projects · Avartan Skill Lab" },
      { property: "og:description", content: "Submit your projects and track marks, grades and feedback." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentProjectsPage,
});

type SignedFile = { name: string; path: string; url: string | null };
type Submission = {
  id: string; status: string; attempt: number; grade: number | null; grade_letter: string | null;
  feedback: string | null; content: string | null; source_code: string | null;
  files: SignedFile[]; submitted_at: string; reviewed_at: string | null;
};
type Project = {
  id: string; title: string; description: string | null; instructions: string | null;
  technology: string | null; submission_type: string; due_date: string | null; max_marks: number | null;
  created_at: string; teachers: { full_name: string } | null; submission: Submission | null;
};

function statusOf(p: Project): ProjectStatus {
  const s = p.submission?.status;
  if (!s) return "assigned";
  const allowed: ProjectStatus[] = ["in_progress", "submitted", "under_review", "evaluated", "resubmit_requested"];
  return (allowed.includes(s as ProjectStatus) ? s : "submitted") as ProjectStatus;
}

function StudentProjectsPage() {
  const { focus } = Route.useSearch();
  const load = useServerFn(listStudentProjects);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Project | null>(null);
  const focused = useRef(false);

  async function refresh() {
    try {
      const rows = (await load()) as Project[];
      setProjects(rows ?? []);
      return rows ?? [];
    } catch (e) {
      toast.error("We couldn't load your projects", { description: friendlyError(e) });
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const rows = await refresh();
      if (focus && !focused.current) {
        focused.current = true;
        const hit = rows.find((p) => p.id === focus);
        if (hit) setActive(hit);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const stats = useMemo(() => {
    let pending = 0, submitted = 0, evaluated = 0;
    for (const p of projects) {
      const s = statusOf(p);
      if (s === "assigned" || s === "in_progress" || s === "resubmit_requested") pending += 1;
      if (s === "submitted" || s === "under_review") submitted += 1;
      if (s === "evaluated") evaluated += 1;
    }
    return { pending, submitted, evaluated, total: projects.length };
  }, [projects]);

  return (
    <AppShell requireRole="student" title="Projects">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold tracking-tight">My Projects</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Work on the projects your teacher assigned, submit them and see your marks and feedback.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={FolderKanban} label="All projects" value={stats.total} tone="indigo" />
        <MiniStat icon={Clock3} label="Pending" value={stats.pending} tone="amber" />
        <MiniStat icon={FileCheck2} label="Submitted" value={stats.submitted} tone="sky" />
        <MiniStat icon={CheckCircle2} label="Evaluated" value={stats.evaluated} tone="emerald" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : projects.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            No projects have been assigned to you yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((p) => {
            const status = statusOf(p);
            const meta = STATUS_META[status];
            return (
              <Card key={p.id} className="rounded-3xl">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                    <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {p.technology && <span>{p.technology}</span>}
                    <span>· {SUBMISSION_TYPES.find((s) => s.value === p.submission_type)?.label ?? p.submission_type}</span>
                    <span>· Max {p.max_marks ?? 100} marks</span>
                    {p.due_date && <span>· Due {new Date(p.due_date).toLocaleDateString()}</span>}
                    {p.teachers?.full_name && <span>· {p.teachers.full_name}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  {p.submission?.grade != null && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Award className="h-4 w-4" />{p.submission.grade}/{p.max_marks ?? 100}
                        {p.submission.grade_letter && <Badge variant="outline" className="rounded-full">{p.submission.grade_letter}</Badge>}
                      </div>
                      {p.submission.feedback && <p className="mt-2 whitespace-pre-wrap text-sm">{p.submission.feedback}</p>}
                    </div>
                  )}
                  {status === "resubmit_requested" && p.submission?.feedback && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                      <strong>Resubmission requested:</strong> {p.submission.feedback}
                    </div>
                  )}
                  <Button className="w-full" size="lg" onClick={() => setActive(p)}>
                    {status === "evaluated" ? "View project & feedback" : status === "submitted" || status === "under_review" ? "View submission" : "Open project"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {active && (
        <ProjectDialog
          project={active}
          onClose={() => setActive(null)}
          onChanged={async () => {
            const rows = await refresh();
            const fresh = rows.find((p) => p.id === active.id) ?? null;
            setActive(fresh);
          }}
        />
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

function ProjectDialog({ project, onClose, onChanged }: { project: Project; onClose: () => void; onChanged: () => void }) {
  const begin = useServerFn(startProject);
  const send = useServerFn(submitProject);
  const status = statusOf(project);
  const locked = status === "evaluated" || status === "under_review";

  const [content, setContent] = useState(project.submission?.content ?? "");
  const [sourceCode, setSourceCode] = useState(project.submission?.source_code ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!project.submission) {
      begin({ data: { assignmentId: project.id } }).then(onChanged).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const needsFiles = ["file", "screenshot", "multi_file"].includes(project.submission_type);
  const multiple = project.submission_type === "multi_file";

  async function submit() {
    setBusy(true);
    try {
      const uploaded = needsFiles && files.length > 0 ? await uploadProjectFiles(project.id, files) : [];
      await send({
        data: {
          assignmentId: project.id,
          content,
          sourceCode,
          files: uploaded.length > 0 ? uploaded : (project.submission?.files ?? []).map((f) => ({ name: f.name, path: f.path })),
        },
      });
      toast.success("Project submitted", { description: "Your teacher has been notified." });
      setFiles([]);
      onChanged();
    } catch (e) {
      toast.error("We couldn't submit your project", { description: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{project.title}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          {project.instructions && (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{project.instructions}</pre>
            </div>
          )}

          {project.submission?.files && project.submission.files.length > 0 && (
            <div className="rounded-2xl border p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your attachments</div>
              <ul className="mt-2 space-y-1 text-sm">
                {project.submission.files.map((f) => (
                  <li key={f.path}>
                    {f.url ? <a href={f.url} target="_blank" rel="noreferrer" className="text-primary underline">{f.name}</a> : f.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {locked ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {status === "evaluated"
                ? "This project has been evaluated. Contact your teacher if you need to submit again."
                : "Your teacher is reviewing this submission right now."}
            </div>
          ) : (
            <>
              {(project.submission_type === "text") && (
                <div>
                  <Label>Your answer</Label>
                  <Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your project answer here…" />
                </div>
              )}
              {project.submission_type === "source_code" && (
                <div>
                  <Label>Source code</Label>
                  <Textarea rows={12} value={sourceCode} onChange={(e) => setSourceCode(e.target.value)} className="font-mono text-sm" placeholder="Paste your code here…" />
                </div>
              )}
              {needsFiles && (
                <div className="space-y-3">
                  <Label>{multiple ? "Upload your files" : project.submission_type === "screenshot" ? "Upload your screenshot" : "Upload your file"}</Label>
                  <Input
                    type="file"
                    multiple={multiple}
                    accept={project.submission_type === "screenshot" ? "image/*" : undefined}
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, multiple ? 10 : 1))}
                  />
                  {files.length > 0 && (
                    <ul className="text-xs text-muted-foreground">{files.map((f) => <li key={f.name}>{f.name}</li>)}</ul>
                  )}
                  <div>
                    <Label>Notes for your teacher (optional)</Label>
                    <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!locked && (
            <Button size="lg" disabled={busy} onClick={submit}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {project.submission && project.submission.attempt > 0 && status === "resubmit_requested" ? "Submit again" : "Submit project"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}