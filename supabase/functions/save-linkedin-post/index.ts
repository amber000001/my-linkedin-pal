import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_POST_TYPES = new Set([
  "thought_leadership",
  "observational",
  "meme",
  "personal",
]);

type StructurePayload = {
  hook?: unknown;
  observation?: unknown;
  explanation?: unknown;
  implications?: unknown;
  learnings?: unknown;
  closing?: unknown;
  hashtags?: unknown;
};

function getRequiredString(value: unknown, label: string, preserveExact = false) {
  if (typeof value !== "string") {
    throw new Error(`${label} is required.`);
  }

  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return preserveExact ? value : value.trim();
}

function getBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be true or false.`);
  }

  return value;
}

function getNonNegativeInteger(value: unknown, label: string) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be an integer >= 0.`);
  }

  return parsed;
}

function normalizeDatePosted(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Date posted is required.");
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    throw new Error("Date posted must use YYYY-MM-DD or MM-DD-YYYY.");
  }

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function normalizeStringArray(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list of strings.`);
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStructure(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Structure must be an object when provided.");
  }

  const structure = value as StructurePayload;
  const normalized: Record<string, string | string[]> = {};

  if (typeof structure.hook === "string" && structure.hook.trim()) {
    normalized.hook = structure.hook.trim();
  }
  if (typeof structure.observation === "string" && structure.observation.trim()) {
    normalized.observation = structure.observation.trim();
  }
  if (typeof structure.explanation === "string" && structure.explanation.trim()) {
    normalized.explanation = structure.explanation.trim();
  }
  if (typeof structure.implications === "string" && structure.implications.trim()) {
    normalized.implications = structure.implications.trim();
  }
  if (typeof structure.closing === "string" && structure.closing.trim()) {
    normalized.closing = structure.closing.trim();
  }
  if (structure.learnings !== undefined) {
    normalized.learnings = normalizeStringArray(structure.learnings, "Learnings");
  }
  if (structure.hashtags !== undefined) {
    normalized.hashtags = normalizeStringArray(structure.hashtags, "Hashtags");
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const topic = getRequiredString(body.topic, "Topic");
    const postType = getRequiredString(body.post_type, "Post type");

    if (!ALLOWED_POST_TYPES.has(postType)) {
      throw new Error("Post type must be thought_leadership, observational, meme, or personal.");
    }

    const postText = getRequiredString(body.post_text ?? body.post, "Post text", true);
    const datePosted = normalizeDatePosted(body.date_posted);
    const impressions = getNonNegativeInteger(body.impressions, "Impressions");
    const reactions = getNonNegativeInteger(body.reactions, "Reactions");
    const comments = getNonNegativeInteger(body.comments, "Comments");
    const hasMeme = getBoolean(body.has_meme, "Has meme");
    const usesEmojis = getBoolean(body.uses_emojis, "Uses emojis");
    const structure = normalizeStructure(body.structure);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("linkedin_posts")
      .insert({
        topic,
        post_type: postType,
        post_text: postText,
        date_posted: datePosted,
        impressions,
        reactions,
        comments,
        has_meme: hasMeme,
        uses_emojis: usesEmojis,
        reaction_rate: reactionRate,
        comment_rate: commentRate,
        structure,
      })
      .select("*")
      .single();

    if (error) {
      console.error("save-linkedin-post insert error:", error);
      throw new Error(error.message || "Failed to save LinkedIn post.");
    }

    return new Response(JSON.stringify({ success: true, post: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("save-linkedin-post error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});