/**
 * Serviço de Analytics
 * Integração com Instagram Insights API
 */

import { supabase } from '@/integrations/supabase/client';

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
    imageUrl?: string;
    publishedAt: string;
    metrics: EngagementMetrics;
}

export interface AnalyticsSummary {
    totalPosts: number;
    totalEngagement: number;
    averageEngagementRate: number;
    topPost: PostPerformance | null;
    recentPosts: PostPerformance[];
    growthRate: number;
}

/**
 * Calcula taxa de engajamento
 */
export function calculateEngagementRate(metrics: Partial<EngagementMetrics>): number {
    const { likes = 0, comments = 0, shares = 0, saves = 0, reach = 0 } = metrics;

    if (reach === 0) return 0;

    const totalEngagement = likes + comments + (shares * 2) + (saves * 3);
    return (totalEngagement / reach) * 100;
}

/**
 * Busca métricas de um post específico
 */
export async function getPostMetrics(postId: string): Promise<EngagementMetrics | null> {
    try {
        const { data, error } = await supabase
            .from('post_analytics')
            .select('*')
            .eq('post_id', postId)
            .single();

        if (error) throw error;

        return {
            likes: data.likes || 0,
            comments: data.comments || 0,
            shares: data.shares || 0,
            saves: data.saves || 0,
            reach: data.reach || 0,
            impressions: data.impressions || 0,
            engagementRate: calculateEngagementRate(data),
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
          likes,
          comments,
          shares,
          saves,
          reach,
          impressions
        )
      `)
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        const postsWithMetrics: PostPerformance[] = posts
            .filter(post => post.post_analytics && post.post_analytics.length > 0)
            .map(post => {
                const analytics = post.post_analytics[0];
                const metrics: EngagementMetrics = {
                    likes: analytics.likes || 0,
                    comments: analytics.comments || 0,
                    shares: analytics.shares || 0,
                    saves: analytics.saves || 0,
                    reach: analytics.reach || 0,
                    impressions: analytics.impressions || 0,
                    engagementRate: calculateEngagementRate(analytics),
                };

                return {
                    postId: post.id,
                    caption: post.caption || '',
                    imageUrl: post.image_url,
                    publishedAt: post.created_at,
                    metrics,
                };
            });

        const totalEngagement = postsWithMetrics.reduce(
            (sum, post) => sum + (post.metrics.likes + post.metrics.comments + post.metrics.shares + post.metrics.saves),
            0
        );

        const averageEngagementRate = postsWithMetrics.length > 0
            ? postsWithMetrics.reduce((sum, post) => sum + post.metrics.engagementRate, 0) / postsWithMetrics.length
            : 0;

        const topPost = postsWithMetrics.length > 0
            ? postsWithMetrics.reduce((top, post) =>
                post.metrics.engagementRate > top.metrics.engagementRate ? post : top
            )
            : null;

        return {
            totalPosts: postsWithMetrics.length,
            totalEngagement,
            averageEngagementRate,
            topPost,
            recentPosts: postsWithMetrics.slice(0, 10),
            growthRate: 0, // TODO: Calcular baseado em dados históricos
        };
    } catch (error) {
        console.error('Error fetching analytics summary:', error);
        return null;
    }
}

/**
 * Formata número para exibição (1.2K, 1.5M, etc)
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Formata porcentagem
 */
export function formatPercentage(num: number): string {
    return num.toFixed(2) + '%';
}
