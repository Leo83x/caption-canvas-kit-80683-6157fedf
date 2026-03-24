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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Não autorizado");
    }

    // Get current token
    const { data: profile, error: profileError } = await supabaseClient
      .from("company_profiles")
      .select("instagram_access_token")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.instagram_access_token) {
      throw new Error("Token não encontrado. Por favor, reconecte sua conta.");
    }

    const currentToken = profile.instagram_access_token;

    console.log("Refreshing Instagram token...");

    // Refresh the long-lived token (extends for another 60 days)
    const version = "v20.0";
    const refreshUrl = `https://graph.facebook.com/${version}/oauth/access_token?grant_type=fb_exchange_token&client_id=${Deno.env.get(
      "FACEBOOK_APP_ID"
    )}&client_secret=${Deno.env.get(
      "FACEBOOK_APP_SECRET"
    )}&fb_exchange_token=${currentToken}`;

    const response = await fetch(refreshUrl);
    const data = await response.json();

    if (data.error) {
      console.error("Token refresh error:", data.error);
      throw new Error(
        data.error.message ||
        "Erro ao renovar token. Por favor, reconecte sua conta."
      );
    }

    const newToken = data.access_token;
    const expiresIn = data.expires_in; // 5184000 seconds (60 days)
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update database
    const { error: updateError } = await supabaseClient
      .from("company_profiles")
      .update({
        instagram_access_token: newToken,
        token_expires_at: expiresAt,
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    console.log("Token refreshed successfully. New expiration:", expiresAt);

    return new Response(
      JSON.stringify({
        success: true,
        expiresAt,
        message: "Token renovado com sucesso!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error refreshing token:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao renovar token",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
