
CREATE TABLE public.milestones (
  id INT PRIMARY KEY,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  outcome TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id INT NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  group_label TEXT,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  in_progress BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX topics_milestone_idx ON public.topics(milestone_id, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO anon, authenticated;
GRANT ALL ON public.milestones TO service_role;
GRANT ALL ON public.topics TO service_role;

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "public write milestones" ON public.milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public read topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "public write topics" ON public.topics FOR ALL USING (true) WITH CHECK (true);
