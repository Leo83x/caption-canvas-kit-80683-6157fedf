import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase.from("company_profiles")
      .select("company_name, category, target_audience, keywords").eq("user_id", user.id).maybeSingle();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Você é um especialista em marketing de conteúdo brasileiro. Gere um calendário de datas estratégicas relevantes para a empresa nos próximos 60 dias a partir de ${today}.` },
          { role: "user", content: `Empresa: ${profile?.company_name || "N/A"}\nCategoria: ${profile?.category || "Geral"}\nPúblico: ${profile?.target_audience || "Geral"}\nKeywords: ${profile?.keywords?.join(", ") || "N/A"}\n\nGere 8-10 datas comemorativas relevantes.` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "calendar_dates",
            description: "Return strategic calendar dates",
            parameters: {
              type: "object",
              properties: {
                dates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" }, name: { type: "string" }, description: { type: "string" },
                      category: { type: "string" }, days_until: { type: "number" },
                      post_ideas: { type: "array", items: { type: "string" } }
                    },
                    required: ["date", "name", "description", "category", "days_until", "post_ideas"]
                  }
                }
              },
              required: ["dates"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "calendar_dates" } },
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    const fallbackDates = [
      { name: "Dia do Consumidor", date: "15/03/2026", description: "Foco em promoções.", category: "Comercial", days_until: 0, post_ideas: ["Oferta relâmpago", "Depoimentos"] },
      { name: "Dia do Trabalho", date: "01/05/2026", description: "Homenagem aos colaboradores.", category: "Nacional", days_until: 40, post_ideas: ["Bastidores da equipe", "Mensagem de gratidão"] },
      { name: "Dia das Mães", date: "10/05/2026", description: "Grande data comercial.", category: "Comercial", days_until: 50, post_ideas: ["Guia de presentes", "Histórias de mães"] }
    ];
    return new Response(JSON.stringify({ dates: fallbackDates, is_fallback: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
