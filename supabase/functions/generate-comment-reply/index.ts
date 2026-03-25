import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { commentText, author, brandVoice, companyDescription, postCaption } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um gestor de redes sociais especialista em engajamento. 
    Responda a comentários no Instagram de forma autêntica, amigável e estratégica.
    VOZ DA MARCA: ${brandVoice}
    SOBRE A EMPRESA: ${companyDescription}
    DIRETRIZES:
    1. Seja breve e direto (máximo 2-3 frases).
    2. Use emojis se apropriado.
    3. Trate o usuário pelo nome: ${author}.
    4. Se dúvida, responda prestativa. Se elogio, agradeça. Se crítica, seja diplomático.
    O post original: "${postCaption}"`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Responda a este comentário: "${commentText}" feito por ${author}.` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) throw new Error("Rate limit exceeded");
      if (response.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty AI response");

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating reply:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
