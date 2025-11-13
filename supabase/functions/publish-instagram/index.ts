import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  scheduledPostId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Não autorizado");
    }

    const { scheduledPostId } = (await req.json()) as PublishRequest;

    // Get scheduled post details
    const { data: scheduledPost, error: scheduleError } = await supabaseClient
      .from("scheduled_posts")
      .select("*, generated_posts(*)")
      .eq("id", scheduledPostId)
      .single();

    if (scheduleError || !scheduledPost) {
      throw new Error("Post agendado não encontrado");
    }

    // Get Instagram credentials
    const { data: profile, error: profileError } = await supabaseClient
      .from("company_profiles")
      .select("instagram_access_token, instagram_user_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.instagram_access_token || !profile?.instagram_user_id) {
      throw new Error("Credenciais do Instagram não configuradas. Configure em Configurações → Instagram.");
    }

    const { instagram_access_token, instagram_user_id } = profile;

    // Validar tipo de token (Instagram Basic Display não é suportado)
    if (instagram_access_token.startsWith("IG") || instagram_access_token.startsWith("IGQV")) {
      throw new Error(
        "O token informado parece do Instagram Basic Display (IG/IGQV). Para publicar, gere um User Access Token do Facebook Graph (normalmente começa com EAA) com as permissões instagram_basic, pages_show_list e instagram_content_publish."
      );
    }

    // Validar formato básico do token
    if (instagram_access_token.length < 50) {
      throw new Error("Access Token parece estar incompleto. Verifique se copiou o token completo.");
    }

    const post = scheduledPost.generated_posts;

    if (!post) {
      throw new Error("Post não encontrado");
    }

    console.log("Publishing to Instagram:", {
      userId: instagram_user_id,
      caption: post.caption?.substring(0, 50),
      hasImage: !!post.image_url,
    });

    // Step 1: Create media container
    const mediaUrl = `https://graph.facebook.com/v18.0/${instagram_user_id}/media`;
    
    const mediaParams = new URLSearchParams({
      image_url: post.image_url || "",
      caption: `${post.caption}\n\n${post.hashtags.join(" ")}`,
      access_token: instagram_access_token,
    });

    console.log("Creating media container...");
    const mediaResponse = await fetch(`${mediaUrl}?${mediaParams.toString()}`, {
      method: "POST",
    });

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error("Media creation error:", errorData);
      
      // Mensagens de erro mais claras
      if (errorData.includes("Invalid OAuth access token")) {
        throw new Error("Access Token inválido ou expirado. Por favor, gere um novo token no Meta for Developers e atualize em Configurações → Instagram.");
      }
      if (errorData.includes("permissions")) {
        throw new Error("Permissões insuficientes. Certifique-se que o token tem as permissões: instagram_basic, instagram_content_publish");
      }
      
      throw new Error(`Erro ao criar mídia no Instagram: ${errorData}`);
    }

    const mediaData = await mediaResponse.json();
    const creationId = mediaData.id;

    console.log("Media container created:", creationId);

    // Step 2: Publish the media
    const publishUrl = `https://graph.facebook.com/v18.0/${instagram_user_id}/media_publish`;
    
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: instagram_access_token,
    });

    console.log("Publishing media...");
    const publishResponse = await fetch(`${publishUrl}?${publishParams.toString()}`, {
      method: "POST",
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text();
      console.error("Publish error:", errorData);
      throw new Error(`Erro ao publicar: ${errorData}`);
    }

    const publishData = await publishResponse.json();
    const mediaId = publishData.id;

    console.log("Media published successfully:", mediaId);

    // Update scheduled post status
    const { error: updateError } = await supabaseClient
      .from("scheduled_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        instagram_media_id: mediaId,
      })
      .eq("id", scheduledPostId);

    if (updateError) {
      console.error("Error updating post status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mediaId,
        message: "Post publicado com sucesso no Instagram!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error publishing to Instagram:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao publicar no Instagram",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
