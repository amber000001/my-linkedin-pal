export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audience_signals: {
        Row: {
          created_at: string
          engagement_count: number
          engagement_types: Json
          engager_name: string
          id: string
          linkedin_post_id: string | null
          measured_at: string
          segment: string
        }
        Insert: {
          created_at?: string
          engagement_count?: number
          engagement_types?: Json
          engager_name: string
          id?: string
          linkedin_post_id?: string | null
          measured_at?: string
          segment?: string
        }
        Update: {
          created_at?: string
          engagement_count?: number
          engagement_types?: Json
          engager_name?: string
          id?: string
          linkedin_post_id?: string | null
          measured_at?: string
          segment?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_signals_linkedin_post_id_fkey"
            columns: ["linkedin_post_id"]
            isOneToOne: false
            referencedRelation: "linkedin_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ella_state: {
        Row: {
          current_user_goals: Json
          id: string
          last_briefing_sent_at: string | null
          last_nudge_sent_at: string | null
          learned_thresholds: Json
          silenced_until: string | null
          tone_preference: string
          updated_at: string
        }
        Insert: {
          current_user_goals?: Json
          id?: string
          last_briefing_sent_at?: string | null
          last_nudge_sent_at?: string | null
          learned_thresholds?: Json
          silenced_until?: string | null
          tone_preference?: string
          updated_at?: string
        }
        Update: {
          current_user_goals?: Json
          id?: string
          last_briefing_sent_at?: string | null
          last_nudge_sent_at?: string | null
          learned_thresholds?: Json
          silenced_until?: string | null
          tone_preference?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_post_outcomes: {
        Row: {
          beat_baseline_comments: boolean | null
          beat_baseline_reactions: boolean | null
          comment_rate: number | null
          comments: number
          generated_post_id: string
          hours_since_posting: number
          id: string
          impressions: number
          lift_vs_baseline: number | null
          measured_at: string
          reaction_rate: number | null
          reactions: number
          reshares: number
        }
        Insert: {
          beat_baseline_comments?: boolean | null
          beat_baseline_reactions?: boolean | null
          comment_rate?: number | null
          comments?: number
          generated_post_id: string
          hours_since_posting: number
          id?: string
          impressions?: number
          lift_vs_baseline?: number | null
          measured_at?: string
          reaction_rate?: number | null
          reactions?: number
          reshares?: number
        }
        Update: {
          beat_baseline_comments?: boolean | null
          beat_baseline_reactions?: boolean | null
          comment_rate?: number | null
          comments?: number
          generated_post_id?: string
          hours_since_posting?: number
          id?: string
          impressions?: number
          lift_vs_baseline?: number | null
          measured_at?: string
          reaction_rate?: number | null
          reactions?: number
          reshares?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_post_outcomes_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "generated_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_posts: {
        Row: {
          alternate_hooks: Json
          baseline_comment_rate: number | null
          baseline_reaction_rate: number | null
          created_at: string
          edit_distance: number | null
          edit_reason: string | null
          emoji_count: number
          emojis_used: string[]
          final_post: string
          free_text: string | null
          has_list: boolean
          has_meme: boolean
          has_question_closer: boolean
          hook_pattern: string | null
          hook_rationale: string | null
          hook_text: string | null
          id: string
          influenced_by_post_ids: string[]
          linkedin_post_id: string | null
          mode: string
          paragraph_count: number
          posted_at: string | null
          predicted_engagement_driver: string | null
          predicted_score: number | null
          scroll_anchor_line: string | null
          source_url: string | null
          specificity_nudge_used: boolean
          status: string
          topic: string | null
          user_satisfaction: string | null
          uses_emojis: boolean
          word_count: number
        }
        Insert: {
          alternate_hooks?: Json
          baseline_comment_rate?: number | null
          baseline_reaction_rate?: number | null
          created_at?: string
          edit_distance?: number | null
          edit_reason?: string | null
          emoji_count?: number
          emojis_used?: string[]
          final_post: string
          free_text?: string | null
          has_list?: boolean
          has_meme?: boolean
          has_question_closer?: boolean
          hook_pattern?: string | null
          hook_rationale?: string | null
          hook_text?: string | null
          id?: string
          influenced_by_post_ids?: string[]
          linkedin_post_id?: string | null
          mode: string
          paragraph_count?: number
          posted_at?: string | null
          predicted_engagement_driver?: string | null
          predicted_score?: number | null
          scroll_anchor_line?: string | null
          source_url?: string | null
          specificity_nudge_used?: boolean
          status?: string
          topic?: string | null
          user_satisfaction?: string | null
          uses_emojis?: boolean
          word_count?: number
        }
        Update: {
          alternate_hooks?: Json
          baseline_comment_rate?: number | null
          baseline_reaction_rate?: number | null
          created_at?: string
          edit_distance?: number | null
          edit_reason?: string | null
          emoji_count?: number
          emojis_used?: string[]
          final_post?: string
          free_text?: string | null
          has_list?: boolean
          has_meme?: boolean
          has_question_closer?: boolean
          hook_pattern?: string | null
          hook_rationale?: string | null
          hook_text?: string | null
          id?: string
          influenced_by_post_ids?: string[]
          linkedin_post_id?: string | null
          mode?: string
          paragraph_count?: number
          posted_at?: string | null
          predicted_engagement_driver?: string | null
          predicted_score?: number | null
          scroll_anchor_line?: string | null
          source_url?: string | null
          specificity_nudge_used?: boolean
          status?: string
          topic?: string | null
          user_satisfaction?: string | null
          uses_emojis?: boolean
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_posts_linkedin_post_id_fkey"
            columns: ["linkedin_post_id"]
            isOneToOne: false
            referencedRelation: "linkedin_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_posts: {
        Row: {
          comment_rate: number | null
          comments: number | null
          created_at: string
          date_posted: string | null
          has_meme: boolean | null
          id: string
          impressions: number | null
          post_text: string
          post_type: string
          reaction_rate: number | null
          reactions: number | null
          structure: Json | null
          topic: string
          uses_emojis: boolean
        }
        Insert: {
          comment_rate?: number | null
          comments?: number | null
          created_at?: string
          date_posted?: string | null
          has_meme?: boolean | null
          id?: string
          impressions?: number | null
          post_text: string
          post_type?: string
          reaction_rate?: number | null
          reactions?: number | null
          structure?: Json | null
          topic: string
          uses_emojis?: boolean
        }
        Update: {
          comment_rate?: number | null
          comments?: number | null
          created_at?: string
          date_posted?: string | null
          has_meme?: boolean | null
          id?: string
          impressions?: number | null
          post_text?: string
          post_type?: string
          reaction_rate?: number | null
          reactions?: number | null
          structure?: Json | null
          topic?: string
          uses_emojis?: boolean
        }
        Relationships: []
      }
      nudges: {
        Row: {
          acted_on_at: string | null
          composite_score: number | null
          confidence_score: number | null
          created_at: string
          dismissal_reason: string | null
          dismissed_at: string | null
          id: string
          novelty_score: number | null
          nudge_type: string
          opportunity_score: number | null
          payload: Json
          threshold_at_send: number | null
          was_acted_on: boolean
          was_opened: boolean
          was_sent: boolean
        }
        Insert: {
          acted_on_at?: string | null
          composite_score?: number | null
          confidence_score?: number | null
          created_at?: string
          dismissal_reason?: string | null
          dismissed_at?: string | null
          id?: string
          novelty_score?: number | null
          nudge_type: string
          opportunity_score?: number | null
          payload?: Json
          threshold_at_send?: number | null
          was_acted_on?: boolean
          was_opened?: boolean
          was_sent?: boolean
        }
        Update: {
          acted_on_at?: string | null
          composite_score?: number | null
          confidence_score?: number | null
          created_at?: string
          dismissal_reason?: string | null
          dismissed_at?: string | null
          id?: string
          novelty_score?: number | null
          nudge_type?: string
          opportunity_score?: number | null
          payload?: Json
          threshold_at_send?: number | null
          was_acted_on?: boolean
          was_opened?: boolean
          was_sent?: boolean
        }
        Relationships: []
      }
      post_generations: {
        Row: {
          alternate_draft: string | null
          alternate_hooks: Json | null
          comment_replies: Json | null
          created_at: string
          cta_options: string | null
          generated_post: string
          generated_post_id: string | null
          hashtags: Json | null
          id: string
          input_text: string | null
          input_url: string | null
          is_favorite: boolean
          meme_caption: string | null
          meme_ideas: Json | null
          meme_template: string | null
          post_type: string
          status: string
          topic: string | null
          topic_dropdown_value: string | null
        }
        Insert: {
          alternate_draft?: string | null
          alternate_hooks?: Json | null
          comment_replies?: Json | null
          created_at?: string
          cta_options?: string | null
          generated_post: string
          generated_post_id?: string | null
          hashtags?: Json | null
          id?: string
          input_text?: string | null
          input_url?: string | null
          is_favorite?: boolean
          meme_caption?: string | null
          meme_ideas?: Json | null
          meme_template?: string | null
          post_type?: string
          status?: string
          topic?: string | null
          topic_dropdown_value?: string | null
        }
        Update: {
          alternate_draft?: string | null
          alternate_hooks?: Json | null
          comment_replies?: Json | null
          created_at?: string
          cta_options?: string | null
          generated_post?: string
          generated_post_id?: string | null
          hashtags?: Json | null
          id?: string
          input_text?: string | null
          input_url?: string | null
          is_favorite?: boolean
          meme_caption?: string | null
          meme_ideas?: Json | null
          meme_template?: string | null
          post_type?: string
          status?: string
          topic?: string | null
          topic_dropdown_value?: string | null
        }
        Relationships: []
      }
      trending_topics: {
        Row: {
          created_at: string
          expires_at: string | null
          growth_rate: number
          id: string
          relevance_to_user: number
          source: string
          topic: string
          volume_score: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          growth_rate?: number
          id?: string
          relevance_to_user?: number
          source?: string
          topic: string
          volume_score?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          growth_rate?: number
          id?: string
          relevance_to_user?: number
          source?: string
          topic?: string
          volume_score?: number
        }
        Relationships: []
      }
    }
    Views: {
      cadence_log: {
        Row: {
          date: string | null
          days_since_last_post: number | null
          posts_count: number | null
          rolling_30d_avg: number | null
          rolling_7d_avg: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
