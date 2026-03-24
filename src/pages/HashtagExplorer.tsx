import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, TrendingUp, Hash, Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Hashtag {
  tag: string;
  category: string;
  score: number;
  estimatedReach?: number;
  description?: string;
}

export default function HashtagExplorer() {
  const [keywords, setKeywords] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load saved hashtags on mount
  useEffect(() => {
    loadSavedHashtags();
  }, []);

  const loadSavedHashtags = async () => {
    const { data, error } = await supabase
      .from('hashtag_trends' as any)
      .select('*')
      .order('trending_score', { ascending: false })
      .limit(20);

    if (!error && data) {
      setHashtags(data.map(h => ({
        tag: h.hashtag,
        category: h.category || 'General',
        score: h.trending_score || 0,
        estimatedReach: 0,
      })));
    }
  };

  const filteredHashtags = searchTerm
    ? hashtags.filter(h =>
      h.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : hashtags;

  const searchHashtags = async () => {
    if (!keywords.trim()) {
      toast.error('Enter keywords to search');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('search-hashtags', {
        body: {
          keywords: keywords.trim(),
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.hashtags) {
        setHashtags(data.hashtags);
        toast.success(`${data.hashtags.length} hashtags found!`);
      } else {
        toast.error('No hashtags found');
      }
    } catch (error: any) {
      console.error('Error searching hashtags:', error);
      toast.error('Error searching hashtags: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  };

  const categoryColors: Record<string, string> = {
    "Brand": "bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200",
    "Niche": "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-700 border-blue-200",
    "Long Tail": "bg-gradient-to-br from-green-500/10 to-emerald-500/10 text-green-700 border-green-200",
    "General": "bg-gradient-to-br from-gray-500/10 to-slate-500/10 text-gray-700 border-gray-200",
  };

  const copyHashtag = (hashtag: string) => {
    navigator.clipboard.writeText(hashtag);
    setCopiedHashtag(hashtag);
    toast.success(`${hashtag} copied!`);
    setTimeout(() => setCopiedHashtag(null), 2000);
  };

  const copyAllHashtags = () => {
    const allTags = filteredHashtags.map(h => h.tag).join(" ");
    navigator.clipboard.writeText(allTags);
    toast.success(`${filteredHashtags.length} hashtags copied!`);
  };

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-8 border-b border-white/10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Hashtag</span>
            <span className="text-foreground/20">Explorer</span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
            Descubra territórios de atenção e relevância algorítmica
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="glass-premium p-8 md:p-10 rounded-[3rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group/main">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="space-y-8 relative z-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Contexto Estratégico do Negócio</Label>
            <Textarea
              placeholder="Ex: fotografia de luxo, casamentos exclusivos, portraits corporativos de alto impacto..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="min-h-[140px] rounded-[2rem] bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold p-8 focus-visible:ring-primary/40 backdrop-blur-xl transition-all resize-none leading-relaxed"
            />
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest italic text-right px-4">
              A IA analisará nichos correlatos para sugerir tags de alta conversão
            </p>
          </div>

          <Button
            onClick={searchHashtags}
            disabled={isSearching}
            className="h-16 w-full rounded-3xl bg-gradient-to-r from-primary via-accent to-pink-500 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border-none group/btn"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                Sincronizando Tendências...
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6 mr-3 group-hover/btn:rotate-12 transition-transform" />
                Mapear Hashtags Inteligentes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Section - only show if we have hashtags */}
      {hashtags.length > 0 && (
        <div className="glass-premium p-6 md:p-8 rounded-[2rem] border-none shadow-xl relative overflow-hidden group/filter">
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="flex-1 relative group/input w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
              <Input
                placeholder="Filtrar resultados por categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-16 h-14 rounded-2xl bg-white/20 border-white/40 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl"
              />
            </div>
            <Button onClick={copyAllHashtags} variant="secondary" className="h-14 px-8 rounded-2xl bg-white/10 border-white/20 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
              <Copy className="h-4 w-4 mr-3 opacity-50" />
              Copiar Todo o Acervo
            </Button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hashtags.length > 0 ? (
        <div className="grid gap-6">
          {filteredHashtags.map((hashtag) => (
            <div
              key={hashtag.tag}
              className="glass-premium p-6 md:p-8 rounded-[2.5rem] border-none shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group/card"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start md:items-center gap-6 flex-1">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-primary via-accent to-pink-500 p-[2px] shadow-lg group-hover/card:rotate-6 transition-transform">
                    <div className="h-full w-full rounded-[1.4rem] bg-black/20 flex items-center justify-center backdrop-blur-md">
                      <Hash className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="text-xl font-black text-foreground/90 uppercase tracking-tighter italic">{hashtag.tag}</h3>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${categoryColors[hashtag.category] || categoryColors.General}`}>
                        {hashtag.category}
                      </span>
                    </div>

                    {hashtag.description && (
                      <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide leading-relaxed">
                        {hashtag.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
                        <TrendingUp className="h-4 w-4" />
                        <span>Relevância: {hashtag.score}%</span>
                      </div>
                      {hashtag.estimatedReach && hashtag.estimatedReach > 0 && (
                        <div className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest italic">
                          Potencial: ~{(hashtag.estimatedReach / 1000).toFixed(0)}k Impressões
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => copyHashtag(hashtag.tag)}
                  className="h-14 px-8 rounded-2xl bg-white/5 border-white/10 hover:bg-primary hover:text-white hover:border-none text-[10px] font-black uppercase tracking-widest group/copy transition-all"
                >
                  {copiedHashtag === hashtag.tag ? (
                    <>
                      <Check className="h-5 w-5 mr-3" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-3 opacity-40 group-hover/copy:opacity-100" />
                      Copiar Tag
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        <div className="glass-premium p-20 text-center rounded-[3rem] border-dashed border-2 border-white/10 relative overflow-hidden group/empty">
          <Hash className="h-16 w-16 mx-auto mb-6 text-muted-foreground/20 group-hover/empty:scale-110 group-hover/empty:rotate-12 transition-all duration-700" />
          <h3 className="text-2xl font-black text-foreground/90 uppercase tracking-tighter italic mb-3">Vácuo de Alcance</h3>
          <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest max-w-md mx-auto">
            Não encontramos tags específicas para estes termos. Tente palavras mais abrangentes ou de outro nicho.
          </p>
        </div>
      ) : (
        <div className="glass-premium p-20 text-center rounded-[3rem] relative overflow-hidden group/intro">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opaicty-50" />
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary/40 group-hover/intro:scale-110 transition-transform duration-700" />
          <h3 className="text-2xl font-black text-foreground/90 uppercase tracking-tighter italic mb-3">Exploração Orbital</h3>
          <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
            Insira os conceitos vitais da sua marca para que a IA mapeie as hashtags com maior tração algorítmica.
          </p>
        </div>
      )}
    </div>
  );
}
