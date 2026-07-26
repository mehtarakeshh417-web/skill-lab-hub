ALTER TABLE public.school_registrations
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS area text;