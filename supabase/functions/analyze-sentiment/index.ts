import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { postId: targetPostId } = await req.json().catch(() => ({}));

    const { data: profile } = await supabase.from("company_profiles")
      .select("instagram_access_token, instagram_user_id").eq("user_id", user.id).maybeSingle();

    if (!profile?.instagram_access_token || !profile?.instagram_user_id) {
      return new Response(JSON.stringify({ error: "Conecte sua conta do Instagram primeiro" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mediaResponse = await fetch(
      `https://graph.instagram.com/v20.0/${profile.instagram_user_id}/media?fields=id,caption,comments_count,timestamp&limit=10&access_token=${profile.instagram_access_token}`
    );
    if (!mediaResponse.ok) {
      return new Response(JSON.stringify({ error: "Erro ao acessar dados do Instagram" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mediaData = await mediaResponse.json();
    let posts = mediaData.data || [];

    if (targetPostId) {
      const { data: analyticsRow } = await supabase.from('post_analytics')
        .select('instagram_media_id').eq('post_id', targetPostId).maybeSingle();
      if (analyticsRow?.instagram_media_id) {
        posts = posts.filter((p: any) => p.id === analyticsRow.instagram_media_id);
      }
    }

    const postsWithComments = [];
    for (const post of posts.slice(0, targetPostId ? 1 : 5)) {
      if (post.comments_count > 0) {
        try {
          const commentsResponse = await fetch(
            `https://graph.instagram.com/v20.0/${post.id}/comments?fields=text,timestamp,username&limit=50&access_token=${profile.instagram_access_token}`
          );
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            postsWithComments.push({
              id: post.id, caption: post.caption || "",
              comments: (commentsData.data || []).map((c: any) => c.text),
              total: post.comments_count
            });
          }
        } catch (e) { console.error(`Error fetching comments for ${post.id}:`, e); }
      }
    }

    if (postsWithComments.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum post com comentários encontrado." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Você é um especialista em análise de sentimento de redes sociais. Analise comentários e classifique como positivo, negativo ou neutro.` },
          { role: "user", content: `Analise os comentários:\n${JSON.stringify(postsWithComments, null, 2)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_sentiment",
            description: "Return sentiment analysis results",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      post_id: { type: "string" }, post_caption: { type: "string" }, total_comments: { type: "number" },
                      sentiment: { type: "object", properties: { positive: { type: "number" }, negative: { type: "number" }, neutral: { type: "number" } } },
                      highlights: { type: "object", properties: { best_comment: { type: "string" }, worst_comment: { type: "string" }, common_topics: { type: "array", items: { type: "string" } } } }
                    }
                  }
                },
                summary: {
                  type: "object",
                  properties: {
                    overall_sentiment: { type: "string" }, total_analyzed: { type: "number" },
                    average_positive: { type: "number" }, average_negative: { type: "number" }, average_neutral: { type: "number" },
                    recommendations: { type: "array", items: { type: "string" } }
                  }
                }
              },
              required: ["results", "summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_sentiment" } },
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded");
      if (response.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error (${response.status})`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-sentiment:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
