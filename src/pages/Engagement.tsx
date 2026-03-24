import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  User, 
  Clock, 
  MoreVertical, 
  Reply, 
  Search,
  CheckCircle2,
  AlertCircle,
  Instagram,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  aiResponse?: string;
  status: "pending" | "replied" | "generating";
}

interface Post {
  id: string;
  caption: string;
  imageUrl: string;
  timestamp: string;
  commentCount: number;
}

const MOCK_POSTS: Post[] = [
  {
    id: "post_1",
    caption: "Lançamento da nova coleção de verão! ☀️ Pronta para brilhar? #verao #moda",
    imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    commentCount: 3
  },
  {
    id: "post_2",
    caption: "Dica do dia: Como combinar cores vibrantes no seu dia a dia. 🎨",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    commentCount: 2
  }
];

const MOCK_COMMENTS: Record<string, Comment[]> = {
  "post_1": [
    { id: "c1", username: "maria_silva", text: "Amei essas cores! Qual o valor da saia?", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), status: "pending" },
    { id: "c2", username: "joao.design", text: "Excelente composição das fotos. Parabéns pelo trabalho!", timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), status: "replied" },
    { id: "c3", username: "ana_clara", text: "Faz entregas para o Nordeste?", timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), status: "pending" }
  ],
  "post_2": [
    { id: "c4", username: "pedro_caio", text: "Precisava muito dessa dica hoje! Valeu!", timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), status: "pending" },
    { id: "c5", username: "sofia.brand", text: "Qual a paleta que vocês usaram nesse post?", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), status: "pending" }
  ]
};

