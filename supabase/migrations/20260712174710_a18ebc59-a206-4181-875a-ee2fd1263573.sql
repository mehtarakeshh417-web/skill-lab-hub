
-- 1. Add 'sales_rep' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_rep';

-- 2. Create sales_reps table
CREATE TABLE IF NOT EXISTS public.sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  employee_id text,
  username text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  designation text,
  department text NOT NULL DEFAULT 'Sales',
  reporting_manager_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_reps TO authenticated;
GRANT ALL ON public.sales_reps TO service_role;

ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales reps" ON public.sales_reps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers view sales reps" ON public.sales_reps
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'portal_manager'));

CREATE POLICY "Sales rep views self" ON public.sales_reps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER sales_reps_set_updated_at BEFORE UPDATE ON public.sales_reps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Prevent self-reporting and circular hierarchy
CREATE OR REPLACE FUNCTION public.check_sales_rep_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_id uuid;
  depth int := 0;
BEGIN
  IF NEW.reporting_manager_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.reporting_manager_id = NEW.id THEN
    RAISE EXCEPTION 'A sales rep cannot report to themselves';
  END IF;
  current_id := NEW.reporting_manager_id;
  WHILE current_id IS NOT NULL AND depth < 50 LOOP
    IF current_id = NEW.id THEN
      RAISE EXCEPTION 'Circular reporting hierarchy detected';
    END IF;
    SELECT reporting_manager_id INTO current_id FROM public.sales_reps WHERE id = current_id;
    depth := depth + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sales_reps_hierarchy_check
  BEFORE INSERT OR UPDATE ON public.sales_reps
  FOR EACH ROW EXECUTE FUNCTION public.check_sales_rep_hierarchy();

-- 4. Add sales_rep_id to schools (nullable for backward compat; enforced app-side)
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS schools_sales_rep_idx ON public.schools(sales_rep_id);

-- 5. Allow sales reps to view their assigned schools
CREATE POLICY "Sales reps view assigned schools" ON public.schools
  FOR SELECT TO authenticated
  USING (
    sales_rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid())
  );
