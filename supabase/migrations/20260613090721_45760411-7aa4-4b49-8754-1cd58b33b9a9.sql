
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'portal_manager', 'school', 'teacher', 'student');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  area TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, active, inactive
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools visible to admin and manager" ON public.schools FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'portal_manager') OR user_id = auth.uid());
CREATE POLICY "Manager manages schools" ON public.schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'portal_manager') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'portal_manager') OR public.has_role(auth.uid(), 'admin'));

-- Technologies
CREATE TABLE public.technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  display_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.technologies TO authenticated, anon;
GRANT ALL ON public.technologies TO service_role;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone reads technologies" ON public.technologies FOR SELECT USING (true);

INSERT INTO public.technologies (slug, name, description, category, display_order) VALUES
  ('scratch-jr', 'Scratch Junior', 'Visual coding for early learners', 'Block Coding', 1),
  ('scratch', 'Scratch', 'Drag-and-drop block programming', 'Block Coding', 2),
  ('html', 'HTML', 'Build webpages with live preview', 'Web', 3),
  ('python', 'Python', 'Modern general-purpose programming', 'Programming', 4),
  ('java', 'Java', 'Object-oriented programming', 'Programming', 5),
  ('mysql', 'MySQL', 'Query and design databases', 'Database', 6),
  ('paint', 'Paint', 'Digital drawing & canvas', 'Creative', 7),
  ('editor', 'Word Editor', 'Word-processor practice', 'Productivity', 8),
  ('spreadsheet', 'Spreadsheet', 'Tables, formulas, charts', 'Productivity', 9),
  ('presentation', 'Presentation', 'Build slide decks', 'Productivity', 10);

-- Student progress (lightweight tracking)
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technology_slug TEXT NOT NULL,
  lessons_completed INT NOT NULL DEFAULT 0,
  total_lessons INT NOT NULL DEFAULT 10,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, technology_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_progress TO authenticated;
GRANT ALL ON public.student_progress TO service_role;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student manages own progress" ON public.student_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin views all progress" ON public.student_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Saved code snippets
CREATE TABLE public.code_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technology_slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.code_snippets TO authenticated;
GRANT ALL ON public.code_snippets TO service_role;
ALTER TABLE public.code_snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages snippets" ON public.code_snippets FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed admin + portal manager
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  manager_id UUID := gen_random_uuid();
BEGIN
  -- Admin
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'admin@avartan.app', crypt('admin123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"admin","full_name":"System Admin"}'::jsonb,
    false, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_id,
    format('{"sub":"%s","email":"admin@avartan.app"}', admin_id)::jsonb,
    'email', admin_id::text, now(), now(), now());
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin');

  -- Portal manager
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', manager_id, 'authenticated', 'authenticated',
    'manager@avartan.app', crypt('manager123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"manager","full_name":"Portal Manager"}'::jsonb,
    false, '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), manager_id,
    format('{"sub":"%s","email":"manager@avartan.app"}', manager_id)::jsonb,
    'email', manager_id::text, now(), now(), now());
  INSERT INTO public.user_roles (user_id, role) VALUES (manager_id, 'portal_manager');
END $$;
