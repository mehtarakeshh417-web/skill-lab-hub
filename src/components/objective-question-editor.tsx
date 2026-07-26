import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  QUESTION_TYPES,
  blankQuestion,
  type AssignmentType,
  type QuestionInput,
  type QuestionType,
} from "@/lib/objective-assignments.schema";

export function QuestionEditor({
  assignmentType,
  questions,
  onChange,
}: {
  assignmentType: AssignmentType;
  questions: QuestionInput[];
  onChange: (next: QuestionInput[]) => void;
}) {
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  function update(index: number, patch: Partial<QuestionInput>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }
  function remove(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }
  function add(type: QuestionType) {
    onChange([...questions, blankQuestion(type)]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
        <div className="text-sm font-semibold">
          {questions.length} question{questions.length === 1 ? "" : "s"}
          <span className="ml-2 text-muted-foreground">Total {totalMarks} marks</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {assignmentType === "mixed" ? (
            QUESTION_TYPES.map((t) => (
              <Button key={t.value} type="button" size="sm" variant="outline" onClick={() => add(t.value)}>
                <Plus className="mr-1.5 h-4 w-4" />
                {t.label}
              </Button>
            ))
          ) : (
            <Button type="button" size="sm" onClick={() => add(assignmentType as QuestionType)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add question
            </Button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No questions yet. Add your first question above.
        </div>
      ) : (
        questions.map((q, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Q{i + 1}</Badge>
                <Badge variant="secondary" className="capitalize">
                  {QUESTION_TYPES.find((t) => t.value === q.questionType)?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Marks</Label>
                <Input
                  className="h-9 w-20"
                  value={String(q.marks)}
                  inputMode="decimal"
                  onChange={(e) => update(i, { marks: Number(e.target.value) || 0 })}
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)} aria-label="Remove question">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <Textarea
              rows={2}
              value={q.questionText}
              placeholder={
                q.questionType === "fill_blank"
                  ? "e.g. The HTML tag for a paragraph is ______"
                  : "Type the question here"
              }
              onChange={(e) => update(i, { questionText: e.target.value })}
            />

            {q.questionType === "mcq" && (
              <div className="space-y-2">
                <Label className="text-xs">Options — tap the circle to mark the correct one</Label>
                {q.options.map((opt, oi) => {
                  const isCorrect = q.correctAnswers[0] === opt && opt.trim().length > 0;
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update(i, { correctAnswers: [opt] })}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                          isCorrect
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-600"
                            : "border-border text-muted-foreground"
                        }`}
                        aria-label={`Mark option ${oi + 1} correct`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <Input
                        value={opt}
                        placeholder={`Option ${oi + 1}`}
                        onChange={(e) => {
                          const options = q.options.map((o, x) => (x === oi ? e.target.value : o));
                          const correctAnswers =
                            q.correctAnswers[0] === opt ? [e.target.value] : q.correctAnswers;
                          update(i, { options, correctAnswers });
                        }}
                      />
                      {q.options.length > 2 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => update(i, { options: q.options.filter((_, x) => x !== oi) })}
                          aria-label="Remove option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {q.options.length < 8 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => update(i, { options: [...q.options, ""] })}>
                    <Plus className="mr-1.5 h-4 w-4" />Add option
                  </Button>
                )}
              </div>
            )}

            {q.questionType === "true_false" && (
              <div>
                <Label className="text-xs">Correct answer</Label>
                <Select value={q.correctAnswers[0] || "True"} onValueChange={(v) => update(i, { correctAnswers: [v] })}>
                  <SelectTrigger className="mt-1 max-w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {q.questionType === "fill_blank" && (
              <div className="space-y-2">
                <Label className="text-xs">Accepted answers (any one counts, case-insensitive)</Label>
                {q.correctAnswers.map((ans, ai) => (
                  <div key={ai} className="flex items-center gap-2">
                    <Input
                      value={ans}
                      placeholder="Accepted answer"
                      onChange={(e) =>
                        update(i, { correctAnswers: q.correctAnswers.map((a, x) => (x === ai ? e.target.value : a)) })
                      }
                    />
                    {q.correctAnswers.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => update(i, { correctAnswers: q.correctAnswers.filter((_, x) => x !== ai) })}
                        aria-label="Remove accepted answer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => update(i, { correctAnswers: [...q.correctAnswers, ""] })}
                >
                  <Plus className="mr-1.5 h-4 w-4" />Add alternative spelling
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}