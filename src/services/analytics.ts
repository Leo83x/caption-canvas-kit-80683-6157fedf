import { supabase } from "@/integrations/supabase/client";

export interface EngagementMetrics {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    engagementRate: number;
}

export interface PostPerformance {
    postId: string;
    caption: string;
    imageUrl: string | null;
    createdAt: string;
    metrics: EngagementMetrics;
}

export interface AnalyticsSummary {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalReach: number;
    totalImpressions: number;
    averageEngagementRate: number;
    topPosts: PostPerformance[];
    dailyMetrics: { date: string; engagement: number; reach: number }[];
}

function calculateEngagementRate(data: any): number {
    const interactions = (data?.likes_count || data?.likes || 0) + (data?.comments_count || data?.comments || 0) + (data?.shares || 0) + (data?.saves || 0);
    const reach = data?.reach || 1;
    return Number(((interactions / reach) * 100).toFixed(2));
}

/**
 * Busca métricas de um post específico
 */
export async function getPostMetrics(postId: string): Promise<EngagementMetrics | null> {
    try {
        const { data, error } = await supabase
            .from('post_analytics')
            .select('*')
            .eq('generated_post_id', postId)
            .single();

        if (error) throw error;

        const d = data as any;
        return {
            likes: d.likes_count || 0,
            comments: d.comments_count || 0,
            shares: d.shares || 0,
            saves: d.saves || 0,
            reach: d.reach || 0,
            impressions: d.impressions || 0,
            engagementRate: calculateEngagementRate(d),
        };
    } catch (error) {
        console.error('Error fetching post metrics:', error);
        return null;
    }
}

/**
 * Busca resumo de analytics do usuário
 */
export async function getAnalyticsSummary(userId: string, days: number = 30): Promise<AnalyticsSummary | null> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: posts, error } = await supabase
            .from('generated_posts')
            .select(`
        id,
        caption,
        image_url,
        created_at,
        post_analytics (
          likes_count,
          comments_count,
          shares,
          saves,
          reach,
          impressions
        )
      ` as any)
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        const postsWithMetrics: PostPerformance[] = (posts as any[])
            .filter(post => post.post_analytics && post.post_analytics.length > 0)
            .map(post => {
                const analytics = post.post_analytics[0];
                const metrics: EngagementMetrics = {
                    likes: analytics.likes_count || 0,
                    comments: analytics.comments_count || 0,
                    shares: analytics.shares || 0,
                    saves: analytics.saves || 0,
                    reach: analytics.reach || 0,
                    impressions: analytics.impressions || 0,
                    engagementRate: calculateEngagementRate(analytics),
                };

                return {
                    postId: post.id,
                    caption: post.caption,
                    imageUrl: post.image_url,
                    createdAt: post.created_at,
                    metrics,
                };
            });

        const totals = postsWithMetrics.reduce(
            (acc, post) => ({
                likes: acc.likes + post.metrics.likes,
                comments: acc.comments + post.metrics.comments,
                shares: acc.shares + post.metrics.shares,
                saves: acc.saves + post.metrics.saves,
                reach: acc.reach + post.metrics.reach,
                impressions: acc.impressions + post.metrics.impressions,
            }),
            { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
        );

        const avgEngagement =
            postsWithMetrics.length > 0
                ? postsWithMetrics.reduce((sum, p) => sum + p.metrics.engagementRate, 0) / postsWithMetrics.length
                : 0;

        return {
            totalPosts: postsWithMetrics.length,
            totalLikes: totals.likes,
            totalComments: totals.comments,
            totalShares: totals.shares,
            totalSaves: totals.saves,
            totalReach: totals.reach,
            totalImpressions: totals.impressions,
            averageEngagementRate: Number(avgEngagement.toFixed(2)),
            topPosts: postsWithMetrics.slice(0, 5),
            dailyMetrics: [],
        };
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        return null;
    }
}
