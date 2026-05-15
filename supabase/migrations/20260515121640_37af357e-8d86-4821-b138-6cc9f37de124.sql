
-- audience_signals: who engages with what
CREATE TABLE public.audience_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engager_name TEXT NOT NULL,
  segment TEXT NOT NULL DEFAULT 'other',
  linkedin_post_id UUID REFERENCES public.linkedin_posts(id) ON DELETE CASCADE,
  engagement_count INTEGER NOT NULL DEFAULT 0,
  engagement_types JSONB NOT NULL DEFAULT '{"reactions":0,"comments":0,"reshares":0}'::jsonb,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audience_signals_post ON public.audience_signals(linkedin_post_id);
CREATE INDEX idx_audience_signals_segment ON public.audience_signals(segment);
ALTER TABLE public.audience_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to audience_signals" ON public.audience_signals FOR ALL USING (true) WITH CHECK (true);

-- trending_topics: external signal of what's hot
CREATE TABLE public.trending_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  volume_score NUMERIC NOT NULL DEFAULT 0,
  growth_rate NUMERIC NOT NULL DEFAULT 0,
  relevance_to_user NUMERIC NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trending_topics_expires ON public.trending_topics(expires_at);
CREATE INDEX idx_trending_topics_relevance ON public.trending_topics(relevance_to_user DESC);
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to trending_topics" ON public.trending_topics FOR ALL USING (true) WITH CHECK (true);

-- nudges: every proactive ping considered
CREATE TABLE public.nudges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nudge_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  opportunity_score NUMERIC,
  confidence_score NUMERIC,
  novelty_score NUMERIC,
  composite_score NUMERIC,
  threshold_at_send NUMERIC,
  was_sent BOOLEAN NOT NULL DEFAULT false,
  was_opened BOOLEAN NOT NULL DEFAULT false,
  was_acted_on BOOLEAN NOT NULL DEFAULT false,
  acted_on_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT
);
CREATE INDEX idx_nudges_created ON public.nudges(created_at DESC);
CREATE INDEX idx_nudges_type ON public.nudges(nudge_type);
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nudges" ON public.nudges FOR ALL USING (true) WITH CHECK (true);

-- ella_state: singleton memory
CREATE TABLE public.ella_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  last_briefing_sent_at TIMESTAMPTZ,
  last_nudge_sent_at TIMESTAMPTZ,
  current_user_goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  learned_thresholds JSONB NOT NULL DEFAULT '{"nudge_floor":0.65}'::jsonb,
  silenced_until TIMESTAMPTZ,
  tone_preference TEXT NOT NULL DEFAULT 'direct',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ella_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to ella_state" ON public.ella_state FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.ella_state (id) VALUES (gen_random_uuid());

-- cadence_log: derived view from linkedin_posts
CREATE OR REPLACE VIEW public.cadence_log AS
WITH daily AS (
  SELECT
    date_posted::date AS date,
    COUNT(*)::int AS posts_count
  FROM public.linkedin_posts
  WHERE date_posted IS NOT NULL
  GROUP BY date_posted::date
),
ordered AS (
  SELECT
    date,
    posts_count,
    LAG(date) OVER (ORDER BY date) AS prev_date
  FROM daily
)
SELECT
  date,
  posts_count,
  COALESCE((date - prev_date)::int, 0) AS days_since_last_post,
  AVG(posts_count) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7d_avg,
  AVG(posts_count) OVER (ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) AS rolling_30d_avg
FROM ordered
ORDER BY date DESC;
