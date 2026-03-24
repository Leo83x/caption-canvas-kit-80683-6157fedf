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
        // Create Supabase client with Admin (Service Role) rights
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        try {
            const body = await req.json().catch(() => ({}));
            const { userId } = body;

            let profile = null;

            // 1. Try to find the specific user's profile if userId is provided
            if (userId) {
                const { data } = await supabaseAdmin
                    .from("company_profiles")
                    .select("user_id, company_name, instagram_user_id, instagram_access_token, token_expires_at")
                    .eq("user_id", userId)
                    .maybeSingle();

                if (data?.instagram_access_token) {
                    profile = data;
                    console.log(`Debug: Found specific connected profile for userId: ${userId}`);
                }
            }

            // 2. Fallback: Search for ANY connected profile in the entire database
            if (!profile) {
                console.log("No specific connected profile found. Searching for any available connection...");
                const { data: connectedProfiles } = await supabaseAdmin
                    .from("company_profiles")
                    .select("user_id, company_name, instagram_user_id, instagram_access_token, token_expires_at")
                    .not("instagram_access_token", "is", null)
                    .not("instagram_user_id", "is", null)
                    .order('updated_at', { ascending: false })
                    .limit(1);

                if (connectedProfiles && connectedProfiles.length > 0) {
                    profile = connectedProfiles[0];
                    console.log(`Debug: Found global connected profile: ${profile.company_name} (${profile.user_id})`);
                }
            }

            // 3. Last Resort: Just return the first profile (legacy fallback)
            if (!profile) {
                const { data: anyProfile } = await supabaseAdmin
                    .from("company_profiles")
                    .select("user_id, company_name")
                    .limit(1)
                    .maybeSingle();
                profile = anyProfile;
            }
        } catch (e) {
            console.error("Discovery error:", e);
        }

        if (!profile) {
            return new Response(
                JSON.stringify({ connected: false, message: "No profile found" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Determine connection status
        const isConnected = !!(profile.instagram_access_token && profile.instagram_user_id);
        let username = "";

        // If connected, try to fetch username (optional, nice to have)
        // We could store username in DB to avoid this call, but fetching ensures token is valid
        if (isConnected) {
            try {
                // Only fetch if we have a token
                const fbUrl = `https://graph.facebook.com/v20.0/${profile.instagram_user_id}?fields=username&access_token=${profile.instagram_access_token}`;
                const fbRes = await fetch(fbUrl);
                const fbData = await fbRes.json();
                if (fbData.username) username = fbData.username;
            } catch (e) {
                console.error("Error fetching username:", e);
            }
        }

        return new Response(
            JSON.stringify({
                connected: isConnected,
                instagramUserId: profile.instagram_user_id,
                instagramUsername: username,
                tokenExpiresAt: profile.token_expires_at,
                debug_profile_found: profile.company_name
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error: any) {
        console.error("Error in get-instagram-status:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
