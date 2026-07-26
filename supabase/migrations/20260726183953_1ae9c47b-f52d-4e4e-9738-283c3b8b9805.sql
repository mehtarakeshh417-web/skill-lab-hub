-- ============ objective_assignments ============
CREATE TABLE public.objective_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  technology text,
  assignment_type text NOT NULL DEFAULT 'mcq' CHECK (assignment_type IN ('mcq','true_false','fill_blank','mixed')),
  total_marks numeric NOT NULL DEFAULT 0,
  passing_marks numeric NOT NULL DEFAULT 0,
  due_at timestamptz,
  time_limit_minutes integer,
  shuffle_questions boolean NOT NULL DEFAULT false,
  shuffle_options boolean NOT NULL DEFAULT false,
  randomize_per_student boolean NOT NULL DEFAULT false,
  allow_multiple_attempts boolean NOT NULL DEFAULT false,
  max_attempts integer NOT NULL DEFAULT 1,
  show_correct_answers boolean NOT NULL DEFAULT true,
  auto_publish boolean NOT NULL DEFAULT false,
  target_kind text NOT NULL DEFAULT 'class' CHECK (target_kind IN ('class','students')),
  target_class text,
  target_section text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_assignments TO authenticated;
GRANT ALL ON public.objective_assignments TO service_role;
ALTER TABLE public.objective_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage their own objective assignments"
  ON public.objective_assignments FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
  WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE TRIGGER objective_assignments_set_updated_at
  BEFORE UPDATE ON public.objective_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ objective_questions ============
CREATE TABLE public.objective_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.objective_assignments(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq','true_false','fill_blank')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  marks numeric NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_questions TO authenticated;
GRANT ALL ON public.objective_questions TO service_role;
ALTER TABLE public.objective_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage questions of their own assignments"
  ON public.objective_questions FOR ALL TO authenticated
  USING (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()))
  WITH CHECK (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()));

CREATE INDEX objective_questions_assignment_idx ON public.objective_questions(assignment_id, order_index);

-- ============ objective_targets ============
CREATE TABLE public.objective_targets (
  assignment_id uuid NOT NULL REFERENCES public.objective_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_targets TO authenticated;
GRANT ALL ON public.objective_targets TO service_role;
ALTER TABLE public.objective_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage targets of their own assignments"
  ON public.objective_targets FOR ALL TO authenticated
  USING (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()))
  WITH CHECK (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()));

CREATE POLICY "Students read their own assignment targets"
  ON public.objective_targets FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students read objective assignments targeted at them"
  ON public.objective_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.school_id = objective_assignments.school_id
        AND (
          (objective_assignments.target_kind = 'class'
            AND (objective_assignments.target_class IS NULL OR objective_assignments.target_class = s.class_name)
            AND (objective_assignments.target_section IS NULL OR objective_assignments.target_section = s.section))
          OR EXISTS (
            SELECT 1 FROM public.objective_targets t
            WHERE t.assignment_id = objective_assignments.id AND t.student_id = s.id
          )
        )
    )
  );

-- ============ objective_attempts ============
CREATE TABLE public.objective_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.objective_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL DEFAULT 1,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  per_question_result jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_score numeric,
  final_score numeric,
  passed boolean,
  remarks text,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','submitted','auto_scored','published')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id, attempt_no)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_attempts TO authenticated;
GRANT ALL ON public.objective_attempts TO service_role;
ALTER TABLE public.objective_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read their own attempts"
  ON public.objective_attempts FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students create their own attempts"
  ON public.objective_attempts FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students update their own unreviewed attempts"
  ON public.objective_attempts FOR UPDATE TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status IN ('in_progress','submitted')
  )
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Teachers read attempts on their assignments"
  ON public.objective_attempts FOR SELECT TO authenticated
  USING (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()));

CREATE POLICY "Teachers review attempts on their assignments"
  ON public.objective_attempts FOR UPDATE TO authenticated
  USING (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()))
  WITH CHECK (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()));

CREATE TRIGGER objective_attempts_set_updated_at
  BEFORE UPDATE ON public.objective_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ objective_events ============
CREATE TABLE public.objective_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.objective_assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.objective_attempts(id) ON DELETE SET NULL,
  status text NOT NULL,
  actor_role text NOT NULL,
  actor_name text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.objective_events TO authenticated;
GRANT ALL ON public.objective_events TO service_role;
ALTER TABLE public.objective_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read history of their assignments"
  ON public.objective_events FOR SELECT TO authenticated
  USING (assignment_id IN (
    SELECT a.id FROM public.objective_assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = auth.uid()));

CREATE POLICY "Students read their own assignment history"
  ON public.objective_events FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE INDEX objective_events_assignment_idx ON public.objective_events(assignment_id, created_at DESC);
CREATE INDEX objective_attempts_assignment_idx ON public.objective_attempts(assignment_id);
CREATE INDEX objective_attempts_student_idx ON public.objective_attempts(student_id);