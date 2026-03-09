ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to linkedin_posts" ON public.linkedin_posts
  FOR ALL USING (true) WITH CHECK (true);