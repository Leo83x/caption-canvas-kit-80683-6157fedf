import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ImagePlus
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PostVariation {
  variant: string;
  caption: string;
  hashtags: string[];
  imagePrompt: {
    description: string;
    colors: string[];
    style: string;
    aspectRatio: string;
    elements: string[];
    mood: string;
  };
  altText: string;
  rationale: string;
  imageUrl?: string;
  imageError?: string;
}

interface PostPreviewProps {
  variations?: PostVariation[];
}

export function PostPreview({ variations = [] }: PostPreviewProps) {
  const [currentVariation, setCurrentVariation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!variations || variations.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhuma publicação gerada ainda. Preencha o formulário e gere suas variações!
          </p>
        </div>
      </Card>
    );
  }

  const currentPost = variations[currentVariation];

  const handleExport = async () => {
    if (!currentPost) return;
    
    setExporting(true);
    try {
      // Exportar texto
      const content = `
VARIAÇÃO: ${currentPost.variant}

LEGENDA:
${currentPost.caption}

HASHTAGS:
${currentPost.hashtags.join(" ")}

DESCRIÇÃO DA IMAGEM:
${currentPost.imagePrompt.description}

TEXTO ALTERNATIVO:
${currentPost.altText}

ESTRATÉGIA:
${currentPost.rationale}
      `.trim();

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post-variacao-${currentPost.variant}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Exportar imagem se disponível
      if (currentPost.imageUrl) {
        const response = await fetch(currentPost.imageUrl);
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        const imgLink = document.createElement("a");
        imgLink.href = imageUrl;
        imgLink.download = `imagem-variacao-${currentPost.variant}.jpg`;
        document.body.appendChild(imgLink);
        imgLink.click();
        document.body.removeChild(imgLink);
        URL.revokeObjectURL(imageUrl);
      }

      toast.success("Post e imagem exportados com sucesso!");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Erro ao exportar arquivos");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!currentPost) return;

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
        post_type: "feed",
        caption: currentPost.caption,
        hashtags: currentPost.hashtags,
        image_prompt: currentPost.imagePrompt.description,
        image_url: currentPost.imageUrl || null,
        alt_text: currentPost.altText,
        rationale: currentPost.rationale,
        status: "draft"
      });

      if (error) throw error;

      toast.success("Post salvo com sucesso!");
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast.error("Erro ao salvar post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-smooth">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-display font-bold">Variação {currentPost.variant}</h3>
            <p className="text-sm text-muted-foreground">
              {variations.length} variações geradas para teste A/B
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentVariation(Math.max(0, currentVariation - 1))}
              disabled={currentVariation === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentVariation(Math.min(variations.length - 1, currentVariation + 1))}
              disabled={currentVariation === variations.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-3 border-b">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <span className="font-semibold text-sm">sua_empresa</span>
              </div>
              
              <div className="bg-muted aspect-square flex items-center justify-center relative">
                {currentPost.imageUrl ? (
                  <img 
                    src={currentPost.imageUrl} 
                    alt={currentPost.altText}
                    className="w-full h-full object-cover"
                  />
                ) : currentPost.imageError ? (
                  <div className="text-center p-4">
                    <ImagePlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Erro ao gerar imagem</p>
                  </div>
                ) : (
                  <>
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                    <p className="absolute bottom-4 text-sm text-muted-foreground">Gerando imagem...</p>
                  </>
                )}
              </div>

              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Heart className="h-6 w-6 hover:text-red-500 cursor-pointer" />
                    <MessageCircle className="h-6 w-6 hover:text-primary cursor-pointer" />
                    <Send className="h-6 w-6 hover:text-primary cursor-pointer" />
                  </div>
                  <Bookmark className="h-6 w-6 hover:text-primary cursor-pointer" />
                </div>
                
                <div className="text-sm">
                  <span className="font-semibold">sua_empresa</span>{" "}
                  <span className="whitespace-pre-wrap">{currentPost.caption}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">Análise Estratégica</Badge>
              </h4>
              <p className="text-sm text-muted-foreground">{currentPost.rationale}</p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Prompt da Imagem</h4>
              <div className="space-y-2">
                <p className="text-sm">{currentPost.imagePrompt.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Estilo: {currentPost.imagePrompt.style}</Badge>
                  <Badge variant="secondary">Mood: {currentPost.imagePrompt.mood}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Texto Alternativo</h4>
              <p className="text-sm text-muted-foreground">{currentPost.altText}</p>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Hashtags ({currentPost.hashtags.length})</h4>
              <div className="flex flex-wrap gap-2">
                {currentPost.hashtags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveToDatabase}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Salvar Post
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
