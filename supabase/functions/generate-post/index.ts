import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
- Emojis ARE allowed in body text — but use them sparingly and naturally, guided by the EMOJI INTELLIGENCE section below. Place them as accent points (start of a line, before a key phrase, or in closings), never cluttering every sentence.
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
  meme: `Generate a meme-led LinkedIn post. The mainPost MUST be short and punchy — 4 to 5 lines maximum. No long explanations. Think snappy caption energy: set up the joke or insight in 2-3 lines, land it in 1-2 lines. Return JSON with:
{
  "mainPost": "A short, punchy 4-5 line LinkedIn caption to accompany the meme (written in the user's voice, keep it tight)",
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

interface PostWithMetrics {
  post_text: string;
  impressions: number;
  reactions: number;
  comments: number;
  has_meme: boolean;
  uses_emojis: boolean;
  post_type: string;
  reaction_rate: number;
  comment_rate: number;
  structure: {
    hook?: string;
    observation?: string;
    explanation?: string;
    implications?: string;
    learnings?: string[];
    closing?: string;
    hashtags?: string[];
  } | null;
}

function buildPerformanceContext(posts: PostWithMetrics[], isMeme: boolean): string {
  if (!posts || posts.length === 0) return "";

  const relevant = posts.filter((p) => p.has_meme === isMeme);
  const other = posts.filter((p) => p.has_meme !== isMeme);

  const maxImpressions = Math.max(...posts.map((p) => p.impressions || 1), 1);
  const scored = relevant.map((p) => ({
    ...p,
    score:
      (p.reaction_rate || 0) * 0.4 +
      (p.comment_rate || 0) * 0.4 +
      ((p.impressions || 0) / maxImpressions) * 20 * 0.2,
  }));
  scored.sort((a, b) => b.score - a.score);

  let context = "";

  const topPosts = scored.slice(0, 3);
  if (topPosts.length > 0) {
    context += `\n\n## HIGH-PERFORMING ${isMeme ? "MEME" : "NON-MEME"} POSTS (prioritize these patterns):\n`;
    topPosts.forEach((p, i) => {
      context += `\n--- Top Post ${i + 1} (Type: ${p.post_type}, Emojis: ${p.uses_emojis ? "yes" : "no"}, Impressions: ${p.impressions}, Reactions: ${p.reactions}, Comments: ${p.comments}, React Rate: ${(p.reaction_rate * 100).toFixed(2)}%, Comment Rate: ${(p.comment_rate * 100).toFixed(2)}%) ---\n${p.post_text}\n`;
      if (p.structure) {
        context += `Structure: Hook="${p.structure.hook || ""}" | Observation="${p.structure.observation || ""}" | Closing="${p.structure.closing || ""}"\n`;
      }
    });
  }

  const regularPosts = scored.slice(3, 6);
  if (regularPosts.length > 0) {
    context += `\n\n## OTHER ${isMeme ? "MEME" : "NON-MEME"} POSTS (for voice reference):\n`;
    regularPosts.forEach((p, i) => {
      context += `\n--- Post ${i + 1} ---\n${p.post_text}\n`;
    });
  }

  if (other.length > 0) {
    const crossRef = other.slice(0, 2);
    context += `\n\n## CROSS-REFERENCE POSTS (${isMeme ? "non-meme" : "meme"} style, for general voice):\n`;
    crossRef.forEach((p, i) => {
      context += `\n--- Post ${i + 1} ---\n${p.post_text}\n`;
    });
  }

  return context;
}

