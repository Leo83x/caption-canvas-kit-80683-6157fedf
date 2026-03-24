import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Eye, TrendingUp, RefreshCw, Hash, Clock, Users, Brain, MessageCircleHeart, ThumbsUp, ThumbsDown, Minus, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BestTimeInsight } from "@/components/BestTimeInsight";
import { SentimentAnalysis } from "@/components/SentimentAnalysis";
import { PredictiveAnalytics } from "@/components/PredictiveAnalytics";

export default function Analytics() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hashtagData, setHashtagData] = useState<any[]>([]);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);

  useEffect(() => {
    loadPostsWithAnalytics();
    loadHashtagPerformance();
  }, []);

  const loadPostsWithAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: postsData } = await supabase
        .from("generated_posts")
        .select(`*, post_analytics (*), scheduled_posts (status, instagram_media_id)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Error loading analytics");
    } finally {
      setLoading(false);
    }
  };

  const loadHashtagPerformance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("generated_posts")
        .select("hashtags, post_analytics(*)")
        .eq("user_id", user.id)
        .not("post_analytics", "is", null);

      const hashtagMap = new Map();
      data?.forEach((post) => {
        const analytics = post.post_analytics?.[0];
        if (analytics) {
          post.hashtags.forEach((tag: string) => {
            const current = hashtagMap.get(tag) || { hashtag: tag, engagement: 0, reach: 0, count: 0 };
            current.engagement += analytics.likes_count + analytics.comments_count;
            current.reach += analytics.reach || 0;
            current.count += 1;
            hashtagMap.set(tag, current);
          });
        }
      });

      const topHashtags = Array.from(hashtagMap.values())
        .map((h) => ({ ...h, avgEngagement: Math.round(h.engagement / h.count) }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 10);

      setHashtagData(topHashtags);
    } catch (error) {
      console.error("Error loading hashtag performance:", error);
    }
  };

  const refreshAnalytics = async (postId?: string) => {
    const toastId = toast.loading("Updating metrics...");
    try {
      const { data, error } = await supabase.functions.invoke("refresh-analytics", {
        body: { postId },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || "Metrics updated!", { id: toastId });
        await loadPostsWithAnalytics();
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (error: any) {
      console.error("Error refreshing analytics:", error);
      toast.error(error.message || "Error updating metrics", { id: toastId });
    }
  };

  const runSentimentAnalysis = async (postId?: string) => {
    if (postId) setAnalyzingIds(prev => [...prev, postId]);
    const toastId = toast.loading(postId ? "Analisando sentimento..." : "Analisando todos os sentimentos...");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
        body: { postId }
      });

      if (error) throw error;
      toast.success("Análise de sentimento concluída!", { id: toastId });
      await loadPostsWithAnalytics();
    } catch (error: any) {
      console.error("Error analyzing sentiment:", error);
      toast.error(error.message || "Erro na análise de sentimento", { id: toastId });
    } finally {
      if (postId) setAnalyzingIds(prev => prev.filter(id => id !== postId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Desempenho</span>
            <span className="text-foreground/20">Pro</span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
            Análise detalhada, previsões estratégicas e sentimento do público
          </p>
        </div>
        <Button onClick={() => refreshAnalytics()} variant="outline" className="border-primary/20 hover:bg-primary/5 shrink-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Métricas
        </Button>
      </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto bg-muted/30 p-1 rounded-xl">
            <TabsTrigger value="posts" className="data-[state=active]:bg-background">Posts</TabsTrigger>
            <TabsTrigger value="hashtags" className="data-[state=active]:bg-background">Hashtags</TabsTrigger>
            <TabsTrigger value="timing" className="flex items-center gap-1 data-[state=active]:bg-background">
              <Clock className="h-3 w-3" />
              Melhores Horários
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="flex items-center gap-1 data-[state=active]:bg-background">
              <MessageCircleHeart className="h-3 w-3" />
              Sentimento
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-1 data-[state=active]:bg-background">
              <Brain className="h-3 w-3" />
              Preditivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {posts.length === 0 ? (
              <Card className="p-8 md:p-12 text-center border-none shadow-smooth ring-1 ring-border">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg md:text-xl font-bold mb-2">Nenhum post ainda</h3>
                <p className="text-sm md:text-base text-muted-foreground italic">
                  Publique seus primeiros posts no Instagram para ver as métricas de desempenho aqui.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6">
                {posts.map((post) => {
                  const analytics = post.post_analytics?.[0];
                  const isPublished = post.scheduled_posts?.some((s: any) => s.status === 'published' && s.instagram_media_id);
                  return (
                    <Card key={post.id} className="p-4 md:p-6 shadow-smooth hover:shadow-glow transition-smooth">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                        {post.image_url && (
                          <div className="w-full md:w-40 h-40 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                            <img src={post.image_url} alt={post.alt_text || "Post"} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="secondary">{post.post_type}</Badge>
                              <Badge variant="outline">{post.variant}</Badge>
                            </div>
                            <p className="text-sm line-clamp-2 text-muted-foreground">{post.caption}</p>
                          </div>
                          {analytics ? (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                              <div className="flex items-center gap-2 text-sm bg-muted/20 px-2 py-1 rounded">
                                <Heart className="h-4 w-4 text-pink-500" />
                                <span className="font-bold">{analytics.likes_count}</span>
                                <span className="text-muted-foreground hidden md:inline ml-1 uppercase text-[10px] font-bold">Curtidas</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-muted/20 px-2 py-1 rounded">
                                <MessageCircle className="h-4 w-4 text-blue-500" />
                                <span className="font-bold">{analytics.comments_count}</span>
                                <span className="text-muted-foreground hidden md:inline ml-1 uppercase text-[10px] font-bold">Comentários</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-muted/20 px-2 py-1 rounded">
                                <Share2 className="h-4 w-4 text-green-500" />
                                <span className="font-bold">{analytics.shares_count}</span>
                                <span className="text-muted-foreground hidden md:inline ml-1 uppercase text-[10px] font-bold">Salvos</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-muted/20 px-2 py-1 rounded">
                                <Eye className="h-4 w-4 text-purple-500" />
                                <span className="font-bold">{analytics.reach}</span>
                                <span className="text-muted-foreground hidden md:inline ml-1 uppercase text-[10px] font-bold">Alcance</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-muted/20 px-2 py-1 rounded">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                <span className="font-bold">{analytics.engagement_rate}%</span>
                                <span className="text-muted-foreground hidden md:inline ml-1 uppercase text-[10px] font-bold">Engaj.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              {!isPublished ? (
                                <>Aguardando publicação no Instagram</>
                              ) : (
                                <>Clique em "Atualizar Métricas" para ver o desempenho</>
                              )}
                            </div>
                          )}

                          {analytics && (analytics.sentiment_positive > 0 || analytics.sentiment_negative > 0 || analytics.sentiment_neutral > 0) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-medium transition-colors hover:bg-green-500/20">
                                <ThumbsUp className="h-3 w-3" />
                                <span>{analytics.sentiment_positive}% Positivo</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-600 text-[10px] font-medium transition-colors hover:bg-red-500/20">
                                <ThumbsDown className="h-3 w-3" />
                                <span>{analytics.sentiment_negative}% Negativo</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-[10px] font-medium transition-colors hover:bg-yellow-500/20">
                                <Minus className="h-3 w-3" />
                                <span>{analytics.sentiment_neutral}% Neutro</span>
                              </div>
                              {analytics.common_topics && analytics.common_topics.length > 0 && (
                                <div className="flex gap-1 ml-auto">
                                  {analytics.common_topics.slice(0, 3).map((topic: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-[9px] h-5 bg-muted/50">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => refreshAnalytics(post.id)} className="flex-1 md:flex-none">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {analytics ? 'Atualizar Métricas' : 'Buscar Métricas'}
                            </Button>
                            {isPublished && (!analytics || (!analytics.sentiment_positive && !analytics.sentiment_negative)) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => runSentimentAnalysis(post.id)} 
                                disabled={analyzingIds.includes(post.id)}
                                className="flex-1 md:flex-none border-primary/30 hover:bg-primary/5"
                              >
                                {analyzingIds.includes(post.id) ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                                )}
                                Analisar Sentimento
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-6">
            <Card className="p-6 border-none shadow-smooth ring-1 ring-border">
              <div className="flex items-center gap-2 mb-6">
                <Hash className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-display font-bold">Performance das Hashtags</h2>
              </div>
              {hashtagData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={hashtagData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hashtag" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgEngagement" fill="hsl(var(--primary))" name="Média de Engajamento" />
                    <Bar dataKey="count" fill="hsl(var(--accent))" name="Frequência" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic">
                  Publique posts com hashtags para visualizar a análise de performance aqui.
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="timing" className="space-y-6">
            <BestTimeInsight />
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <SentimentAnalysis />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-6">
            <PredictiveAnalytics />
          </TabsContent>
        </Tabs>
    </div>
  );
}
