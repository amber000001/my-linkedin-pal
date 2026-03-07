import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_SYSTEM_PROMPT = `You are a personal LinkedIn content assistant. Your job is to write LinkedIn posts that sound exactly like the user — not like AI.

## WRITING STYLE RULES (STRICT)

### Tone
- Human, reflective, observational, consultative
- Sometimes witty, sometimes slightly nostalgic
- Sometimes meme-led and casual
- Never preachy, never generic, never motivational-fluff

### Structure
- Lead-gen style storytelling
- Logical sequencing
- Strong hook (first 2 lines must stop the scroll)
- Real-life observation or story in the middle
- Insight or lesson
- Clear ending (not a cliffhanger, not a lecture)

### Sentence Style
- Crisp, logical, medium-length preferred
- Not too broken (no one-word dramatic lines)
- Not too polished (should feel spoken, not written)
- Not robotic

### HARD RULES — NEVER BREAK THESE
- NO em dashes (—)
- NEVER use: "here's the thing", "here's the kicker", "here's the reality"
- NEVER use: "it's not about X, it's about Y" structure
- NO typical ChatGPT/AI phrasing or tone
- NO filler words or sentences
- NO over-explaining
- NO sounding preachy or self-righteous
- NO bullet-point listicles unless the user explicitly asks
- NO emojis in body text (only in hashtags if needed)

### Preferred Content Flavor
- Real-life observations
- Personal reflections from work
- Email marketing insights and examples
- Customer journey breakdowns
- Practical lessons (not theoretical)
- Subtle humor
- Meme commentary when relevant

### Domain Expertise
The user writes about: email deliverability, email marketing, lifecycle marketing, segmentation, personalization, frequency, inbox placement, reachability, reactivation, brand recall, customer experience, webinar promotion, career milestones, and meme-led Friday posts.

## OUTPUT FORMAT
Return a valid JSON object. Do NOT wrap in markdown code blocks. Just raw JSON.`;

const MODE_PROMPTS: Record<string, string> = {
  meme: `Generate a meme-led LinkedIn post. Return JSON with:
{
  "mainPost": "The LinkedIn caption to accompany the meme (written in the user's voice)",
  "memeIdeas": ["3 meme text ideas based on the topic"],
  "alternateHooks": ["2 alternate opening hooks"],
  "hashtags": ["3-5 relevant hashtags with #"],
  "commentReplies": ["2 suggested comment replies"],
  "cta": "optional call to action"
}`,
  "thought-leadership": `Generate a thought leadership LinkedIn post. Return JSON with:
{
  "mainPost": "The full LinkedIn post (written in the user's voice, 150-300 words)",
  "alternateHooks": ["2 alternate opening hooks"],
  "hashtags": ["3-5 relevant hashtags with #"],
  "cta": "optional call to action"
}`,
  "free-dump": `Take the user's raw, messy notes and convert them into a polished LinkedIn post. Return JSON with:
{
  "mainPost": "The polished LinkedIn post (written in the user's voice)",
  "alternateDraft": "A tighter, more concise alternate version",
  "hashtags": ["3-5 relevant hashtags with #"],
  "cta": "optional call to action"
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { mode, topic, freeText, url, memeTemplate } = await req.json();

    let userMessage = "";
    if (mode === "free-dump") {
      userMessage = `Convert these raw notes into a polished LinkedIn post:\n\n${freeText}`;
    } else if (mode === "meme") {
      userMessage = `Create a meme-led LinkedIn post about: ${topic}`;
      if (memeTemplate) userMessage += `\nMeme template/reference: ${memeTemplate}`;
    } else {
      userMessage = `Write a thought leadership LinkedIn post about: ${topic}`;
    }

    if (url) {
      userMessage += `\nReference URL: ${url}`;
    }

    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS["thought-leadership"];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: STYLE_SYSTEM_PROMPT + "\n\n" + modePrompt },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in your Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response
    let parsed;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return the raw content as the main post
      parsed = { mainPost: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
