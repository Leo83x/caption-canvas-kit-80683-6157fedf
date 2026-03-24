import { StatsOverview } from "@/components/StatsOverview";
import { PostCreator } from "@/components/PostCreator";
import { PostPreview } from "@/components/PostPreview";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { TrendAlerts } from "@/components/TrendAlerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerationModal } from "@/components/GenerationModal";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { GeneratedPost, PostVariation } from "@/types";
import { composeLogoOnImage, uploadComposedImage } from "@/utils/imageComposition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [composingLogos, setComposingLogos] = useState(false);
  const [trendTopic, setTrendTopic] = useState<{ text: string; id: number } | undefined>(undefined);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.editPost) {
      const editPost = location.state.editPost;
      console.log("Loading post for editing:", editPost.id);
      
      const variation: PostVariation = {
        id: editPost.id,
        variant: editPost.variant || "A",
        caption: editPost.caption,
        tone: editPost.tone || "professional",
        hashtags: editPost.hashtags || [],
        imageUrl: editPost.image_url,
        imagePrompt: {
          description: editPost.image_prompt || "",
          colors: [],
          style: "photography",
          aspectRatio: editPost.post_type === 'story' ? '9:16' : '1:1',
          elements: [],
          mood: "professional"
        },
        altText: editPost.alt_text || "",
        rationale: editPost.rationale || "",
        headlineText: editPost.headline_text,
        slides: editPost.slides || [],
        sourceUrl: editPost.source_url,
        successScore: editPost.success_score,
        successAnalysis: editPost.success_analysis
      };

      setGeneratedPost({
        variations: [variation],
        metadata: {
          objective: editPost.objective || "engagement",
          tone: editPost.tone || "professional",
          postType: editPost.post_type || "feed",
          requiresReview: false,
          reviewReason: null
        }
      });

      // Clear state to avoid re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handlePostGenerated = async (variations: any[]) => {
    // Check if any variation needs logo composition
    const needsComposition = variations.some((v: any) => v.needsLogoComposition && v.logoUrl && v.imageUrl);

    if (needsComposition) {
      setComposingLogos(true);
      toast.info("Processando imagens geradas...");

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Process each variation
        const processedVariations = await Promise.all(
          variations.map(async (variation: any) => {
            if (variation.needsLogoComposition && variation.logoUrl && variation.imageUrl) {
              try {
                console.log(`Composing logo for variant ${variation.variant}`);

                // Compose logo on image
                const composedDataUrl = await composeLogoOnImage(
                  variation.imageUrl,
                  variation.logoUrl,
                  'bottom-right',
                  0.15
                );

                // Upload composed image
                const newImageUrl = await uploadComposedImage(
                  composedDataUrl,
                  user.id,
                  supabase
                );

                console.log(`Logo composed successfully for variant ${variation.variant}`);

                return {
                  ...variation,
                  imageUrl: newImageUrl,
                  needsLogoComposition: false
                };
              } catch (error) {
                console.error(`Failed to compose logo for variant ${variation.variant}:`, error);
                toast.error(`Error adding logo to variation ${variation.variant}`);
                return variation;
              }
            }
            return variation;
          })
        );

        setGeneratedPost({ variations: processedVariations, metadata: ({} as any) });
        toast.success("Imagens processadas com sucesso!");
      } catch (error) {
        console.error("Error composing logos:", error);
        toast.error("Erro ao processar as imagens.");
        setGeneratedPost({ variations: variations, metadata: ({} as any) });
      } finally {
        setComposingLogos(false);
      }
    } else {
      setGeneratedPost({ variations: variations, metadata: ({} as any) });
    }
  };



  return (
    <>
      <GenerationModal 
        isOpen={isGenerationModalOpen} 
        onClose={() => setIsGenerationModalOpen(false)} 
      />

      <div className="space-y-10 md:space-y-12 animate-in fade-in transition-all duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-foreground/90 tracking-tighter">Dashboard</h1>
          <p className="text-base md:text-lg font-medium text-muted-foreground/60 tracking-tight">
            Transforme suas ideias em posts profissionais com a potência da IA
          </p>
        </div>

        <StatsOverview />
        
        {!generatedPost && (
          <div className="space-y-6 animate-in fade-in">
            <TrendAlerts onSelectTrend={(trend) => {
              setTrendTopic({ text: trend, id: Date.now() });
              toast.info(`Trend selecionada: ${trend}. Formulário preenchido!`);
            }} />
            
            <PostCreator 
              onPostGenerated={handlePostGenerated} 
              onGeneratingChange={setIsGenerationModalOpen}
              initialTopic={trendTopic}
            />
          </div>
        )}

        {generatedPost && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Preview do Conteúdo Gerado</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setGeneratedPost(null)}
              >
                Voltar e Criar Novo
              </Button>
            </div>
            <PostPreview variations={generatedPost.variations} />
          </div>
        )}
      </div>
    </>
  );
};

export default Index;
