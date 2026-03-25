import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { keywords, industry } = await req.json();
    const { data: profile } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).single();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: 'system', content: `Você é um especialista em marketing digital e Instagram Business. Sugira 20 hashtags ESTRATÉGICAS divididas em: MARCA (2-3), NICHO (10-12), CAUDA LONGA (5-7). Evite hashtags banidas.` },
          { role: 'user', content: `Empresa: ${profile?.company_name || 'empresa'}\nSetor: ${industry || 'geral'}\nPúblico: ${profile?.target_audience || 'geral'}\nKeywords: ${keywords || 'marketing digital'}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_hashtags",
            description: "Return strategic hashtag suggestions",
            parameters: {
              type: "object",
              properties: {
                hashtags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tag: { type: "string" }, category: { type: "string" },
                      score: { type: "number" }, estimatedReach: { type: "number" },
                      description: { type: "string" }
                    },
                    required: ["tag", "category", "score", "estimatedReach", "description"]
                  }
                }
              },
              required: ["hashtags"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_hashtags" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded");
      if (response.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error (${response.status})`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No structured output');
    const result = JSON.parse(toolCall.function.arguments);

    // Save to database
    if (result.hashtags && Array.isArray(result.hashtags)) {
      const hashtagsToSave = result.hashtags.map((h: any) => ({
        user_id: user.id, hashtag: h.tag, category: h.category,
        trending_score: h.score,
      }));
      await supabase.from('hashtag_trends').upsert(hashtagsToSave, {
        onConflict: 'user_id,hashtag', ignoreDuplicates: false
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in search-hashtags:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro ao buscar hashtags' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
