// Fetch trending topics from last 7 days using Lovable AI with Google Search grounding
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkContentBot/1.0)" },
    });
    if (headRes.ok || (headRes.status >= 300 && headRes.status < 400)) return true;
    if (headRes.status === 405 || headRes.status === 403) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkContentBot/1.0)" },
      });
      return getRes.ok;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { region } = await req.json();
    if (region !== "indian" && region !== "international") {
      return new Response(JSON.stringify({ error: "region must be 'indian' or 'international'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const regionLabel = region === "indian" ? "India" : "international (global, US/EU/UK focus)";
    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a trend research assistant for a LinkedIn content creator who works in email marketing, deliverability, and martech, but wants to "ride waves" of viral conversations to grow reach.

Today is ${today}. Find the TOP 8 most talked-about / highest-engagement topics from the LAST 7 DAYS in ${regionLabel}, mixing:
- Marketing, martech, AdTech, email/CRM, AI-in-marketing news (around 50%)
- General viral / trending conversations on LinkedIn and major news (business, tech, culture, startup drama, big tech moves) (around 50%)

Avoid: hard politics, religion, communal issues, tragedies, anything brand-risky.

For each topic, return:
- title: short punchy headline (max 90 chars)
- summary: 2-3 sentences explaining what it is and WHY it's blowing up
- angle: one sentence suggesting how a martech/marketing creator could ride this wave
- source_url: a real article or LinkedIn post URL (must be a working link)
- source_name: publication / outlet name
- category: one of "marketing", "martech", "tech", "business", "ai", "culture", "startup"
- heat: "🔥🔥🔥" (massive), "🔥🔥" (strong), or "🔥" (rising)

Use real, current information from web search. Do NOT fabricate URLs.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Give me the top 8 trending topics from the last 7 days in ${regionLabel}. Return ONLY raw JSON (no markdown, no code fences) in this exact shape:
{"topics":[{"title":"","summary":"","angle":"","source_url":"","source_name":"","category":"","heat":""}]}

CRITICAL: source_url must be a REAL article URL you actually saw in search results. Do NOT guess, do NOT construct URLs from patterns, do NOT invent slugs. If you can't recall an exact URL, use the publication's homepage (e.g. https://techcrunch.com) instead of fabricating a path.`,
          },
        ],
        tools: [{ type: "google_search_retrieval" }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content || "";

    // Extract JSON from possibly-fenced content
    let parsed: { topics?: any[] } = {};
    try {
      const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = fenced ? fenced[1].trim() : content.trim();
      // Find first { ... last }
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      parsed = JSON.parse(start >= 0 && end > start ? jsonStr.slice(start, end + 1) : jsonStr);
    } catch (err) {
      console.error("Failed to parse trending topics JSON:", err, "raw:", content.slice(0, 500));
    }

    const rawTopics: any[] = Array.isArray(parsed?.topics) ? parsed.topics : [];

    // Validate URLs in parallel (HEAD with GET fallback) and drop / homepage-fallback broken ones
    const validated = await Promise.all(
      rawTopics.map(async (t) => {
        const url: string = t?.source_url || "";
        if (!url || !/^https?:\/\//i.test(url)) return { ...t, source_url: "" };
        const ok = await checkUrl(url);
        if (ok) return t;
        // Fall back to origin (homepage) so the user gets a working link
        try {
          const origin = new URL(url).origin;
          const originOk = await checkUrl(origin);
          return { ...t, source_url: originOk ? origin : "" };
        } catch {
          return { ...t, source_url: "" };
        }
      })
    );

    // Drop topics that ended up with no working URL at all
    const topics = validated.filter((t) => !!t.source_url);

    return new Response(JSON.stringify({ topics }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-trending-topics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
