import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NodeHtmlMarkdown } from 'https://esm.sh/node-html-markdown';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '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';
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
      customCaption,
      postType = 'feed',
      brandColors = [],
      companyName,
      targetAudience,
      keywords = [],
      maxHashtags = 10,
      userId,
      includeLogo = false,
      logoUrl,
      includeTextOverlay = false,
      suggestedText,
      textPosition = 'center',
      action = 'generate',
      originalCaption,
      targetNetwork,
      sourceUrl,
      selectedImage,
      commentText,
      author,
      companyDescription,
      postCaption,
      isFaceless,
      brandVoice: customBrandVoice
    } = await req.json();

    const brandVoice = customBrandVoice || 'Profissional e acolhedor';

    let sourceContent = "";
    if (sourceUrl) {
      console.log(`Scraping content from: ${sourceUrl}`);
      try {
        const response = await fetch(sourceUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (response.ok) {
          const html = await response.text();
          // Extract title and body content
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : "";
          
          // Use NodeHtmlMarkdown to get a clean text representation
          const markdown = NodeHtmlMarkdown.translate(html);
          // Limit to first 10k chars to avoid blowing up the prompt
          sourceContent = `Título: ${title}\n\nConteúdo:\n${markdown.substring(0, 10000)}`;
          console.log(`Content scraped successfully (${sourceContent.length} chars)`);
        }
      } catch (err) {
        console.error("Error scraping content:", err);
        // Continue without source content if scraping fails
      }
    }

    const safeTheme = theme || '';
    const safeCompanyName = companyName || 'Company';
    const safeBrandColors = Array.isArray(brandColors) ? brandColors : [];

    console.log('Generating post with params:', { action, objective, theme: safeTheme, tone, style, postType });

    if (action === 'adapt') {
      const adaptPrompt = `Você é um Consultor de Marketing Digital Estratégico.
Adapte a legenda de Instagram abaixo para a rede social: ${targetNetwork}.
Adequação para LinkedIn: Tom profissional, focado em carreira, business, networking ou aprendizado.
Adequação para Twitter/X: Direto, curto, conciso, se possivel usando gatilho visual ou curiosidade.
Retorne um JSON contendo apenas o campo "adaptedText".
Legenda Original:
"${originalCaption}"`;

      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [{ role: 'user', content: adaptPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI API Error: ${aiResponse.status} - ${errText}`);
      }
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');
      const result = JSON.parse(content);

      return new Response(JSON.stringify({ adaptedText: result.adaptedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-reply') {
      const replySystemPrompt = `Você é um gestor de redes sociais especialista em engajamento. 
      Seu objetivo é responder a comentários no Instagram de forma autêntica, amigável e estratégica.
      
      VOZ DA MARCA: ${brandVoice}
      SOBRE A EMPRESA: ${companyDescription}
      
      DIRETRIZES:
      1. Seja breve e direto (máximo 2-3 frases).
      2. Use emojis se apropriado para a voz da marca.
      3. Trate o usuário pelo nome/username: ${author}.
      4. Se for uma dúvida, responda de forma prestativa.
      5. Se for um elogio, agradeça com entusiasmo.
      6. Se for uma crítica, seja diplomático e profissional.
      
      O post original tinha a legenda: "${postCaption}"`;

      const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            { role: "system", content: replySystemPrompt },
            { role: "user", content: `Responda a este comentário: "${commentText}" feito por ${author}.` }
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI API Error: ${aiResponse.status} - ${errText}`);
      }
      
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content?.trim();
      
      if (!content) {
        console.error("Empty content from AI. Response:", JSON.stringify(aiData));
        throw new Error("A IA não retornou conteúdo. Tente novamente.");
      }

      return new Response(JSON.stringify({ reply: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AI Credits Check
    if (userId) {
      const { data: creditResult, error: creditError } = await supabase.rpc('decrement_ai_credits', {
        user_uuid: userId,
        amount: 1
      });

      if (creditError) {
        console.error('Error checking credits:', creditError);
      } else if (creditResult && creditResult.length > 0 && !creditResult[0].success) {
        return new Response(JSON.stringify({
          error: 'Insufficient AI credits. Please upgrade your plan.',
          creditsRemaining: creditResult[0].remaining
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Compliance Validation
    const checkCompliance = (text: string): { safe: boolean; reason?: string } => {
      const healthClaims = /garant|cura|milagre|100%|promessa/gi;
      if (healthClaims.test(text)) {
        return { safe: false, reason: 'Contains unauthorized health claims' };
      }
      return { safe: true };
    };

    const compliance = checkCompliance(safeTheme);
    if (!compliance.safe) {
      return new Response(JSON.stringify({
        error: 'Content not allowed',
        reason: compliance.reason,
        requiresReview: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isCarousel = postType === 'carousel';
    const isYoutubeThumb = postType === 'youtube_thumb';
    const isReel = postType === 'reel';
    const carouselSlidesCount = isCarousel ? 4 : 0; 
    const aspectRatio = isYoutubeThumb ? '16:9' : (postType === 'story' || isReel ? '9:16' : '1:1');
    const maxCaptionLength = isYoutubeThumb ? 100 : (postType === 'story' ? '125' : '300');

    const systemPrompt = `Você é um Consultor de Marketing Digital Estratégico. Seu papel é gerar posts altamente conversíveis e otimizados para redes sociais.
    
    ${sourceContent ? `CONTEÚDO DE ORIGEM PARA RECICLAGEM:
    Abaixo está o conteúdo extraído do link fornecido pelo usuário. Use este conteúdo como a base factual e temática para criar o post, mantendo a essência mas adaptando para o formato de rede social escolhido.
    ---
    ${sourceContent}
    ---` : ''}

REGRAS OBRIGATÓRIAS:
1. Gere EXATAMENTE 2 variações para teste A/B:
   - Variante A: Focada em conversão direta, chamadas fortes.
   - Variante B: Focada em storytelling e conexão emocional.

2. Limites & SEO 2.0 (Busca Orgânica):
   - Legenda máx: 2200 caracteres (Recomendado: ${maxCaptionLength} para engajamento rápido).
   - Incorpore naturalmente 3-5 palavras-chave com alto volume de busca orgânica no texto da legenda, sem parecer artificial (SEO).
   - Hashtags: Gere de 5 a ${maxHashtags} hashtags ultra-nichadas e estratégicas no final. Não use hashtags genéricas.

3. Estrutura da Legenda:
   - Hook: Primeira linha magnética para prender a atenção (deve aparecer antes do "ver mais").
   - Body: 1-2 parágrafos de valor ou explicação persuasiva.
   - CTA: Uma "Call to Action" claríssima e de fácil execução.
   ${brandVoice ? `- Personalidade da Marca (Brand Voice): ${brandVoice}. Use este tom e estilo linguístico obrigatoriamente.` : ''}
   ${isYoutubeThumb ? '- Nota: Como é uma Thumbnail de YouTube, foque mais nos elementos visuais e no título impactante (headlineText) do que na legenda.' : ''}

4. ${includeTextOverlay ? `TEXTO SOBRE A IMAGEM (Text Overlay):
   - Gere um "headlineText" curto (máx 6 palavras) em PORTUGUÊS para estampar a arte.
   - Deve ser impactante e capturar atenção em frações de segundo.
   ${suggestedText ? `- Baseie-se nesta sugestão: "${suggestedText}"` : ''}` : ''}

5. ${isCarousel ? `CARROSSEL (OBRIGATÓRIO):
   - Gere uma lista de 4 slides ("slides") para cada variação.
   - Cada slide deve ser uma cena que conta uma história progressiva.
   - Slide 1: Gancho visual forte. Slide 2-3: Conteúdo/Dicas. Slide 4: Fechamento/CTA.
   - Cada slide deve ter seu próprio "imagePrompt", "altText" e "headlineText".` : ''}

6. ${isReel ? `VÍDEO/REELS SCRIPT (OBRIGATÓRIO):
   - Como o formato é Reel/Vídeo Curto, gere um roteiro detalhado ("videoScript") para a gravação.
   - O array "videoScript" deve conter de 3 a 6 cenas.
   - Cada cena da lista deve ter:
     - "scene": número ou nome da cena (Ex: "Cena 1 - Gancho")
     - "description": o que focar visualmente e ângulo da câmera.
     - "duration": tempo estimado (Ex: "0:03")
     - "text": sugestão do texto que vai aparecer na tela nesta cena.
     ${isFaceless ? '- "videoKeywords": 3-4 palavras-chave em INGLÊS para buscar um vídeo de fundo (stock video) condizente (Ex: "cinematic nature forest", "business office luxury").' : ''}` : ''}

7. PROMPT DE IMAGEM (VITAL):
   - Gere um "imagePrompt" EXTREMAMENTE visual e descritivo em INGLÊS.
   - Evite apenas nomes de marcas. Descreva o ambiente, a iluminação ("cinematic lighting", "neon glow"), o ângulo da câmera e a composição.
   - Foque no ESTILO escolhido (${style}). Ex: Se for fotografia, mencione texturas, profundidade de campo ou tipo de lente.
   - O objetivo é que o gerador de imagem entenda o contexto VISUAL completo, não apenas o tema abstrato.

7. PONTUAÇÃO PREDITIVA (SCORE):
   - Calcule um "successScore" (0-100) REALISTA. Seja CRÍTICO. 
   - Forneça uma breve "successAnalysis" justificando a nota de forma técnica.

RETORNE NESTE EXATO FORMATO JSON (NADA ALÉM DISSO):
{
  "variations": [
    {
      "variant": "A",
      "caption": "Legenda focada em Conversão (Strong Hooks/CTA)",
      "hashtags": ["#marketing", "#vendas"],
      "successScore": 85,
      "successAnalysis": "Texto persuasivo com gatilhos de escassez.",
      "imagePrompt": {
        "description": "Visual focus on product/result, high contrast, bold colors",
        "style": "${style}",
        "aspectRatio": "${aspectRatio}"
      },
      "altText": "Product showcase",
      "rationale": "Variant A focuses on direct conversion.",
      ${includeTextOverlay ? `"headlineText": "OFERTA IMPERDÍVEL",` : ''}
      "textOverlay": { "position": "${textPosition}" }
    },
    {
      "variant": "B",
      "caption": "Legenda focada em Storytelling (Emotional Connection)",
      "hashtags": ["#lifestyle", "#conexao"],
      "successScore": 78,
      "successAnalysis": "Gera identificação através de narrativa.",
      "imagePrompt": {
        "description": "Lifestyle/human-centric setup, soft lighting, warm tones",
        "style": "${style}",
        "aspectRatio": "${aspectRatio}"
      },
      "altText": "People interacting",
      "rationale": "Variant B focuses on building brand authority and trust.",
      ${includeTextOverlay ? `"headlineText": "VIVA A EXPERIÊNCIA",` : ''}
      "textOverlay": { "position": "${textPosition}" },
      ${isReel ? `"videoScript": [
        { "scene": "...", "description": "...", "duration": "...", "text": "..." ${isFaceless ? ', "videoKeywords": "..."' : ''} }
      ]` : ''}
    }
  ]
}
`;

    const userPrompt = `Empresa: ${safeCompanyName}\nCores da Marca: ${safeBrandColors.join(', ')}\nTags/Keywords da Conta: ${keywords.join(', ')}\nObjetivo: ${objective}\nTema Especial: ${safeTheme}\nTom de Voz: ${tone}\nPúblico Alvo: ${targetAudience}\nEstilo: ${style}\nChamada para Ação Sugerida (CTA): ${cta || 'Nenhuma'}\n\nLembre-se: ATUE COMO CONSULTOR DE MARKETING E RETORNE APENAS O JSON.`;


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
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      throw new Error(`AI API Error: ${aiResponse.status} - ${errBody}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const result = JSON.parse(content);
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    async function processImage(variation: any, promptData: any, folder: string) {
      if (selectedImage) {
        console.log("Using selected library image instead of generating:", selectedImage);
        return selectedImage;
      }
      try {
        const colorsDesc = safeBrandColors.length > 0 ? `colors: ${safeBrandColors.join(', ')}, ` : '';
        const desc = promptData?.description || promptData || 'Professional social media post';
        const finalPrompt = encodeURIComponent(`${desc}, ${colorsDesc}${style} style, high quality, 4k, professional photography, clean composition`);
        const width = isYoutubeThumb ? 1920 : 1080;
        const height = isYoutubeThumb ? 1080 : (postType === 'story' ? 1920 : 1080);

        const primaryUrl = `https://image.pollinations.ai/prompt/${finalPrompt}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 100000)}&nologo=true`;
        const secondaryUrl = `https://api.airforce/v1/imagine?prompt=${finalPrompt}&size=${width}:${height}`;
        const fallbackUrl = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=${width}&q=80`;

        let imgResponse = await fetch(primaryUrl);
        
        if (!imgResponse.ok || imgResponse.status === 500) {
          console.log("Pollinations failed or returned 500. Trying Airforce...");
          imgResponse = await fetch(secondaryUrl);
        }
        
        if (!imgResponse.ok || imgResponse.status === 500) {
           console.log("Airforce failed. Using generic Unsplash fallback...");
           imgResponse = await fetch(fallbackUrl);
        }

        if (imgResponse.ok) {
          const blob = await imgResponse.blob();
          const fileName = `${crypto.randomUUID()}.png`;
          const filePath = `${folder}/${fileName}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('generated-images')
            .upload(filePath, await blob.arrayBuffer(), { contentType: 'image/png' });

          if (!uploadError) {
            const { data: urlData } = supabaseClient.storage.from('generated-images').getPublicUrl(filePath);
            return urlData.publicUrl;
          }
          return fallbackUrl;
        }
        return fallbackUrl;
      } catch (e) {
        console.error('Image upload error:', e);
        return `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80`;
      }
    }

    // Process all variations in parallel
    await Promise.all(result.variations.map(async (variation: any) => {
      // Process Cover Image
      const coverPromise = processImage(variation, variation.imagePrompt, userId || 'anonymous');
      
      // Process Slides if carousel in parallel
      let slidesPromises: Promise<any>[] = [];
      if (variation.slides && Array.isArray(variation.slides)) {
        slidesPromises = variation.slides.map((slide: any) => 
          processImage(variation, slide.imagePrompt, userId || 'anonymous')
            .then(url => { slide.image_url = url; })
        );
      }
      
      const [coverUrl] = await Promise.all([coverPromise, ...slidesPromises]);
      variation.imageUrl = coverUrl;
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Final Error in generate-post:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error",
      details: error.stack || "No stack trace",
      context: "generate-post-function"
    }), {
      status: 200, // Returning 200 to ensure the frontend can parse the JSON error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
