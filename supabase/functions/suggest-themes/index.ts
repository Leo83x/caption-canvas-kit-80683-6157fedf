import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).single();
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: 'system', content: `Você é um especialista em marketing de conteúdo e estratégia de redes sociais. Sugira 5 temas de conteúdo estratégicos.` },
          { role: 'user', content: `Empresa: ${profile.company_name}\nCategoria: ${profile.category || 'N/A'}\nBio: ${profile.bio || 'N/A'}\nTom: ${profile.default_tone || 'professional'}\nPúblico: ${profile.target_audience || 'N/A'}\nKeywords: ${profile.keywords?.join(', ') || 'N/A'}\n\nGere 5 temas personalizados.` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_themes",
            description: "Return 5 content theme suggestions",
            parameters: {
              type: "object",
              properties: {
                themes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      theme_name: { type: "string" },
                      description: { type: "string" },
                      category: { type: "string" },
                      frequency: { type: "string", enum: ["daily", "weekly", "biweekly", "monthly"] },
                      suggested_hashtags: { type: "array", items: { type: "string" } }
                    },
                    required: ["theme_name", "description", "category", "frequency", "suggested_hashtags"]
                  }
                }
              },
              required: ["themes"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_themes" } }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded");
      if (response.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error (${response.status}): ${errText.substring(0, 100)}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No structured output');
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ suggestions: result.themes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-themes:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
