import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImagePlus,
  Edit2,
  Save,
  X,
  Youtube,
  Sparkles,
  Info,
  Palette
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { composeLogoOnImage, uploadComposedImage } from "@/utils/imageComposition";
import { PostVariation } from "@/types";
import { CanvasEditor } from "./CanvasEditor";

interface PostPreviewProps {
  variations?: PostVariation[];
}

export function PostPreview({ variations = [] }: PostPreviewProps) {
  const [currentVariation, setCurrentVariation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isApplyingText, setIsApplyingText] = useState(false);
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState("your_company");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [editedHeadlineText, setEditedHeadlineText] = useState("");

  const [activeImageUrl, setActiveImageUrl] = useState<string | undefined>(undefined);
  const [showDebug, setShowDebug] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptTarget, setAdaptTarget] = useState<string | null>(null);
  const [adaptedText, setAdaptedText] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const STOCK_VIDEOS: Record<string, string> = {
    luxury: "https://assets.mixkit.co/videos/preview/mixkit-luxury-penthouse-apartment-view-41223-large.mp4",
    business: "https://assets.mixkit.co/videos/preview/mixkit-businessman-working-on-his-laptop-23212-large.mp4",
    nature: "https://assets.mixkit.co/videos/preview/mixkit-walking-on-the-beach-at-sunset-1520-large.mp4",
    abstract: "https://assets.mixkit.co/videos/preview/mixkit-flowing-colors-of-ink-in-water-4333-large.mp4",
    lifestyle: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-at-the-camera-while-walking-23348-large.mp4",
    technology: "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-keyboard-close-up-157-large.mp4",
    minimal: "https://assets.mixkit.co/videos/preview/mixkit-white-sand-of-a-beach-in-the-sun-1534-large.mp4",
    default: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-121-large.mp4"
  };

  useEffect(() => {
    const loadCompanyProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("company_profiles")
        .select("company_name, logo_url, instagram_handle")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setCompanyName(data.instagram_handle || data.company_name || "your_company");
        setLogoUrl(data.logo_url);
      }
    };
    loadCompanyProfile();
  }, []);

  if (!variations || variations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum post gerado ainda. Preencha o formulário e gere suas variações!
          </p>
        </div>
      </Card>
    );
  }

  const currentPost = variations[currentVariation];

  useEffect(() => {
    setActiveImageUrl(currentPost.imageUrl);
    
    if (currentPost.videoScript && currentPost.videoScript.length > 0) {
      const firstKeywords = currentPost.videoScript[0].videoKeywords?.toLowerCase() || "";
      let found = false;
      for (const key in STOCK_VIDEOS) {
        if (firstKeywords.includes(key)) {
          setVideoUrl(STOCK_VIDEOS[key]);
          found = true;
          break;
        }
      }
      if (!found) setVideoUrl(STOCK_VIDEOS.default);
    } else {
      setVideoUrl(null);
    }
  }, [currentPost.imageUrl, currentVariation, currentPost.videoScript]);

  const handleVariationChange = (newIndex: number) => {
    setCurrentVariation(newIndex);
    setIsEditing(false);
    setAdaptedText(null);
    setCurrentSlide(0);
  };

  // Auto-apply logo if available
  useEffect(() => {
    if (logoUrl && variations.length > 0 && !isComposing) {
      const firstPost = variations[0];
      const hasLogo = firstPost.imageUrl?.includes('composed') || 
                      firstPost.slides?.some(s => s.image_url?.includes('composed'));
      
      if (!hasLogo) {
        handleApplyLogo();
      }
    }
  }, [logoUrl, variations]);

  const startEditing = () => {
    setEditedCaption(currentPost.caption);
    setEditedHashtags(currentPost.hashtags.join(" "));
    setEditedImageUrl(currentPost.imageUrl || "");
    setEditedHeadlineText(currentPost.headlineText || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEdits = () => {
    variations[currentVariation] = {
      ...currentPost,
      caption: editedCaption,
      hashtags: editedHashtags.split(" ").filter(tag => tag.startsWith("#")),
      imageUrl: editedImageUrl || currentPost.imageUrl,
      headlineText: editedHeadlineText || currentPost.headlineText
    };
    setIsEditing(false);
    toast.success("Alterações salvas na prévia!");
  };

  const handleImageError = () => {
    console.warn("Image load error detected for variant", currentPost.variant);

    if (activeImageUrl === currentPost.imageUrl && currentPost.supabaseUrl && currentPost.supabaseUrl !== currentPost.imageUrl) {
      console.log("Switching to Fallback 1: Supabase Storage");
      setActiveImageUrl(currentPost.supabaseUrl);
    } else if (!activeImageUrl?.includes('unsplash.com') && !activeImageUrl?.includes('loremflickr.com') && !activeImageUrl?.includes('data:image')) {
      console.log("Switching to Fallback 2: Emergency Unsplash");
      const query = encodeURIComponent(currentPost.altText || "marketing,business");
      setActiveImageUrl(`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80&term=${query}`);
    } else if (activeImageUrl?.includes('unsplash.com')) {
      console.log("Switching to Fallback 3: LoremFlickr");
      const query = encodeURIComponent(currentPost.altText?.split(' ').slice(0, 2).join(',') || "business");
      setActiveImageUrl(`https://loremflickr.com/1080/1080/${query}`);
    } else if (activeImageUrl?.includes('loremflickr.com')) {
      console.log("Switching to Fallback 4: Internal Base64 SVG");
      setActiveImageUrl("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTA4MCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiNFMkU4RjAiLz48dGV4dCB4PSI1NDAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSIjOTQ0Qjg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW0gSW5zdGFHZW5pdXM8L3RleHQ+PC9zdmc+");
    }
  };

  const handleNextImage = () => {
    if (!activeImageUrl || activeImageUrl === currentPost.imageUrl) {
      if (currentPost.supabaseUrl) setActiveImageUrl(currentPost.supabaseUrl);
      else {
        const query = encodeURIComponent(currentPost.altText || "marketing");
        setActiveImageUrl(`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80&term=${query}`);
      }
    } else if (activeImageUrl?.includes('supabase.co')) {
      const query = encodeURIComponent(currentPost.altText || "marketing");
      setActiveImageUrl(`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80&term=${query}`);
    } else if (activeImageUrl?.includes('unsplash.com')) {
      const query = encodeURIComponent(currentPost.altText?.split(' ').slice(0, 2).join(',') || "business");
      setActiveImageUrl(`https://loremflickr.com/1080/1080/${query}`);
    } else if (activeImageUrl?.includes('loremflickr.com') || activeImageUrl?.includes('data:image')) {
      setActiveImageUrl("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTA4MCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiNFMkU4RjAiLz48dGV4dCB4PSI1NDAiIHk9IjU0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQwIiBmaWxsPSIjOTQ0Qjg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW0gSW5zdGFHZW5pdXM8L3RleHQ+PC9zdmc+");
    } else {
      setActiveImageUrl(currentPost.imageUrl);
    }
    toast.info("Tentando outra fonte de imagem...");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const content = `
VARIANT: ${currentPost.variant}
CAPTION: ${currentPost.caption}
HASHTAGS: ${currentPost.hashtags.join(" ")}
STRATEGY: ${currentPost.rationale}
`.trim();

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post-variation-${currentPost.variant}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (activeImageUrl) {
        const response = await fetch(activeImageUrl);
        const imageBlob = await response.blob();
        const imgUrl = URL.createObjectURL(imageBlob);
        const imgLink = document.createElement("a");
        imgLink.href = imgUrl;
        imgLink.download = `image-variation-${currentPost.variant}.jpg`;
        document.body.appendChild(imgLink);
        imgLink.click();
        document.body.removeChild(imgLink);
        URL.revokeObjectURL(imgUrl);
      }
      toast.success("Post e imagem exportados com sucesso!");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error exporting files");
    } finally {
      setExporting(false);
    }
  };

  const handleApplyLogo = async () => {
    if (!logoUrl) return;
    setIsComposing(true);
    toast.info("Aplicando logo nas imagens...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (currentPost.slides && currentPost.slides.length > 0) {
        if (!(currentPost as any).originalSlides) {
          (currentPost as any).originalSlides = JSON.parse(JSON.stringify(currentPost.slides));
        }
        
        let newActiveUrl = activeImageUrl;
        for (let i = 0; i < currentPost.slides.length; i++) {
          const slideUrl = currentPost.slides[i].image_url;
          if (!slideUrl) continue;
          const composedDataUrl = await composeLogoOnImage(slideUrl, logoUrl, 'bottom-right', 0.15);
          const newUrl = await uploadComposedImage(composedDataUrl, user.id, supabase);
          currentPost.slides[i].image_url = newUrl;
          if (i === 0) newActiveUrl = newUrl;
        }
        setActiveImageUrl("composed_carousel"); // force update
        toast.success("Logo aplicada ao carrossel com sucesso!");
      } else if (currentPost.imageUrl) {
        const composedDataUrl = await composeLogoOnImage(currentPost.imageUrl, logoUrl, 'bottom-right', 0.15);
        const newImageUrl = await uploadComposedImage(composedDataUrl, user.id, supabase);
        setActiveImageUrl(newImageUrl);
        toast.success("Logo aplicada com sucesso!");
      }
    } catch (error) {
      console.error("Error applying logo:", error);
      toast.error("Error applying logo to image");
    } finally {
      setIsComposing(false);
    }
  };

  const handleCanvasSave = async (dataUrl: string) => {
    setShowCanvasEditor(false);
    setIsApplyingText(true);
    toast.info("Salvando imagem editada...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      const newImageUrl = await uploadComposedImage(dataUrl, user.id, supabase);
      currentPost.imageUrl = newImageUrl;
      setActiveImageUrl(newImageUrl);
      toast.success("Imagem atualizada com sucesso!");
    } catch (error) {
      console.error("Error saving edited image:", error);
      toast.error("Error saving image");
    } finally {
      setIsApplyingText(false);
    }
  };

  const handleAdapt = async (network: string) => {
    setIsAdapting(true);
    setAdaptTarget(network);
    try {
       const { data, error } = await supabase.functions.invoke('generate-post', {
         body: { action: 'adapt', originalCaption: currentPost.caption, targetNetwork: network }
       });
       if (error) throw error;
       if (data.error) throw new Error(data.error);
       setAdaptedText(data.adaptedText);
       toast.success(`Texto adaptado para ${network}!`);
    } catch(e) {
       console.error("Error adapting:", e);
       toast.error("Erro ao adaptar texto");
    } finally {
       setIsAdapting(false);
    }
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }
      const { error } = await supabase.from("generated_posts").insert({
        user_id: user.id,
        variant: currentPost.variant,
        objective: "engagement",
        theme: currentPost.caption.substring(0, 100),
        post_type: currentPost.videoScript && currentPost.videoScript.length > 0 ? "reel" : (currentPost.slides && currentPost.slides.length > 0 ? "carousel" : "feed"),
        caption: currentPost.caption,
        hashtags: currentPost.hashtags,
        image_prompt: currentPost.imagePrompt?.description || "",
        image_url: activeImageUrl || currentPost.imageUrl || null,
        alt_text: currentPost.altText || "",
        rationale: currentPost.rationale || "",
        status: "draft",
        slides: (currentPost.slides || []) as any,
        source_url: currentPost.sourceUrl,
        success_score: currentPost.successScore,
        success_analysis: currentPost.successAnalysis,
        headline_text: currentPost.headlineText,
        video_script: (currentPost.videoScript || null) as any
      } as any);
      if (error) throw error;
      toast.success("Post salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving post to DB:", error);
      toast.error(`Erro ao salvar post: ${error.message || "Verifique as permissões"}`);
      console.error("Database save failed:", error);
      
      if (error.message?.includes("headline_text")) {
        toast.info("Dica: O banco de dados foi atualizado recentemente. Se o erro persistir, tente deslogar e logar novamente para atualizar as permissões do navegador.", { duration: 8000 });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = () => {
    if (currentPost.slides && currentPost.slides.length > 0 && (currentPost as any).originalSlides) {
      currentPost.slides = JSON.parse(JSON.stringify((currentPost as any).originalSlides));
      setActiveImageUrl(undefined);
    } else {
      setActiveImageUrl(currentPost.imageUrl);
    }
    toast.info("Logo removida da arte original");
  };

  return (
    <div className="space-y-10 md:space-y-12 transition-all duration-700">
      <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group/main transition-all duration-500">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-full -mr-80 -mt-80 blur-[100px] opacity-50" />
        
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between mb-10 relative z-10">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic uppercase">Variação {currentPost.variant}</h3>
              {currentPost.successScore && (
                <div className="group relative flex items-center">
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-help">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    {currentPost.successScore}% Sucesso
                  </div>
                  {currentPost.successAnalysis && (
                    <div className="absolute left-0 bottom-full mb-3 w-72 p-4 bg-black/80 backdrop-blur-xl text-white text-[10px] font-medium leading-relaxed rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 border border-white/10 translate-y-2 group-hover:translate-y-0">
                      <div className="font-black mb-2 flex items-center uppercase tracking-widest text-primary">
                        <Info className="h-3.5 w-3.5 mr-2" /> Análise da IA
                      </div>
                      {currentPost.successAnalysis}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">
              {variations.length} variações geradas para teste A/B
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all italic h-9"
              onClick={() => setShowDebug(!showDebug)}
            >
              Diagnóstico
            </Button>
            
            {variations.length > 1 && (
              <Button
                variant={isComparisonMode ? "default" : "outline"}
                size="sm"
                className={`h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest gap-2 transition-all duration-300 ${isComparisonMode ? 'bg-primary text-white border-none shadow-lg' : 'bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 backdrop-blur-md hover:bg-white/60'}`}
                onClick={() => setIsComparisonMode(!isComparisonMode)}
              >
                <Sparkles className="h-4 w-4" />
                {isComparisonMode ? "Sair da Comparação" : "Comparar Lado a Lado"}
              </Button>
            )}

            {!isComparisonMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 backdrop-blur-md hover:bg-white/60 transition-all"
                  onClick={() => handleVariationChange(Math.max(0, currentVariation - 1))}
                  disabled={currentVariation === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 backdrop-blur-md hover:bg-white/60 transition-all"
                  onClick={() => handleVariationChange(Math.min(variations.length - 1, currentVariation + 1))}
                  disabled={currentVariation === variations.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {isComparisonMode ? (
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
            {variations.map((v, idx) => (
              <div key={idx} className="space-y-6 group/comp">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${idx === 0 ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gradient-to-r from-purple-500 to-pink-600"}`}>
                       Variação {v.variant}
                     </span>
                     {v.successScore && (
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-60">
                         {v.successScore}% Match
                       </span>
                     )}
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => {
                     setCurrentVariation(idx);
                     setIsComparisonMode(false);
                   }} className="text-[10px] font-bold uppercase tracking-widest h-8 px-4 hover:bg-primary/10 hover:text-primary rounded-lg transition-all">
                     Selecionar
                   </Button>
                </div>
                
                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl overflow-hidden relative shadow-lg group-hover/comp:shadow-2xl transition-all duration-500 group-hover/comp:scale-[1.02]">
                   <div className="aspect-square bg-black/5 flex items-center justify-center overflow-hidden">
                     {v.imageUrl ? (
                       <img src={v.imageUrl} alt={v.altText} className="w-full h-full object-cover transition-transform duration-700 group-hover/comp:scale-110" />
                     ) : (
                       <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                     )}
                   </div>
                   <div className="p-6 bg-white/50 dark:bg-black/40 backdrop-blur-md border-t border-white/20 dark:border-white/5">
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-3 italic">Estratégia</p>
                      <p className="text-xs font-medium leading-relaxed mb-4 line-clamp-2 italic text-foreground/80">"{v.rationale}"</p>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />
                      <p className="text-[11px] font-medium leading-relaxed text-foreground/70 line-clamp-4">{v.caption}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid lg:grid-cols-2 gap-10 md:gap-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
          <div className="space-y-6">
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl transition-all duration-500 hover:shadow-primary/5">
              <div className="flex items-center gap-4 p-5 border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/20">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary via-accent to-pink-500 p-[2px]">
                   <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt={companyName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-accent" />
                    )}
                   </div>
                </div>
                <div className="flex-1">
                  <span className="font-black text-sm tracking-tight text-foreground/90">{companyName}</span>
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Post Sugerido</p>
                </div>
              </div>

              <div className={`bg-black/5 flex items-center justify-center relative overflow-hidden ${
                currentPost.imagePrompt?.aspectRatio === '16:9' ? 'aspect-video' :
                (currentPost.imagePrompt?.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square')
              }`}>
                {currentPost.slides && currentPost.slides.length > 0 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={currentPost.slides[currentSlide].image_url}
                      alt={currentPost.slides[currentSlide].altText || "Carousel slide"}
                      className="w-full h-full object-cover transition-all duration-700"
                      key={`${currentVariation}-${currentSlide}`}
                    />
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {currentPost.slides.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1 w-4 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/30'}`} 
                        />
                      ))}
                    </div>

                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-xl border border-white/20 hover:bg-white/40 z-10 transition-all active:scale-95"
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-xl border border-white/20 hover:bg-white/40 z-10 transition-all active:scale-95"
                      onClick={() => setCurrentSlide(prev => Math.min((currentPost.slides?.length || 1) - 1, prev + 1))}
                      disabled={currentSlide === (currentPost.slides?.length || 1) - 1}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    
                    <Badge className="absolute top-6 right-6 bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest">
                      {currentSlide + 1} / {currentPost.slides.length}
                    </Badge>
                  </div>
                ) : activeImageUrl ? (
                  <div className="relative w-full h-full group">
                    {videoUrl ? (
                      <div className="relative w-full h-full">
                        <video 
                          src={videoUrl} 
                          className="w-full h-full object-cover" 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          poster={activeImageUrl}
                          onError={() => {
                            console.error("Video failed to load:", videoUrl);
                            setVideoUrl(null);
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                        
                        {/* Subtitle Overlay */}
                        <div className="absolute inset-x-0 bottom-12 px-8 text-center animate-in fade-in slide-in-from-bottom-6 duration-1000">
                          <p className="inline-block bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl text-white font-black text-sm md:text-base leading-tight shadow-2xl border border-white/20 uppercase tracking-tight">
                            {currentPost.videoScript?.[0]?.text || currentPost.headlineText || "Seu vídeo extraordinário"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={activeImageUrl}
                          alt={currentPost.altText}
                          className="w-full h-full object-cover transition-opacity duration-700"
                          onError={handleImageError}
                          key={activeImageUrl}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-40 pointer-events-none" />
                      </>
                    )}
                  </div>
                ) : currentPost.imageError ? (
                  <div className="text-center p-8 bg-black/5 rounded-3xl">
                    <ImagePlus className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Erro ao gerar imagem</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="relative">
                      <Loader2 className="h-16 w-16 text-primary/40 animate-spin" />
                      <Sparkles className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse italic">Materializando sua ideia...</p>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-5 bg-white/40 dark:bg-black/20">
                {currentPost.imagePrompt?.aspectRatio !== '16:9' && (
                  <div className="flex items-center justify-between px-2">
                    <div className="flex gap-6">
                      <Heart className="h-7 w-7 text-foreground/70 hover:text-red-500 hover:scale-110 active:scale-90 transition-all cursor-pointer" />
                      <MessageCircle className="h-7 w-7 text-foreground/70 hover:text-primary hover:scale-110 transition-all cursor-pointer" />
                      <Send className="h-7 w-7 text-foreground/70 hover:text-primary hover:scale-110 -rotate-12 transition-all cursor-pointer" />
                    </div>
                    <Bookmark className="h-7 w-7 text-foreground/70 hover:text-primary hover:scale-110 transition-all cursor-pointer" />
                  </div>
                )}

                <div className="text-sm leading-relaxed px-2">
                  <span className="font-black text-foreground/90 mr-2 uppercase tracking-tight">{companyName}</span>{" "}
                  <span className="font-medium text-foreground/70 whitespace-pre-wrap">{currentPost.caption}</span>
                </div>
              
                {/* Card de Sugestão de Título (Headline) */}
                {currentPost.headlineText && activeImageUrl === currentPost.imageUrl && (
                  <div className="mx-2 p-5 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-3xl mt-4 animate-in fade-in slide-in-from-top-4 transition-all hover:bg-primary/[0.15]">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/20 p-3 rounded-2xl shadow-inner">
                        <Palette className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1 italic">Sugestão High-End</p>
                        <p className="text-sm font-black text-foreground/90 mb-4 leading-tight tracking-tight">"{currentPost.headlineText}"</p>
                        <Button 
                          onClick={() => setShowCanvasEditor(true)} 
                          size="sm" 
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_8px_16px_rgba(124,58,237,0.2)] hover:shadow-primary/30 active:scale-95 transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-2" />
                          Customizar Arte
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground/90 italic">Edição em Tempo Real</h4>
                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Ajuste os detalhes finais do conteúdo</p>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={startEditing} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 hover:bg-white/60 transition-all">
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditing} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/40 hover:bg-white/10 transition-all">
                      <X className="h-3.5 w-3.5 mr-2" />
                      Cancelar
                    </Button>
                    <Button variant="default" size="sm" onClick={saveEdits} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20 transition-all">
                      <Save className="h-3.5 w-3.5 mr-2" />
                      Salvar
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6 p-6 border-none bg-white/30 dark:bg-black/20 backdrop-blur-xl rounded-3xl animate-in zoom-in-95">
                  <div className="space-y-2">
                    <Label htmlFor="caption" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Legenda</Label>
                    <Textarea
                      id="caption"
                      value={editedCaption}
                      onChange={(e) => setEditedCaption(e.target.value)}
                      rows={6}
                      className="resize-none rounded-2xl bg-white/50 dark:bg-black/40 border-white/40 dark:border-white/10 text-sm p-4 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hashtags" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Hashtags</Label>
                    <Input
                      id="hashtags"
                      value={editedHashtags}
                      onChange={(e) => setEditedHashtags(e.target.value)}
                      placeholder="#estilo #branding"
                      className="h-12 rounded-2xl bg-white/50 dark:bg-black/40 border-white/40 dark:border-white/10 text-sm px-4 font-medium"
                    />
                  </div>
                  {currentPost.headlineText && (
                    <div className="space-y-2">
                      <Label htmlFor="headlineText" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Texto Destacado na Arte</Label>
                      <Input
                        id="headlineText"
                        value={editedHeadlineText}
                        onChange={(e) => setEditedHeadlineText(e.target.value)}
                        placeholder="Frase de impacto..."
                        maxLength={50}
                        className="h-12 rounded-2xl bg-white/50 dark:bg-black/40 border-white/40 dark:border-white/10 text-sm px-4 font-bold"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-14 rounded-2xl gap-3 bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-all duration-300"
                    onClick={handleNextImage}
                  >
                    <ImagePlus className="h-5 w-5" />
                    Explorar Nova Variação Visual (Fallback)
                  </Button>

                  <div className="p-6 bg-white/30 dark:bg-black/10 backdrop-blur-md rounded-[2rem] border border-white/40 dark:border-white/5 group/rationale relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/30" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3 italic flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Análise Estratégica
                    </h4>
                    <p className="text-sm font-medium leading-relaxed text-foreground/70 italic">"{currentPost.rationale}"</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic">Metadata</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Prompt da Imagem</h4>
                      <div className="space-y-3">
                        <p className="text-xs font-medium leading-relaxed text-foreground/60 bg-white/20 dark:bg-black/10 p-4 rounded-2xl border border-white/10">{currentPost.imagePrompt?.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          {currentPost.imagePrompt?.style && (
                            <span className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Estilo: {
                                currentPost.imagePrompt.style === 'photography' ? 'Fotografia' :
                                currentPost.imagePrompt.style === 'illustration' ? 'Ilustração' :
                                currentPost.imagePrompt.style === '3d' ? '3D Render' :
                                currentPost.imagePrompt.style === 'flat' ? 'Flat Design' :
                                currentPost.imagePrompt.style === 'abstract' ? 'Abstrato' :
                                currentPost.imagePrompt.style
                              }
                            </span>
                          )}
                          <span className="px-3 py-1 bg-white/40 dark:bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest italic opacity-60">
                            Aspect Ratio {currentPost.imagePrompt?.aspectRatio || '1:1'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Engajamento (Hashtags)</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentPost.hashtags?.map((tag: string, index: number) => (
                          <span key={index} className="px-3 py-1.5 bg-accent/5 text-accent border border-accent/20 rounded-xl text-[10px] font-bold hover:bg-accent/10 transition-colors cursor-default">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {currentPost.videoScript && currentPost.videoScript.length > 0 && (
                      <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/90 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                              <Youtube className="h-4 w-4 text-red-500" />
                            </div>
                            Direção de Roteiro (Reels)
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                            onClick={() => {
                              const text = currentPost.videoScript?.map(s => `[${s.scene} - ${s.duration}]\nVisual: ${s.description}\nTexto/Falar: ${s.text || ''}`).join('\n\n');
                              navigator.clipboard.writeText(text || '');
                              toast.success("Roteiro copiado para o clipboard!");
                            }}
                          >
                            Copiar Roteiro
                          </Button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-none hover:scrollbar-thin transition-all">
                          {currentPost.videoScript.map((scene, idx) => (
                            <div key={idx} className="bg-white/30 dark:bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 group/scene hover:border-red-500/20 transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <span className="px-2.5 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/10">
                                  {scene.scene}
                                </span>
                                <span className="text-[10px] font-black text-muted-foreground/50 italic opacity-40">
                                  ⏱ {scene.duration}
                                </span>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/40 italic block">Visual Flow</span>
                                  <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                                    {scene.description}
                                  </p>
                                </div>
                                {scene.text && (
                                  <div className="bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-white/20 dark:border-white/5 relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/20" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-red-500/60 block mb-1">Text Overlay / VO</span>
                                    <p className="text-xs font-black italic text-foreground tracking-tight">"{scene.text}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator className="bg-white/10" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/90 italic">Adaptar Formato</h4>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Ajuste para outras redes sociais em um clique</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={() => handleAdapt('LinkedIn')} disabled={isAdapting} className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 hover:bg-white/60 transition-all">
                    {isAdapting && adaptTarget === 'LinkedIn' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="h-4 w-4 bg-blue-600 rounded-[2px] mr-2" />}
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAdapt('Twitter')} disabled={isAdapting} className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 hover:bg-white/60 transition-all">
                    {isAdapting && adaptTarget === 'Twitter' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="h-4 w-4 bg-black rounded-full border border-white/20 mr-2 flex items-center justify-center font-bold text-[8px] text-white italic">X</div>}
                    Threads / X
                  </Button>
                </div>
                {adaptedText && (
                  <div className="p-6 bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-[2.5rem] relative mt-4 group/adapted animate-in zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Versão {adaptTarget}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all" onClick={() => {
                          navigator.clipboard.writeText(adaptedText);
                          toast.success("Texto copiado!");
                        }}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">{adaptedText}</p>
                  </div>
                )}
              </div>

              <Separator className="bg-white/10" />

              <div className="flex flex-wrap gap-4 pt-4">
                {activeImageUrl && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowCanvasEditor(true)}
                    disabled={isApplyingText}
                    className="flex-1 lg:flex-none h-14 rounded-2xl px-8 border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-primary/5"
                  >
                    {isApplyingText ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Rendering...
                      </>
                    ) : (
                      <>
                        <Palette className="mr-3 h-5 w-5" />
                        Customizar Arte
                      </>
                    )}
                  </Button>
                )}

                <div className="flex flex-1 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex-1 h-14 rounded-2xl px-6 bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  </Button>

                  <Button
                    variant="default"
                    onClick={handleSaveToDatabase}
                    disabled={saving}
                    className="flex-[2] h-14 rounded-2xl px-8 bg-gradient-to-r from-primary via-accent to-pink-500 hover:shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-white border-none font-black uppercase tracking-widest text-[10px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Arquivando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-3 h-5 w-5" />
                        Salvar Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {showCanvasEditor && activeImageUrl && (
        <CanvasEditor
          imageUrl={activeImageUrl}
          initialText={currentPost.headlineText || ""}
          onSave={handleCanvasSave}
          onClose={() => setShowCanvasEditor(false)}
        />
      )}

      {showDebug && (
        <Card className="p-4 bg-slate-900 text-slate-100 font-mono text-[10px] border-none">
          <h5 className="text-slate-400 mb-2 uppercase border-b border-slate-800 pb-1">Status do Pipeline de Imagem</h5>
          <div className="space-y-1">
            <p><span className="text-blue-400">Fonte Atual:</span> {activeImageUrl}</p>
            <p><span className="text-green-400">Link Direto IA:</span> {currentPost.imageUrl || 'Nenhum'}</p>
            <p><span className="text-purple-400">Link Supabase:</span> {currentPost.supabaseUrl || 'Nenhum'}</p>
            <p><span className="text-yellow-400">Status:</span> {activeImageUrl === currentPost.imageUrl ? 'Tentando Original' : 'Usando Fallback'}</p>
          </div>
        </Card>
      )}
    </div>
  );
}