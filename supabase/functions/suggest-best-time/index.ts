import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
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

    // Fetch user's published posts with analytics
    const { data: posts } = await supabase
      .from("generated_posts")
      .select("id, created_at, post_type, tone, post_analytics(*), theme")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch scheduled posts to understand patterns
    const { data: scheduled } = await supabase
      .from("scheduled_posts")
      .select("scheduled_date, scheduled_time, status")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: false })
      .limit(50);

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("category, target_audience, company_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const postsInfo = (posts || []).map(p => ({
      created: p.created_at,
      type: p.post_type,
      tone: p.tone,
      analytics: p.post_analytics?.[0] || null,
      theme: p.theme
    }));

    const scheduleInfo = (scheduled || []).map(s => ({
      date: s.scheduled_date,
      time: s.scheduled_time,
      status: s.status
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em social media analytics. Analise os dados de posts e sugira os melhores horários para publicação no Instagram.
Considere:
- Padrões de engajamento dos posts anteriores
- Horários típicos de alta atividade no Instagram no Brasil
- O nicho e público-alvo da empresa
- Dias da semana com melhor performance

Se não houver dados suficientes, use benchmarks do mercado brasileiro.`
          },
          {
            role: "user",
            content: `Empresa: ${profile?.company_name || "N/A"} | Categoria: ${profile?.category || "N/A"} | Público: ${profile?.target_audience || "N/A"}

Posts anteriores: ${JSON.stringify(postsInfo)}
Agendamentos: ${JSON.stringify(scheduleInfo)}

Analise e recomende os 5 melhores horários para postar.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "recommend_times",
            description: "Retorna recomendações de melhores horários para postar",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "Dia da semana (ex: Segunda-feira)" },
                      time: { type: "string", description: "Horário recomendado (ex: 18:00)" },
                      confidence: { type: "number", description: "Nível de confiança 0-100" },
                      reason: { type: "string", description: "Motivo da recomendação" }
                    },
                    required: ["day", "time", "confidence", "reason"]
                  }
                },
                summary: { type: "string", description: "Resumo geral das recomendações" }
              },
              required: ["recommendations", "summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "recommend_times" } }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de taxa excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI API error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
