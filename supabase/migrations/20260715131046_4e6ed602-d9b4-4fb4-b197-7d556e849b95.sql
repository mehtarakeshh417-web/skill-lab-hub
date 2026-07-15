-- Explicitly deny client-side inserts to school_registrations; all inserts happen server-side via service role
CREATE POLICY "No direct client inserts on registrations"
  ON public.school_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Restrict technologies read to authenticated users
DROP POLICY IF EXISTS "Everyone reads technologies" ON public.technologies;
CREATE POLICY "Authenticated users read technologies"
  ON public.technologies
  FOR SELECT
  TO authenticated
  USING (true);