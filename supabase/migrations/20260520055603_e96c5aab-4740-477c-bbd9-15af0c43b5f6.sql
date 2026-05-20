ALTER TABLE public.linkedin_posts
  ADD COLUMN IF NOT EXISTS posted_at timestamp with time zone;

-- Backfill existing rows from date_posted at 09:00 UTC so they don't disappear from the heatmap
UPDATE public.linkedin_posts
SET posted_at = (date_posted::timestamp + interval '9 hours') AT TIME ZONE 'UTC'
WHERE posted_at IS NULL AND date_posted IS NOT NULL;