CREATE TABLE public.class_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  section_name text NOT NULL,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (school_id, class_name, section_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_sections TO authenticated;
GRANT ALL ON public.class_sections TO service_role;

ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools manage their own class sections"
  ON public.class_sections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = class_sections.school_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = class_sections.school_id AND s.user_id = auth.uid()));

CREATE POLICY "Teachers view their school class sections"
  ON public.class_sections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.school_id = class_sections.school_id AND t.user_id = auth.uid()));

CREATE POLICY "Students view their school class sections"
  ON public.class_sections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students st WHERE st.school_id = class_sections.school_id AND st.user_id = auth.uid()));

CREATE POLICY "Admins and managers view class sections"
  ON public.class_sections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','portal_manager')));

CREATE TRIGGER class_sections_set_updated_at
  BEFORE UPDATE ON public.class_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();