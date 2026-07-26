## Goal

Keep the existing manual question builder exactly as it is, and add a second way to fill it: an **"Generate with AI"** panel inside the teacher's Create Assignment dialog. The teacher picks technology, number of questions, assignment type, and difficulty — AI writes the questions, which drop straight into the existing editor so they can still be reviewed, edited, or deleted before saving.

## About the API key

The portal already has AI built in (the same gateway used by the Learning module), so no new key is needed and nothing gets hardcoded. I'll use the existing built-in AI credentials. If you'd still prefer your own Google key be used, say so and I'll store it securely instead of putting it in the code.

## What the teacher sees

Inside the Create Assignment dialog, above the question editor:

```text
┌─ Generate with AI ──────────────────────────────┐
│ Technology  [Python ▾]   Questions [10 ▾]       │
│ Type        [MCQ ▾]      Difficulty [Medium ▾]  │
│ Topic focus (optional)  [loops and lists      ] │
│                         [ ✨ Generate questions ]│
└─────────────────────────────────────────────────┘
```

- Technology defaults to the technology already chosen for the assignment; type defaults to the chosen assignment type (MCQ / True-False / Fill in the Blanks / Mixed).
- Question count: 5 / 10 / 15 / 20 / 25 (or a number input, 1–50).
- Difficulty: Beginner / Easy / Medium / Hard / Advanced.
- Optional free-text "topic focus" so the teacher can narrow the syllabus area.
- While generating: spinner + disabled button, plus a clear error toast if AI is rate-limited or credits run out.
- Results either **replace** or **append** to the current question list (a small toggle), then render in the normal editor — fully editable.
- For Mixed, the AI is instructed to spread questions across all three question types.

## Technical section

1. **`src/lib/ai-assignments.server.ts`** (new) — calls the AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`, `LOVABLE_API_KEY` read inside the handler) with a strict system prompt: return only JSON matching the portal's question shape (`questionText`, `questionType`, `options`, `correctAnswers`, `marks`). Includes normalization: True/False forced to `["True","False"]` options, MCQ forced to 4 options with the correct answer present in the option list, fill-in-the-blank stripped of options, marks defaulted to 1. Anything that fails validation is dropped rather than saved malformed.
2. **`src/lib/ai-assignments.functions.ts`** (new) — `generateObjectiveQuestions` server function, `.middleware([requireSupabaseAuth])` so only signed-in teachers can call it, input validated with Zod (technology, count 1–50, type, difficulty, optional topic), output validated against the existing `questionSchema` from `objective-assignments.schema.ts`.
3. **`src/components/ai-question-generator.tsx`** (new) — the panel UI, styled with the current Emerald Prestige tokens (glass card, `rounded-2xl`, gradient action button). Emits `QuestionInput[]` to its parent.
4. **`src/routes/teacher.assignments.tsx`** — insert the panel into `CreateAssignmentDialog` and wire it to the existing `setQuestions` state. No change to `createObjectiveAssignment`, scoring, attempts, roster targeting, or any other existing logic.
5. Audit trail: generation is a draft-time action, so nothing is logged until the teacher actually saves the assignment (existing create logging is untouched).

Nothing about the manual flow, database schema, student attempt runner, or auto-scoring engine changes.
