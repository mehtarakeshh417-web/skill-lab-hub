ALTER TABLE public.school_registrations
  ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL;