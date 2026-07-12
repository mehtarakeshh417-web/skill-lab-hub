DROP POLICY IF EXISTS "Admins and managers manage schools" ON public.schools;
DROP POLICY IF EXISTS "School users view own school" ON public.schools;
DROP POLICY IF EXISTS "School users update own school" ON public.schools;

CREATE POLICY "Admins manage schools"
ON public.schools
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

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