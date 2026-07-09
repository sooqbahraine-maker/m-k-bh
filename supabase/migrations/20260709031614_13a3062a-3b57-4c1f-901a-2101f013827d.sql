
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS whatsapp text;

-- Fix profiles public exposure: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;
CREATE POLICY "profiles readable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Fix tasks UPDATE policy: only owner or admin can update
DROP POLICY IF EXISTS "owner updates task or admin or accepter" ON public.tasks;
CREATE POLICY "owner or admin updates task"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
