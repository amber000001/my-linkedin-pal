import { supabase } from "@/integrations/supabase/client";

export type PostMode = "meme" | "thought-leadership" | "free-dump";

export interface GenerateRequest {
  mode: PostMode;
  topic?: string;
  freeText?: string;
  url?: string;
  memeTemplate?: string;
}

export interface GenerateResponse {
  mainPost: string;
  alternateHooks?: string[];
  memeIdeas?: string[];
  alternateDraft?: string;
  hashtags?: string[];
  cta?: string;
  commentReplies?: string[];
}

export async function generatePost(request: GenerateRequest): Promise<GenerateResponse> {
  const { data, error } = await supabase.functions.invoke("generate-post", {
    body: request,
  });

  if (error) throw error;
  return data as GenerateResponse;
}
