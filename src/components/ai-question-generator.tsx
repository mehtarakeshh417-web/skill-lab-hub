import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateObjectiveQuestions } from "@/lib/ai-assignments.functions";
import {
  ASSIGNMENT_TECHNOLOGIES,
  ASSIGNMENT_TYPES,
  type AssignmentType,
  type QuestionInput,
} from "@/lib/objective-assignments.schema";
import { friendlyError } from "@/lib/messages";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Advanced"] as const;
const COUNTS = [5, 10, 15, 20, 25];

export function AiQuestionGenerator({
  technology,
  assignmentType,
  onGenerated,
}: {
  technology: string;
  assignmentType: AssignmentType;
  onGenerated: (questions: QuestionInput[], mode: "replace" | "append") => void;
}) {
  const [tech, setTech] = useState<string>(technology);
  const [type, setType] = useState<AssignmentType>(assignmentType);
  const [count, setCount] = useState<string>("10");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Medium");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [busy, setBusy] = useState(false);
  const generate = useServerFn(generateObjectiveQuestions);

  async function run() {
    const n = Number(count);
    if (!Number.isFinite(n) || n < 1 || n > 50) {
      toast.error("Choose between 1 and 50 questions.");
      return;
    }
    setBusy(true);
    try {
      const res = await generate({
        data: { technology: tech, count: Math.round(n), assignmentType: type, difficulty, topic: topic.trim() },
      });
      onGenerated(res.questions as QuestionInput[], mode);
      toast.success(`Generated ${res.questions.length} question${res.questions.length === 1 ? "" : "s"} with AI.`);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5 shadow-elegant backdrop-blur-xl sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold">Generate with AI</div>
            <div className="text-xs text-muted-foreground">
              Pick the criteria and AI drafts the questions — you can still edit everything below.
            </div>
          </div>
        </div>
        <Badge variant="accent" className="shrink-0">Optional</Badge>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">Technology</Label>
          <Select value={tech} onValueChange={setTech}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSIGNMENT_TECHNOLOGIES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Number of questions</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTS.map((c) => (<SelectItem key={c} value={String(c)}>{c} questions</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Question type</Label>
          <Select value={type} onValueChange={(v) => setType(v as AssignmentType)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSIGNMENT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Difficulty level</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as (typeof DIFFICULTIES)[number])}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <Label className="text-xs">Topic focus (optional)</Label>
          <Input
            className="mt-1"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. loops, lists and functions"
          />
        </div>
        <div>
          <Label className="text-xs">Existing questions</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as "replace" | "append")}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="replace">Replace them</SelectItem>
              <SelectItem value="append">Add to them</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="hero" className="w-full" onClick={run} disabled={busy}>
            {busy ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="mr-1.5 h-4 w-4" /> Generate questions</>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
