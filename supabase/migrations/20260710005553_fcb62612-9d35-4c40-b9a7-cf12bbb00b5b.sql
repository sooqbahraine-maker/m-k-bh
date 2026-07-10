
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- banners
DROP POLICY IF EXISTS "admin manages banners delete" ON public.banners;
DROP POLICY IF EXISTS "admin manages banners insert" ON public.banners;
DROP POLICY IF EXISTS "admin manages banners update" ON public.banners;
CREATE POLICY "admin manages banners delete" ON public.banners FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin manages banners insert" ON public.banners FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin manages banners update" ON public.banners FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- profiles
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- tasks
DROP POLICY IF EXISTS "owner or admin deletes task" ON public.tasks;
DROP POLICY IF EXISTS "owner or admin updates task" ON public.tasks;
DROP POLICY IF EXISTS "tasks readable by all" ON public.tasks;
CREATE POLICY "owner or admin deletes task" ON public.tasks FOR DELETE TO authenticated USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "owner or admin updates task" ON public.tasks FOR UPDATE TO authenticated USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "tasks readable by authenticated" ON public.tasks FOR SELECT TO authenticated USING (true);

-- storage.objects policies referencing public.has_role
DROP POLICY IF EXISTS "admin manage banners storage insert" ON storage.objects;
DROP POLICY IF EXISTS "admin manage banners storage delete" ON storage.objects;
DROP POLICY IF EXISTS "admin manage banners storage update" ON storage.objects;
CREATE POLICY "admin manage banners storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin manage banners storage delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admin manage banners storage update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'banners' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
REVOKE SELECT ON public.tasks FROM anon;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_title_len,
  DROP CONSTRAINT IF EXISTS tasks_details_len,
  DROP CONSTRAINT IF EXISTS tasks_location_len,
  DROP CONSTRAINT IF EXISTS tasks_whatsapp_len,
  DROP CONSTRAINT IF EXISTS tasks_price_range;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_title_len CHECK (char_length(title) BETWEEN 3 AND 120),
  ADD CONSTRAINT tasks_details_len CHECK (char_length(details) BETWEEN 1 AND 1000),
  ADD CONSTRAINT tasks_location_len CHECK (char_length(location) BETWEEN 1 AND 120),
  ADD CONSTRAINT tasks_whatsapp_len CHECK (whatsapp IS NULL OR char_length(whatsapp) BETWEEN 6 AND 20),
  ADD CONSTRAINT tasks_price_range CHECK (price >= 0 AND price <= 1000000);
