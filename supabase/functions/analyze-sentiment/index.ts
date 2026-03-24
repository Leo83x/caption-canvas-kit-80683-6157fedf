import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { postId: targetPostId } = await req.json().catch(() => ({}));

    // Get user's Instagram token
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("instagram_access_token, instagram_user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.instagram_access_token || !profile?.instagram_user_id) {
      return new Response(JSON.stringify({ error: "Conecte sua conta do Instagram primeiro" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent media from Instagram
    const mediaResponse = await fetch(
      `https://graph.instagram.com/v20.0/${profile.instagram_user_id}/media?fields=id,caption,comments_count,timestamp&limit=10&access_token=${profile.instagram_access_token}`
    );

    if (!mediaResponse.ok) {
      const errData = await mediaResponse.json();
      console.error("Instagram API error:", errData);
      return new Response(JSON.stringify({ error: "Erro ao acessar dados do Instagram" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mediaData = await mediaResponse.json();
    let posts = mediaData.data || [];
    
    // Filter by specific post if requested
    if (targetPostId) {
      // Find the media ID associated with our database post ID
      const { data: analyticsRow } = await supabase
        .from('post_analytics')
        .select('instagram_media_id')
        .eq('post_id', targetPostId)
        .maybeSingle();
        
      if (analyticsRow?.instagram_media_id) {
        posts = posts.filter((p: any) => p.id === analyticsRow.instagram_media_id);
      }
    }

    // Fetch comments for each post
    const postsWithComments = [];
    for (const post of posts.slice(0, targetPostId ? 1 : 5)) {
      if (post.comments_count > 0) {
        try {
          const commentsResponse = await fetch(
            `https://graph.instagram.com/v20.0/${post.id}/comments?fields=text,timestamp,username&limit=50&access_token=${profile.instagram_access_token}`
          );
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            postsWithComments.push({
              id: post.id,
              caption: post.caption || "",
              comments: (commentsData.data || []).map((c: any) => c.text),
              total: post.comments_count
            });
          }
        } catch (e) {
          console.error(`Error fetching comments for ${post.id}:`, e);
        }
      }
    }

    if (postsWithComments.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Nenhum post com comentários encontrado. Publique conteúdo e receba comentários para analisar." 
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Groq API Key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

    const systemPrompt = `Você é um especialista em análise de sentimento de redes sociais. Analise os comentários dos posts do Instagram e classifique cada um como positivo, negativo ou neutro. Calcule percentuais e identifique tópicos comuns.
    
    RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
    {
      "results": [
        {
          "post_id": "string",
          "post_caption": "string",
          "total_comments": number,
          "sentiment": { "positive": number, "negative": number, "neutral": number },
          "highlights": { "best_comment": "string", "worst_comment": "string", "common_topics": ["string"] }
        }
      ],
      "summary": {
        "overall_sentiment": "string",
        "total_analyzed": number,
        "average_positive": number,
        "average_negative": number,
        "average_neutral": number,
        "recommendations": ["string"]
      }
    }`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise os comentários destes posts:\n${JSON.stringify(postsWithComments, null, 2)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Groq API error:", aiResponse.status, errText);
      throw new Error(`Erro na IA (${aiResponse.status})`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta da IA vazia");

    const result = JSON.parse(content);

    // Persist results to database
    if (result.results && Array.isArray(result.results)) {
      for (const res of result.results) {
        const { error: updateError } = await supabase
          .from("post_analytics")
          .update({
            sentiment_positive: res.sentiment.positive,
            sentiment_negative: res.sentiment.negative,
            sentiment_neutral: res.sentiment.neutral,
            common_topics: res.highlights.common_topics,
            last_updated: new Date().toISOString()
          })
          .eq("instagram_media_id", res.post_id);
          
        if (updateError) {
          console.error(`Error updating sentiment for media ${res.post_id}:`, updateError);
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-sentiment:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 200, // Using 200 so frontend can handle custom error JSON
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
