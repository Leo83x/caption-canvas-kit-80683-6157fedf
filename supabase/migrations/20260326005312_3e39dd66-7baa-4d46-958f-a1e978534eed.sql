
ALTER TABLE public.generated_posts
  ADD COLUMN IF NOT EXISTS slides jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS success_score integer,
  ADD COLUMN IF NOT EXISTS success_analysis text,
  ADD COLUMN IF NOT EXISTS headline_text text,
  ADD COLUMN IF NOT EXISTS video_script jsonb;
