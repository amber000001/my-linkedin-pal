
CREATE TABLE public.generated_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  mode text NOT NULL,
  topic text,
  free_text text,
  source_url text,
  final_post text NOT NULL,
  hook_pattern text,
  hook_text text,
  hook_rationale text,
  alternate_hooks jsonb NOT NULL DEFAULT '[]'::jsonb,
  predicted_engagement_driver text,
  scroll_anchor_line text,
  has_meme boolean NOT NULL DEFAULT false,
  uses_emojis boolean NOT NULL DEFAULT false,
  emoji_count int NOT NULL DEFAULT 0,
  emojis_used text[] NOT NULL DEFAULT '{}',
  word_count int NOT NULL DEFAULT 0,
  paragraph_count int NOT NULL DEFAULT 0,
  has_list boolean NOT NULL DEFAULT false,
  has_question_closer boolean NOT NULL DEFAULT false,
  predicted_score numeric,
  baseline_reaction_rate numeric,
  baseline_comment_rate numeric,
  influenced_by_post_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  posted_at timestamptz,
  linkedin_post_id uuid REFERENCES public.linkedin_posts(id) ON DELETE SET NULL,
  edit_distance int,
  edit_reason text,
  user_satisfaction text,
  specificity_nudge_used boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_generated_posts_status_created ON public.generated_posts(status, created_at DESC);
CREATE INDEX idx_generated_posts_hook_pattern ON public.generated_posts(hook_pattern);
CREATE INDEX idx_generated_posts_mode ON public.generated_posts(mode);

ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to generated_posts"
ON public.generated_posts FOR ALL
USING (true) WITH CHECK (true);

CREATE TABLE public.generated_post_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_post_id uuid NOT NULL REFERENCES public.generated_posts(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  hours_since_posting int NOT NULL,
  impressions int NOT NULL DEFAULT 0,
  reactions int NOT NULL DEFAULT 0,
  comments int NOT NULL DEFAULT 0,
  reshares int NOT NULL DEFAULT 0,
  reaction_rate numeric GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN reactions::numeric / impressions ELSE 0 END
  ) STORED,
  comment_rate numeric GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN comments::numeric / impressions ELSE 0 END
  ) STORED,
  beat_baseline_reactions boolean,
  beat_baseline_comments boolean,
  lift_vs_baseline numeric
);

CREATE INDEX idx_outcomes_post_window ON public.generated_post_outcomes(generated_post_id, hours_since_posting);

ALTER TABLE public.generated_post_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to generated_post_outcomes"
ON public.generated_post_outcomes FOR ALL
USING (true) WITH CHECK (true);
