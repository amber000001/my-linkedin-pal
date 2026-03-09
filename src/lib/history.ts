export interface PostGeneration {
  id: string;
  created_at: string;
  topic: string | null;
  post_type: string;
  topic_dropdown_value: string | null;
  input_text: string | null;
  input_url: string | null;
  meme_template: string | null;
  generated_post: string;
  alternate_hooks: string[];
  cta_options: string | null;
  hashtags: string[];
  meme_caption: string | null;
  alternate_draft: string | null;
  comment_replies: string[];
  meme_ideas: string[];
  status: string;
  is_favorite: boolean;
}
