import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function PublicApproval() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "loading">("loading");
  const [company, setCompany] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const { data: postData, error: postError } = await supabase
          .from("generated_posts")
          .select("*")
          .eq("id", id)
          .single();
          
        if (postError) throw postError;
        setPost(postData);
        setStatus(postData.status === "approved" || postData.status === "rejected" ? postData.status : "pending");

        // Try to fetch company profile info if possible (might be blocked by RLS for anon, but we can try)
        if (postData.user_id) {
            const { data: companyData } = await supabase
              .from("company_profiles")
              .select("company_name, logo_url")
              .eq("user_id", postData.user_id)
              .maybeSingle();
              
            if (companyData) setCompany(companyData);
        }

      } catch (err) {
        console.error("Error fetching post:", err);
        toast.error("Link inválido ou post não encontrado.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleAction = async (action: "approved" | "rejected") => {
    setSubmitting(true);
    try {
      const payload: any = {
          p_post_id: id,
          p_new_status: action
      };
      if (comment) {
          payload.p_comment = comment;
      }

      const { error } = await supabase.rpc('approve_post', payload);
        
      if (error) throw error;
      setStatus(action);
      toast.success(action === "approved" ? "Post aprovado com sucesso!" : "Alterações solicitadas enviadas.");
    } catch (err: any) {
      console.error("Error updating post:", err);
      toast.error(`Erro: ${err.message || "Falha ao enviar resposta"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Post não encontrado</h2>
          <p className="text-muted-foreground">Este link de aprovação é inválido ou expirou.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          {company.logo_url && (
            <img src={company.logo_url} alt="Logo" className="h-16 w-16 rounded-full mx-auto mb-4 object-cover" />
          )}
          <h1 className="text-2xl font-bold">Aprovação de Criativo</h1>
          <p className="text-muted-foreground">
            {company.company_name || "Sua Agência"} enviou um post para sua revisão.
          </p>
        </div>

        <Card className="overflow-hidden shadow-lg border-0">
          <div className="grid md:grid-cols-2">
            <div className="bg-muted aspect-square relative flex items-center justify-center overflow-hidden">
               {post.slides && post.slides.length > 0 ? (
                 <div className="relative w-full h-full">
                   <img 
                     src={post.slides[currentSlide].image_url} 
                     alt={`Slide ${currentSlide + 1}`} 
                     className="w-full h-full object-cover transition-all duration-300" 
                     key={currentSlide}
                   />
                   
                   {post.slides[currentSlide].headlineText && (
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 p-6 text-center">
                        <h3 className="text-white font-bold text-2xl drop-shadow-lg leading-tight uppercase">
                          {post.slides[currentSlide].headlineText}
                        </h3>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {post.slides.map((_: any, i: number) => (
                        <div 
                          key={i} 
                          className={`h-1.5 w-1.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-3' : 'bg-white/50'}`} 
                        />
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-none z-10"
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      disabled={currentSlide === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-none z-10"
                      onClick={() => setCurrentSlide(prev => Math.min((post.slides?.length || 1) - 1, prev + 1))}
                      disabled={currentSlide === (post.slides?.length || 1) - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Badge className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 border-none">
                      {currentSlide + 1}/{post.slides.length}
                    </Badge>
                 </div>
               ) : post.image_url ? (
                 <img src={post.image_url} alt="Post preview" className="w-full h-full object-cover" />
               ) : (
                 <p className="text-muted-foreground">Sem imagem</p>
               )}
            </div>
            
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
                    {status === "approved" && "✅ Aprovado"}
                    {status === "rejected" && "❌ Alterações Solicitadas"}
                    {status === "pending" && "⏳ Aguardando Revisão"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Legenda</h3>
                  <p className="text-sm whitespace-pre-wrap">{post.caption}</p>
                </div>

                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-blue-500">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {status === "pending" ? (
                <div className="mt-8 space-y-4 pt-6 border-t">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Comentários ou Alterações</label>
                    <Textarea 
                      placeholder="Opcional: Digite aqui se precisar de algum ajuste..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleAction("rejected")}
                      disabled={submitting}
                    >
                      Solicitar Ajuste
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleAction("approved")}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprovar Post
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t">
                  <div className={`p-4 rounded-lg flex items-start gap-3 ${status === "approved" ? "bg-green-50 text-green-800 dark:bg-green-900/20" : "bg-red-50 text-red-800 dark:bg-red-900/20"}`}>
                    {status === "approved" ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <XCircle className="h-5 w-5 mt-0.5" />}
                    <div>
                      <p className="font-medium">
                        {status === "approved" ? "Post aprovado!" : "Ajustes solicitados"}
                      </p>
                      {post.client_comment && (
                        <p className="text-sm mt-1 opacity-90">"{post.client_comment}"</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
