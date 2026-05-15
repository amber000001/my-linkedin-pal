# Ella — Proactive LinkedIn Content Agent

> Builds on the Closed-Loop Engagement Learning system (Phases 1 & 2 already shipped).
> Full PRD captured below. Implementation is sequenced into 4 phases — ship each end-to-end before starting the next.

---

## Vision

Ella is an autonomous content strategist who knows your LinkedIn presence better than you do. She analyzes what you've posted, how it performed, what your audience responds to, what's happening in your niche, and proactively tells you what to post and when — sometimes as a weekly strategic review, sometimes as a real-time opportunity alert. She doesn't post for you. She makes sure you never miss the post you should have written.

Split relationship:
- **Strategist** when you ask her (analyzes, recommends, you decide)
- **Co-pilot** when she initiates (surfaces opportunities, drafts, you approve)

## Goals

1. Continuous analytics layer scoring every dimension (topic, day, time, hook, length, audience segment, cadence).
2. Recommendation engine fusing historical data with current signals into ranked "what to post now" opportunities.
3. Proactivity engine that decides when an opportunity is worth interrupting you for.
4. Five analytics boards for self-serve understanding.
5. ≥40% act-rate on Ella's suggestions by day 90.

## Non-Goals (v1)

Auto-posting · Comment/DM management · Network growth tactics · Multi-account · LinkedIn API auto-pull (manual + optional extension only).

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  PROACTIVITY ENGINE                                 │
│  Decides when to interrupt + which nudge to send    │
├─────────────────────────────────────────────────────┤
│  RECOMMENDATION ENGINE                              │
│  Scores candidate "post now" opportunities          │
├─────────────────────────────────────────────────────┤
│  ANALYTICS LAYER (5 boards + queries)               │
├─────────────────────────────────────────────────────┤
│  DATA LAYER                                         │
│  linkedin_posts + generated_posts + outcomes        │
│  + new: trends, audience, nudges, signals, ella     │
└─────────────────────────────────────────────────────┘
```

---

## Data Layer — New Tables

- **`audience_signals`** — `(linkedin_post_id, segment, engagement_count, engagement_types jsonb, measured_at)`. Segments: founder | engineer | pm | designer | recruiter | other. v1 derived from manual onboarding tagging of top 30-50 engagers.
- **`trending_topics`** — `(topic, source, volume_score, growth_rate, relevance_to_user, expires_at)`. Sources: linkedin_search | news_api | perplexity | manual.
- **`nudges`** — every proactive ping considered, sent or not. Fields: `nudge_type`, `payload`, `opportunity_score`, `confidence_score`, `novelty_score`, `composite_score`, `threshold_at_send`, `was_sent`, `was_opened`, `was_acted_on`, `dismissed_at`, `dismissal_reason`. Critical for learning.
- **`cadence_log`** — derived view, refreshed daily. `(date, posts_count, days_since_last_post, rolling_7d_avg, rolling_30d_avg)`.
- **`ella_state`** — single-row. `last_briefing_sent_at`, `last_nudge_sent_at`, `current_user_goals jsonb`, `learned_thresholds jsonb`, `silenced_until`, `tone_preference`.

---

## The Five Analytics Boards

### 1. Performance Heatmap
**Q:** When and about what does my audience engage?
7×4 grid (DOW × time bucket: 6-11/11-14/14-18/18-23). Cells colored by avg engagement rate. Suppress cells with n<3.
> "Tue 9-11am product posts: 4.2% (3.1x baseline, n=8). Fri afternoon: 0.9% (n=12, your worst slot)."

### 2. Topic ROI Matrix
**Q:** Which topics deserve more time, which to drop?
Scatter plot: freq × engagement rate, dot-size = impressions. Quadrants: **Cash Cows** / **Hidden Gems** / **Treadmills** / **Dead Weight**.
> "Hidden Gem: 'founder mental health' — 3 posts in 14mo, 6.2% avg (your top). Why so rare?"

### 3. Hook Pattern Leaderboard
**Q:** Which hooks work for me right now?
Horizontal bars per pattern × time window (lifetime / 30d / 90d) — reveals drift. Requires closed-loop hook tagging + 10+ outcomes.
> "Contrarian dropped 4.8% → 2.1% in last 8 posts. Audience adapted or takes softened?"

### 4. Audience Resonance Map
**Q:** Who engages with what?
Stacked bars: topic × audience segment. Requires audience onboarding.
> "Hiring posts: 78% of comments from founders. Tech debt: 65% from engineers."

### 5. Content Gap Radar
**Q:** What's getting engagement in my niche I haven't touched?
Two columns: trending topics (relevance > 0.6) | your last post on each.
> "'AI agent failures' trending +210% this week. Never posted. Related topics hit 1.5x."

### Bonus (Phase 3+)
- **6. Cadence Pulse** — frequency vs per-post engagement (find the inverted-U).
- **7. Engagement Decay Curves** — how long posts keep earning.
- **8. Peer Benchmarking** — 5-10 creators, opt-in via extension.

---

## Recommendation Engine

Output:
```json
{
  "topic": "AI agent failures",
  "rationale": "Trending +210%, you haven't posted on it, related topics hit 1.5x.",
  "suggested_hook_pattern": "contrarian",
  "suggested_time": "Tomorrow 9-11am (your strongest slot for tech topics)",
  "confidence": 0.78,
  "predicted_lift": "1.4x to 2.1x baseline",
  "draft_available": true,
  "data_basis": ["trend_signal", "topic_roi", "heatmap", "pattern_track_record"]
}
```

**Scoring (v1, hand-tuned):**
```
recommendation_score =
    topic_fit       × 0.30
  + timing_fit      × 0.25
  + novelty         × 0.20
  + pattern_match   × 0.15
  + cadence_health  × 0.10
