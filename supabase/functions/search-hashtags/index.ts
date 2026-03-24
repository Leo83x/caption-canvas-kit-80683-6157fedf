import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get JWT token from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { keywords, industry } = await req.json();

    console.log('Searching hashtags for:', { keywords, industry, userId: user.id });

    // Get company profile to understand the business
    const { data: profile } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Groq API Key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    // Use AI to suggest relevant hashtags based on the business profile
    const systemPrompt = `Você é um especialista em marketing digital e Instagram Business.
Sua função é sugerir hashtags ESTRATÉGICAS e RELEVANTES para empresas no Instagram.

REGRAS:
1. Sugira EXATAMENTE 20 hashtags divididas em 3 categorias:
   - MARCA (2-3): hashtags exclusivas da marca/empresa
   - NICHO (10-12): hashtags relevantes para o setor, com alcance médio (10k-500k posts)
   - CAUDA LONGA (5-7): hashtags específicas, menos concorridas (<10k posts)

2. Para cada hashtag, forneça:
   - tag: a hashtag (com #)
   - category: "Marca", "Nicho" ou "Cauda Longa"
   - score: relevância estimada (0-100)
   - estimatedReach: alcance estimado em posts
   - description: breve explicação de por que é relevante

3. EVITE hashtags banidas ou spam (#like4like, #follow4follow, etc.)

4. FOQUE em hashtags que o público-alvo realmente busca

RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
{
  "hashtags": [
    {
      "tag": "#exemplohashtag",
      "category": "Nicho",
      "score": 85,
      "estimatedReach": 150000,
      "description": "Popular entre o público-alvo"
    }
  ]
}`;

    const userPrompt = `
Empresa: ${profile?.company_name || 'empresa'}
Setor: ${industry || profile?.industry || 'geral'}
Público-alvo: ${profile?.target_audience || 'geral'}
Palavras-chave para busca: ${keywords || 'marketing digital'}

Sugira 20 hashtags estratégicas para essa empresa usar no Instagram.
`;

    console.log('Calling Groq API (Model: llama-3.3-70b-versatile)...');

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Groq API error:', aiResponse.status, errorText);
      throw new Error(`Erro na IA (${aiResponse.status}): ${errorText.substring(0, 100)}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq response não contém conteúdo válido');
    }

    let result;
    try {
      // Extrair JSON do markdown se necessário
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return new Response(JSON.stringify({
        error: 'Falha ao processar resposta da IA',
        details: content
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to database for future reference
    if (result.hashtags && Array.isArray(result.hashtags)) {
      const hashtagsToSave = result.hashtags.map((h: any) => ({
        user_id: user.id,
        hashtag: h.tag,
        category: h.category,
        score: h.score,
        usage_count: 0,
      }));

      // Upsert hashtags (update if exists, insert if not)
      const { error: insertError } = await supabase
        .from('hashtag_trends')
        .upsert(hashtagsToSave, {
          onConflict: 'user_id,hashtag',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error saving hashtags:', insertError);
        // Don't fail the request, just log it
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in search-hashtags function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro ao buscar hashtags',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
