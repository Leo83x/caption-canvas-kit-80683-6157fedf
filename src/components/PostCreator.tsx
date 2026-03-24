import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ImagePlus, Upload, Loader2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PreviewAlert } from "./PreviewAlert";
import { LivePreview } from "./LivePreview";

interface PostCreatorProps {
  onPostGenerated: (variations: any[]) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  initialTopic?: { text: string; id: number };
}

export const PostCreator = ({ onPostGenerated, onGeneratingChange, initialTopic }: PostCreatorProps) => {
  const [postType, setPostType] = useState<"feed" | "story" | "reel" | "carousel" | "youtube_thumb">("feed");
  const [objective, setObjective] = useState("");
  const [theme, setTheme] = useState("");
  
  useEffect(() => {
    if (initialTopic?.text) {
      setTheme(initialTopic.text);
      // Optional: scroll to the textarea
      const el = document.getElementById('theme');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [initialTopic]);
  const [tone, setTone] = useState("professional");
  const [style, setStyle] = useState("photography");
  const [cta, setCta] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [customCaption, setCustomCaption] = useState("");
  const [brandColors, setBrandColors] = useState<string[]>(["#8b5cf6", "#ec4899", "#f59e0b"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeTextOverlay, setIncludeTextOverlay] = useState(false);
  const [suggestedText, setSuggestedText] = useState("");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("center");
  const [libraryImages, setLibraryImages] = useState<any[]>([]);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<string | null>(null);
  const [showLibrarySelector, setShowLibrarySelector] = useState(false);
  const [isFaceless, setIsFaceless] = useState(false);

  useEffect(() => {
    const prefillData = sessionStorage.getItem('prefillTheme');
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData);
        if (data.theme) setTheme(data.theme + (data.description ? ` - ${data.description}` : ''));
        sessionStorage.removeItem('prefillTheme');
      } catch (e) {
        console.error('Error parsing prefill data:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompanyProfile(data);
        setTone(data.default_tone || "professional");
        if (data.brand_colors && data.brand_colors.length > 0) {
          setBrandColors(data.brand_colors);
        }
      }

      const { data: libData } = await supabase
        .from("image_library")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (libData) setLibraryImages(libData);
    } catch (error) {
      console.error("Error loading company profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!theme || !objective) {
      toast.error("Por favor, preencha o tema e o objetivo da campanha");
      return;
    }

    setIsGenerating(true);
    onGeneratingChange?.(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        setIsGenerating(false);
        return;
      }

      if (companyProfile && companyProfile.ai_credits_remaining <= 0) {
        toast.error("Você atingiu seu limite de créditos de IA deste mês.");
        setIsGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          objective,
          theme,
          tone,
          style,
          cta,
          customCaption,
          postType,
          brandColors: companyProfile?.brand_colors || brandColors,
          companyName: companyProfile?.company_name || "Your Company",
          targetAudience: companyProfile?.target_audience || "General Audience",
          keywords: companyProfile?.keywords || ["innovation", "quality", "professionalism"],
          brandVoice: companyProfile?.brand_voice,
          maxHashtags: companyProfile?.max_hashtags || 10,
          userId: user.id,
          includeLogo,
          logoUrl: companyProfile?.logo_url,
          includeTextOverlay,
          suggestedText: suggestedText.trim() || undefined,
          textPosition,
          sourceUrl: sourceUrl.trim() || undefined,
          selectedImage: selectedLibraryImage || undefined,
          isFaceless: postType === 'reel' ? isFaceless : false
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      await loadCompanyProfile();
      toast.success("Posts gerados com sucesso!");

      if (onPostGenerated && data.variations) {
        // Inject metadata into variations
        const enrichedVariations = data.variations.map((v: any) => ({
          ...v,
          sourceUrl: sourceUrl.trim() || undefined,
          successScore: v.successScore,
          successAnalysis: v.successAnalysis
        }));
        onPostGenerated(enrichedVariations);
      }
    } catch (error: any) {
      console.error('Error generating post:', error);
      toast.error(error.message || "Erro ao gerar post. Tente novamente.");
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 shadow-smooth">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className="glass-card-white p-8 md:p-10 rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group transition-all duration-500">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
      
      <div className="space-y-8 md:space-y-10 relative z-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tight">Criar Post</h2>
            <p className="text-sm font-medium text-muted-foreground/60 flex items-center gap-2">
              Descreva sua ideia e deixe a IA criar o conteúdo perfeito <Sparkles className="h-3.5 w-3.5 text-primary" />
            </p>
          </div>
          <Tabs value={postType} onValueChange={(v) => setPostType(v as any)} className="w-full md:w-auto">
            <TabsList className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl h-12 p-1 gap-1">
              <TabsTrigger value="feed" className="rounded-xl px-5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Feed</TabsTrigger>
              <TabsTrigger value="carousel" className="rounded-xl px-5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Carrossel</TabsTrigger>
              <TabsTrigger value="story" className="rounded-xl px-5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Story</TabsTrigger>
              <TabsTrigger value="reel" className="rounded-xl px-5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Reel</TabsTrigger>
              <TabsTrigger value="youtube_thumb" className="rounded-xl px-5 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">YouTube</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {postType === 'reel' && (
          <div className="flex items-center gap-4 p-5 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 animate-in fade-in zoom-in-95 group/faceless hover:border-primary/30 transition-all">
            <Checkbox
              id="isFaceless"
              checked={isFaceless}
              onCheckedChange={(checked) => setIsFaceless(checked as boolean)}
              className="h-5 w-5 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex-1">
              <Label htmlFor="isFaceless" className="text-sm font-black cursor-pointer flex items-center gap-2 text-foreground/90 uppercase tracking-tight">
                Gerar Reel Faceless <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </Label>
              <p className="text-[10px] font-semibold text-muted-foreground/60 mt-0.5">
                A IA buscará vídeos de fundo profissionais e criará um roteiro dinâmico.
              </p>
            </div>
          </div>
        )}

        <PreviewAlert show={!!theme} />

        <div className="grid gap-8 md:gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="objective" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Objetivo da Campanha *</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger id="objective" className="h-14 rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold">
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent className="glass-premium border-none rounded-2xl">
                  <SelectItem value="conversion" className="rounded-xl py-3 px-4 font-bold">Conversão / Vendas</SelectItem>
                  <SelectItem value="traffic" className="rounded-xl py-3 px-4 font-bold">Tráfego para Site</SelectItem>
                  <SelectItem value="awareness" className="rounded-xl py-3 px-4 font-bold">Reconhecimento de Marca</SelectItem>
                  <SelectItem value="engagement" className="rounded-xl py-3 px-4 font-bold">Engajamento</SelectItem>
                  <SelectItem value="leads" className="rounded-xl py-3 px-4 font-bold">Geração de Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Tema / Descrição do Post *</Label>
              <Textarea
                id="theme"
                placeholder="Ex: Lançamento de produto, promoção de verão, dicas de uso..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                 className="resize-none min-h-[140px] rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold p-5"
               />
             </div>
  
             <div className="space-y-2">
               <Label htmlFor="sourceUrl" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Reciclar Conteúdo (Blog/YouTube URL)</Label>
               <Input
                 id="sourceUrl"
                 placeholder="Cole um link para a IA usar como base..."
                 value={sourceUrl}
                 onChange={(e) => setSourceUrl(e.target.value)}
                 className="h-14 rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold px-5"
               />
               <p className="text-[10px] font-semibold text-muted-foreground/50 mt-1 ml-1">
                 A IA lerá o texto do link para gerar o post estrategicamente.
               </p>
             </div>

            <div className="space-y-2">
              <Label htmlFor="tone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Tom de Voz</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone" className="h-14 rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-premium border-none rounded-2xl">
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="casual">Casual / Amigável</SelectItem>
                  <SelectItem value="emotional">Emocional</SelectItem>
                  <SelectItem value="humorous">Bem-humorado</SelectItem>
                  <SelectItem value="educational">Educacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Identidade Visual</Label>
              <div className="p-6 space-y-5 bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/10">
                <div className="space-y-3">
                  <Label htmlFor="colors" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Cores da Marca</Label>
                  <div className="flex gap-3 mt-1">
                    {brandColors.map((color, index) => (
                      <div key={index} className="relative group/color">
                        <Input
                          type="color"
                          className="h-12 w-16 md:w-20 cursor-pointer p-0 rounded-xl overflow-hidden border-none bg-transparent"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...brandColors];
                            newColors[index] = e.target.value;
                            setBrandColors(newColors);
                          }}
                        />
                        <div className="absolute inset-0 rounded-xl border border-white/40 pointer-events-none group-hover/color:border-white/80 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>

                {companyProfile?.logo_url && (
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <Checkbox
                      id="includeLogo"
                      checked={includeLogo}
                      onCheckedChange={(checked) => setIncludeLogo(checked as boolean)}
                      className="h-5 w-5 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="includeLogo" className="text-sm font-bold cursor-pointer text-foreground/80">
                      Incluir logo na arte
                    </Label>
                    <div className="ml-auto p-1.5 bg-white rounded-xl shadow-sm border border-white/40 flex items-center justify-center h-10 w-10 overflow-hidden">
                      <img
                        src={companyProfile.logo_url}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Usar Imagem da Biblioteca</Label>
                    <Button variant="ghost" size="sm" onClick={() => setShowLibrarySelector(!showLibrarySelector)} className="h-7 text-[9px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/10 rounded-lg hover:bg-white/60">
                      {showLibrarySelector ? "Recolher" : "Selecionar"}
                    </Button>
                  </div>
                  
                  {showLibrarySelector && (
                    <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto p-2 bg-black/5 dark:bg-white/5 rounded-2xl animate-in fade-in slide-in-from-top-1 scrollbar-none">
                      {libraryImages.length === 0 ? (
                        <p className="col-span-4 text-[9px] text-center text-muted-foreground py-4 font-bold">Sua biblioteca está vazia.</p>
                      ) : (
                        libraryImages.map(img => (
                          <div 
                            key={img.id} 
                            onClick={() => setSelectedLibraryImage(selectedLibraryImage === img.url ? null : img.url)}
                            className={`aspect-square rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-300 ${selectedLibraryImage === img.url ? "border-primary ring-4 ring-primary/20 scale-95" : "border-transparent hover:scale-105 hover:border-white/60"}`}
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {selectedLibraryImage && (
                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 animate-in zoom-in-95">
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
                        <Check className="h-3.5 w-3.5" /> Imagem selecionada
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                  <Checkbox
                    id="includeTextOverlay"
                    checked={includeTextOverlay}
                    onCheckedChange={(checked) => setIncludeTextOverlay(checked as boolean)}
                    className="h-5 w-5 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="includeTextOverlay" className="text-sm font-bold cursor-pointer text-foreground/80">
                    Incluir texto na imagem
                  </Label>
                </div>

                {includeTextOverlay && (
                  <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label htmlFor="suggestedText" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                        Texto sugerido (opcional)
                      </Label>
                      <Input
                        id="suggestedText"
                        placeholder="Ex: Transforme Seu Negócio Hoje"
                        value={suggestedText}
                        onChange={(e) => setSuggestedText(e.target.value)}
                        maxLength={50}
                        className="h-12 rounded-xl bg-white/40 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textPosition" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                        Posição do texto
                      </Label>
                      <Select value={textPosition} onValueChange={(v) => setTextPosition(v as "top" | "center" | "bottom")}>
                        <SelectTrigger id="textPosition" className="h-12 rounded-xl bg-white/40 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-premium rounded-2xl border-none">
                          <SelectItem value="top" className="font-bold">Topo</SelectItem>
                          <SelectItem value="center" className="font-bold">Centro</SelectItem>
                          <SelectItem value="bottom" className="font-bold">Fundo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Estilo da Imagem</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger id="style" className="h-14 rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-premium border-none rounded-2xl">
                  <SelectItem value="photography" className="font-bold">Fotografia</SelectItem>
                  <SelectItem value="illustration" className="font-bold">Ilustração</SelectItem>
                  <SelectItem value="3d" className="font-bold">3D / Renderizado</SelectItem>
                  <SelectItem value="flat" className="font-bold">Design Flat</SelectItem>
                  <SelectItem value="abstract" className="font-bold">Abstrato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Chamada para Ação (Optional)</Label>
              <Input
                id="cta"
                placeholder="Ex: Link na bio, Saiba mais, Compre agora"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="h-14 rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold px-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customCaption" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Legenda Personalizada (Opcional)</Label>
              <Textarea
                id="customCaption"
                placeholder="Escreva sua própria legenda. Se preenchido, a IA usará este texto como base."
                value={customCaption}
                onChange={(e) => setCustomCaption(e.target.value)}
                rows={3}
                className="resize-none rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 backdrop-blur-sm focus:ring-primary/20 transition-all text-sm font-bold p-5"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => {
              setObjective("");
              setTheme("");
              setCta("");
            }}
            className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
          >
            Limpar
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-2xl h-14 px-10 gap-3 bg-gradient-to-r from-primary via-accent to-pink-500 hover:shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-white border-none font-black uppercase tracking-[0.1em] text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Gerar Variações A/B
              </>
            )}
          </Button>
        </div>

        {theme && (
          <div className="mt-10 p-2 rounded-[2rem] bg-black/5 dark:bg-white/5 border border-white/10">
            <LivePreview
              caption={theme}
              hashtags={[]}
              companyName={companyProfile?.company_name || "Your Company"}
              companyLogo={companyProfile?.logo_url}
              postType={postType}
            />
          </div>
        )}
      </div>
    </div>
  );
};
