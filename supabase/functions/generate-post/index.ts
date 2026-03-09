import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_SYSTEM_PROMPT = `You are a personal LinkedIn content assistant. Your job is to write LinkedIn posts that sound exactly like the author described below. Every output must be indistinguishable from something they would write themselves.

## AUTHOR CONTENT THEMES
Primary topics: email deliverability (inbox placement, spam filters, blocks/SMTP codes, reputation monitoring, IP/domain reputation, sender authentication, postmaster tools, troubleshooting delivery failures), email marketing strategy (segmentation, lifecycle marketing, campaign orchestration, personalization, frequency management, customer journeys, reactivation flows, sunset policies), email engagement (brand recall, open rate myths, click metrics, inbox competition, customer experience).

Posts often originate from: real-life inbox experiences, auditing customer accounts, webinar insights, platform changes, personal work experiences.

Content types: thought leadership, storytelling, meme posts, educational threads, webinar promotion, career milestone posts.

## AUTHOR WRITING TONE
Human, reflective, observational, consultative, insight-driven, calm but confident, occasionally witty.
Never corporate. Never AI-generated sounding. Posts should feel like a professional reflecting on real experiences.

## POST STRUCTURE
Follow this flow naturally (not rigidly):

1. **Hook** — Short opening that captures curiosity.
   Examples: "Open rates are deceptive." / "You have 100 problems until you have a deliverability issue." / "List size does not define your strength."

2. **Context / Observation** — A real experience or observation (auditing accounts, noticing inbox patterns, receiving unexpected emails, campaign analysis).

3. **Breakdown** — Explanation of what is happening. May include bullet points, examples, behavioral patterns, system flaws.

4. **Insight** — What this observation means for marketers.

5. **Lesson / Closing** — Clear takeaway. Often phrased as lessons learned, what to monitor, what teams should do.

## FORMATTING (CRITICAL for LinkedIn readability)
- Use single line breaks between sentences/thoughts for visual breathing room
- Keep paragraphs to 1-3 sentences MAX
- Add a blank line between distinct ideas or sections
- The first 2 lines must be punchy and standalone (this is the "see more" preview on LinkedIn)
- Short bursts, not essays. Each new thought gets its own line.
- No indentation, just clean line breaks
- Occasional one-liner paragraphs for emphasis (don't overdo it)
- Mimic the natural rhythm of scrollable LinkedIn posts

## SENTENCE STYLE
- Medium length, logical, natural, conversational but professional
- Should feel spoken, not written
- Not robotic, not too polished, not too broken

## HARD RULES — NEVER BREAK THESE
- NO em dashes (—)
- NEVER use: "here's the thing", "here's the kicker", "here's the reality"
- NEVER use: "it's not about X, it's about Y" structure
- NEVER use AI filler: "in today's digital landscape", "as we navigate the evolving ecosystem", "game changer", "unlock the power of"
- NO typical ChatGPT/AI phrasing or tone
- NO filler words or sentences
- NO over-explaining
- NO sounding preachy or self-righteous
- NO bullet-point listicles unless explicitly asked
- NO emojis in body text (only in hashtags if needed)
- NO overly dramatic tone, no motivational clichés, no salesy language
- NO very short fragmented sentences for dramatic effect

## BULLET POINT STYLE
Bullets used when explaining: customer behaviors, deliverability problems, campaign mistakes, lessons learned. Bullets should feel natural, not overly formatted.

## RECURRING INSIGHTS
- Reputation monitoring: regular monitoring prevents major deliverability failures
- Frequency control: over-emailing converts engaged users into spam reporters
- Segmentation: sending the same campaign to everyone damages engagement
- Reachability: a large database does not equal real reach
- Lifecycle journeys: promotions should run alongside lifecycle messaging

## MEME POST STYLE
Used for: Friday posts, light deliverability humor, industry inside jokes.
Themes: open rate misconceptions, spam filters, deliverability debugging, email marketers vs inbox reality.
The caption always explains the professional insight behind the joke.

## AUTHOR VOICE
Observational thinker. Not overly promotional. Not overly technical for non-experts. Balanced between storytelling and insight.
Posts should feel like: "Someone experienced sharing what they've noticed."

## PREFERRED VOCABULARY
audit, inbox placement, reputation monitoring, customer journey, segmentation logic, email ecosystem, deliverability signals, engagement indicators

## IMPROVISATION RULES
- Never invent facts or specific numbers. If unsure, keep it general or ask for clarification.
- Posts must always feel like an experienced professional sharing a thoughtful observation.

## QUALITY STANDARD
If the output reads like a generic AI post, it must be rewritten. Every post must sound human, match the author's tone, follow the structural flow, and respect all language rules.

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
