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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const { postId } = await req.json();

    // Get user's Instagram token
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('instagram_access_token, instagram_user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile?.instagram_access_token || !profile?.instagram_user_id) {
      return new Response(JSON.stringify({ 
        error: 'Conta do Instagram não conectada. Conecte em Configurações > Instagram.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = profile.instagram_access_token;

    // If a specific post ID is provided, refresh only that post
    let postsToRefresh: any[] = [];
    
    if (postId) {
      const { data } = await supabase
        .from('generated_posts')
        .select('id, post_analytics(instagram_media_id)')
        .eq('id', postId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) postsToRefresh = [data];
    } else {
      // Refresh all published posts
      const { data } = await supabase
        .from('generated_posts')
        .select('id, post_analytics(instagram_media_id)')
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);
      
      postsToRefresh = data || [];
    }

    let updatedCount = 0;
    const errors: string[] = [];

    for (const post of postsToRefresh) {
      const mediaId = post.post_analytics?.[0]?.instagram_media_id;
      if (!mediaId) continue;

      try {
        // Fetch metrics from Instagram Graph API
        const metricsUrl = `https://graph.facebook.com/v20.0/${mediaId}?fields=like_count,comments_count,timestamp&access_token=${accessToken}`;
        const metricsResponse = await fetch(metricsUrl);
        const metricsData = await metricsResponse.json();

        if (metricsData.error) {
          console.error(`Error fetching metrics for media ${mediaId}:`, metricsData.error);
          errors.push(`Post ${post.id}: ${metricsData.error.message}`);
          continue;
        }

        // Fetch insights (reach, impressions) - only for non-story posts
        let reach = 0;
        let impressions = 0;

        try {
          const insightsUrl = `https://graph.facebook.com/v20.0/${mediaId}/insights?metric=reach,impressions&access_token=${accessToken}`;
          const insightsResponse = await fetch(insightsUrl);
          const insightsData = await insightsResponse.json();

          if (insightsData.data) {
            for (const metric of insightsData.data) {
              if (metric.name === 'reach') reach = metric.values?.[0]?.value || 0;
              if (metric.name === 'impressions') impressions = metric.values?.[0]?.value || 0;
            }
          }
        } catch (insightError) {
          console.error(`Error fetching insights for media ${mediaId}:`, insightError);
        }

        const likesCount = metricsData.like_count || 0;
        const commentsCount = metricsData.comments_count || 0;
        const totalEngagement = likesCount + commentsCount;
        const engagementRate = reach > 0 ? parseFloat(((totalEngagement / reach) * 100).toFixed(2)) : 0;

        // Upsert analytics
        const { error: upsertError } = await supabase
          .from('post_analytics')
          .update({
            likes_count: likesCount,
            comments_count: commentsCount,
            reach,
            impressions,
            engagement_rate: engagementRate,
            last_updated: new Date().toISOString(),
          })
          .eq('post_id', post.id);

        if (upsertError) {
          console.error(`Error updating analytics for post ${post.id}:`, upsertError);
          errors.push(`Post ${post.id}: ${upsertError.message}`);
        } else {
          updatedCount++;
        }
      } catch (fetchError: any) {
        console.error(`Error processing post ${post.id}:`, fetchError);
        errors.push(`Post ${post.id}: ${fetchError.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `${updatedCount} post(s) atualizado(s)`,
      updatedCount,
      totalPosts: postsToRefresh.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in refresh-analytics:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao atualizar métricas' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
