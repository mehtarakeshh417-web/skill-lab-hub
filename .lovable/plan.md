## Goal

Replace the current free-text Assignments page for Teachers and Students with a complete objective assignment module: MCQs, True/False, Fill in the Blanks, and Mixed. Auto-scored on submit, teacher-reviewed, published with remarks, notified end-to-end. Quizzes and Projects stay exactly as they are.

## What the Teacher gets

Assignments page (`/teacher/assignments`, rebuilt):

- **Create assignment**: title, technology (Scratch Jr, Scratch, HTML, Python, Java, MySQL, Paint, Editor, Spreadsheet, Presentation, and a free-text "Other"), description/instructions, assignment type (MCQ / True-False / Fill blanks / Mixed).
- **Question builder**: add unlimited questions; per question — text, type (locked to the assignment type, free per-question when Mixed), options (MCQ), correct answer, marks. Fill-in-the-blank answers accept multiple accepted spellings, matched case-insensitively with trimmed whitespace. Running total of marks shown live.
- **Settings**: passing score (marks or %), due date **and time**, time limit in minutes, shuffle questions, shuffle options, allow multiple attempts (with max attempts), randomize question order per student, show correct answers to students after publication, and **auto-publish results vs hold for manual review** (per assignment, as chosen).
- **Assign to**: selected students or a whole class/section, reusing the existing audience resolver.
- **Monitor**: per-assignment roster showing each student's status — Assigned, In Progress, Submitted, Auto-scored, Published, Overdue — plus score, attempt count and timing.
- **Review & publish**: open an attempt, see every question with the student's answer marked right/wrong, override marks per question or on the total, add remarks, then Publish result (or Republish after edits).
- **Dashboard analytics**: counts for assigned / pending / completed / overdue, plus class-wise performance (average score, pass rate, highest/lowest, per-question accuracy so weak topics are visible).

## What the Student gets

Assignments page (`/student/assignments`, rebuilt):

- Buckets for Pending, Upcoming, Completed and Graded, plus overdue flagging.
- Attempt runner: one screen with all questions (shuffled/randomized per the settings), a live countdown when a time limit is set, auto-submit when the timer expires or the due time passes, and answer autosave in local state so an accidental scroll or refresh mid-attempt is not fatal.
- Blocked from attempting after the due date, or after the attempt limit is used.
- Result view: score, pass/fail against the passing score, teacher remarks, correct answers when the teacher enabled that, and full attempt history when multiple attempts are allowed.

## Notifications (same workflow as Projects)

- Assignment created → every targeted student gets a clickable notification opening that assignment.
- Student submits → assigned teacher gets a clickable notification opening that attempt for review.
- Result published → student gets a notification with the score, opening the result view.

## Technical section

**Database (one migration)** — new tables, kept separate from `assignments` (which now backs Projects) and from `quizzes`:

- `objective_assignments` — teacher_id, school_id, title, description, technology, assignment_type, total_marks, passing_marks, due_at, time_limit_minutes, shuffle_questions, shuffle_options, randomize_per_student, allow_multiple_attempts, max_attempts, show_correct_answers, auto_publish, target_kind/target_class/target_section, timestamps.
- `objective_questions` — assignment_id, question_text, question_type, options (jsonb), correct_answers (jsonb, array to support multiple accepted blank answers), marks, order_index.
- `objective_targets` — assignment_id + student_id for "selected students" targeting.
- `objective_attempts` — assignment_id, student_id, attempt_no, answers (jsonb), per_question_result (jsonb), auto_score, final_score, passed, remarks, status (in_progress | submitted | auto_scored | published), started_at, submitted_at, reviewed_at, reviewed_by.
- `objective_events` — immutable assignment history (assigned, started, submitted, auto-scored, marks adjusted, published), mirroring `project_events`.
- Each table: GRANTs for `authenticated` and `service_role`, RLS enabled, policies scoping teachers to their own assignments and students to their own attempts; correct answers are never exposed to students through the client — they are only ever included in a published result payload when `show_correct_answers` is on.

**Server** — `src/lib/objective-assignments.server.ts` (scoring engine, audience/access checks, history writer) and `src/lib/objective-assignments.functions.ts` with `requireSupabaseAuth`-protected server functions: `createObjectiveAssignment`, `updateObjectiveAssignment`, `listTeacherObjectiveAssignments`, `listStudentObjectiveAssignments`, `startAttempt`, `submitAttempt` (auto-scores server-side, auto-publishes when configured), `reviewAttempt` (override marks + remarks), `publishResult`, `listAssignmentHistory`, `getTeacherAnalytics`. Auto-scoring, time-limit enforcement and due-date enforcement all run server-side; the client timer is display only.

**Frontend** — rebuild `src/routes/teacher.assignments.tsx` and `src/routes/student.assignments.tsx`; add a shared `src/components/objective-question-editor.tsx` and `src/lib/objective-assignments.schema.ts`. Add an assignments summary widget to both dashboards next to the existing Projects widget. The Assignments menu entries in `src/components/app-shell.tsx` keep their current paths, so no navigation changes are needed.

**Not touched**: Quizzes module, Projects module, notifications infrastructure, roles/auth, and all existing business logic. The legacy free-text assignment rows remain in the database untouched but are no longer surfaced in the UI.
