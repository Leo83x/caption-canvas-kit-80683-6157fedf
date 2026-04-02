import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, TrendingUp, Users, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MOCK_LEADS = [
  {
    id: 1,
    author: "clara_marketing",
    comment: "Vocês tem alguma ferramenta para automatizar Reels? Preciso de algo urgente!",
    source: "Post de @concorrente_social",
    score: 95,
    type: "Intenção de Compra"
  },
  {
    id: 2,
    author: "joao_consultor",
    comment: "Incrível como a IA está mudando o jogo. Alguém indica um gerador de imagens bom?",
    source: "Hashtag #SocialMediaBrasil",
    score: 88,
    type: "Dúvida Técnica"
  },
  {
    id: 3,
    author: "ana_doces_artesanais",
    comment: "Queria muito fazer vídeos assim mas não tenho tempo de gravar...",
    source: "Hashtag #MarketingParaPequenasEmpresas",
    score: 82,
    type: "Problema/Dor"
  }
];

export default function LeadHunter() {
  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!keyword) {
      toast.error("Digite uma hashtag ou palavra-chave");
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      toast.success("Oportunidades encontradas para " + keyword);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
           <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Caçador</span>
           <span className="text-hero-muted">de Leads</span>
        </h1>
        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">Encontre clientes em potencial monitorando conversas e tendências em tempo real.</p>
      </div>

      <Card className="p-8 glass-card-white border-none shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px] space-y-3 relative z-10">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">O que você quer monitorar?</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Ex: #marketingdigital, @concorrente, corretor de imoveis..." 
                className="pl-10 h-12 bg-background/50 border-primary/10"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="h-12 px-8 bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all"
          >
            {isSearching ? "Escaneando..." : "Caçar Oportunidades"}
          </Button>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/5" onClick={() => setKeyword("#socialmedia")}>#socialmedia</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/5" onClick={() => setKeyword("@resultadosdigitais")}>@resultadosdigitais</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-primary/5" onClick={() => setKeyword("vendas automáticas")}>vendas automáticas</Badge>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-4 bg-primary/5 border-primary/10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">128</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Sinais de Intenção</p>
          </div>
        </Card>
        <Card className="p-4 bg-accent/5 border-accent/10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">45</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Leads Quentes</p>
          </div>
        </Card>
        <Card className="p-4 bg-orange-500/5 border-orange-500/10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">89%</p>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Score de Relevância</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Oportunidades de Ouro (Social Listening)
        </h2>
        
        <div className="space-y-3">
          {MOCK_LEADS.map((lead) => (
            <Card key={lead.id} className="p-5 hover:border-primary/40 transition-all group overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1 bg-primary/20 group-hover:bg-primary transition-all" />
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">@{lead.author}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase">{lead.type}</Badge>
                    <span className="text-[10px] text-muted-foreground italic">{lead.source}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic text-foreground/80">"{lead.comment}"</p>
                </div>
                <div className="flex flex-col items-end justify-between gap-2 min-w-[150px]">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Lead Score</p>
                    <p className="text-xl font-black text-primary">{lead.score}%</p>
                  </div>
                  <Button size="sm" className="w-full gap-2 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar Abordagem
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
