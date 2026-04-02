import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Copy, Check, Plus, Trash2, Search, 
  Sparkles, Heart, ShoppingBag, HelpCircle, ThumbsUp, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReplyTemplate {
  id: string;
  category: string;
  icon: React.ElementType;
  title: string;
  text: string;
}

const DEFAULT_TEMPLATES: ReplyTemplate[] = [
  {
    id: "price",
    category: "Vendas",
    icon: ShoppingBag,
    title: "Pergunta sobre preço",
    text: "Olá! 😊 Que bom que se interessou! Enviei os detalhes de valores e tamanhos no seu Direct. Confira lá! 💜",
  },
  {
    id: "shipping",
    category: "Vendas",
    icon: ShoppingBag,
    title: "Pergunta sobre entrega/frete",
    text: "Oi! Fazemos entregas para todo o Brasil! 🚚 Me chama no Direct que te passo o prazo e valor do frete para sua região. 📦",
  },
  {
    id: "compliment",
    category: "Elogios",
    icon: Heart,
    title: "Elogio ao conteúdo",
    text: "Que lindo ler isso! 😍 Ficamos muito felizes que gostou! Sua opinião é super importante pra gente. ❤️",
  },
  {
    id: "thanks",
    category: "Elogios",
    icon: ThumbsUp,
    title: "Agradecimento geral",
    text: "Muito obrigado pelo carinho! 🙏 É por vocês que criamos conteúdo todos os dias. Continue acompanhando! ✨",
  },
  {
    id: "question",
    category: "Dúvidas",
    icon: HelpCircle,
    title: "Dúvida genérica",
    text: "Olá! Que bom ver seu comentário por aqui! 😊 Me chama no Direct que te ajudo com todos os detalhes. ✨",
  },
  {
    id: "availability",
    category: "Vendas",
    icon: ShoppingBag,
    title: "Disponibilidade de produto",
    text: "Oi! Esse item está disponível sim! 🎉 Vou te mandar todas as opções no Direct agora. Confere lá! 💫",
  },
];

const CATEGORIES = ["Todos", "Vendas", "Elogios", "Dúvidas", "Personalizados"];

export default function ReadyReplies() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>(DEFAULT_TEMPLATES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customContext, setCustomContext] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filtered = templates.filter(t => {
    const matchCategory = activeCategory === "Todos" || t.category === activeCategory;
    const matchSearch = !searchTerm || 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const copyText = (template: ReplyTemplate) => {
    navigator.clipboard.writeText(template.text);
    setCopiedId(template.id);
    toast.success("Resposta copiada! Cole no Instagram.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateCustomReplies = async () => {
    if (!customContext.trim()) {
      toast.error("Descreva o contexto para gerar respostas.");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: {
          action: "generate-reply-templates",
          context: customContext,
        },
      });

      if (error) throw error;

      if (data?.templates && Array.isArray(data.templates)) {
        const newTemplates: ReplyTemplate[] = data.templates.map((t: any, i: number) => ({
          id: `custom_${Date.now()}_${i}`,
          category: "Personalizados",
          icon: Sparkles,
          title: t.title || `Resposta personalizada ${i + 1}`,
          text: t.text || t,
        }));
        setTemplates(prev => [...prev, ...newTemplates]);
        setActiveCategory("Personalizados");
        toast.success(`${newTemplates.length} respostas geradas!`);
      } else {
        // Fallback: generate simple templates locally
        const fallbackTemplates: ReplyTemplate[] = [
          {
            id: `custom_${Date.now()}_1`,
            category: "Personalizados",
            icon: Sparkles,
            title: "Resposta personalizada",
            text: `Olá! 😊 Obrigado pelo seu comentário sobre ${customContext}. Ficamos felizes em ajudar! Me chama no Direct para mais detalhes. ✨`,
          },
          {
            id: `custom_${Date.now()}_2`,
            category: "Personalizados",
            icon: Sparkles,
            title: "Resposta de engajamento",
            text: `Que incrível sua interação! 💜 Sobre ${customContext}, temos novidades chegando. Ative as notificações para não perder! 🔔`,
          },
        ];
        setTemplates(prev => [...prev, ...fallbackTemplates]);
        setActiveCategory("Personalizados");
        toast.info("Respostas geradas no modo local.");
      }

      setCustomContext("");
      setShowCustomForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar respostas. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Modelo removido.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter uppercase flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Respostas</span>
            <span className="text-hero-muted">Prontas</span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
            Banco de respostas para copiar e colar nos seus comentários do Instagram
          </p>
        </div>
        <Button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="shrink-0 rounded-2xl gap-2 bg-gradient-to-r from-primary via-accent to-pink-500 text-white font-bold text-xs uppercase tracking-wider"
        >
          <Sparkles className="h-4 w-4" />
          Gerar com IA
        </Button>
      </div>

      {/* AI Generator */}
      {showCustomForm && (
        <Card className="p-6 rounded-3xl border-primary/20 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Descreva o contexto e a IA gera modelos de resposta
          </p>
          <Textarea
            placeholder="Ex: Cliente perguntando sobre curso de maquiagem online, valor e formas de pagamento..."
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            className="min-h-[100px] rounded-2xl bg-background text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCustomForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={generateCustomReplies} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar Respostas
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            placeholder="Buscar modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/30 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full text-[10px] font-bold uppercase tracking-wider h-8 px-4"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <MessageSquare className="h-12 w-12 mb-4" />
            <p className="text-sm font-bold">Nenhum modelo encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="p-5 rounded-2xl hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold leading-tight">{template.title}</h3>
                          <Badge variant="secondary" className="text-[9px] mt-0.5">{template.category}</Badge>
                        </div>
                      </div>
                      {template.id.startsWith("custom") && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeTemplate(template.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">
                      {template.text}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(template)}
                      className="w-full rounded-xl gap-2 text-xs font-bold h-9"
                    >
                      {copiedId === template.id ? (
                        <><Check className="h-3.5 w-3.5 text-green-500" /> Copiado!</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copiar Resposta</>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
