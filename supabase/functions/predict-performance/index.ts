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

    const { data: posts } = await supabase.from("generated_posts")
      .select("id, theme, caption, post_type, tone, style, objective, hashtags, created_at, post_analytics(*)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);

    const { data: drafts } = await supabase.from("generated_posts")
      .select("id, theme, caption, post_type, tone, style, objective, hashtags")
      .eq("user_id", user.id).eq("status", "draft").order("created_at", { ascending: false }).limit(5);

    const { data: profile } = await supabase.from("company_profiles")
      .select("company_name, category, target_audience").eq("user_id", user.id).maybeSingle();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const historicalPosts = (posts || []).map(p => ({
      id: p.id, theme: p.theme, caption: p.caption?.substring(0, 100),
      type: p.post_type, tone: p.tone, style: p.style, objective: p.objective,
      hashtags_count: p.hashtags?.length || 0,
      analytics: p.post_analytics?.[0] ? {
        likes: p.post_analytics[0].likes_count,
        comments: p.post_analytics[0].comments_count,
        reach: p.post_analytics[0].reach
      } : null
    }));

    const draftPosts = (drafts || []).map(d => ({
      id: d.id, theme: d.theme, caption: d.caption?.substring(0, 100),
      type: d.post_type, tone: d.tone, style: d.style, objective: d.objective,
      hashtags_count: d.hashtags?.length || 0
    }));

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Você é um especialista em analytics preditivo para Instagram. Preveja o sucesso de posts em draft com base no histórico. Seja CRÍTICO e realista.` },
          { role: "user", content: `Empresa: ${profile?.company_name || "N/A"} | Categoria: ${profile?.category || "N/A"}\n\nHistórico: ${JSON.stringify(historicalPosts)}\n\nDrafts: ${JSON.stringify(draftPosts)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "predict_results",
            description: "Return performance predictions",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      post_id: { type: "string" }, post_caption: { type: "string" }, post_theme: { type: "string" },
                      predicted_engagement_rate: { type: "number" }, predicted_reach: { type: "number" },
                      performance_vs_average: { type: "string" }, confidence: { type: "number" },
                      factors: { type: "object", properties: { positive: { type: "array", items: { type: "string" } }, negative: { type: "array", items: { type: "string" } } } },
                      recommendation: { type: "string" }
                    },
                    required: ["post_id", "predicted_engagement_rate", "confidence", "recommendation"]
                  }
                },
                summary: {
                  type: "object",
                  properties: {
                    average_predicted_engagement: { type: "number" }, best_performing_type: { type: "string" },
                    best_performing_tone: { type: "string" }, overall_trend: { type: "string" },
                    insights: { type: "array", items: { type: "string" } }
                  }
                }
              },
              required: ["predictions", "summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "predict_results" } },
        temperature: 0.3,
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
    console.error("Error in predict-performance:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
