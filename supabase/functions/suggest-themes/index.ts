import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Groq API Key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    const systemPrompt = `Você é um especialista em marketing de conteúdo e estratégia de redes sociais. 
Baseado no perfil da empresa fornecido, sugira 5 temas de conteúdo estratégicos e relevantes.

Para cada tema, forneça:
- theme_name: Nome criativo e atrativo do tema
- description: Descrição detalhada do tema (2-3 frases)
- category: Uma das seguintes: "Conteúdo Educativo", "Promoções", "Engajamento", "Bastidores", "Dicas"
- frequency: Uma das seguintes: "daily", "weekly", "biweekly", "monthly"
- suggested_hashtags: Array de 5-8 hashtags relevantes (inclua # no início)

Considere o público-alvo, nicho de mercado, tom de voz e palavras-chave da empresa para criar sugestões personalizadas e efetivas.

RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
{
  "themes": [
    {
      "theme_name": "Nome...",
      "description": "Descrição...",
      "category": "Categoria...",
      "frequency": "weekly",
      "suggested_hashtags": ["#tag1", "#tag2"]
    }
  ]
}`;

    const userPrompt = `Perfil da Empresa:
- Nome: ${profile.company_name}
- Categoria: ${profile.category || 'Não especificada'}
- Bio: ${profile.bio || 'Não especificada'}
- Tom de Voz: ${profile.default_tone || 'professional'}
- Público-Alvo: ${profile.target_audience || 'Não especificado'}
- Palavras-chave: ${profile.keywords?.join(', ') || 'Nenhuma'}

Gere 5 temas de conteúdo personalizados para esta empresa.`;

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
      throw new Error('Falha ao processar resposta da IA');
    }

    if (!result.themes || !Array.isArray(result.themes)) {
      throw new Error('Resposta da IA inválida: propriedade "themes" ausente ou não é array');
    }

    return new Response(JSON.stringify({ suggestions: result.themes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-themes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
