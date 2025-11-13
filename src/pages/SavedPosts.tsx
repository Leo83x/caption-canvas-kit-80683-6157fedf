import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast.error("Erro ao carregar posts salvos");
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
      toast.success("Post deletado com sucesso");
      loadPosts();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao deletar post");
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
      
      toast.success("Download concluído!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Erro ao baixar arquivos");
    }
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
        toast.error("Conecte sua conta do Instagram primeiro");
        navigate("/instagram");
        return;
      }

      // Navigate to schedule page
      navigate("/", { state: { schedulePostId: postId } });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao agendar post");
    }
  };

  const publishNow = async (post: any) => {
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
        toast.error("Conecte sua conta do Instagram primeiro");
        navigate("/instagram");
        return;
      }

      // Create a temporary scheduled post
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

      toast.loading("Publicando no Instagram...");

      const { data, error } = await supabase.functions.invoke("publish-instagram", {
        body: { scheduledPostId: scheduledPost.id },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Post publicado com sucesso no Instagram!");
        loadPosts();
      } else {
        throw new Error(data.error || "Erro ao publicar");
      }
    } catch (error: any) {
      console.error("Error publishing:", error);
      toast.error(error.message || "Erro ao publicar no Instagram");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Posts Salvos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus posts gerados
          </p>
        </div>

        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum post salvo ainda</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="p-6 space-y-4">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.alt_text || "Post"}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">{post.theme}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {post.caption}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                    {post.hashtags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{post.hashtags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPost(post)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => schedulePost(post.id)}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Agendar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => publishNow(post)}
                    className="flex-1"
                  >
                    Publicar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
