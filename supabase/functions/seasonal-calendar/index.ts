import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("company_name, category, target_audience, keywords")
      .eq("user_id", user.id)
      .maybeSingle();

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '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';
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const today = new Date().toISOString().split("T")[0];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em marketing de conteúdo brasileiro. Gere um calendário de DATAS ESTRATÉGICAS (comemorativas e sazonais) relevantes para a empresa.
            
REGRAS:
- Considere APENAS datas dos próximos 60 dias a partir de hoje (${today})
- Inclua datas nacionais brasileiras, datas comerciais e datas do nicho da empresa
- Para cada data, sugira 2-3 ideias concretas de posts em pt-BR.
- Ordene por proximidade (mais próximas primeiro)
- Inclua o campo days_until calculado a partir de hoje
- O formato de resposta deve ser um JSON válido contendo um array "dates".`
          },
          {
            role: "user",
            content: `Data de hoje: ${today}
Empresa: ${profile?.company_name || "N/A"}
Categoria: ${profile?.category || "Geral"}  
Público-alvo: ${profile?.target_audience || "Geral"}
Palavras-chave: ${profile?.keywords?.join(", ") || "N/A"}

Gere as próximas 8-10 datas comemorativas relevantes para esta empresa. 
Retorne um JSON com a seguinte estrutura:
{
  "dates": [
    {
      "date": "DD/MM/YYYY",
      "name": "Nome da Data",
      "description": "Por que é importante",
      "category": "Nacional/Comercial/Nicho",
      "days_until": 10,
      "post_ideas": ["ideia 1", "ideia 2"]
    }
  ]
}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    
    // Fallback: Common Brazilian strategic dates
    const fallbackDates = [
      { name: "Dia do Consumidor", date: "15/03/2026", description: "Foco em promoções e fidelização.", category: "Comercial", days_until: 0, post_ideas: ["Oferta relâmpago 24h", "Depoimentos de clientes satisfeitos"] },
      { name: "Dia da Mulher", date: "08/03/2026", description: "Homenagem e empoderamento.", category: "Nacional", days_until: 0, post_ideas: ["História de mulheres na empresa", "Dicas de bem-estar"] },
      { name: "Dia de Tiradentes", date: "21/04/2026", description: "Feriado Nacional.", category: "Nacional", days_until: 30, post_ideas: ["Curiosidades históricas", "Aviso de funcionamento"] },
      { name: "Dia do Trabalho", date: "01/05/2026", description: "Homenagem aos colaboradores.", category: "Nacional", days_until: 40, post_ideas: ["Bastidores da equipe", "Mensagem de gratidão"] },
      { name: "Dia das Mães", date: "10/05/2026", description: "Uma das maiores datas comerciais.", category: "Comercial", days_until: 50, post_ideas: ["Guia de presentes", "Histórias emocionantes de mães"] }
    ].filter(d => {
      const parts = d.date.split('/');
      const date = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
      return date > new Date();
    }).slice(0, 5);

    return new Response(JSON.stringify({ 
      dates: fallbackDates,
      error: error instanceof Error ? error.message : "Unknown error",
      is_fallback: true
    }), {
      status: 200, // Returning 200 with fallback data
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
