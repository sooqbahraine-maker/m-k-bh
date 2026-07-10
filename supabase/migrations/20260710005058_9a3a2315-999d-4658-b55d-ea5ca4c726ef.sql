-- Restrict profile visibility to owner (or admin)
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- Re-issue tasks UPDATE policy with strict owner/admin scoping
DROP POLICY IF EXISTS "owner or admin updates task" ON public.tasks;
CREATE POLICY "owner or admin updates task"
ON public.tasks FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));