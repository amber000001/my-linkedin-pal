# Closed-Loop Engagement Learning — Phased Build

The PRD is ~4 weeks of work. Shipping it in one pass would be a giant unreviewable change and would block on the first migration. I propose to ship it in the same 4 phases the PRD lists, starting with Phase 1 now. Each phase is independently useful: even Phase 1 alone gives you tagged generations and a draft log you can query.

## Phase 1 — Foundation (this round)

**Database migration**

Two new tables, additive only — `linkedin_posts` and `post_generations` are untouched.

- `generated_posts` — one row per AI generation, immutable except for `status` lifecycle. All PRD §5.1 fields. `status` defaults to `draft`. `linkedin_post_id` nullable FK to `linkedin_posts`.
- `generated_post_outcomes` — append-only, one row per measurement window. `reaction_rate` / `comment_rate` as generated columns from `reactions/impressions` and `comments/impressions`.
- RLS: `Allow all` to match existing project posture (no auth in the app today).
- Index on `generated_posts(status, created_at)` for the discard sweep and analytics; index on `generated_post_outcomes(generated_post_id, hours_since_posting)`.

**Edge function: `generate-post`**

Extend the JSON schema returned by the model in **all** modes:

```json
{
  "post": "...",                    // existing mainPost
  "hook_pattern": "contrarian | specific_number | question | confession | observation | myth_callout",
  "hook_text": "<first 2 lines>",
  "hook_rationale": "<one sentence>",
  "alternateHooks": [
    { "pattern": "...", "text": "..." },
    { "pattern": "...", "text": "..." },
    { "pattern": "...", "text": "..." }
  ],
  "predicted_engagement_driver": "reactions | comments | reshares",
  "scroll_anchor_line": "..."
}
```

- The three `alternateHooks` must each use a different pattern from `hook_pattern` (enforced in the prompt + validated server-side; if violated, we keep what came back but log a warning — no regenerate in v1).
- Sanitization (em-dash + filler stripper) extended to walk the new fields too.
- After generation, write a `generated_posts` row with `status='draft'`, captured `predicted_score`, `baseline_reaction_rate`, `baseline_comment_rate`, `influenced_by_post_ids` (the top-3 context posts already computed by `buildPerformanceContext`), plus structural metrics (`word_count`, `paragraph_count`, `emoji_count`, `emojis_used`, `has_list`, `has_question_closer`).
- Return the new `generated_post_id` to the client so later phases can reference it.

**Backwards compatibility**

- All new JSON fields parsed with safe fallbacks — old generations still work.
- `PostOutput.tsx` continues rendering today's fields; no UI change yet. The new structured payload (alt hooks with patterns, scroll anchor) is captured silently in DB. Phase 4 surfaces it.

**Out of Phase 1 (deferred to later phases as in the PRD)**
- Phase 2: Mark-as-Posted modal + edit-distance + thumbs + manual metric entry + 24h/7d/30d reminders.
- Phase 3: `buildTrackRecordPrompt` (gated at ≥10 outcomes) + specificity nudge.
- Phase 4: Discard background job (cron) + analytics page + "Catch up on metrics" view.

## Open questions before I build Phase 1

I'll default these unless you push back:

1. **`predicted_score`** — store the same composite (reactions·0.4 + comments·0.4 + impressions·0.2 normalized) computed against the user's running average at generation time. Not a true prediction, just a snapshot of what the engine "expected" — gives Phase 4 something to compare against.
2. **`influenced_by_post_ids`** — the top-3 by composite score from `buildPerformanceContext`. Already computed; just need to surface the IDs.
3. **Hook-pattern enforcement** — soft for v1 (log + accept). Hard validation can come once you have signal on how often the model misbehaves.
4. **`hook_text` extraction** — take the first 2 non-empty lines of `post`. Cheap and matches the "above-the-fold" framing already in the playbook.

## Files touched in Phase 1

- new migration (two tables + indexes + RLS)
- `supabase/functions/generate-post/index.ts` — extend prompt schema, parse new fields, sanitize them, insert `generated_posts` row, return `generated_post_id`
- `src/lib/api.ts` — extend `GenerateResponse` with the new optional fields + `generatedPostId`

That's it for Phase 1. UI stays put. Approve and I'll run the migration and ship the edge-function changes; once it's live and you've kicked off a few generations to confirm rows are landing cleanly, I'll start Phase 2.
