
DROP POLICY IF EXISTS "tasks readable by authenticated" ON public.tasks;
CREATE POLICY "tasks readable by everyone" ON public.tasks
  FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.tasks TO anon;
