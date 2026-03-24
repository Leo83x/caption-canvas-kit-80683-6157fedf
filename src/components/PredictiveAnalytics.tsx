import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Sparkles, Loader2, Target, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

interface PostPrediction {
  post_id: string;
  post_caption: string;
  post_theme: string;
  predicted_engagement_rate: number;
  predicted_reach: number;
  performance_vs_average: string;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendation: string;
}

interface PredictionSummary {
  average_predicted_engagement: number;
  best_performing_type: string;
  best_performing_tone: string;
  overall_trend: string;
  insights: string[];
}

export function PredictiveAnalytics() {
  const [predictions, setPredictions] = useState<PostPrediction[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const predictPerformance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-performance");
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPredictions(data.predictions || []);
      setSummary(data.summary || null);
      toast.success("Análise preditiva concluída!");
    } catch (error: any) {
      console.error("Error predicting:", error);
      toast.error(error.message || "Erro na análise preditiva");
    } finally {
      setLoading(false);
    }
  };

  const performanceColor = (perf: string) => {
    if (perf.includes("above")) return "text-green-600 dark:text-green-400";
    if (perf.includes("below")) return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  return (
    <Card className="p-6 shadow-smooth">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Painel Preditivo</h2>
        </div>
        <Button onClick={predictPerformance} disabled={loading} size="sm" variant="outline">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Prever Desempenho
            </>
          )}
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary/5 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{summary.average_predicted_engagement}%</p>
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Média de Engajamento</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 text-center flex flex-col justify-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-sm font-bold truncate px-1">{summary.best_performing_type}</p>
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Melhor Formato</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 text-center flex flex-col justify-center">
            <p className="text-sm font-bold mt-1 truncate px-1">{summary.best_performing_tone}</p>
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Melhor Tom</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 text-center flex flex-col justify-center">
            <p className="text-sm font-bold mt-1 truncate px-1">{summary.overall_trend}</p>
            <p className="text-[9px] uppercase font-bold text-muted-foreground">Tendência</p>
          </div>
        </div>
      )}

      {summary?.insights && summary.insights.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg mb-6 border-l-4 border-primary">
          <h4 className="text-sm font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Insights da IA
          </h4>
          <ul className="space-y-1">
            {summary.insights.map((insight, i) => (
              <li key={i} className="text-xs text-muted-foreground">{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {predictions.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Previsões por Post</h3>
          {predictions.map((pred, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{pred.post_theme}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{pred.post_caption}</p>
                </div>
                <div className="flex items-center gap-1">
                  {pred.performance_vs_average.includes("above") ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-bold ${performanceColor(pred.performance_vs_average)}`}>
                    {pred.performance_vs_average}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Engagement:</span>{" "}
                  <span className="font-bold">{pred.predicted_engagement_rate}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reach:</span>{" "}
                  <span className="font-bold">{pred.predicted_reach}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[9px] font-bold">Confiança:</span>{" "}
                  <span className="font-bold">{pred.confidence}%</span>
                </div>
              </div>

              <Progress value={pred.confidence} className="h-1.5" />

              <p className="text-xs text-muted-foreground italic">💡 {pred.recommendation}</p>
            </div>
          ))}
        </div>
      ) : !loading && !summary ? (
        <p className="text-sm text-muted-foreground text-center py-6 italic">
          Clique em "Prever Desempenho" para que a IA analise seu histórico e preveja o desempenho de futuros posts.
        </p>
      ) : null}
    </Card>
  );
}
