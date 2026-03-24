import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Trophy, TrendingUp, Target, Brain, ArrowUpRight, Info, Sparkles, AlertCircle } from "lucide-react";

// Types matching our Edge Function response
interface BenchmarkingResults {
  performanceData: { category: string; voce: number; mercado: number }[];
  radarData: { subject: string; A: number; B: number; fullMark: number }[];
  highlights: {
    growth: string; growthText: string;
    engagement: string; engagementText: string;
    aiEfficiency: string; aiEfficiencyText: string;
  };
  insights: { type: string; title: string; description: string }[];
}

const Benchmarking = () => {
  const [niche, setNiche] = useState("");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<BenchmarkingResults | null>(null);

  // Load user default niche if available
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("company_profiles").select("target_audience").eq("user_id", user.id).maybeSingle();
      if (data && data.target_audience) {
         setNiche(data.target_audience);
      }
    };
    fetchProfile();
  }, []);

  const handleAnalyze = async () => {
    const validCompetitors = competitors.filter(c => c.trim().length > 0);
    if (!niche.trim() || validCompetitors.length === 0) {
      toast.error("Preencha o seu nicho e pelo menos 1 concorrente válido.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: { niche, competitors: validCompetitors }
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);

      setResults(data as BenchmarkingResults);
      toast.success("Análise de mercado concluída!");
      
      // Optionally save back to profile
      if (user) {
         await supabase.from("company_profiles").update({
           target_audience: niche
         }).eq("user_id", user.id);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao gerar o relatório. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle className="h-3.5 w-3.5" />;
    if (type === 'opportunity') return <TrendingUp className="h-3.5 w-3.5" />;
    return <Sparkles className="h-3.5 w-3.5" />;
  };

  const getInsightColors = (type: string) => {
    if (type === 'warning') return "text-orange-600 hover:border-orange-500/30";
    if (type === 'opportunity') return "text-emerald-600 hover:border-emerald-600/30";
    return "text-purple-600 hover:border-purple-600/30";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
          <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Benchmarking</span>
          <span className="text-foreground/20">Pro</span>
        </h1>
        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">Compare e supere a concorrência com inteligência de dados em tempo real</p>
      </div>
      {results && (
        <Badge variant="secondary" className="w-fit h-6 px-3 bg-primary/10 text-primary border-primary/20 text-xs rounded-full">
          Nicho Analisado: {niche}
        </Badge>
      )}

      {!results && (
        <Card className="max-w-4xl mx-auto glass-card-white border-none shadow-2xl relative overflow-hidden group p-8 md:p-12 rounded-[3.5rem]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-[100px] opacity-50" />
          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-foreground/90 uppercase tracking-tighter italic">Configurar Mapeamento</h2>
              <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest italic leading-relaxed">
                Para a IA mapear sua presença orbital e detectar brechas na concorrência, defina seu território de atuação.
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic ml-1">Território de Atuação (Seu Nicho)</label>
                <Input 
                  value={niche} 
                  onChange={(e) => setNiche(e.target.value)} 
                  placeholder="Ex: Clínica de Estética em SP, Fotografia de Casamento..." 
                  className="h-16 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic ml-1">Operadores Rivais (Concorrentes no IG)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map(index => (
                    <Input 
                      key={index}
                      placeholder="@usernamerival" 
                      value={competitors[index]}
                      onChange={(e) => {
                        const newComps = [...competitors];
                        newComps[index] = e.target.value;
                        setCompetitors(newComps);
                      }}
                      className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button 
              className="h-16 w-full rounded-3xl bg-gradient-to-r from-primary via-accent to-pink-500 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 border-none" 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Mapeando Ecossistema...</>
              ) : (
                <><Brain className="mr-3 h-6 w-6" /> Iniciar Varredura de Mercado</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {results && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setResults(null)} className="rounded-full shadow-sm">
              Fazer Nova Análise
            </Button>
          </div>

          {/* Top Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/40 backdrop-blur-sm border-none ring-1 ring-border shadow-smooth rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Seu Crescimento Prometido</CardDescription>
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  {results.highlights.growth} <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground italic">{results.highlights.growthText}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/40 backdrop-blur-sm border-none ring-1 ring-border shadow-smooth rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Engajamento Destacado</CardDescription>
                <CardTitle className="text-2xl font-bold">{results.highlights.engagement}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground italic">{results.highlights.engagementText}</p>
              </CardContent>
            </Card>

            <Card className="bg-white/40 backdrop-blur-sm border-none ring-1 ring-border shadow-smooth rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Eficiência de IA Estratégica</CardDescription>
                <CardTitle className="text-2xl font-bold">{results.highlights.aiEfficiency}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[10px] text-muted-foreground italic">{results.highlights.aiEfficiencyText}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-smooth border-none bg-white/40 backdrop-blur-sm ring-1 ring-border rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Detalhada
                </CardTitle>
                <CardDescription className="text-xs">Comparativo direto por categoria de métrica</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="category" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                    <Bar dataKey="voce" name="Sua Marca (Genius)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="mercado" name="Concorrência" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-smooth border-none bg-white/40 backdrop-blur-sm ring-1 ring-border rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Target className="h-5 w-5 text-purple-500" />
                  Posicionamento de Marca
                </CardTitle>
                <CardDescription className="text-xs">Seus pontos fortes vs. concorrência</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={results.radarData}>
                    <PolarGrid opacity={0.3} />
                    <PolarAngleAxis dataKey="subject" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                    <Radar
                      name="Sua Marca"
                      dataKey="A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Concorrência Média"
                      dataKey="B"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.4}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Strategic Insights */}
          <Card className="border-none ring-1 ring-primary/20 bg-primary/5 overflow-hidden shadow-smooth rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl shadow-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">AI Strategic Insights</CardTitle>
                  <CardDescription className="text-xs font-medium">Recomendações baseadas na fraqueza detectada dos concorrentes.</CardDescription>
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] rounded-full px-3">Análise de Mercado Real</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.insights.map((insight, idx) => (
                  <div key={idx} className={`space-y-2 p-5 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white/40 shadow-sm transition-all hover:shadow-md ${getInsightColors(insight.type)}`}>
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                      {getInsightIcon(insight.type)}
                      {insight.title}
                    </div>
                    <p className="text-[11px] font-medium text-foreground/80 leading-relaxed italic">"{insight.description}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Benchmarking;
