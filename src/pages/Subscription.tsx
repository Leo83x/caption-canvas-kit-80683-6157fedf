import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Zap, Sparkles, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Subscription() {
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(profileData);

      let { data: subData } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!subData) {
        const { data: newSub, error } = await supabase
          .from("subscriptions" as any)
          .insert([{
            user_id: user.id,
            plan_type: 'free',
            status: 'active'
          }])
          .select()
          .single();

        if (!error) {
          subData = newSub;
        }
      }

      setSubscription(subData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPlan) return;
    setProcessingPayment(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Credits definition by plan
      const creditsByPlan: Record<string, { total: number; remaining: number }> = {
        'Gratuito': { total: 100, remaining: 100 },
        'Profissional': { total: 500, remaining: 500 },
        'Empresarial': { total: 2000, remaining: 2000 }
      };

      const planConfig = creditsByPlan[selectedPlan.name] || creditsByPlan['Gratuito'];
      const planType = selectedPlan.planType;

      // Update simulation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update subscription
      await supabase
        .from("subscriptions" as any)
        .update({
          plan_type: planType,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        })
        .eq("user_id", user.id);

      // Update credits in profile
      if (profile) {
        await supabase
          .from("company_profiles")
          .update({
            ai_credits_total: planConfig.total,
            ai_credits_remaining: planConfig.remaining,
            ai_credits_last_reset: new Date().toISOString()
          } as any)
          .eq("user_id", user.id);
      }

      toast.success(`Assinatura do plano ${selectedPlan.name} realizada com sucesso! (Modo Simulação)`);
      setShowPaymentModal(false);
      loadData();
    } catch (error) {
      console.error("Error changing plan:", error);
      toast.error("Erro ao processar simulação de pagamento");
    } finally {
      setProcessingPayment(false);
    }
  };

  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      icon: Sparkles,
      gradient: "from-slate-400 to-slate-500",
      planType: "free",
      features: [
        "100 créditos de IA por mês",
        "Até 5 posts por dia",
        "Analytics básico",
        "Sugestões de temas",
      ],
      current: subscription?.plan_type === "free" || !subscription,
    },
    {
      name: "Profissional",
      price: "R$ 97",
      period: "/mês",
      icon: Zap,
      gradient: "from-purple-500 to-pink-500",
      planType: "pro",
      features: [
        "500 créditos de IA por mês",
        "Posts ilimitados",
        "Analytics avançado",
        "Sugestões de temas premium",
        "Suporte prioritário",
      ],
      popular: true,
      current: subscription?.plan_type === "pro",
    },
    {
      name: "Empresarial",
      price: "R$ 197",
      period: "/mês",
      icon: Crown,
      gradient: "from-orange-500 to-yellow-500",
      planType: "business",
      features: [
        "2000 créditos de IA por mês",
        "Posts ilimitados",
        "Analytics completo",
        "Múltiplas contas (breve)",
        "Acesso antecipado a novas IAs",
        "Gerente de conta dedicado",
      ],
      current: subscription?.plan_type === "business",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">
          Escolha seu Plano
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto italic">
          Desbloqueie o potencial máximo do Studio Genius com nossos planos flexíveis
        </p>
      </div>

      {/* Current AI Credits */}
      {profile && (
        <Card className="p-6 max-w-2xl mx-auto border-none ring-1 ring-border bg-white/40 backdrop-blur-sm shadow-smooth rounded-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Créditos de IA Disponíveis</h3>
                <p className="text-sm text-muted-foreground italic font-medium">
                  {profile.ai_credits_remaining} de {profile.ai_credits_total} créditos restantes
                </p>
              </div>
            </div>
            <div className="w-full md:w-64 space-y-2">
              <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(100, (profile.ai_credits_remaining / profile.ai_credits_total) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Consumo</span>
                <span>{Math.round((profile.ai_credits_remaining / profile.ai_credits_total) * 100)}%</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.name}
              className={`p-8 border-none ring-1 ring-border bg-white/40 backdrop-blur-sm shadow-smooth hover:shadow-glow transition-all duration-300 relative rounded-3xl group ${plan.popular ? "ring-2 ring-primary scale-105 z-10" : "hover:scale-105"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg whitespace-nowrap">
                  Mais Popular
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.current && (
                      <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-tighter">
                        Plano Atual
                      </Badge>
                    )}
                  </div>
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground font-medium">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 pt-4 border-t border-dashed">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="font-medium text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all ${plan.current 
                    ? "bg-transparent border border-muted-foreground/20 text-muted-foreground pointer-events-none" 
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-primary/20"}`}
                  variant={plan.current ? "outline" : "default"}
                  onClick={() => handleUpgrade(plan)}
                  disabled={plan.current}
                >
                  {plan.current ? "Plano Ativo" : "Começar Agora"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="rounded-3xl border-none ring-1 ring-border bg-white/95 backdrop-blur-md shadow-2xl max-w-sm">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold">Confirmar Assinatura</DialogTitle>
            <DialogDescription className="text-sm font-medium italic">
              Você está assinando o plano <strong className="text-primary">{selectedPlan?.name}</strong> por <strong>{selectedPlan?.price}</strong>{selectedPlan?.period}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-5 rounded-2xl border-none ring-1 ring-border flex items-center gap-4 bg-slate-50/50">
              <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="font-bold text-sm">Cartão de Crédito</p>
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest">**** **** **** 4242</p>
              </div>
              <Badge variant="outline" className="ml-auto text-[8px] uppercase font-bold text-emerald-600 border-emerald-200 bg-emerald-50">Teste</Badge>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] font-medium leading-relaxed italic">
                <strong>Ambiente de Teste:</strong> Nenhuma transação real será feita. Isso é uma simulação do fluxo de pagamento.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-row gap-3">
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)} className="flex-1 rounded-xl">Voltar</Button>
            <Button
              onClick={confirmPayment}
              disabled={processingPayment}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl shadow-lg border-none h-11 font-bold uppercase tracking-widest text-[11px]"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ativando...
                </>
              ) : "Assinar Agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-10 max-w-4xl mx-auto border-none ring-1 ring-primary/20 bg-gradient-to-br from-primary/10 via-white/50 to-purple-600/10 rounded-[2.5rem] shadow-smooth relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="h-32 w-32 text-primary" />
        </div>
        <div className="text-center space-y-5 relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">Precisa de mais escala?</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto font-medium italic">
            Entre em contato com nosso time comercial para planos personalizados Enterprise, API dedicada e suporte estratégico.
          </p>
          <Button variant="outline" className="px-10 h-11 rounded-xl border-primary color-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[11px] shadow-sm">
            Falar com Consultor
          </Button>
        </div>
      </Card>
    </div>
  );
}
