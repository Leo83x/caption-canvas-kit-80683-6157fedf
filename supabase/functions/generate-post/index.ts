import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { NodeHtmlMarkdown } from 'https://esm.sh/node-html-markdown';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callLovableAI(messages: any[], options: { temperature?: number; tools?: any[]; tool_choice?: any } = {}) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages,
    temperature: options.temperature ?? 0.7,
  };
  if (options.tools) {
    body.tools = options.tools;
    body.tool_choice = options.tool_choice;
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) throw new Error("Rate limit exceeded. Try again later.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please add funds.");
    throw new Error(`AI API Error: ${response.status} - ${errText}`);
  }

  return await response.json();
}

async function generateImage(prompt: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return null;

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch (e) {
    console.error("Image generation error:", e);
    return null;
  }
}

async function uploadBase64Image(base64DataUrl: string, folder: string, supabaseClient: any): Promise<string> {
  try {
    const base64Data = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${crypto.randomUUID()}.png`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('generated-images')
      .upload(filePath, binaryData, { contentType: 'image/png' });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return base64DataUrl; // Return the base64 as fallback
    }

    const { data: urlData } = supabaseClient.storage.from('generated-images').getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (e) {
    console.error("Upload error:", e);
    return base64DataUrl;
  }
}

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

    const {
      objective, theme, tone = 'professional', style = 'photography',
      cta, customCaption, postType = 'feed', brandColors = [],
      companyName, targetAudience, keywords = [], maxHashtags = 10,
      userId, includeLogo = false, logoUrl, includeTextOverlay = false,
      suggestedText, textPosition = 'center', action = 'generate',
      originalCaption, targetNetwork, sourceUrl, selectedImage,
      commentText, author, companyDescription, postCaption,
      isFaceless, brandVoice: customBrandVoice
    } = await req.json();

    const brandVoice = customBrandVoice || 'Profissional e acolhedor';

    // --- ACTION: ADAPT ---
    if (action === 'adapt') {
      const aiData = await callLovableAI([
        { role: 'user', content: `Você é um Consultor de Marketing Digital Estratégico.
Adapte a legenda de Instagram abaixo para a rede social: ${targetNetwork}.
Adequação para LinkedIn: Tom profissional, focado em carreira, business, networking ou aprendizado.
Adequação para Twitter/X: Direto, curto, conciso, se possivel usando gatilho visual ou curiosidade.
Retorne um JSON contendo apenas o campo "adaptedText".
Legenda Original:
"${originalCaption}"` }
      ], {
        tools: [{
          type: "function",
          function: {
            name: "adapt_text",
            description: "Return adapted text for the target network",
            parameters: {
              type: "object",
              properties: { adaptedText: { type: "string" } },
              required: ["adaptedText"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "adapt_text" } }
      });

      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      const result = toolCall ? JSON.parse(toolCall.function.arguments) : { adaptedText: "" };

      return new Response(JSON.stringify({ adaptedText: result.adaptedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ACTION: GENERATE REPLY ---
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

      const aiData = await callLovableAI([
        { role: "system", content: replySystemPrompt },
        { role: "user", content: `Responda a este comentário: "${commentText}" feito por ${author}.` }
      ], { temperature: 0.7 });

      const content = aiData.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("A IA não retornou conteúdo. Tente novamente.");

      return new Response(JSON.stringify({ reply: content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- ACTION: GENERATE POST ---

    // AI Credits Check
    if (userId) {
      const { data: creditResult, error: creditError } = await supabase.rpc('decrement_ai_credits', {
        user_uuid: userId, amount: 1
      });
      if (creditError) console.error('Error checking credits:', creditError);
      else if (creditResult?.length > 0 && !creditResult[0].success) {
        return new Response(JSON.stringify({
          error: 'Insufficient AI credits. Please upgrade your plan.',
          creditsRemaining: creditResult[0].remaining
        }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Compliance Validation
    const safeTheme = theme || '';
    const healthClaims = /garant|cura|milagre|100%|promessa/gi;
    if (healthClaims.test(safeTheme)) {
      return new Response(JSON.stringify({
        error: 'Content not allowed', reason: 'Contains unauthorized health claims', requiresReview: true
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Scrape source URL if provided
    let sourceContent = "";
    if (sourceUrl) {
      try {
        const response = await fetch(sourceUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (response.ok) {
          const html = await response.text();
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : "";
          const markdown = NodeHtmlMarkdown.translate(html);
          sourceContent = `Título: ${title}\n\nConteúdo:\n${markdown.substring(0, 10000)}`;
        }
      } catch (err) {
        console.error("Error scraping content:", err);
      }
    }

    const safeCompanyName = companyName || 'Company';
    const safeBrandColors = Array.isArray(brandColors) ? brandColors : [];
    const isCarousel = postType === 'carousel';
    const isYoutubeThumb = postType === 'youtube_thumb';
    const isReel = postType === 'reel';
    const aspectRatio = isYoutubeThumb ? '16:9' : (postType === 'story' || isReel ? '9:16' : '1:1');
    const maxCaptionLength = isYoutubeThumb ? 100 : (postType === 'story' ? 125 : 300);

    console.log('Generating post with Lovable AI:', { action, objective, theme: safeTheme, tone, style, postType });

    const systemPrompt = `Você é um Consultor de Marketing Digital Estratégico. Seu papel é gerar posts altamente conversíveis e otimizados para redes sociais.
    
    ${sourceContent ? `CONTEÚDO DE ORIGEM PARA RECICLAGEM:\n${sourceContent}\n---` : ''}

REGRAS OBRIGATÓRIAS:
1. Gere EXATAMENTE 2 variações para teste A/B:
   - Variante A: Focada em conversão direta.
   - Variante B: Focada em storytelling e conexão emocional.

2. Limites & SEO:
   - Legenda máx: 2200 caracteres (Recomendado: ${maxCaptionLength}).
   - Incorpore 3-5 palavras-chave naturalmente.
   - Hashtags: 5 a ${maxHashtags} hashtags ultra-nichadas.

3. Estrutura da Legenda:
   - Hook: Primeira linha magnética.
   - Body: 1-2 parágrafos de valor.
   - CTA: Call to Action clara.
   ${brandVoice ? `- Brand Voice: ${brandVoice}.` : ''}
   ${isYoutubeThumb ? '- Como YouTube Thumbnail, foque em título impactante.' : ''}

4. ${includeTextOverlay ? `TEXTO SOBRE A IMAGEM: Gere "headlineText" (máx 6 palavras) em PORTUGUÊS. ${suggestedText ? `Baseie-se em: "${suggestedText}"` : ''}` : ''}

5. ${isCarousel ? `CARROSSEL: Gere 4 slides com "imagePrompt", "altText" e "headlineText" cada.` : ''}

6. ${isReel ? `REELS: Gere "videoScript" com 3-6 cenas (scene, description, duration, text${isFaceless ? ', videoKeywords' : ''}).` : ''}

7. PROMPT DE IMAGEM: Gere "imagePrompt" descritivo em INGLÊS com detalhes de iluminação, ângulo e composição. Estilo: ${style}.

8. PONTUAÇÃO: "successScore" (0-100) realista com "successAnalysis".`;

    const userPrompt = `Empresa: ${safeCompanyName}\nCores: ${safeBrandColors.join(', ')}\nKeywords: ${keywords.join(', ')}\nObjetivo: ${objective}\nTema: ${safeTheme}\nTom: ${tone}\nPúblico: ${targetAudience}\nEstilo: ${style}\nCTA: ${cta || 'Nenhuma'}\n\nRETORNE APENAS O JSON.`;

    const variationSchema = {
      type: "object",
      properties: {
        variant: { type: "string" },
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
        successScore: { type: "number" },
        successAnalysis: { type: "string" },
        imagePrompt: {
          type: "object",
          properties: {
            description: { type: "string" },
            style: { type: "string" },
            aspectRatio: { type: "string" }
          },
          required: ["description", "style", "aspectRatio"]
        },
        altText: { type: "string" },
        rationale: { type: "string" },
        headlineText: { type: "string" },
        slides: { type: "array", items: { type: "object" } },
        videoScript: { type: "array", items: { type: "object" } },
        textOverlay: { type: "object" }
      },
      required: ["variant", "caption", "hashtags", "successScore", "successAnalysis", "imagePrompt", "altText", "rationale"]
    };

    const aiData = await callLovableAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.8,
      tools: [{
        type: "function",
        function: {
          name: "generate_post_variations",
          description: "Generate post variations for A/B testing",
          parameters: {
            type: "object",
            properties: {
              variations: { type: "array", items: variationSchema }
            },
            required: ["variations"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "generate_post_variations" } }
    });

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No structured output from AI');
    const result = JSON.parse(toolCall.function.arguments);

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Process images for each variation
    async function processImage(variation: any, promptData: any, folder: string) {
      if (selectedImage) return selectedImage;

      try {
        const desc = promptData?.description || promptData || 'Professional social media post';
        const colorsDesc = safeBrandColors.length > 0 ? `colors: ${safeBrandColors.join(', ')}, ` : '';
        const fullPrompt = `${desc}, ${colorsDesc}${style} style, high quality, 4k, professional photography, clean composition`;

        const base64Url = await generateImage(fullPrompt);
        if (base64Url) {
          return await uploadBase64Image(base64Url, folder, supabaseClient);
        }

        // Fallback to Unsplash
        return `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80`;
      } catch (e) {
        console.error('Image processing error:', e);
        return `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80`;
      }
    }

    // Process all variations in parallel
    await Promise.all(result.variations.map(async (variation: any) => {
      const coverPromise = processImage(variation, variation.imagePrompt, userId || 'anonymous');
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
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
