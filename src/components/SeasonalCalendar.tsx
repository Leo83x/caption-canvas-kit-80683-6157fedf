import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarHeart, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SeasonalDate {
  date: string;
  name: string;
  description: string;
  post_ideas: string[];
  days_until: number;
  category: string;
}

export function SeasonalCalendar() {
  const [seasonalDates, setSeasonalDates] = useState<SeasonalDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadSeasonalDates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seasonal-calendar");
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSeasonalDates(data.dates || []);
      toast.success("Seasonal calendar updated!");
    } catch (error: any) {
      console.error("Error loading seasonal:", error);
      let errorMessage = "Erro ao carregar calendário sazonal";
      
      if (error.context?.json?.error) {
        errorMessage = error.context.json.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createPostFromIdea = (idea: string, dateName: string) => {
    sessionStorage.setItem("prefillTheme", JSON.stringify({
      theme: `${dateName} - ${idea}`,
      description: idea,
    }));
    navigate("/");
  };

  const generateDraftsForDate = async (item: SeasonalDate) => {
    setGeneratingFor(item.name);
    toast.info(`Iniciando geração inteligente para ${item.name}...`);
    try {
      const themeDesc = `Especial de ${item.name}: ${item.post_ideas.join(' ou ')}`;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const response = await supabase.functions.invoke('generate-post', {
        body: {
          objective: 'engagement',
          theme: themeDesc,
          tone: 'professional',
          style: 'photography',
          postType: 'feed',
          action: 'generate'
        }
      });
      
      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      if (!response.data.variations || response.data.variations.length === 0) {
         throw new Error("Nenhuma variação retornada pela IA");
      }

      const postsToSave = response.data.variations.map((v: any) => ({
        user_id: user.id,
        variant: v.variant,
        objective: 'engagement',
        theme: themeDesc.substring(0, 100),
        post_type: 'feed',
        caption: v.caption,
        hashtags: v.hashtags,
        image_prompt: v.imagePrompt?.description || "",
        image_url: v.imageUrl,
        alt_text: v.altText || "",
        rationale: v.rationale || "",
        status: "draft"
      }));

      const { error: dbError } = await supabase.from('generated_posts').insert(postsToSave);
      if (dbError) throw dbError;

      toast.success(`Pronto! 2 rascunhos para ${item.name} foram salvos em Meus Posts!`);
    } catch (error: any) {
      console.error("Error generating seasonal drafts:", error);
      toast.error(error.message || "Erro ao gerar rascunhos");
    } finally {
      setGeneratingFor(null);
    }
  };

  const urgencyColor = (daysUntil: number) => {
    if (daysUntil <= 3) return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200";
    if (daysUntil <= 7) return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200";
    if (daysUntil <= 14) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200";
    return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200";
  };

  return (
    <Card className="p-6 shadow-smooth">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Calendário Sazonal Otimizado</h2>
        </div>
        <Button onClick={loadSeasonalDates} disabled={loading} size="sm" variant="outline" className="border-primary/20 hover:bg-primary/5">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Buscando datas...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Descobrir Datas Estratégicas
            </>
          )}
        </Button>
      </div>

      {seasonalDates.length > 0 ? (
        <div className="space-y-4">
          {seasonalDates.map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border ${urgencyColor(item.days_until)}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant="outline" className="text-xs font-bold border-current">
                    {item.days_until === 0 ? "É Hoje!" : `Faltam ${item.days_until} dias`}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {item.date}
                  </p>
                </div>
              </div>
              
              {item.days_until <= 7 && (
                <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200 dark:border-purple-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Atenção! Data próxima.</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Seja proativo e garanta o engajamento.</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                    onClick={() => generateDraftsForDate(item)}
                    disabled={generatingFor === item.name}
                  >
                    {generatingFor === item.name ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1.5" />
                    )}
                    Pré-gerar 2 Rascunhos
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-medium">Ideias de Conteúdo:</p>
                <div className="flex flex-wrap gap-2">
                  {item.post_ideas.map((idea, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => createPostFromIdea(idea, item.name)}
                    >
                      {idea}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Clique em "Descobrir Datas Estratégicas" para alinhar o seu conteúdo aos próximos 60 dias de oportunidades.
        </p>
      ) : null}
    </Card>
  );
}
