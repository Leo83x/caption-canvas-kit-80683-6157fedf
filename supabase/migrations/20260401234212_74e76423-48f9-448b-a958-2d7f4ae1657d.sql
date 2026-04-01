
-- Remove old cron job
SELECT cron.unschedule('publish-scheduled-posts');

-- Create updated cron job with direct URL
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qhzstqlucjqqilbknthm.supabase.co/functions/v1/cron-publish',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoenN0cWx1Y2pxcWlsYmtudGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMDA1MjIsImV4cCI6MjA3ODU3NjUyMn0.712eM7L5UrXhrvPGVO2zVd12_uEO7-qasmeiSQdZsVk',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