export default function Engagement() {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<string>(MOCK_POSTS[0].id);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS[MOCK_POSTS[0].id]);
  const [replyText, setReplyText] = useState<string>("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // If we're using mock data, update comments when post changes
    if (!isConnected) {
      setComments(MOCK_COMMENTS[selectedPostId] || []);
    }
  }, [selectedPostId, isConnected]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(data);
      if (data?.instagram_access_token) {
        setIsConnected(true);
        // Here we would fetch REAL comments from Instagram API
        // For now, let's stick to Mock but mark as connected
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = async (comment: Comment) => {
    setGeneratingId(comment.id);
    setReplyingToId(comment.id);
    setReplyText("Gerando sugestão inteligente... aguarde um momento.");
    
    try {
      const selectedPost = posts.find(p => p.id === selectedPostId);
      
      // Intentional timeout to not wait forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { 
          action: "generate-reply",
          commentText: comment.text,
          author: comment.username,
          brandVoice: profile?.brand_voice || "Profissional e acolhedor",
          companyDescription: profile?.company_description || "",
          postCaption: selectedPost?.caption || ""
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (error || !data?.reply) {
        throw new Error("Fallover into local AI");
      }
      
      setComments(prev => prev.map(c => 
        c.id === comment.id ? { ...c, aiResponse: data.reply } : c
      ));
      setReplyText(data.reply);
      toast.success("Resposta gerada pela IA!");
    } catch (error: any) {
      console.log("Using local backup AI due to edge function timeout/missing deploy");
      
      // Smart Local Fallback
      const localReply = generateLocalFallback(comment.text, comment.username);
      setComments(prev => prev.map(c => 
        c.id === comment.id ? { ...c, aiResponse: localReply } : c
      ));
      setReplyText(localReply);
      toast.info("Sugestão gerada (Modo de Contingência)");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    
    if (isConnected && profile?.instagram_access_token) {
      const loadingToast = toast.loading("Enviando resposta para o Instagram...");
      try {
        const response = await fetch(
          `https://graph.facebook.com/v20.0/${commentId}/replies`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: replyText,
              access_token: profile.instagram_access_token
            })
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        toast.success("Resposta enviada com sucesso!", { id: loadingToast });
      } catch (error: any) {
        console.error("Error sending reply:", error);
        toast.error(`Erro ao enviar resposta: ${error.message}`, { id: loadingToast });
        return;
      }
    } else {
      toast.success("Resposta simulada com sucesso! (Modo Demo)");
    }

    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, status: "replied", aiResponse: undefined } : c
    ));
    setReplyText("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
                <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Engajamento</span>
                <span className="text-foreground/20">IA</span>
              </h1>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
                Responda comentários com inteligência e mantenha sua comunidade ativa
              </p>
            </div>
            
            {!isConnected && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 py-1 px-3 shrink-0">
                <AlertCircle className="h-3 w-3 mr-2" />
                Modo Demo
              </Badge>
            )}
            
            {isConnected && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 py-1 px-3 shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Conectado ao Instagram
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
            {/* Sidebar: Posts List */}
            <Card className="lg:col-span-4 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar posts..." className="pl-9 bg-background h-9 text-sm" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className={`w-full flex gap-3 p-3 rounded-xl transition-all text-left hover:bg-muted/50 ${
                        selectedPostId === post.id ? "bg-primary/10 ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="h-14 w-14 rounded-lg object-cover ring-1 ring-border" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight mb-1">
                          {post.caption}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1 text-primary">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {post.commentCount} comentários
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Main Content: Comments List */}
            <Card className="lg:col-span-8 flex flex-col overflow-hidden bg-muted/10">
              <div className="p-4 border-b bg-background flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Reply className="h-5 w-5 text-primary" />
                  <h2 className="font-bold">Comentários do Post</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {comments.filter(c => c.status === "pending").length} Pendentes
                  </Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <MessageSquare className="h-12 w-12 mb-4" />
                      <p>Nenhum comentário encontrado para este post.</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-background">
                            {comment.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-sm flex items-center gap-2">
                                {comment.username}
                                {comment.status === "replied" && (
                                  <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-600 border-green-500/20">Respondido</Badge>
                                )}
                              </h3>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                            <div className="bg-background p-3 rounded-2xl rounded-tl-none border shadow-sm text-sm leading-relaxed">
                              {comment.text}
                            </div>

                            {comment.status === "pending" && (
                              <div className="flex flex-col gap-3 mt-4 animate-in zoom-in-95 duration-200">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-[11px] font-bold gap-2 text-primary hover:bg-primary/5 border-primary/20"
                                    onClick={() => generateAIResponse(comment)}
                                    disabled={generatingId === comment.id}
                                  >
                                    {generatingId === comment.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-3 w-3" />
                                    )}
                                    Sugerir Resposta com IA
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 text-[11px]"
                                    onClick={() => { setReplyText(`@${comment.username} `); setReplyingToId(comment.id); }}
                                  >
                                    Escrever manualmente
                                  </Button>
                                </div>

                                {replyingToId === comment.id && (
                                  <div className="space-y-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 border-dashed">
                                    <Label className="text-[10px] uppercase font-bold text-primary flex items-center gap-1.5">
                                      <Sparkles className="h-3 w-3" /> Resposta Sugerida pela IA
                                    </Label>
                                    <Textarea 
                                      value={replyText} 
                                      onChange={(e) => setReplyText(e.target.value)}
                                      className="min-h-[100px] bg-background text-sm leading-relaxed"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => { setReplyText(""); setReplyingToId(null); }} className="text-xs">Cancelar</Button>
                                      <Button size="sm" onClick={() => handleSendReply(comment.id)} className="text-xs gap-2">
                                        <Send className="h-3 w-3" /> Enviar Resposta
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              {/* Manual Input Bar */}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Sua resposta..." 
                    className="resize-none min-h-[44px] max-h-32 text-sm"
                    rows={1}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={() => handleSendReply(selectedPostId)}>
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
        </div>
    </div>
  );
}

const generateLocalFallback = (text: string, username: string) => {
  const t = text.toLowerCase();
  if (t.includes("valor") || t.includes("preço") || t.includes("quanto")) {
    return `@${username} Olá! Enviamos os detalhes de valores e tamanhos no seu Direct. Confira lá! 😉`;
  }
  if (t.includes("entrega") || t.includes("frete") || t.includes("envia")) {
    return `@${username} Fazemos entregas para todo o Brasil! Me chama no Direct que te passo o prazo para sua região. 🚚`;
  }
  if (t.includes("amei") || t.includes("lindo") || t.includes("parabéns") || t.includes("top")) {
    return `@${username} Ficamos muito felizes que gostou! Sua opinião é muito importante para nós. ❤️`;
  }
  return `@${username} Olá! Que bom ver seu comentário por aqui. Como podemos te ajudar hoje? ✨`;
};