```
Re-tune from nudge outcomes after 30+ sent.

---

## Proactivity Engine — 3 Channels

| Channel | Trigger | Threshold | Cap |
|---|---|---|---|
| **1. Weekly Briefing** | Mon 8am scheduled | none | 1/wk |
| **2. Real-Time Opportunity** | event-driven | composite ≥ 0.65 (auto-tunes) | 1/24h, 3/wk |
| **3. Ambient (in-app only)** | open the app | rec_score > 0.5 | unlimited, no push |

**Composite nudge score:** `opportunity × 0.50 + confidence × 0.30 + novelty × 0.20`

**Auto-tuning:** dismissal >60% → +0.05; <20% w/ acts → -0.05. Floor 0.5, ceiling 0.85.

**Silence states:** Quiet Week (7d, briefing on) · Heads Down (30d, all off) · Only Big Stuff (threshold pinned 0.8).

### Nudge Taxonomy
1. **Opportunity Ping** — entering top heatmap slot + relevant topic + nothing scheduled.
2. **Wave Alert** — trend growth >150% + relevance >0.7 + no recent post on topic.
3. **Cadence Warning** — days_since_last > learned drop-off threshold.
4. **Pattern Shift** — winning pattern's last 5 posts trend 25%+ below lifetime avg.
5. **Weekly Briefing** — Mon 8am digest.
6. **Gap Radar** — Hidden Gem topic untouched >60d.

---

## Voice & Tone

Confident but not bossy · Data-grounded (cite numbers) · Direct, not cute (no "Hey there ✨") · Concise (2-4 sentences for nudges) · Honest about uncertainty · Sparing with praise.

> Test by reading nudges aloud — should sound like a smart friend texting, not a SaaS notification.

---

## Data Access Reality Check

| Capability | v1 path |
|---|---|
| Your post metrics | Manual entry (already shipped) |
| Audience demographics | Manual onboarding tagging |
| Trending topics in niche | News APIs + Perplexity + manual |
| Peer benchmarking | Manual or browser extension (Phase 4) |
| Best time to post | Inferred from engagement timestamps |

Browser extension in Phase 4 unblocks ~60% of wishlist; without it, Ella still works leaning on own metrics + external trend signals.

---

## Build Sequence (8-10 weeks)

### Phase 1 — Foundation (Weeks 1-2)
- Schema: `audience_signals`, `trending_topics`, `nudges`, `ella_state`, `cadence_log` view
- **Board 1** (Heatmap), **Board 2** (Topic ROI) — both use existing data
- Audience onboarding flow (tag top 30-50 engagers)
- "Ask Ella what to post" entry point — pull only, no proactivity

### Phase 2 — Recommendation Engine + First Nudges (Weeks 3-5)
- Recommendation scoring function
- **Board 3** (Hook Pattern Leaderboard) — needs closed-loop data
- **Board 5** (Gap Radar) — needs trends source
- Perplexity / news API for trending topics
- **Channel 3 only** (Ambient in-app) — learn rec quality before pinging

### Phase 3 — Proactivity (Weeks 6-7)
- Composite scoring + proactivity engine
- **Channel 1** (Weekly Briefing) first — high value, low annoyance
- **Channel 2** (Real-time) at conservative 0.75 floor
- Nudge outcome tracking + dismissal reasons
- Silence states UI

### Phase 4 — Depth (Weeks 8-10)
- **Board 4** (Audience Resonance) once tagging has data
- **Boards 6-8** (Cadence Pulse, Decay, Peer)
- Auto-tuning gated on 30+ nudges
- Optional browser extension v1
- Voice refinement after 6 weeks of real nudges

---

## Open Questions

1. Briefing channel: email vs in-app? Default → **email Monday AM**, in-app for everything else.
2. Dismissal taxonomy: bad timing | wrong topic | already planning | low confidence | other.
3. Conversational memory: yes — `ella_state.current_user_goals`, 90d weighting.
4. Auto-tuning aggression: thresholds only at first; weights only after 50+ nudge outcomes.
5. Hard-truth nudges (pattern shift, cadence warnings) need extra design care to avoid feeling like nagging.

## Risks

- **Annoyance overflow** — auto-tuning must work; start conservative.
- **Cold start** — needs ~30 posts w/ outcomes. Set expectation: "First 30 days I'm in observation mode."
- **Recency overfit** — weight by lifetime, 90d decay not 7d.
- **Trend data quality** — bad trends → bad Wave Alerts. Trigger only on high-confidence.
- **Extension scope creep** — keep narrow: own metrics + optional peer metrics, nothing else.

---

## Phase 1 — Concrete Plan (next ship)

Two practical principles: (1) ship Phase 1 end-to-end before Phase 2, (2) build briefing before real-time pings.

**Migration**
- Tables: `audience_signals`, `trending_topics`, `nudges`, `ella_state` (singleton), `cadence_log` materialized view (or refreshable view).
- RLS: `Allow all` to match existing posture.
- Indexes: `nudges(created_at desc)`, `trending_topics(expires_at)`, `audience_signals(linkedin_post_id, segment)`.
- Seed `ella_state` with one row at migration time.

**UI**
- New `/ella` route with two tabs: **Insights** (boards) and **Ask Ella** (pull-mode chat-style entry).
- Board 1 — Heatmap component (recharts/custom grid). Topic filter dropdown.
- Board 2 — Topic ROI scatter (recharts). Quadrant overlay + median lines.
- Audience onboarding modal — paste names, tag segments, save to `audience_signals` as zero-engagement seed rows the user can re-tag later.
- "Ask Ella" — single-shot edge function call returning top-3 recommendations using current data only (no trends yet).

**Edge function: `ella-recommend`**
- Pulls heatmap + topic ROI + cadence signal from existing tables.
- Returns ranked recommendations with rationale + data_basis. No trend signal yet (Phase 2).
- Uses Lovable AI Gateway (`google/gemini-2.5-flash`) only for the rationale phrasing — scoring stays deterministic.

**Out of Phase 1**
- Boards 3, 4, 5 · Trending topic ingestion · Any nudges (proactivity engine) · Browser extension · Auto-tuning.

Approve and I'll run the migration + scaffold the `/ella` route + boards 1-2 + audience onboarding + `ella-recommend`. Once that's live and you've kicked the tires, we move to Phase 2.
