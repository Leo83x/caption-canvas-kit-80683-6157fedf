import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const normalizeTime = (value: string | null | undefined) => {
  const [hours = "00", minutes = "00", seconds = "00"] = (value ?? "").split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
};

const getCurrentDateTimeInTimezone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${lookup.year}-${lookup.month}-${lookup.day}`,
    time: `${lookup.hour}:${lookup.minute}:${lookup.second}`,
  };
};

const isPostDue = (
  scheduledDate: string,
  scheduledTime: string,
  timeZone: string | null | undefined,
  now: Date
) => {
  const current = getCurrentDateTimeInTimezone(now, timeZone || DEFAULT_TIMEZONE);
  const normalizedScheduledTime = normalizeTime(scheduledTime);

  return (
    scheduledDate < current.date ||
    (scheduledDate === current.date && normalizedScheduledTime <= current.time)
  );
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();
    console.log(`Checking scheduled posts for ${now.toISOString()}`);

    const { data: scheduledPosts, error: queryError } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*, generated_posts(*)")
      .in("status", ["scheduled", "pending"])
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (queryError) {
      console.error("Error querying scheduled posts:", queryError);
      throw queryError;
    }

    const duePosts = (scheduledPosts || []).filter((scheduledPost) =>
      isPostDue(
        scheduledPost.scheduled_date,
        scheduledPost.scheduled_time,
        scheduledPost.timezone,
        now
      )
    );

    console.log(
      `Found ${duePosts.length} posts due for publishing out of ${scheduledPosts?.length || 0} scheduled posts`
    );

    const results = [];

    for (const scheduledPost of duePosts || []) {
      try {
        const post = scheduledPost.generated_posts;
        if (!post) {
          console.warn(`No generated post found for scheduled post ${scheduledPost.id}`);
          await supabaseAdmin
            .from("scheduled_posts")
            .update({ status: "failed", error_message: "Post original não encontrado" })
            .eq("id", scheduledPost.id);
          continue;
        }

        // Get Instagram credentials for this user
        const { data: profile } = await supabaseAdmin
          .from("company_profiles")
          .select("instagram_access_token, instagram_user_id")
          .eq("user_id", scheduledPost.user_id)
          .single();

        if (!profile?.instagram_access_token || !profile?.instagram_user_id) {
          console.warn(`No Instagram credentials for user ${scheduledPost.user_id}`);
          await supabaseAdmin
            .from("scheduled_posts")
            .update({ status: "failed", error_message: "Credenciais do Instagram não configuradas" })
            .eq("id", scheduledPost.id);
          continue;
        }

        const { instagram_access_token, instagram_user_id } = profile;
        const version = "v20.0";

        // Step 1: Create media container
        const mediaParams = new URLSearchParams({
          image_url: post.image_url || "",
          caption: `${post.caption}\n\n${post.hashtags.join(" ")}`,
          access_token: instagram_access_token,
        });

        console.log(`Publishing post ${scheduledPost.id}...`);

        const mediaResponse = await fetch(
          `https://graph.facebook.com/${version}/${instagram_user_id}/media?${mediaParams.toString()}`,
          { method: "POST" }
        );

        const mediaData = await mediaResponse.json();

        if (!mediaResponse.ok) {
          const errorMsg = mediaData?.error?.message || "Erro ao criar mídia";
          console.error(`Media creation failed for ${scheduledPost.id}:`, errorMsg);
          await supabaseAdmin
            .from("scheduled_posts")
            .update({ status: "failed", error_message: errorMsg })
            .eq("id", scheduledPost.id);
          continue;
        }

        // Step 2: Publish
        const publishParams = new URLSearchParams({
          creation_id: mediaData.id,
          access_token: instagram_access_token,
        });

        const publishResponse = await fetch(
          `https://graph.facebook.com/${version}/${instagram_user_id}/media_publish?${publishParams.toString()}`,
          { method: "POST" }
        );

        const publishData = await publishResponse.json();

        if (!publishResponse.ok) {
          const errorMsg = publishData?.error?.message || "Erro ao publicar";
          console.error(`Publish failed for ${scheduledPost.id}:`, errorMsg);
          await supabaseAdmin
            .from("scheduled_posts")
            .update({ status: "failed", error_message: errorMsg })
            .eq("id", scheduledPost.id);
          continue;
        }

        // Success
        await supabaseAdmin
          .from("scheduled_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            instagram_media_id: publishData.id,
          })
          .eq("id", scheduledPost.id);

        console.log(`Successfully published post ${scheduledPost.id} → media ${publishData.id}`);
        results.push({ id: scheduledPost.id, status: "published", mediaId: publishData.id });
      } catch (postError: any) {
        console.error(`Error processing post ${scheduledPost.id}:`, postError);
        await supabaseAdmin
          .from("scheduled_posts")
          .update({ status: "failed", error_message: postError.message })
          .eq("id", scheduledPost.id);
        results.push({ id: scheduledPost.id, status: "failed", error: postError.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Cron publish error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
