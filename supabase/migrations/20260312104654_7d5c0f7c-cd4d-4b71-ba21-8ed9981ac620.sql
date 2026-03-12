ALTER TABLE public.linkedin_posts
ADD COLUMN date_posted date,
ADD COLUMN impressions integer DEFAULT 0,
ADD COLUMN reactions integer DEFAULT 0,
ADD COLUMN comments integer DEFAULT 0,
ADD COLUMN has_meme boolean DEFAULT false,
ADD COLUMN reaction_rate numeric GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN ROUND((reactions::numeric / impressions) * 100, 2) ELSE 0 END) STORED,
ADD COLUMN comment_rate numeric GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN ROUND((comments::numeric / impressions) * 100, 2) ELSE 0 END) STORED;