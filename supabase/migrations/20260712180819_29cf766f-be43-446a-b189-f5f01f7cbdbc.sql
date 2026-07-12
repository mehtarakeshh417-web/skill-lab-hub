
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  roll_number TEXT,
  class_name TEXT,
  section TEXT,
  gender TEXT,
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX students_school_id_idx ON public.students(school_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools manage their own students" ON public.students
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = students.school_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = students.school_id AND s.user_id = auth.uid()));

CREATE POLICY "Students view own record" ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all students" ON public.students
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'portal_manager'));

CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
