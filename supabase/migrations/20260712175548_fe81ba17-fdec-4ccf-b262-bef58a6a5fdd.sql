
-- 1. Fix authorization: grant execute on has_role so authenticated clients can call it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon, service_role;

-- 2. Public school registrations table (Pending Approval workflow)
CREATE TABLE public.school_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  school_code text NOT NULL,
  principal_name text,
  region text,
  designation text,
  notes text,
  username text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  encrypted_password text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin & manager access; no anon (public writes go through server function using service role)
GRANT SELECT, UPDATE ON public.school_registrations TO authenticated;
GRANT ALL ON public.school_registrations TO service_role;

ALTER TABLE public.school_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers view registrations"
  ON public.school_registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'portal_manager'));

CREATE POLICY "Admins and managers update registrations"
  ON public.school_registrations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'portal_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'portal_manager'));

CREATE TRIGGER school_registrations_set_updated_at
  BEFORE UPDATE ON public.school_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX school_registrations_status_idx ON public.school_registrations (status, submitted_at DESC);
