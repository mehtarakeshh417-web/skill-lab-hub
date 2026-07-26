import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listStudentObjectiveAssignments,
  listTeacherObjectiveAssignments,
} from "@/lib/objective-assignments.functions";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, FileCheck2, Loader2 } from "lucide-react";

type Counts = { pending: number; awaiting: number; done: number };

export function AssignmentsWidget({ role }: { role: "teacher" | "student" }) {
  const loadTeacher = useServerFn(listTeacherObjectiveAssignments);
  const loadStudent = useServerFn(listStudentObjectiveAssignments);
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const c: Counts = { pending: 0, awaiting: 0, done: 0 };
      try {
        if (role === "teacher") {
          const res = (await loadTeacher()) as {
            assignments: Array<{ analytics: { pending: number; awaitingReview: number; published: number } }>;
          };
          for (const a of res.assignments ?? []) {
            c.pending += a.analytics.pending;
            c.awaiting += a.analytics.awaitingReview;
            c.done += a.analytics.published;
          }
        } else {
          const rows = (await loadStudent()) as Array<{ attempts: Array<{ status: string }> }>;
          for (const a of rows ?? []) {
            const latest = a.attempts[a.attempts.length - 1];
            if (!latest || latest.status === "in_progress") c.pending += 1;
            else if (latest.status === "published") c.done += 1;
            else c.awaiting += 1;
          }
        }
        if (alive) setCounts(c);
      } catch {
        if (alive) setCounts(c);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <Card className="rounded-3xl backdrop-blur bg-card/60 border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-5 w-5" />Assignments
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to={role === "teacher" ? "/teacher/assignments" : "/student/assignments"}>
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
            <Tile icon={FileCheck2} label={role === "teacher" ? "Awaiting review" : "Submitted"} value={counts.awaiting} tone="text-sky-600 dark:text-sky-300 bg-sky-500/10" />
            <Tile icon={CheckCircle2} label={role === "teacher" ? "Published" : "Graded"} value={counts.done} tone="text-emerald-600 dark:text-emerald-300 bg-emerald-500/10" />
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