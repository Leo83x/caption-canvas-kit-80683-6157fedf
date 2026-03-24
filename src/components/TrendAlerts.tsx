import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, ArrowRight, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrendAlert } from "@/types";

interface TrendAlertsProps {
  onSelectTrend: (trend: string) => void;
}

export const TrendAlerts = ({ onSelectTrend }: TrendAlertsProps) => {
  const [trends, setTrends] = useState<TrendAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-trend-alerts');
        if (error) throw error;
        setTrends(data.trends || []);
      } catch (err) {
        console.error("Error fetching trends, using local fallback:", err);
        setTrends([
          {
            id: '1',
            title: 'Lançamento do iPhone 16',
            description: 'Discussões sobre novas câmeras e IA da Apple estão no topo.',
            category: 'Tecnologia',
            relevance_score: 95,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'IA Generativa em Alta',
            description: 'Novos modelos de vídeo estão viralizando. Use para mostrar inovação.',
            category: 'Marketing',
            relevance_score: 92,
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) return null;
  if (trends.length === 0) return null;

  return (
    <div className="glass-card-white p-4 md:p-5 rounded-3xl border-none overflow-hidden relative group transition-all duration-500 hover:shadow-[0_20px_40px_rgba(124,58,237,0.15)]">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 via-accent/5 to-pink-500/5 opacity-50" />
      
      <div 
        className="flex items-center justify-between cursor-pointer relative z-10" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white/40 dark:bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white/40">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground/90 uppercase tracking-[0.15em] italic">Trend Alerts <span className="text-muted-foreground/40 font-medium not-italic ml-1">(Newsjacking)</span></h3>
            {!isExpanded && (
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Clique para ver as oportunidades do momento</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-white/40 dark:bg-white/10 backdrop-blur-md rounded-full border border-white/50 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {trends.length} em alta
          </div>
          <div className="h-8 w-8 rounded-full hover:bg-white/40 flex items-center justify-center transition-colors">
            {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 flex gap-5 overflow-x-auto pb-4 scrollbar-none animate-in fade-in slide-in-from-top-4 relative z-10 px-1">
          {trends.map((trend) => (
            <div 
              key={trend.id}
              className="flex-shrink-0 w-72 p-5 glass-card-white rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group/card"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg border border-primary/20">
                  {trend.category}
                </span>
                <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {trend.relevance_score}%
                </span>
              </div>
              <h4 className="font-black text-sm mb-2 line-clamp-1 group-hover/card:text-primary transition-colors tracking-tight text-foreground/90">
                {trend.title}
              </h4>
              <p className="text-xs font-medium text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed">
                {trend.description}
              </p>
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full text-[10px] h-9 bg-white/60 dark:bg-white/5 hover:bg-primary hover:text-white group font-black uppercase tracking-widest rounded-xl transition-all duration-300 border border-white/40"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTrend(trend.title);
                }}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" /> Aproveitar agora
                <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
