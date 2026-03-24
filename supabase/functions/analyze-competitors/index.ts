import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, competitors } = await req.json();

    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    if (!niche || !competitors || competitors.length === 0) {
      throw new Error('Niche and at least one competitor are required');
    }

    console.log(`Analyzing competitors ${competitors.join(', ')} for niche: ${niche}`);

    const systemPrompt = `Você é um Cientista de Dados e Estrategista Chefe de Social Media especializado no mercado brasileiro.
O usuário atua no nicho de: "${niche}".
E os principais concorrentes que ele mapeou são: ${competitors.join(', ')}.

Sua tarefa é simular uma análise de Benchmarking profunda e inteligente entre o perfil do usuário e as médias estimadas ou tendências reais conhecidas (ou muito plausíveis) para esses concorrentes nesse exato nicho.
Gere UM ÚNICO JSON em português brasileiro contendo a seguinte e EXATA estrutura, sem marcações markdown extra ou blocos de código além do próprio JSON:

{
  "performanceData": [
    { "category": "Engajamento (%)", "voce": [numero aleatorio plausível ex: 4.8], "mercado": [numero ex: 3.2] },
    { "category": "Alcance Médio", "voce": [num ex: 12500], "mercado": [num] },
    { "category": "Cliques/Link", "voce": [num ex: 320], "mercado": [num] },
    { "category": "Salvamentos", "voce": [num], "mercado": [num] }
  ],
  "radarData": [
    { "subject": "Consistência", "A": [sua pontuacao max 100], "B": [mercado max 100], "fullMark": 100 },
    { "subject": "Qualidade Visual", "A": [sua pontuacao max 100], "B": [mercado max 100], "fullMark": 100 },
    { "subject": "Inovação", "A": [sua pontuacao max 100], "B": [mercado max 100], "fullMark": 100 },
    { "subject": "Interação", "A": [sua pontuacao max 100], "B": [mercado max 100], "fullMark": 100 },
    { "subject": "Frequência", "A": [sua pontuacao max 100], "B": [mercado max 100], "fullMark": 100 }
  ],
  "highlights": {
    "growth": "+[número ex: 24]%",
    "growthText": "[texto curto ex: Acima da média do mercado]",
    "engagement": "[numero ex: 4.8]%",
    "engagementText": "[texto curto ex: Sua taxa é 1.5x maior que o nicho]",
    "aiEfficiency": "[Alta/Média]",
    "aiEfficiencyText": "[texto curto]"
  },
  "insights": [
    {
      "type": "warning", 
      "title": "Gargalo de Interação",
      "description": "Explique um ponto onde o mercado está melhor, focando nos concorrentes indicados."
    },
    {
      "type": "opportunity",
      "title": "Oportunidade de Formato",
      "description": "Explique uma oportunidade (ex: Reels, Carrossel) que os concorrentes não usam."
    },
    {
      "type": "strength",
      "title": "Dominância Identificada",
      "description": "Explique o principal ponto forte do usuário frente à concorrência."
    }
  ]
}

REGRAS:
- Os números devem ser críveis e fazer sentido matemático (engajamento entre 0.5% e 15%, etc).
- Use os nomes dos concorrentes fornecidos na descrição dos Insights.
- O formato final de saída DEVE ser estritamente o JSON sem NENHUM texto antes ou depois (sem \`\`\`json ou explicações).`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere a análise JSON baseada nos concorrentes: ${competitors.join(', ')} e no meu nicho: ${niche}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter error:', errorData);
      throw new Error('Falha ao comunicar com a IA');
    }

    const data = await response.json();
    let textOut = data.choices[0]?.message?.content?.trim() || "{}";
    
    // Strip markdown formatting if any
    if (textOut.startsWith("```json")) {
      textOut = textOut.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (textOut.startsWith("```")) {
      textOut = textOut.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(textOut);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', textOut);
      throw new Error('A resposta da IA não foi um JSON válido.');
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-competitors function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
