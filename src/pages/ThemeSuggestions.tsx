import { useState, useEffect } from "react";
import { ThemeCalendar } from "@/components/ThemeCalendar";
import { SeasonalCalendar } from "@/components/SeasonalCalendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Plus, Sparkles, Loader2, Copy, Calendar as CalendarIcon, Info } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ThemeSuggestion {
  theme_name: string;
  description: string;
  category: string;
  frequency: string;
  suggested_hashtags: string[];
}

export default function ThemeSuggestions() {
  const [suggestions, setSuggestions] = useState<ThemeSuggestion[]>([]);
  const [savedThemes, setSavedThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadSavedThemes();
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfileExists(!!data);
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const loadSavedThemes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("theme_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedThemes(data || []);
    } catch (error) {
      console.error("Error loading themes:", error);
    }
  };

  const generateSuggestions = async () => {
    if (!profileExists) {
      toast.error("Complete your profile in Settings first");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-themes');

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSuggestions(data.suggestions || []);
      toast.success("Suggestions generated successfully!");
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      toast.error("Error generating suggestions");
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async (theme: ThemeSuggestion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("theme_suggestions")
        .insert([{ ...theme, user_id: user.id }]);

      if (error) throw error;

      toast.success("Theme saved successfully!");
      loadSavedThemes();
      setSuggestions(suggestions.filter(s => s.theme_name !== theme.theme_name));
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error("Error saving theme");
    }
  };

  const openThemeDialog = (theme: any) => {
    setSelectedTheme(theme);
    setDialogOpen(true);
  };

  const copyHashtags = () => {
    if (!selectedTheme?.suggested_hashtags) return;
    const hashtags = selectedTheme.suggested_hashtags.join(" ");
    navigator.clipboard.writeText(hashtags);
    toast.success("Hashtags copied to clipboard");
  };

  const categoryColors: Record<string, string> = {
    "Educational Content": "bg-blue-500/10 text-blue-600 border-blue-200",
    "Promotions": "bg-green-500/10 text-green-600 border-green-200",
    "Engagement": "bg-purple-500/10 text-purple-600 border-purple-200",
    "Behind the Scenes": "bg-orange-500/10 text-orange-600 border-orange-200",
    "Tips": "bg-pink-500/10 text-pink-600 border-pink-200",
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Diário",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Temas</span>
            <span className="text-foreground/20">Estratégicos</span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
            Descubra o que postar hoje com base no seu perfil e tendências
          </p>
        </div>

        <Button
          onClick={generateSuggestions}
          disabled={loading || !profileExists}
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transition-all hover:scale-105 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar com IA
            </>
          )}
        </Button>
      </div>

      {!profileExists && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Complete seu perfil nas <strong>Configurações</strong> para receber sugestões personalizadas.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="suggestions" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Sparkles className="h-4 w-4" /> Sugestões
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarIcon className="h-4 w-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarIcon className="h-4 w-4" /> Datas Sazonais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-8 min-h-[400px]">
          {suggestions.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 bg-purple-100 text-purple-700 border-purple-200">
                  Novas Ideias
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {suggestions.map((theme, index) => (
                  <Card key={index} className="p-6 border-none ring-1 ring-border shadow-smooth hover:ring-primary/40 hover:shadow-glow transition-all group overflow-hidden">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{theme.theme_name}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{theme.description}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={categoryColors[theme.category] || "border-muted"}>
                          {theme.category}
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 italic">
                          {frequencyLabels[theme.frequency]}
                        </Badge>
                      </div>

                      {theme.suggested_hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                          {theme.suggested_hashtags.slice(0, 5).map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] font-medium text-muted-foreground hover:text-primary cursor-default">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <Button 
                        onClick={() => saveTheme(theme)} 
                        className="w-full mt-4 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Salvar Tema
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center bg-muted/20 border-dashed">
              <div className="h-20 w-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Sua Fábrica de Ideias</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Clique no botão acima para que nossa IA analise seu perfil e gere temas estratégicos personalizados.
              </p>
              <div className="flex justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Inovador</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Copy className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Estratégico</span>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          <ThemeCalendar savedThemes={savedThemes} />
          
          {savedThemes.length > 0 && (
            <div className="space-y-4 pt-8 border-t">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Biblioteca de Temas</h2>
                <Badge variant="outline">{savedThemes.length} Temas Salvos</Badge>
              </div>
              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                {savedThemes.map((theme) => (
                  <Card
                    key={theme.id}
                    className="p-5 border-none ring-1 ring-border shadow-sm hover:ring-primary/30 transition-all cursor-pointer group"
                    onClick={() => openThemeDialog(theme)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{theme.theme_name}</h3>
                        {theme.description && <p className="text-xs text-muted-foreground line-clamp-2 italic">{theme.description}</p>}
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Badge className={`text-[10px] ${categoryColors[theme.category] || "border-muted"}`}>
                        {theme.category}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-4 rounded-xl border border-primary/10">
            <div className="max-w-3xl mx-auto text-center space-y-2">
              <h2 className="text-xl font-display font-bold">Calendário de Datas Estratégicas</h2>
              <p className="text-xs text-muted-foreground italic">
                Monitoramos datas comemorativas e feriados para suas oportunidades de engajamento.
              </p>
            </div>
          </div>
          <SeasonalCalendar />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">
              {selectedTheme?.theme_name}
            </DialogTitle>
          </DialogHeader>
          {selectedTheme && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Descrição do Tema</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedTheme.description}</p>
              </div>

              <div className="flex gap-2">
                <Badge className={categoryColors[selectedTheme.category] || "border-muted"}>
                  {selectedTheme.category}
                </Badge>
                <Badge variant="outline" className="italic">
                  {frequencyLabels[selectedTheme.frequency]}
                </Badge>
              </div>

              {selectedTheme.suggested_hashtags && selectedTheme.suggested_hashtags.length > 0 && (
                <div className="p-4 bg-muted/40 rounded-xl border border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm">Hashtags Sugeridas</h4>
                    <Button onClick={copyHashtags} variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest text-primary hover:bg-primary/5">
                      <Copy className="h-3 w-3 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTheme.suggested_hashtags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
