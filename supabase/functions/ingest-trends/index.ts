// Ingest trending AI/martech/email topics, score relevance against user's history, write to trending_topics.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build user vocabulary from past posts (topics + first 200 chars of text)
    const { data: posts } = await supabase
      .from("linkedin_posts")
      .select("topic, post_text, date_posted")
      .order("date_posted", { ascending: false })
      .limit(80);

    const userPosts = (posts || []) as Array<{ topic: string; post_text: string; date_posted: string | null }>;
    const vocab = new Map<string, number>();
    for (const p of userPosts) {
      const tokens = [...tokenize(p.topic || ""), ...tokenize((p.post_text || "").slice(0, 400))];
      for (const t of tokens) vocab.set(t, (vocab.get(t) || 0) + 1);
    }

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = `You are a trend scout for a creator who writes about email marketing, deliverability, martech, AI in marketing, and the future of customer communication. Today is ${today}. Find the 12 most discussed topics on LinkedIn / X / industry press in the LAST 7 DAYS that this creator could ride.

Mix:
- AI in marketing / CRM / email (high priority)
- Email deliverability, sender reputation, Gmail/Yahoo policy
- Martech product launches, funding, layoffs
- AI agents, models, viral demos relevant to a marketing audience
- Industry hot takes / drama worth a contrarian post

Return ONLY raw JSON (no fences):
{"trends":[{"topic":"short specific phrase, 4-8 words","summary":"one sentence what's happening","keywords":["3-6 lowercase keywords"],"growth_rate":0.0,"volume_score":0.0,"source":"linkedin|news|x|industry"}]}

growth_rate: 0.5 (rising) to 2.5 (going viral). volume_score: 0-1 normalized chatter level.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Give me the 12 trends now. JSON only." },
        ],
        tools: [{ type: "google_search_retrieval" }],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error", status: aiRes.status }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content || "";
    let parsed: { trends?: any[] } = {};
    try {
      const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = fenced ? fenced[1].trim() : content.trim();
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      parsed = JSON.parse(start >= 0 && end > start ? jsonStr.slice(start, end + 1) : jsonStr);
    } catch (err) {
      console.error("trend JSON parse failed", err, content.slice(0, 300));
    }

    const rawTrends: any[] = Array.isArray(parsed?.trends) ? parsed.trends : [];

    // Score relevance by keyword overlap with user vocab
    const scored = rawTrends.map((t) => {
      const kws: string[] = Array.isArray(t.keywords) ? t.keywords.map((k: string) => k.toLowerCase()) : [];
      const topicTokens = tokenize(t.topic || "");
      const allKws = [...new Set([...kws, ...topicTokens])];
      let hits = 0;
      let weighted = 0;
      for (const k of allKws) {
        const v = vocab.get(k) || 0;
        if (v > 0) {
          hits += 1;
          weighted += Math.min(v, 5);
        }
      }
      const relevance = allKws.length > 0
        ? Math.min(1, (hits / allKws.length) * 0.6 + (weighted / (allKws.length * 5)) * 0.4)
        : 0;
      return {
        topic: String(t.topic || "").slice(0, 240),
        source: String(t.source || "industry").slice(0, 40),
        volume_score: Math.max(0, Math.min(1, Number(t.volume_score) || 0.5)),
        growth_rate: Math.max(0, Math.min(5, Number(t.growth_rate) || 1)),
        relevance_to_user: +relevance.toFixed(3),
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        summary: String(t.summary || ""),
        keywords: kws,
      };
    }).filter((t) => t.topic.length > 4);

    // Wipe old + insert fresh
    await supabase.from("trending_topics").delete().lt("expires_at", new Date().toISOString());

    if (scored.length > 0) {
      const rows = scored.map((s) => ({
        topic: s.topic,
        source: s.source,
        volume_score: s.volume_score,
        growth_rate: s.growth_rate,
        relevance_to_user: s.relevance_to_user,
        expires_at: s.expires_at,
      }));
      const { error } = await supabase.from("trending_topics").insert(rows);
      if (error) console.error("insert error", error);
    }

    return new Response(
      JSON.stringify({ ingested: scored.length, trends: scored }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ingest-trends error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
