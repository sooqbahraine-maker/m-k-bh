
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.task_category AS ENUM ('delivery','teaching','transport','search','work','help','other');
CREATE TYPE public.task_status AS ENUM ('open','accepted','completed');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  IF NEW.email = 'al7anjri@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  category task_category NOT NULL DEFAULT 'other',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  status task_status NOT NULL DEFAULT 'open',
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tasks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks readable by all" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "auth users insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner updates task or admin or accepter" ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR auth.uid() IS NOT NULL);
CREATE POLICY "owner or admin deletes task" ON public.tasks FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Banners
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active banners readable" ON public.banners FOR SELECT USING (true);
CREATE POLICY "admin manages banners insert" ON public.banners FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages banners update" ON public.banners FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages banners delete" ON public.banners FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
