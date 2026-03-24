import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/dotenv@v3.2.0/load.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commentText, author, brandVoice, companyDescription, postCaption } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || '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';
    if (!OPENROUTER_API_KEY) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }

    const systemPrompt = `Você é um gestor de redes sociais especialista em engajamento. 
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://studiogenius.ai",
        "X-Title": "Studio Genius",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Responda a este comentário: "${commentText}" feito por ${author}.` }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const aiData = await response.json();
    const reply = aiData.choices[0].message.content.trim();

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating reply:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
