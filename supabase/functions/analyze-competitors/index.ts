import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { niche, competitors } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!niche || !competitors || competitors.length === 0) throw new Error('Niche and at least one competitor are required');

    console.log(`Analyzing competitors ${competitors.join(', ')} for niche: ${niche}`);

    const systemPrompt = `Você é um Cientista de Dados e Estrategista de Social Media especializado no mercado brasileiro.
Nicho: "${niche}". Concorrentes: ${competitors.join(', ')}.
Gere análise de Benchmarking profunda.`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere a análise baseada nos concorrentes: ${competitors.join(', ')} e no nicho: ${niche}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "benchmark_analysis",
            description: "Return competitor benchmark analysis",
            parameters: {
              type: "object",
              properties: {
                performanceData: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" }, voce: { type: "number" }, mercado: { type: "number" }
                    },
                    required: ["category", "voce", "mercado"]
                  }
                },
                radarData: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      subject: { type: "string" }, A: { type: "number" }, B: { type: "number" }, fullMark: { type: "number" }
                    },
                    required: ["subject", "A", "B", "fullMark"]
                  }
                },
                highlights: {
                  type: "object",
                  properties: {
                    growth: { type: "string" }, growthText: { type: "string" },
                    engagement: { type: "string" }, engagementText: { type: "string" },
                    aiEfficiency: { type: "string" }, aiEfficiencyText: { type: "string" }
                  }
                },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["warning", "opportunity", "strength"] },
                      title: { type: "string" }, description: { type: "string" }
                    },
                    required: ["type", "title", "description"]
                  }
                }
              },
              required: ["performanceData", "radarData", "highlights", "insights"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "benchmark_analysis" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded");
      if (response.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No structured output');
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in analyze-competitors:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
