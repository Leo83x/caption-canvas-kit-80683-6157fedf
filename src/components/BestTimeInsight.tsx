import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Sparkles, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface TimeRecommendation {
  day: string;
  time: string;
  confidence: number;
  reason: string;
}

export function BestTimeInsight() {
  const [recommendations, setRecommendations] = useState<TimeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const analyzebestTimes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-best-time");

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRecommendations(data.recommendations || []);
      setSummary(data.summary || null);
      toast.success("Análise de horários concluída!");
    } catch (error: any) {
      console.error("Error analyzing times:", error);
      toast.error(error.message || "Erro ao analisar horários");
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (confidence >= 60) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  };

  return (
    <Card className="p-6 shadow-smooth">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Melhores Horários com IA</h2>
        </div>
        <Button onClick={analyzebestTimes} disabled={loading} size="sm" variant="outline">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analisar Horários
            </>
          )}
        </Button>
      </div>

      {summary && (
        <p className="text-sm text-muted-foreground mb-4 p-3 bg-primary/5 rounded-lg">
          {summary}
        </p>
      )}

      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 min-w-[140px]">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{rec.day}</span>
                <span className="text-sm text-primary font-bold">{rec.time}</span>
              </div>
              <Badge className={`${confidenceColor(rec.confidence)} text-[10px] uppercase font-bold`}>
                {rec.confidence}% de confiança
              </Badge>
              <p className="text-xs text-muted-foreground flex-1 hidden md:block">{rec.reason}</p>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground text-center py-6 italic">
          Clique em "Analisar Horários" para receber recomendações personalizadas baseadas no seu histórico.
        </p>
      ) : null}
    </Card>
  );
}
