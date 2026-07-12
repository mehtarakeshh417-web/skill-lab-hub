
-- Create all tables first
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'assignment' CHECK (kind IN ('assignment','project')),
  due_date timestamptz,
  max_marks integer DEFAULT 100,
  target_kind text NOT NULL CHECK (target_kind IN ('students','class')),
  target_class text,
  target_section text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignment_targets (
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, student_id)
);

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  content text,
  file_url text,
  file_name text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','returned','completed')),
  grade numeric,
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  grade_level text,
  description text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai')),
  target_kind text NOT NULL DEFAULT 'students' CHECK (target_kind IN ('students','class')),
  target_class text,
  target_section text,
  time_limit_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq','true_false','fill_blank')),
  options jsonb,
  correct_answer text NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_assignments (
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quiz_id, student_id)
);

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, student_id)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX assignments_teacher_idx ON public.assignments(teacher_id);
CREATE INDEX assignments_school_idx ON public.assignments(school_id);
CREATE INDEX submissions_assignment_idx ON public.submissions(assignment_id);
CREATE INDEX submissions_student_idx ON public.submissions(student_id);
CREATE INDEX quizzes_teacher_idx ON public.quizzes(teacher_id);
CREATE INDEX quiz_questions_quiz_idx ON public.quiz_questions(quiz_id);
CREATE INDEX quiz_attempts_quiz_idx ON public.quiz_attempts(quiz_id);
CREATE INDEX quiz_attempts_student_idx ON public.quiz_attempts(student_id);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, read, created_at DESC);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.assignment_targets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.quiz_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.assignments, public.assignment_targets, public.submissions,
              public.quizzes, public.quiz_questions, public.quiz_assignments,
              public.quiz_attempts, public.notifications TO service_role;

-- RLS enable
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER assignments_set_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER submissions_set_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER quizzes_set_updated_at BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Policies (all tables now exist, cross-refs safe) ──

-- assignments
CREATE POLICY "Teachers manage own assignments" ON public.assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = assignments.teacher_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = assignments.teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Schools view assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = assignments.school_id AND s.user_id = auth.uid()));

CREATE POLICY "Students view assigned assignments" ON public.assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.assignment_targets at
            JOIN public.students st ON st.id = at.student_id
            WHERE at.assignment_id = assignments.id AND st.user_id = auth.uid())
    OR (
      assignments.target_kind = 'class'
      AND EXISTS (SELECT 1 FROM public.students st WHERE st.user_id = auth.uid()
                  AND st.school_id = assignments.school_id
                  AND st.class_name = assignments.target_class
                  AND (assignments.target_section IS NULL OR st.section = assignments.target_section))
    )
  );

-- assignment_targets
CREATE POLICY "Teachers manage own assignment targets" ON public.assignment_targets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assignments a JOIN public.teachers t ON t.id = a.teacher_id
                 WHERE a.id = assignment_targets.assignment_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a JOIN public.teachers t ON t.id = a.teacher_id
                      WHERE a.id = assignment_targets.assignment_id AND t.user_id = auth.uid()));

CREATE POLICY "Students see own targets" ON public.assignment_targets
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students st WHERE st.id = assignment_targets.student_id AND st.user_id = auth.uid()));

-- submissions
CREATE POLICY "Students manage own submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students st WHERE st.id = submissions.student_id AND st.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.students st WHERE st.id = submissions.student_id AND st.user_id = auth.uid()));

CREATE POLICY "Teachers view/grade submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assignments a JOIN public.teachers t ON t.id = a.teacher_id
                 WHERE a.id = submissions.assignment_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a JOIN public.teachers t ON t.id = a.teacher_id
                      WHERE a.id = submissions.assignment_id AND t.user_id = auth.uid()));

-- quizzes
CREATE POLICY "Teachers manage own quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = quizzes.teacher_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = quizzes.teacher_id AND t.user_id = auth.uid()));

CREATE POLICY "Students see assigned quizzes" ON public.quizzes
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quiz_assignments qa
            JOIN public.students st ON st.id = qa.student_id
            WHERE qa.quiz_id = quizzes.id AND st.user_id = auth.uid())
    OR (
      quizzes.target_kind = 'class'
      AND EXISTS (SELECT 1 FROM public.students st WHERE st.user_id = auth.uid()
                  AND st.school_id = quizzes.school_id
                  AND st.class_name = quizzes.target_class
                  AND (quizzes.target_section IS NULL OR st.section = quizzes.target_section))
    )
  );

-- quiz_questions
CREATE POLICY "Teachers manage own quiz questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.teachers t ON t.id = q.teacher_id
                 WHERE q.id = quiz_questions.quiz_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.teachers t ON t.id = q.teacher_id
                      WHERE q.id = quiz_questions.quiz_id AND t.user_id = auth.uid()));

CREATE POLICY "Students see questions of assigned quizzes" ON public.quiz_questions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND (
        EXISTS (SELECT 1 FROM public.quiz_assignments qa
                JOIN public.students st ON st.id = qa.student_id
                WHERE qa.quiz_id = q.id AND st.user_id = auth.uid())
        OR (
          q.target_kind = 'class'
          AND EXISTS (SELECT 1 FROM public.students st WHERE st.user_id = auth.uid()
                      AND st.school_id = q.school_id
                      AND st.class_name = q.target_class
                      AND (q.target_section IS NULL OR st.section = q.target_section))
        )
      )
  ));

-- quiz_assignments
CREATE POLICY "Teachers manage own quiz assignments" ON public.quiz_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.teachers t ON t.id = q.teacher_id
                 WHERE q.id = quiz_assignments.quiz_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.teachers t ON t.id = q.teacher_id
                      WHERE q.id = quiz_assignments.quiz_id AND t.user_id = auth.uid()));

CREATE POLICY "Students see own quiz assignments" ON public.quiz_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students st WHERE st.id = quiz_assignments.student_id AND st.user_id = auth.uid()));

-- quiz_attempts
CREATE POLICY "Students manage own attempts" ON public.quiz_attempts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students st WHERE st.id = quiz_attempts.student_id AND st.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.students st WHERE st.id = quiz_attempts.student_id AND st.user_id = auth.uid()));

CREATE POLICY "Teachers view attempts of own quizzes" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q JOIN public.teachers t ON t.id = q.teacher_id
                 WHERE q.id = quiz_attempts.quiz_id AND t.user_id = auth.uid()));

-- notifications
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
