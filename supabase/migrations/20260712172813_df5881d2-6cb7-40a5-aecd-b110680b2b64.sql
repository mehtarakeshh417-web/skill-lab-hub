ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS principal_name text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE public.schools
SET username = lower(school_code)
WHERE username IS NULL;

UPDATE public.schools
SET email = lower(school_code) || '@avartan.app'
WHERE email IS NULL;

ALTER TABLE public.schools
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS schools_school_code_unique_idx ON public.schools (upper(school_code));
CREATE UNIQUE INDEX IF NOT EXISTS schools_username_unique_idx ON public.schools (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS schools_email_unique_idx ON public.schools (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_schools_updated_at ON public.schools;
CREATE TRIGGER set_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Manager manages schools" ON public.schools;
DROP POLICY IF EXISTS "Schools visible to admin and manager" ON public.schools;
DROP POLICY IF EXISTS "School users view own school" ON public.schools;
DROP POLICY IF EXISTS "School users update own school" ON public.schools;

CREATE POLICY "Admins and managers manage schools"
ON public.schools
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'portal_manager'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'portal_manager'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "School users view own school"
ON public.schools
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "School users update own school"
ON public.schools
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());