function buildPerformanceLearningPrompt(posts: PostWithMetrics[]): string {
  if (!posts || posts.length === 0) return "";

  const withMetrics = posts.filter((p) => p.impressions > 0);
  if (withMetrics.length < 2) return "";

  const avgReactRate = withMetrics.reduce((s, p) => s + (p.reaction_rate || 0), 0) / withMetrics.length;
  const avgCommentRate = withMetrics.reduce((s, p) => s + (p.comment_rate || 0), 0) / withMetrics.length;

  const emojiPosts = withMetrics.filter((p) => p.uses_emojis);
  const noEmojiPosts = withMetrics.filter((p) => !p.uses_emojis);

  const topByReactions = [...withMetrics].sort((a, b) => (b.reaction_rate || 0) - (a.reaction_rate || 0)).slice(0, 3);
  const topByComments = [...withMetrics].sort((a, b) => (b.comment_rate || 0) - (a.comment_rate || 0)).slice(0, 3);

  let prompt = `\n\n## PERFORMANCE LEARNING SIGNALS
Based on the author's historical performance data:
- Average reaction rate: ${(avgReactRate * 100).toFixed(2)}%
- Average comment rate: ${(avgCommentRate * 100).toFixed(2)}%`;

  // Emoji intelligence
  prompt += `\n\n## EMOJI INTELLIGENCE`;

  if (emojiPosts.length > 0 && noEmojiPosts.length > 0) {
    const emojiAvgReact = emojiPosts.reduce((s, p) => s + (p.reaction_rate || 0), 0) / emojiPosts.length;
    const noEmojiAvgReact = noEmojiPosts.reduce((s, p) => s + (p.reaction_rate || 0), 0) / noEmojiPosts.length;
    const emojiAvgComment = emojiPosts.reduce((s, p) => s + (p.comment_rate || 0), 0) / emojiPosts.length;
    const noEmojiAvgComment = noEmojiPosts.reduce((s, p) => s + (p.comment_rate || 0), 0) / noEmojiPosts.length;
    const emojiWins = emojiAvgReact > noEmojiAvgReact;
    
    prompt += `\n- Posts with emojis: ${emojiPosts.length} | Without: ${noEmojiPosts.length}`;
    prompt += `\n- Emoji posts avg reaction rate: ${(emojiAvgReact * 100).toFixed(2)}% | Non-emoji: ${(noEmojiAvgReact * 100).toFixed(2)}%`;
    prompt += `\n- Emoji posts avg comment rate: ${(emojiAvgComment * 100).toFixed(2)}% | Non-emoji: ${(noEmojiAvgComment * 100).toFixed(2)}%`;
    prompt += `\n- Recommendation: ${emojiWins ? "Emojis correlate with higher engagement — use 2-4 emojis naturally in the post." : "Non-emoji posts perform better — use emojis very sparingly (0-1 max)."}`;
  } else if (emojiPosts.length > 0) {
    prompt += `\n- All ${emojiPosts.length} posts use emojis — maintain this style with 2-4 emojis per post.`;
  } else if (noEmojiPosts.length > 0) {
    prompt += `\n- None of the ${noEmojiPosts.length} posts use emojis — keep emoji usage minimal (0-1).`;
  }

  // Extract actual emojis from top posts to learn style
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAF8}]/gu;
  const emojiUsageMap: Record<string, number> = {};
  withMetrics.filter(p => p.uses_emojis).forEach(p => {
    const found = p.post_text.match(emojiRegex) || [];
    found.forEach(e => { emojiUsageMap[e] = (emojiUsageMap[e] || 0) + 1; });
  });
  const topEmojis = Object.entries(emojiUsageMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (topEmojis.length > 0) {
    prompt += `\n- Author's frequently used emojis: ${topEmojis.map(([e, c]) => `${e}(${c}x)`).join(" ")}`;
    prompt += `\n- Use these familiar emojis when appropriate. Do NOT introduce random or uncommon emojis.`;
  }

  prompt += `\n\nHooks from top-performing posts by engagement:`;
  topByReactions.forEach((p) => {
    const hookText = p.structure?.hook || p.post_text.split("\n").find((l: string) => l.trim()) || "";
    prompt += `\n- "${hookText.slice(0, 120)}" (React rate: ${(p.reaction_rate * 100).toFixed(2)}%)`;
  });

  prompt += `\n\nHooks from top-performing posts by comments:`;
  topByComments.forEach((p) => {
    const hookText = p.structure?.hook || p.post_text.split("\n").find((l: string) => l.trim()) || "";
    prompt += `\n- "${hookText.slice(0, 120)}" (Comment rate: ${(p.comment_rate * 100).toFixed(2)}%)`;
  });

  // Structural patterns from top posts
  const topAll = [...withMetrics].sort((a, b) => {
    const scoreA = (a.reaction_rate || 0) * 0.4 + (a.comment_rate || 0) * 0.4 + (a.impressions / 100000) * 0.2;
    const scoreB = (b.reaction_rate || 0) * 0.4 + (b.comment_rate || 0) * 0.4 + (b.impressions / 100000) * 0.2;
    return scoreB - scoreA;
  }).slice(0, 3);

  const structuredTop = topAll.filter((p) => p.structure);
  if (structuredTop.length > 0) {
    prompt += `\n\nStructural patterns from top posts:`;
    structuredTop.forEach((p) => {
      if (p.structure) {
        const hasLearnings = p.structure.learnings && p.structure.learnings.length > 0;
        prompt += `\n- Type: ${p.post_type}, Emojis: ${p.uses_emojis ? "yes" : "no"}, Has learnings list: ${hasLearnings ? "yes" : "no"}`;
      }
    });
  }

  prompt += `\n\nUse these patterns as subtle guidance. Do NOT copy hooks. Borrow the style and energy, not the words. Never sacrifice authenticity for engagement.`;

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { mode, topic, freeText, url, memeTemplate, toneTags } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isMemeMode = mode === "meme";
    const selectFields = "post_text, impressions, reactions, comments, has_meme, uses_emojis, post_type, reaction_rate, comment_rate, structure";

    let repositoryContext = "";
    let performanceLearning = "";

    if (topic) {
      const { data: topicPosts } = await supabase
        .from("linkedin_posts")
        .select(selectFields)
        .eq("topic", topic)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: otherPosts } = await supabase
        .from("linkedin_posts")
        .select(selectFields)
        .neq("topic", topic)
        .order("created_at", { ascending: false })
        .limit(5);

      if (topicPosts && topicPosts.length > 0) {
        repositoryContext = buildPerformanceContext(topicPosts as PostWithMetrics[], isMemeMode);
      }

      const allPosts = [...(topicPosts || []), ...(otherPosts || [])] as PostWithMetrics[];
      performanceLearning = buildPerformanceLearningPrompt(allPosts);

      if (!topicPosts || topicPosts.length === 0) {
        if (otherPosts && otherPosts.length > 0) {
          repositoryContext += `\n\n## AUTHOR REFERENCE POSTS (for voice matching):\n`;
          otherPosts.slice(0, 3).forEach((p, i) => {
            repositoryContext += `\n--- Post ${i + 1} ---\n${p.post_text}\n`;
          });
        }
      }
    } else if (mode === "free-dump") {
      const queryTopic = topic || null;
      if (queryTopic) {
        const { data: topicPosts } = await supabase
          .from("linkedin_posts")
          .select(selectFields)
          .eq("topic", queryTopic)
          .order("created_at", { ascending: false })
          .limit(10);

        const { data: otherPosts } = await supabase
          .from("linkedin_posts")
          .select(selectFields)
          .neq("topic", queryTopic)
          .order("created_at", { ascending: false })
          .limit(5);

        if (topicPosts && topicPosts.length > 0) {
          repositoryContext = buildPerformanceContext(topicPosts as PostWithMetrics[], false);
        }
        const allPosts = [...(topicPosts || []), ...(otherPosts || [])] as PostWithMetrics[];
        performanceLearning = buildPerformanceLearningPrompt(allPosts);

        if (!topicPosts || topicPosts.length === 0) {
          if (otherPosts && otherPosts.length > 0) {
            repositoryContext += `\n\n## AUTHOR REFERENCE POSTS (for voice matching):\n`;
            otherPosts.slice(0, 3).forEach((p, i) => {
              repositoryContext += `\n--- Post ${i + 1} ---\n${p.post_text}\n`;
            });
          }
        }
      } else {
        const { data: recentPosts } = await supabase
          .from("linkedin_posts")
          .select(selectFields)
          .order("created_at", { ascending: false })
          .limit(8);

        if (recentPosts && recentPosts.length > 0) {
          repositoryContext = buildPerformanceContext(recentPosts as PostWithMetrics[], false);
          performanceLearning = buildPerformanceLearningPrompt(recentPosts as PostWithMetrics[]);
        }
      }
    }

    let userMessage = "";
    if (mode === "free-dump") {
      userMessage = `Convert these raw notes into a polished LinkedIn post:\n\n${freeText}`;
      if (topic) userMessage += `\nTopic/Category: ${topic}`;
      if (toneTags && toneTags.length > 0) {
        userMessage += `\n\nTONE DIRECTION: Make the post ${toneTags.join(", ")}. Infuse these tones naturally throughout — don't force it, let it feel authentic.`;
      }
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
            { role: "system", content: STYLE_SYSTEM_PROMPT + repositoryContext + performanceLearning + "\n\n" + modePrompt },
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

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
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
