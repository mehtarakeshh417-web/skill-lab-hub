
-- Extend role enum with sales_rep if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sales_rep' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'sales_rep';
  END IF;
END $$;

-- 1) user_security
CREATE TABLE IF NOT EXISTS public.user_security (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  security_pin_hash text,
  security_question text,
  security_answer_hash text,
  must_setup_security boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_security_username_idx ON public.user_security (lower(username));

GRANT SELECT, INSERT, UPDATE ON public.user_security TO authenticated;
GRANT ALL ON public.user_security TO service_role;

ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own security read"   ON public.user_security FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own security update" ON public.user_security FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own security insert" ON public.user_security FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_security_updated
BEFORE UPDATE ON public.user_security
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_username text,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_label text,
  previous_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'success',
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx  ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx  ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx   ON public.audit_logs (actor_user_id);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL   ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read audit" ON public.audit_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
