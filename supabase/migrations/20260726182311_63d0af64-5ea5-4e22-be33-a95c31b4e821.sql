ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS technology text,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS submission_type text NOT NULL DEFAULT 'text';

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_submission_type_check;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_submission_type_check
  CHECK (submission_type = ANY (ARRAY['text','screenshot','file','source_code','multi_file']));

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS grade_letter text,
  ADD COLUMN IF NOT EXISTS source_code text,
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
  CHECK (status = ANY (ARRAY['in_progress','submitted','under_review','evaluated','resubmit_requested','reviewed','returned','completed']));

CREATE TABLE IF NOT EXISTS public.project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.submissions(id) ON DELETE SET NULL,
  status text NOT NULL,
  actor_role text NOT NULL,
  actor_name text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_events_assignment_idx ON public.project_events (assignment_id, student_id, created_at DESC);

GRANT SELECT ON public.project_events TO authenticated;
GRANT ALL ON public.project_events TO service_role;

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own project history"
  ON public.project_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students st WHERE st.id = project_events.student_id AND st.user_id = auth.uid()));

CREATE POLICY "Teachers read own project history"
  ON public.project_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE a.id = project_events.assignment_id AND t.user_id = auth.uid()
  ));