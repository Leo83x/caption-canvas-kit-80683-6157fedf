import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Fetch historical posts with analytics
    const { data: posts } = await supabase
      .from("generated_posts")
      .select("id, theme, caption, post_type, tone, style, objective, hashtags, created_at, post_analytics(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    // Get recent draft posts for prediction
    const { data: drafts } = await supabase
      .from("generated_posts")
      .select("id, theme, caption, post_type, tone, style, objective, hashtags")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("company_name, category, target_audience")
      .eq("user_id", user.id)
      .maybeSingle();

    const historicalPosts = (posts || []).map(p => ({
      id: p.id,
      theme: p.theme,
      caption: p.caption?.substring(0, 100),
      type: p.post_type,
      tone: p.tone,
      style: p.style,
      objective: p.objective,
      hashtags_count: p.hashtags?.length || 0,
      analytics: p.post_analytics?.[0] ? {
        likes: p.post_analytics[0].likes_count,
        comments: p.post_analytics[0].comments_count,
        reach: p.post_analytics[0].reach,
        engagement_rate: p.post_analytics[0].engagement_rate
      } : null
    }));

    const draftPosts = (drafts || []).map(d => ({
      id: d.id,
      theme: d.theme,
      caption: d.caption?.substring(0, 100),
      type: d.post_type,
      tone: d.tone,
      style: d.style,
      objective: d.objective,
      hashtags_count: d.hashtags?.length || 0
    }));

    // Groq API Key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    const systemPrompt = `Você é um especialista em analytics preditivo para Instagram de ALTO NÍVEL e RIGOR EXTREMO. Sua tarefa é prever o sucesso de posts em draft com base no histórico.
    
    DIRETRIZES DE RIGOR:
    - NÃO dê 90%+ de chance de sucesso levianamente. Somente posts impecáveis e totalmente alinhados ao histórico vencedor merecem notas altas.
    - Se a imagem (image_prompt) for genérica ou não bater com o tema, a nota deve ser BAIXA (40-60%).
    - Se o objetivo for Conversão mas o CTA for fraco, penalize a nota.
    - Fatores negativos devem ser CRÍTICOS e honestos.
    - O "successScore" deve refletir a REALIDADE do mercado competitivo do Instagram.

    RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
    {
      "predictions": [
        {
          "post_id": "string",
          "post_caption": "string",
          "post_theme": "string",
          "predicted_engagement_rate": number,
          "predicted_reach": number,
          "performance_vs_average": "string",
          "confidence": number,
          "factors": { "positive": ["string"], "negative": ["string"] },
          "recommendation": "string"
        }
      ],
      "summary": {
        "average_predicted_engagement": number,
        "best_performing_type": "string",
        "best_performing_tone": "string",
        "overall_trend": "string",
        "insights": ["string"]
      }
    }`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Empresa: ${profile?.company_name || "N/A"} | Categoria: ${profile?.category || "N/A"}\n\nHistórico: ${JSON.stringify(historicalPosts)}\n\nDrafts: ${JSON.stringify(draftPosts)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Groq API error:", aiResponse.status, errText);
      throw new Error(`Erro na IA (${aiResponse.status})`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta da IA vazia");

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in predict-performance:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
