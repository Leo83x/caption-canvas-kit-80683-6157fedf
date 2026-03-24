import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || 'AIzaSyDdj3DOJ7tY6A1HcTDQvSUNHvjJ-Xv4xWc';

        const systemPrompt = `Você é um especialista em marketing digital e Instagram Business.
Sua função é gerar variações de posts para Instagram (Feed, Story ou Reel) baseadas no objetivo e tema fornecidos.

REGRAS:
1. Gere EXATAMENTE 2 variações.
2. Cada variação deve ter:
   - variant: "A" ou "B"
   - caption: Legenda persuasiva com emojis (máx 2000 caracteres)
   - hashtags: String com 10-15 hashtags relevantes
   - imagePrompt: Objeto com { description: "descrição detalhada visual", style: "estilo visual" }
   - rationale: Por que esta variação funciona para o objetivo
   - altText: Texto alternativo para acessibilidade
   - headlineText: Texto sugerido para sobreposição na imagem (curto e impactante)

RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
{
  "variations": [
    {
      "variant": "A",
      "caption": "...",
      "hashtags": "...",
      "imagePrompt": { "description": "...", "style": "..." },
      "rationale": "...",
      "altText": "...",
      "headlineText": "..."
    }
  ]
}`;

        const userPrompt = `
Objetivo: conversion
Tema: Nova função: Fluxo de Automação
Tom: professional
Tipo: feed
`;

        const geminiPayload = {
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 4000,
                responseMimeType: "application/json"
            }
        };

        console.log('Testing full generate-post simulation (2.0-flash)...');
        const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });
        const genData = await genResponse.json();

        return new Response(JSON.stringify({
            status: genResponse.status,
            raw_response: genData,
            content: genData.candidates?.[0]?.content?.parts?.[0]?.text
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
