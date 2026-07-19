
DROP POLICY IF EXISTS "public write milestones" ON public.milestones;
DROP POLICY IF EXISTS "public write topics" ON public.topics;

REVOKE INSERT, UPDATE, DELETE ON public.milestones FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.topics FROM anon;

CREATE POLICY "authenticated insert milestones" ON public.milestones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated update milestones" ON public.milestones
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated delete milestones" ON public.milestones
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated insert topics" ON public.topics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated update topics" ON public.topics
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated delete topics" ON public.topics
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
