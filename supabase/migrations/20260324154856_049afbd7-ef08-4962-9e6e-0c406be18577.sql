
-- Add missing columns to company_profiles
ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS ai_credits_remaining integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS ai_credits_total integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS ai_credits_last_reset timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone;

-- Create image_library table
CREATE TABLE IF NOT EXISTS public.image_library (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  url text NOT NULL,
  storage_path text NOT NULL,
  tags text[] DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.image_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own images" ON public.image_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own images" ON public.image_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON public.image_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON public.image_library FOR DELETE USING (auth.uid() = user_id);

-- Create hashtag_trends table
CREATE TABLE IF NOT EXISTS public.hashtag_trends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  hashtag text NOT NULL,
  category text DEFAULT 'General',
  trending_score numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.hashtag_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view hashtag trends" ON public.hashtag_trends FOR SELECT USING (true);
CREATE POLICY "Users can insert hashtag trends" ON public.hashtag_trends FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Create theme_suggestions table
CREATE TABLE IF NOT EXISTS public.theme_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  theme_name text NOT NULL,
  description text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.theme_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own themes" ON public.theme_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own themes" ON public.theme_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own themes" ON public.theme_suggestions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own themes" ON public.theme_suggestions FOR DELETE USING (auth.uid() = user_id);

-- Create post_analytics table
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generated_post_id uuid REFERENCES public.generated_posts(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  saves integer DEFAULT 0,
  shares integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own post analytics" ON public.post_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.generated_posts WHERE generated_posts.id = post_analytics.generated_post_id AND generated_posts.user_id = auth.uid())
);

-- Create approve_post function
CREATE OR REPLACE FUNCTION public.approve_post(p_post_id uuid, p_new_status text, p_comment text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.generated_posts
  SET status = p_new_status,
      review_reason = COALESCE(p_comment, review_reason),
      updated_at = now()
  WHERE id = p_post_id;
END;
$$;
