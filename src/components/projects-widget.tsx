import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listStudentProjects, listTeacherProjects } from "@/lib/projects.functions";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, FolderKanban, Loader2 } from "lucide-react";

type Counts = { pending: number; submitted: number; evaluated: number };

export function ProjectsWidget({ role }: { role: "teacher" | "student" }) {
  const loadTeacher = useServerFn(listTeacherProjects);
  const loadStudent = useServerFn(listStudentProjects);
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let c: Counts = { pending: 0, submitted: 0, evaluated: 0 };
        if (role === "teacher") {
          const res = (await loadTeacher()) as {
            projects: Array<{ audience: Array<{ id: string }>; submissions: Array<{ student_id: string; status: string }> }>;
          };
          for (const p of res.projects ?? []) {
            for (const st of p.audience) {
              const status = p.submissions.find((s) => s.student_id === st.id)?.status ?? "assigned";
              if (["assigned", "in_progress", "resubmit_requested"].includes(status)) c.pending += 1;
              else if (["submitted", "under_review"].includes(status)) c.submitted += 1;
              else if (status === "evaluated") c.evaluated += 1;
            }
          }
        } else {
          const rows = (await loadStudent()) as Array<{ submission: { status: string } | null }>;
          for (const p of rows ?? []) {
            const status = p.submission?.status ?? "assigned";
            if (["assigned", "in_progress", "resubmit_requested"].includes(status)) c.pending += 1;
            else if (["submitted", "under_review"].includes(status)) c.submitted += 1;
            else if (status === "evaluated") c.evaluated += 1;
          }
        }
        if (alive) setCounts(c);
      } catch {
        if (alive) setCounts({ pending: 0, submitted: 0, evaluated: 0 });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <Card className="rounded-3xl backdrop-blur bg-card/60 border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="h-5 w-5" />Projects
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to={role === "teacher" ? "/teacher/projects" : "/student/projects"}>
            Open <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {counts === null ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Tile icon={Clock3} label={role === "teacher" ? "Pending with students" : "Pending"} value={counts.pending} tone="text-amber-600 dark:text-amber-300 bg-amber-500/10" />
            <Tile icon={FileCheck2} label={role === "teacher" ? "Awaiting evaluation" : "Submitted"} value={counts.submitted} tone="text-sky-600 dark:text-sky-300 bg-sky-500/10" />
            <Tile icon={CheckCircle2} label="Evaluated" value={counts.evaluated} tone="text-emerald-600 dark:text-emerald-300 bg-emerald-500/10" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Tile({ icon: Icon, label, value, tone }: { icon: typeof Clock3; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}