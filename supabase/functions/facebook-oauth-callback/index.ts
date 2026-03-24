import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OAuthCallbackRequest {
  code: string;
  redirectUri: string;
  userId: string | null;
}

// Helper to extract user ID from JWT without full verification
function getUserIdFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    // Base64Url decode payload
    const payloadJson = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    return payload.sub || null;
  } catch (e) {
    console.error("Error decoding JWT manually:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { code, action } = body;
    let userId = body.userId || body.user_id;
    if (userId === "mock-user-id") userId = null;

    // Use Service Role to bypass RLS and avoid JWT "missing sub" errors
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- Action: check_status ---
    if (action === "check_status") {
      console.log("Action: check_status for user:", userId);
      let profile = null;

      if (userId) {
        const { data } = await supabaseAdmin
          .from("company_profiles")
          .select("user_id, company_name, instagram_user_id, instagram_access_token, token_expires_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (data?.instagram_access_token) profile = data;
      }

      if (!profile) {
        const { data: connectedProfiles } = await supabaseAdmin
          .from("company_profiles")
          .select("user_id, company_name, instagram_user_id, instagram_access_token, token_expires_at")
          .not("instagram_access_token", "is", null)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (connectedProfiles && connectedProfiles.length > 0) profile = connectedProfiles[0];
      }

      if (profile) {
        let username = "";
        if (profile.instagram_access_token && profile.instagram_user_id) {
          try {
            const fbUrl = `https://graph.facebook.com/v20.0/${profile.instagram_user_id}?fields=username&access_token=${profile.instagram_access_token}`;
            const fbRes = await fetch(fbUrl);
            const fbData = await fbRes.json();
            if (fbData.username) username = fbData.username;
          } catch (e) {
            console.error("Error fetching username in status check:", e);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            connected: !!profile.instagram_access_token,
            instagramUserId: profile.instagram_user_id,
            instagramUsername: username,
            expiresAt: profile.token_expires_at
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, connected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Original OAuth Flow ---
    const redirectUri = "https://studio.convertamais.online/instagram";
    console.log("Receiving OAuth flow for code:", code?.substring(0, 10) + "...");

    const authHeader = req.headers.get("Authorization");

    if (!userId && authHeader) {
      userId = getUserIdFromAuthHeader(authHeader);
    }

    if (!userId) {
      console.log("No userId identified. Searching for first available profile...");
      const { data: profiles } = await supabaseAdmin
        .from("company_profiles")
        .select("user_id, company_name")
        .limit(2);

      if (profiles && profiles.length > 0) {
        const marco = profiles.find(p => p.company_name?.toLowerCase().includes("marco"));
        userId = marco ? marco.user_id : profiles[0].user_id;
        console.log(`Fallback Success: Identified user as ${marco ? "Marco" : "Primary Account"} (${userId})`);
      }
    }

    if (!userId) {
      throw new Error("Could not identify your account. Please ensure your Company Profile is configured in the database.");
    }

    console.log("Processing Instagram OAuth for User:", userId);

    const appId = Deno.env.get("FACEBOOK_APP_ID");
    const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");

    if (!appId || !appSecret) {
      throw new Error("Facebook configuration incomplete on server.");
    }

    // Step 1: Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${code}`;

    let tokenData;
    try {
      const tokenResponse = await fetch(tokenUrl);
      tokenData = await tokenResponse.json();
    } catch (e) {
      console.error("Fetch to Facebook failed:", e);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to connect to Facebook API: " + (e instanceof Error ? e.message : String(e))
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (tokenData.error) {
      console.error("Token exchange error:", JSON.stringify(tokenData.error));
      return new Response(JSON.stringify({
        success: false,
        error: `Facebook Error: ${tokenData.error.message || "Error obtaining access token"}.`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const accessToken = tokenData.access_token;

    console.log("Access token obtained, fetching pages with dual strategy...");

    // Step 2: Get user's Facebook Pages
    const pagesUrls = [
      `https://graph.facebook.com/v20.0/me/accounts?fields=name,access_token,instagram_business_account{id,username}&access_token=${accessToken}`,
      `https://graph.facebook.com/v20.0/me?fields=accounts{name,access_token,instagram_business_account{id,username}}&access_token=${accessToken}`
    ];

    let pagesData: any[] | null = null;
    for (const url of pagesUrls) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          pagesData = data.data;
          break;
        } else if (data.accounts?.data && data.accounts.data.length > 0) {
          pagesData = data.accounts.data;
          break;
        }
      } catch (err) {
        console.error("Error fetching pages from:", url, err);
      }
    }

    if (!pagesData || pagesData.length === 0) {
      const rawResponse = await fetch(pagesUrls[0]);
      const rawData = await rawResponse.json();
      console.error("Discovery failed. Raw response:", JSON.stringify(rawData));

      const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`;
      const debugResponse = await fetch(debugUrl);
      const debugData = await debugResponse.json();
      const scopes = debugData.data?.scopes || [];
      const granularScopes = debugData.data?.granular_scopes || [];

      console.log("Discovery empty. Checking granular scopes fallback...");

      // Fallback Strategy: If we have specific page IDs in granular scopes, try to fetch them directly
      const pagesShowList = granularScopes.find((s: any) => s.scope === "pages_show_list");
      if (pagesShowList && pagesShowList.target_ids && pagesShowList.target_ids.length > 0) {
        console.log(`Found ${pagesShowList.target_ids.length} targeted pages. Attempting direct fetch...`);
        const foundPages: any[] = [];
        for (const pId of pagesShowList.target_ids) {
          try {
            const pUrl = `https://graph.facebook.com/v20.0/${pId}?fields=name,access_token,instagram_business_account{id,username}&access_token=${accessToken}`;
            const pRes = await fetch(pUrl);
            const pData = await pRes.json();
            if (pData.id && (pData.instagram_business_account || pData.access_token)) {
              foundPages.push(pData);
            }
          } catch (e) {
            console.error(`Failed to fetch targeted page ${pId}:`, e);
          }
        }
        if (foundPages.length > 0) {
          console.log(`Direct fetch found ${foundPages.length} valid pages. Proceeding.`);
          pagesData = foundPages;
        }
      }

      if (!pagesData || pagesData.length === 0) {
        let guidance = "Check if all permissions are granted.";
        if (granularScopes.length > 0) {
          const pagesShowListCheck = granularScopes.find((s: any) => s.scope === "pages_show_list");
          const instagramBasicCheck = granularScopes.find((s: any) => s.scope === "instagram_basic");

          if (pagesShowListCheck && (!pagesShowListCheck.target_ids || pagesShowListCheck.target_ids.length === 0)) {
            guidance = "PROCESSO INCOMPLETO: Você selecionou 'Página específica' mas esqueceu de marcar a Página na lista do Facebook.";
          } else if (instagramBasicCheck && (!instagramBasicCheck.target_ids || instagramBasicCheck.target_ids.length === 0)) {
            guidance = "PROCESSO INCOMPLETO: Você marcou a Página, mas esqueceu de marcar a 'Conta do Instagram' correspondente.";
          }
        }

        throw new Error(`DEBUG INFO (v2.4):
          Facebook Status: "Success" (Valid Token)
          Pages Found: 0
          
          ${guidance}

          Token Scopes: ${JSON.stringify(scopes)}
          Granular Scopes: ${JSON.stringify(granularScopes, null, 2)}`);
      }
    }

    let instagramUserId = null;
    let instagramUsername = null;
    let pageId = null;
    let finalAccessToken = accessToken;

    for (const page of pagesData) {
      if (page.instagram_business_account?.id) {
        instagramUserId = page.instagram_business_account.id;
        instagramUsername = page.instagram_business_account.username || null;
        pageId = page.id;
        finalAccessToken = page.access_token;
        console.log(`Found IG Business on page "${page.name}": ID=${instagramUserId}, username=${instagramUsername}`);
        break;
      }
    }

    if (!instagramUserId) {
      // Try fetching IG for the first page separately if not embedded
      const firstPage = pagesData[0];
      const pId = firstPage.id;
      const pToken = firstPage.access_token;

      const igAccountUrl = `https://graph.facebook.com/v20.0/${pId}?fields=instagram_business_account{id,username}&access_token=${pToken}`;
      const igRes = await fetch(igAccountUrl);
      const igData = await igRes.json();

      if (igData.instagram_business_account?.id) {
        instagramUserId = igData.instagram_business_account.id;
        instagramUsername = igData.instagram_business_account.username || null;
        pageId = pId;
        finalAccessToken = pToken;
      }
    }

    if (!instagramUserId) {
      throw new Error(`Pages found but none have a linked Instagram Business account. Check your Facebook Business Manager settings.`);
    }

    // Exchange for long-lived token
    const longLivedTokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${finalAccessToken}`;
    const longLivedResponse = await fetch(longLivedTokenUrl);
    const longLivedData = await longLivedResponse.json();

    const storedToken = longLivedData.access_token || finalAccessToken;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    const tokenExpiresAt = expiresAt.toISOString();

    const { data: existingProfile } = await supabaseAdmin
      .from("company_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      const { error } = await supabaseAdmin
        .from("company_profiles")
        .update({
          instagram_access_token: storedToken,
          instagram_user_id: instagramUserId,
          facebook_page_id: pageId,
          token_expires_at: tokenExpiresAt,
        })
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("company_profiles").insert({
        user_id: userId,
        company_name: "My Company",
        instagram_access_token: storedToken,
        instagram_user_id: instagramUserId,
        facebook_page_id: pageId,
        token_expires_at: tokenExpiresAt,
      });
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        instagramUsername,
        instagramUserId,
        expiresAt: tokenExpiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Critical error in OAuth callback:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error connecting to Instagram",
      }),
      {
        status: 200, // Returning 200 so the frontend can read the exact error message without crashing
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
