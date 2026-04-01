import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Calendar, Download, Grid3X3, List, Link as LinkIcon, MessageSquare, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InstagramGridPreview } from "@/components/InstagramGridPreview";

export default function SavedPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast.error("Error loading saved posts");
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Post deleted successfully");
      loadPosts();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Error deleting post");
    }
  };

  const downloadPost = async (post: any) => {
    try {
      // Download text content
      const content = `${post.caption}\n\n${post.hashtags.join(" ")}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `post-${post.id.slice(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Download image if available
      if (post.image_url) {
        const response = await fetch(post.image_url);
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        const imageLink = document.createElement("a");
        imageLink.href = imageUrl;
        imageLink.download = `post-image-${post.id.slice(0, 8)}.png`;
        document.body.appendChild(imageLink);
        imageLink.click();
        document.body.removeChild(imageLink);
        URL.revokeObjectURL(imageUrl);
      }

      toast.success("Download complete!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Error downloading files");
    }
  };

  const copyApprovalLink = (postId: string) => {
    const link = `${window.location.origin}/approve/${postId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de aprovação copiado!");
  };

  const schedulePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if Instagram is connected
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("instagram_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.instagram_access_token) {
        toast.error("Connect your Instagram account first");
        navigate("/instagram");
        return;
      }

      // Navigate to schedule page
      navigate("/schedule", { state: { schedulePostId: postId } });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error scheduling post");
    }
  };

  const publishNow = async (post: any) => {
    let toastId: string | number | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("company_profiles")
        .select("instagram_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.instagram_access_token) {
        toast.error("Connect your Instagram account first");
        navigate("/instagram");
        return;
      }

      const { data: scheduledPost, error: insertError } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          generated_post_id: post.id,
          scheduled_date: new Date().toISOString().split("T")[0],
          scheduled_time: new Date().toTimeString().slice(0, 5),
          status: "scheduled",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toastId = toast.loading("Publicando no Instagram...");

      // Retry logic - up to 3 attempts
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error } = await supabase.functions.invoke("publish-instagram", {
            body: { scheduledPostId: scheduledPost.id },
          });

          if (error) throw error;

          if (data.success) {
            toast.success("Post publicado com sucesso no Instagram!", { id: toastId });
            loadPosts();
            return;
          } else {
            throw new Error(data.error || "Erro ao publicar");
          }
        } catch (e: any) {
          lastError = e;
          console.warn(`Publish attempt ${attempt}/3 failed:`, e.message);
          if (attempt < 3) {
            toast.loading(`Tentativa ${attempt + 1}/3...`, { id: toastId });
            await new Promise(r => setTimeout(r, 2000 * attempt));
          }
        }
      }

      throw lastError || new Error("Falha após 3 tentativas");
    } catch (error: any) {
      console.error("Error publishing:", error);
      const errorMessage = error.message || "Erro ao publicar no Instagram";
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">Carregando Acervo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-8 border-b border-white/10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Meus</span>
            <span className="text-foreground/20">Posts</span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
            Acervo estratégico de criações de alto impacto
          </p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-10">
        <TabsList className="h-14 p-1.5 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10">
          <TabsTrigger value="list" className="flex items-center gap-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
            <List className="h-4 w-4" />
            Lista de Ativos
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
            <Grid3X3 className="h-4 w-4" />
            Prévia do Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-0">
          {posts.length === 0 ? (
            <div className="glass-premium p-20 text-center rounded-[3rem] border-dashed border-2 border-white/10 relative overflow-hidden group/empty">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opaicty-50" />
              <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover/empty:scale-110 group-hover/empty:rotate-12 transition-all duration-700">
                <MessageSquare className="h-12 w-12 text-primary/30" />
              </div>
              <h3 className="text-2xl font-black text-foreground/90 uppercase tracking-tighter italic mb-3">Vácuo de Criação</h3>
              <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                Você ainda não salvou nenhum post. Comece a gerar conteúdo estratégico no dashboard.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div key={post.id} className="glass-premium p-5 rounded-[2.5rem] border-none shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group/card bg-white/40 dark:bg-black/20">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-pink-500 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  
                  <PostImage
                    src={post.image_url}
                    alt={post.alt_text || "Post"}
                    slides={post.slides}
                    headlineText={post.headline_text}
                  />

                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-black text-foreground/80 uppercase tracking-tight line-clamp-1">{post.theme}</p>
                      <Badge 
                        variant={
                          post.status === "approved" ? "default" : 
                          post.status === "rejected" ? "destructive" : 
                          "secondary"
                        }
                        className={`rounded-lg h-6 px-3 text-[8px] font-black uppercase tracking-widest border-none ${
                          post.status === "approved" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : 
                          post.status === "rejected" ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : 
                          "bg-white/20 backdrop-blur-md text-foreground/40"
                        }`}
                      >
                        {post.status === "approved" && "Aprovado"}
                        {post.status === "rejected" && "Ajustes"}
                        {(post.status === "draft" || !post.status) && "Rascunho"}
                        {post.status === "scheduled" && "Agendado"}
                        {post.status === "published" && "Publicado"}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                      {post.caption}
                    </p>

                    <div className="flex flex-wrap gap-2 py-2">
                      {post.hashtags.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-5 border-t border-white/10 grid grid-cols-4 gap-2">
                       <Button size="icon" variant="ghost" onClick={() => downloadPost(post)} className="h-10 w-full rounded-xl bg-white/5 hover:bg-white/10 group/btn">
                         <Download className="h-4 w-4 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => schedulePost(post.id)} className="h-10 w-full rounded-xl bg-white/5 hover:bg-primary/10 group/btn">
                         <Calendar className="h-4 w-4 text-primary opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => navigate("/dashboard", { state: { editPost: post } })} className="h-10 w-full rounded-xl bg-white/5 hover:bg-amber-500/10 group/btn">
                         <Edit2 className="h-4 w-4 text-amber-500 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => deletePost(post.id)} className="h-10 w-full rounded-xl bg-white/5 hover:bg-red-500/10 group/btn">
                         <Trash2 className="h-4 w-4 text-red-500 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                       </Button>
                    </div>

                    <Button
                      variant="default"
                      onClick={() => publishNow(post)}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-black uppercase tracking-widest text-[9px] shadow-lg hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 border-none mt-2"
                    >
                      Publicar Agora
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grid" className="mt-0">
          <div className="glass-premium p-8 md:p-12 rounded-[3.5rem] border-none shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-full -mr-40 -mt-40 blur-[80px] opacity-50" />
             <InstagramGridPreview />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostImage({ src, alt, headlineText, slides }: { src: string; alt: string; headlineText?: string; slides?: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(slides && slides.length > 0 ? slides[0].image_url : src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(slides && slides.length > 0 ? slides[currentSlide].image_url : src);
    setHasError(false);
  }, [src, currentSlide, slides]);

  const handleError = () => {
    console.warn("SavedPosts: Image error...");
    if (!currentSrc.includes('images.unsplash.com')) {
      const query = encodeURIComponent(alt || "luxury,design");
      setCurrentSrc(`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80&q=fallback&term=${query}`);
    } else {
      setCurrentSrc(`https://placehold.co/1080x1080/0f172a/ffffff?text=Studio+High-End`);
    }
  };

  const hasSlides = slides && slides.length > 0;

  return (
    <div className="relative group/img rounded-[2rem] overflow-hidden bg-black/5 shadow-inner border border-white/20">
      <img
        src={currentSrc}
        alt={alt}
        onError={handleError}
        className="w-full aspect-square object-cover transition-transform duration-1000 group-hover/img:scale-105"
      />
      
      {headlineText && !slides && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center pointer-events-none backdrop-blur-[2px] bg-black/10">
          <h3 className="text-white font-black text-2xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] leading-tight uppercase tracking-tighter italic">
            {headlineText}
          </h3>
        </div>
      )}
      
      {hasSlides && (
        <>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 w-4 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white w-8' : 'bg-white/30'}`} 
              />
            ))}
          </div>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center shadow-2xl opacity-0 group-hover/img:opacity-100 hover:bg-white/20 transition-all duration-300 disabled:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(prev => Math.max(0, prev - 1));
            }}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/20 flex items-center justify-center shadow-2xl opacity-0 group-hover/img:opacity-100 hover:bg-white/20 transition-all duration-300 disabled:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
            }}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.2em] text-white h-7 px-4 flex items-center rounded-xl border border-white/10">
            {currentSlide + 1} <span className="opacity-40 mx-1">/</span> {slides.length}
          </div>
        </>
      )}
    </div>
  );
}
