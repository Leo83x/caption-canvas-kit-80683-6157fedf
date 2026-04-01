import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM

    console.log(`Checking scheduled posts for ${currentDate} at ${currentTime}`);

    // Find posts that are due (scheduled_date <= today AND scheduled_time <= now AND status = pending)
    const { data: duePosts, error: queryError } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*, generated_posts(*)")
      .eq("status", "pending")
      .lte("scheduled_date", currentDate)
      .lte("scheduled_time", currentTime);

    if (queryError) {
      console.error("Error querying scheduled posts:", queryError);
      throw queryError;
    }

    console.log(`Found ${duePosts?.length || 0} posts due for publishing`);

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
