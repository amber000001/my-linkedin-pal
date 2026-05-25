import { supabase } from "@/integrations/supabase/client";

export type PostMode = "meme" | "thought-leadership" | "free-dump";

export interface GenerateRequest {
  mode: PostMode;
  topic?: string;
  description?: string;
  freeText?: string;
  url?: string;
  memeTemplate?: string;
  toneTags?: string[];
}

export interface GenerateResponse {
  mainPost: string;
  alternateHooks?: string[];
  memeIdeas?: string[];
  alternateDraft?: string;
  hashtags?: string[];
  cta?: string;
  commentReplies?: string[];
  // Phase 1 closed-loop fields (optional, captured server-side too)
  generatedPostId?: string;
  hook_pattern?: string;
  hook_rationale?: string;
  predicted_engagement_driver?: string;
  scroll_anchor_line?: string;
}

export async function generatePost(request: GenerateRequest): Promise<GenerateResponse> {
  const { data, error } = await supabase.functions.invoke("generate-post", {
    body: request,
  });

  if (error) throw error;
  return data as GenerateResponse;
}
