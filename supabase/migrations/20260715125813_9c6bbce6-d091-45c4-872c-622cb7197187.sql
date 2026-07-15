
-- 1. Move has_role to private schema (not exposed via Data API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Recreate policies referencing private.has_role
DROP POLICY IF EXISTS "Admin views all progress" ON public.student_progress;
CREATE POLICY "Admin views all progress" ON public.student_progress FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage schools" ON public.schools;
CREATE POLICY "Admins manage schools" ON public.schools FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage sales reps" ON public.sales_reps;
CREATE POLICY "Admins manage sales reps" ON public.sales_reps FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Managers view sales reps" ON public.sales_reps;
CREATE POLICY "Managers view sales reps" ON public.sales_reps FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'portal_manager'::public.app_role));

DROP POLICY IF EXISTS "Admins and managers view registrations" ON public.school_registrations;
CREATE POLICY "Admins and managers view registrations" ON public.school_registrations FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'portal_manager'::public.app_role));

DROP POLICY IF EXISTS "Admins and managers update registrations" ON public.school_registrations;
CREATE POLICY "Admins and managers update registrations" ON public.school_registrations FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'portal_manager'::public.app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'portal_manager'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all teachers" ON public.teachers;
CREATE POLICY "Admins can view all teachers" ON public.teachers FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'portal_manager'::public.app_role));

DROP POLICY IF EXISTS "Admins view all students" ON public.students;
CREATE POLICY "Admins view all students" ON public.students FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'portal_manager'::public.app_role));

DROP POLICY IF EXISTS "admins read audit" ON public.audit_logs;
CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Drop the publicly exposed SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4. Restrict profiles SELECT to own row + admins/managers
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
    OR private.has_role(auth.uid(), 'portal_manager'::public.app_role)
  );
