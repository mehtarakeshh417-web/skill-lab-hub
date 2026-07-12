
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  employee_id text,
  subject text,
  department text,
  qualification text,
  gender text,
  date_of_birth date,
  address text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX teachers_school_id_idx ON public.teachers(school_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Admins & managers see all teachers
CREATE POLICY "Admins can view all teachers" ON public.teachers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'portal_manager'));

-- School users can view/manage teachers of their own school
CREATE POLICY "Schools manage their own teachers" ON public.teachers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = teachers.school_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = teachers.school_id AND s.user_id = auth.uid()
    )
  );

-- Teachers can view their own record
CREATE POLICY "Teachers view own record" ON public.teachers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER teachers_set_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
