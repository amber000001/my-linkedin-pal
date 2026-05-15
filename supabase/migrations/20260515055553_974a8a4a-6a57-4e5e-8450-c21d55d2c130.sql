-- Phase 2: link client-side post_generations rows to the Phase 1 generated_posts rows
ALTER TABLE public.post_generations
  ADD COLUMN IF NOT EXISTS generated_post_id uuid;

CREATE INDEX IF NOT EXISTS idx_post_generations_generated_post_id
  ON public.post_generations(generated_post_id);

-- Helpful indexes for catch-up queries
CREATE INDEX IF NOT EXISTS idx_generated_posts_status_posted_at
  ON public.generated_posts(status, posted_at);

CREATE INDEX IF NOT EXISTS idx_outcomes_post_window
  ON public.generated_post_outcomes(generated_post_id, hours_since_posting);
