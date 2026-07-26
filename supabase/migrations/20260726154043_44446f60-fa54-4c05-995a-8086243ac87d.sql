REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

DROP POLICY IF EXISTS "no client insert audit" ON public.audit_logs;
DROP POLICY IF EXISTS "no client update audit" ON public.audit_logs;
DROP POLICY IF EXISTS "no client delete audit" ON public.audit_logs;

CREATE POLICY "no client insert audit" ON public.audit_logs
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "no client update audit" ON public.audit_logs
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "no client delete audit" ON public.audit_logs
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);