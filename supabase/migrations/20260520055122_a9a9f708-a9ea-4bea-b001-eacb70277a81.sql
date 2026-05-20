ALTER TABLE public.post_generations
  ADD COLUMN IF NOT EXISTS final_post text,
  ADD COLUMN IF NOT EXISTS edit_distance integer,
  ADD COLUMN IF NOT EXISTS edit_reason text,
  ADD COLUMN IF NOT EXISTS posted_at timestamp with time zone;