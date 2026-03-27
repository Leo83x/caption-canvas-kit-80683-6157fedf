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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      company_profiles: {
        Row: {
          ai_credits_last_reset: string | null
          ai_credits_remaining: number | null
          ai_credits_total: number | null
          bio: string | null
          body_font: string | null
          brand_colors: string[] | null
          category: string | null
          company_name: string
          created_at: string
          default_tone: string | null
          description: string | null
          heading_font: string | null
          id: string
          instagram_access_token: string | null
          instagram_handle: string | null
          instagram_user_id: string | null
          keywords: string[] | null
          logo_url: string | null
          max_hashtags: number | null
          target_audience: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          ai_credits_last_reset?: string | null
          ai_credits_remaining?: number | null
          ai_credits_total?: number | null
          bio?: string | null
          body_font?: string | null
          brand_colors?: string[] | null
          category?: string | null
          company_name: string
          created_at?: string
          default_tone?: string | null
          description?: string | null
          heading_font?: string | null
          id?: string
          instagram_access_token?: string | null
          instagram_handle?: string | null
          instagram_user_id?: string | null
          keywords?: string[] | null
          logo_url?: string | null
          max_hashtags?: number | null
          target_audience?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          ai_credits_last_reset?: string | null
          ai_credits_remaining?: number | null
          ai_credits_total?: number | null
          bio?: string | null
          body_font?: string | null
          brand_colors?: string[] | null
          category?: string | null
          company_name?: string
          created_at?: string
          default_tone?: string | null
          description?: string | null
          heading_font?: string | null
          id?: string
          instagram_access_token?: string | null
          instagram_handle?: string | null
          instagram_user_id?: string | null
          keywords?: string[] | null
          logo_url?: string | null
          max_hashtags?: number | null
          target_audience?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      generated_posts: {
        Row: {
          alt_text: string | null
          caption: string
          company_profile_id: string | null
          created_at: string
          cta: string | null
          hashtags: string[]
          headline_text: string | null
          id: string
          image_prompt: string
          image_url: string | null
          objective: string
          post_type: string
          rationale: string | null
          requires_review: boolean | null
          review_reason: string | null
          slides: Json | null
          source_url: string | null
          status: string | null
          style: string | null
          success_analysis: string | null
          success_score: number | null
          theme: string
          tone: string | null
          updated_at: string
          user_id: string
          variant: string
          video_script: Json | null
        }
        Insert: {
          alt_text?: string | null
          caption: string
          company_profile_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags: string[]
          headline_text?: string | null
          id?: string
          image_prompt: string
          image_url?: string | null
          objective: string
          post_type: string
          rationale?: string | null
          requires_review?: boolean | null
          review_reason?: string | null
          slides?: Json | null
          source_url?: string | null
          status?: string | null
          style?: string | null
          success_analysis?: string | null
          success_score?: number | null
          theme: string
          tone?: string | null
          updated_at?: string
          user_id: string
          variant: string
          video_script?: Json | null
        }
        Update: {
          alt_text?: string | null
          caption?: string
          company_profile_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: string[]
          headline_text?: string | null
          id?: string
          image_prompt?: string
          image_url?: string | null
          objective?: string
          post_type?: string
          rationale?: string | null
          requires_review?: boolean | null
          review_reason?: string | null
          slides?: Json | null
          source_url?: string | null
          status?: string | null
          style?: string | null
          success_analysis?: string | null
          success_score?: number | null
          theme?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
          variant?: string
          video_script?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_posts_company_profile_id_fkey"
            columns: ["company_profile_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_trends: {
        Row: {
          category: string | null
          created_at: string
          hashtag: string
          id: string
          trending_score: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          hashtag: string
          id?: string
          trending_score?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          hashtag?: string
          id?: string
          trending_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      image_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          storage_path: string
          tags: string[] | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          storage_path: string
          tags?: string[] | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          storage_path?: string
          tags?: string[] | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      post_analytics: {
        Row: {
          comments_count: number | null
          created_at: string
          generated_post_id: string | null
          id: string
          impressions: number | null
          likes_count: number | null
          reach: number | null
          saves: number | null
          shares: number | null
        }
        Insert: {
          comments_count?: number | null
          created_at?: string
          generated_post_id?: string | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Update: {
          comments_count?: number | null
          created_at?: string
          generated_post_id?: string | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "generated_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          created_at: string
          error_message: string | null
          generated_post_id: string | null
          id: string
          instagram_media_id: string | null
          published_at: string | null
          scheduled_date: string
          scheduled_time: string
          status: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          generated_post_id?: string | null
          id?: string
          instagram_media_id?: string | null
          published_at?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          generated_post_id?: string | null
          id?: string
          instagram_media_id?: string | null
          published_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "generated_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      theme_suggestions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          suggested_hashtags: string[] | null
          theme_name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          suggested_hashtags?: string[] | null
          theme_name: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          suggested_hashtags?: string[] | null
          theme_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_post: {
        Args: { p_comment?: string; p_new_status: string; p_post_id: string }
        Returns: undefined
      }
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
