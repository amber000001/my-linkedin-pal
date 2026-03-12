
ALTER TABLE public.linkedin_posts 
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'thought_leadership',
  ADD COLUMN IF NOT EXISTS uses_emojis boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS structure jsonb DEFAULT NULL;
