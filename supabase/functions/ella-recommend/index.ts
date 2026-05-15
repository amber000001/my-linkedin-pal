import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface LinkedinPost {
  id: string;
  topic: string;
  date_posted: string | null;
  reaction_rate: number | null;
  comment_rate: number | null;
  reactions: number | null;
  comments: number | null;
  impressions: number | null;
}

interface Recommendation {
  topic: string;
  rationale: string;
  suggested_hook_pattern: string;
  suggested_time: string;
  confidence: number;
  predicted_lift: string;
  data_basis: string[];
  scores: {
    topic_fit: number;
    timing_fit: number;
    novelty: number;
    pattern_match: number;
    cadence_health: number;
    composite: number;
  };
}

const TIME_BUCKETS = [
  { label: "Morning (6–11)", start: 6, end: 11 },
  { label: "Midday (11–14)", start: 11, end: 14 },
  { label: "Afternoon (14–18)", start: 14, end: 18 },
  { label: "Evening (18–23)", start: 18, end: 23 },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: posts } = await supabase
      .from("linkedin_posts")
      .select("id, topic, date_posted, reaction_rate, comment_rate, reactions, comments, impressions")
      .order("date_posted", { ascending: false })
      .limit(500);

    const allPosts = (posts || []) as LinkedinPost[];
    const dated = allPosts.filter((p) => p.date_posted);
    const baselineRate = avg(allPosts.map((p) => p.reaction_rate || 0).filter(Boolean));

    // Topic ROI
    const byTopic = new Map<string, LinkedinPost[]>();
    for (const p of allPosts) {
      if (!p.topic) continue;
      const arr = byTopic.get(p.topic) || [];
      arr.push(p);
      byTopic.set(p.topic, arr);
    }
    const topicStats = Array.from(byTopic.entries()).map(([topic, list]) => ({
      topic,
      count: list.length,
      avgReaction: avg(list.map((p) => p.reaction_rate || 0)),
      avgComment: avg(list.map((p) => p.comment_rate || 0)),
      lastPosted: list
        .map((p) => (p.date_posted ? new Date(p.date_posted).getTime() : 0))
        .sort((a, b) => b - a)[0],
    }));
    const medFreq = median(topicStats.map((t) => t.count));
    const medRate = median(topicStats.map((t) => t.avgReaction));

    // Heatmap → best slot for now/tomorrow
    const slotMap = new Map<string, { rates: number[]; n: number }>();
    for (const p of dated) {
      const d = new Date(p.date_posted!);
      const dow = d.getUTCDay();
      const hour = d.getUTCHours();
      const bucket = TIME_BUCKETS.find((b) => hour >= b.start && hour < b.end);
      if (!bucket) continue;
      const key = `${dow}-${bucket.label}`;
      const entry = slotMap.get(key) || { rates: [], n: 0 };
      entry.rates.push(p.reaction_rate || 0);
      entry.n += 1;
      slotMap.set(key, entry);
    }
    const slotScores = Array.from(slotMap.entries())
      .filter(([, v]) => v.n >= 2)
      .map(([key, v]) => {
        const [dow, ...rest] = key.split("-");
        return { dow: parseInt(dow), bucket: rest.join("-"), rate: avg(v.rates), n: v.n };
      })
      .sort((a, b) => b.rate - a.rate);

    // Cadence
    const lastPostDate = dated[0]?.date_posted ? new Date(dated[0].date_posted) : null;
    const daysSinceLast = lastPostDate
      ? Math.floor((Date.now() - lastPostDate.getTime()) / 86_400_000)
      : 999;

    // Score each topic as a candidate
    const candidates: Recommendation[] = topicStats
      .filter((t) => t.count >= 1)
      .map((t) => {
        const isHighRate = t.avgReaction >= medRate;
        const isLowFreq = t.count <= medFreq;
        const isHiddenGem = isHighRate && isLowFreq;
        const isCashCow = isHighRate && !isLowFreq;
        const isTreadmill = !isHighRate && !isLowFreq;

        const topic_fit = Math.min(1, (t.avgReaction / Math.max(baselineRate || 0.01, 0.01)) * 0.5);
        const daysSinceTopic = t.lastPosted
          ? (Date.now() - t.lastPosted) / 86_400_000
          : 365;
        const novelty = Math.min(1, daysSinceTopic / 60);
        const cadence_health =
          daysSinceLast >= 5 ? 1 : daysSinceLast >= 3 ? 0.6 : 0.3;
        const top = slotScores[0];
        const timing_fit = top ? Math.min(1, top.rate / Math.max(baselineRate || 0.01, 0.01) * 0.4) : 0.3;
        const pattern_match = isCashCow ? 0.8 : isHiddenGem ? 0.7 : isTreadmill ? 0.3 : 0.5;

        const composite =
          topic_fit * 0.3 +
          timing_fit * 0.25 +
          novelty * 0.2 +
          pattern_match * 0.15 +
          cadence_health * 0.1;

        const data_basis: string[] = ["topic_roi", "cadence"];
        if (top) data_basis.push("heatmap");

        const quadrant = isHiddenGem
          ? "Hidden Gem"
          : isCashCow
            ? "Cash Cow"
            : isTreadmill
              ? "Treadmill"
              : "Dead Weight";

        const slotLabel = top
          ? `${DAY_NAMES[top.dow]} ${top.bucket} (avg ${(top.rate * 100).toFixed(1)}% rxn, n=${top.n})`
          : "Tuesday morning (default — not enough timing data yet)";

        const lift = baselineRate > 0 ? (t.avgReaction / baselineRate).toFixed(1) : "1.0";
        const rationale = `${quadrant}. ${t.count} post${t.count === 1 ? "" : "s"} averaging ${(t.avgReaction * 100).toFixed(1)}% reaction rate (${lift}x your baseline). ${
          daysSinceTopic > 60
            ? `Last touched ${Math.round(daysSinceTopic)} days ago.`
            : `Posted ${Math.round(daysSinceTopic)} days ago.`
        }`;

        return {
          topic: t.topic,
          rationale,
          suggested_hook_pattern: isHiddenGem ? "specific_number" : isCashCow ? "observation" : "contrarian",
          suggested_time: slotLabel,
          confidence: Math.min(0.95, 0.4 + t.count * 0.05),
          predicted_lift: `${lift}x baseline`,
          data_basis,
          scores: {
            topic_fit: +topic_fit.toFixed(2),
            timing_fit: +timing_fit.toFixed(2),
            novelty: +novelty.toFixed(2),
            pattern_match: +pattern_match.toFixed(2),
            cadence_health: +cadence_health.toFixed(2),
            composite: +composite.toFixed(2),
          },
        };
      })
      .sort((a, b) => b.scores.composite - a.scores.composite)
      .slice(0, 3);

    // Optional: AI rationale polish (single short call)
    let summary = "";
    if (candidates.length > 0 && LOVABLE_API_KEY) {
      try {
        const sysPrompt = `You are Ella, a LinkedIn content strategist. Speak direct, not cute. Cite numbers. 2 sentences max. No em dashes. No filler.`;
        const userPrompt = `Days since last post: ${daysSinceLast}. Top 3 candidates:\n${candidates
          .map(
            (c, i) =>
              `${i + 1}. ${c.topic} — composite ${c.scores.composite}, ${c.predicted_lift}, suggested slot ${c.suggested_time}`,
          )
          .join("\n")}\n\nWrite a 2-sentence opening for the user. State the strongest pick and why. No greetings.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          summary = j.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (e) {
        console.error("ella summary AI call failed", e);
      }
    }

    return new Response(
      JSON.stringify({
        summary,
        recommendations: candidates,
        meta: {
          posts_analyzed: allPosts.length,
          baseline_reaction_rate: baselineRate,
          days_since_last_post: daysSinceLast,
          best_slot: slotScores[0] || null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ella-recommend error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
