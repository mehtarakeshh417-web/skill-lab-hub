CREATE TABLE public.student_teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_teacher_assignments TO authenticated;
GRANT ALL ON public.student_teacher_assignments TO service_role;

ALTER TABLE public.student_teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools manage their student teacher assignments"
ON public.student_teacher_assignments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = student_teacher_assignments.school_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.schools s
    WHERE s.id = student_teacher_assignments.school_id
      AND s.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = student_teacher_assignments.teacher_id
      AND t.school_id = student_teacher_assignments.school_id
  )
  AND EXISTS (
    SELECT 1 FROM public.students st
    WHERE st.id = student_teacher_assignments.student_id
      AND st.school_id = student_teacher_assignments.school_id
  )
);

CREATE POLICY "Teachers view their student assignments"
ON public.student_teacher_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teachers t
    WHERE t.id = student_teacher_assignments.teacher_id
      AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and managers view student teacher assignments"
ON public.student_teacher_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['admin'::public.app_role, 'portal_manager'::public.app_role])
  )
);

CREATE TRIGGER set_student_teacher_assignments_updated_at
BEFORE UPDATE ON public.student_teacher_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sections TO authenticated;
GRANT ALL ON public.class_sections TO service_role;