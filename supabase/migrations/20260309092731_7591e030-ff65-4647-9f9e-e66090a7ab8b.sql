CREATE TABLE public.post_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  topic text,
  post_type text NOT NULL DEFAULT 'thought-leadership',
  topic_dropdown_value text,
  input_text text,
  input_url text,
  meme_template text,
  generated_post text NOT NULL,
  alternate_hooks jsonb DEFAULT '[]'::jsonb,
  cta_options text,
  hashtags jsonb DEFAULT '[]'::jsonb,
  meme_caption text,
  alternate_draft text,
  comment_replies jsonb DEFAULT '[]'::jsonb,
  meme_ideas jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  is_favorite boolean NOT NULL DEFAULT false
);

ALTER TABLE public.post_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to post_generations" ON public.post_generations
  FOR ALL USING (true) WITH CHECK (true);