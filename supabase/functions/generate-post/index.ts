import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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

    const { 
      objective, 
      theme, 
      tone = 'professional',
      style = 'photography',
      cta,
      postType = 'feed',
      brandColors = [],
      companyName,
      targetAudience,
      keywords = [],
      maxHashtags = 10,
      userId
    } = await req.json();

    console.log('Generating post with params:', { objective, theme, tone, style, postType });

    // Validação de compliance e segurança
    const checkCompliance = (text: string): { safe: boolean; reason?: string } => {
      const healthClaims = /garant|cura|milagre|100%|promessa/gi;
      if (healthClaims.test(text)) {
        return { safe: false, reason: 'Contém alegações de saúde não permitidas' };
      }
      return { safe: true };
    };

    const compliance = checkCompliance(theme);
    if (!compliance.safe) {
      return new Response(JSON.stringify({ 
        error: 'Conteúdo não permitido',
        reason: compliance.reason,
        requiresReview: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determinar aspect ratio baseado no tipo de post
    const aspectRatio = postType === 'story' ? '9:16' : '1:1';
    const maxCaptionLength = postType === 'story' ? 125 : 300;

    // System prompt detalhado conforme especificações
    const systemPrompt = `Você é um especialista em marketing digital e Instagram Business. 
Sua função é gerar posts PROFISSIONAIS otimizados para máximo engajamento.

REGRAS OBRIGATÓRIAS:
1. Sempre gere EXATAMENTE 2 variações para teste A/B:
   - Variação A: Direta, objetiva, foco em CONVERSÃO (CTA forte, benefício imediato)
   - Variação B: Emocional, storytelling, foco em RELACIONAMENTO (conexão humana)

2. Limites do Instagram:
   - Legenda máxima: 2.200 caracteres (recomendado: ${maxCaptionLength} chars para maior engajamento)
   - Hashtags: máximo 30 (recomendado: 5-15 relevantes)
   - ${postType === 'story' ? 'Stories: texto curto com CTA clara' : 'Feed: primeira linha deve ser um HOOK impactante'}

3. Estrutura da legenda:
   - Hook: Primeira linha chamativa (emojis opcionais conforme tom)
   - Desenvolvimento: 1-2 linhas explicativas
   - CTA: Call-to-action clara e específica
   ${tone === 'formal' ? '- Usar 0-1 emojis' : '- Usar até 3 emojis relevantes'}

4. Hashtags (máximo ${maxHashtags}, 3 níveis):
   - 2-4 hashtags de MARCA (ex: #${companyName?.toLowerCase().replace(/\s/g, '')})
   - 4-6 de NICHO intermediário (alcance médio)
   - 2-4 de CAUDA LONGA (específicas, menos concorridas)
   - NUNCA usar hashtags banidas (#like4like, #follow4follow)

5. Prompt de imagem DETALHADO:
   - Descrição visual completa
   - Paleta de cores sugerida: ${brandColors.length > 0 ? brandColors.join(', ') : 'moderna e vibrante'}
   - Estilo: ${style}
   - Aspect ratio: ${aspectRatio}
   - Elementos de marca
   - Sensação desejada
   ${postType === 'story' ? '- Composição vertical (1080x1920)' : '- Composição quadrada ou 4:5 com espaço para texto'}

6. Alt text: máximo 125 caracteres (SEO + acessibilidade)

7. Rationale: Explicação estratégica (1-2 linhas) sobre escolhas de tom e hashtags

RETORNE UM JSON VÁLIDO com este formato EXATO:
{
  "variations": [
    {
      "variant": "A",
      "caption": "legenda com hook + conteúdo + CTA",
      "hashtags": ["#tag1", "#tag2"],
      "imagePrompt": {
        "description": "descrição detalhada",
        "colors": ["cor1", "cor2"],
        "style": "${style}",
        "aspectRatio": "${aspectRatio}",
        "elements": ["elemento1", "elemento2"],
        "mood": "sensação desejada"
      },
      "altText": "texto alternativo conciso",
      "rationale": "explicação estratégica"
    },
    {
      "variant": "B",
      ...
    }
  ],
  "metadata": {
    "objective": "${objective}",
    "tone": "${tone}",
    "postType": "${postType}",
    "requiresReview": false,
    "reviewReason": null
  }
}`;

    const userPrompt = `
Empresa: ${companyName || 'empresa'}
Público-alvo: ${targetAudience || 'geral'}
Palavras-chave: ${keywords.join(', ') || 'inovação, qualidade'}

OBJETIVO: ${objective}
TEMA: ${theme}
${cta ? `CTA SUGERIDA: ${cta}` : ''}

Gere 2 variações otimizadas (A/B) com legendas, hashtags E prompts de imagem DETALHADOS.
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de taxa excedido. Tente novamente em alguns instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('AI response não contém conteúdo válido');
    }

    console.log('AI response content:', content);

    // Parse JSON da resposta
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

    // Validar estrutura da resposta
    if (!result.variations || !Array.isArray(result.variations) || result.variations.length !== 2) {
      return new Response(JSON.stringify({ 
        error: 'Resposta da IA em formato inválido',
        expected: 'Array com 2 variações'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully generated post variations');

    // Generate images for each variation using Lovable AI
    console.log('Generating images for variations...');
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    
    for (const variation of result.variations) {
      try {
        const imagePrompt = `${variation.imagePrompt.description}. Style: ${variation.imagePrompt.style}. Colors: ${variation.imagePrompt.colors.join(', ')}. Mood: ${variation.imagePrompt.mood}. High quality Instagram post image, professional photography, ultra high resolution.`;
        
        console.log(`Generating image for variant ${variation.variant} with prompt:`, imagePrompt);
        
        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: imagePrompt
            }],
            modalities: ['image', 'text']
          })
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error(`Image generation failed for variant ${variation.variant}:`, errorText);
          throw new Error(`Image generation failed: ${errorText}`);
        }

        const imageData = await imageResponse.json();
        const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (!base64Image) {
          throw new Error('No image returned from AI');
        }

        // Convert base64 to blob and upload to Supabase Storage
        const base64Data = base64Image.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `${crypto.randomUUID()}.png`;
        const filePath = `${userId || 'anonymous'}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabaseClient
          .storage
          .from('generated-images')
          .upload(filePath, binaryData, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabaseClient
          .storage
          .from('generated-images')
          .getPublicUrl(filePath);

        variation.imageUrl = urlData.publicUrl;
        console.log(`Image generated and uploaded for variant ${variation.variant}:`, variation.imageUrl);
        
      } catch (imageError: any) {
        console.error(`Failed to generate image for variant ${variation.variant}:`, imageError);
        variation.imageUrl = null;
        variation.imageError = imageError.message;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-post function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao gerar post',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
