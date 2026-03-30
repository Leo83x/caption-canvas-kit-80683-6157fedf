import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Building2, Palette, ArrowRight, Check, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingWizard({ userId, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    description: "",
    target_audience: "",
    category: "",
    instagram_handle: "",
  });

  const steps = [
    { icon: Building2, title: "Sua Empresa", subtitle: "Conte-nos sobre o seu negócio" },
    { icon: Palette, title: "Público & Nicho", subtitle: "Quem você quer alcançar?" },
    { icon: Sparkles, title: "Tudo Pronto!", subtitle: "Comece a criar conteúdo com IA" },
  ];

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast.error("Preencha o nome da empresa.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("company_profiles").insert({
        user_id: userId,
        company_name: formData.company_name,
        description: formData.description || null,
        target_audience: formData.target_audience || null,
        category: formData.category || null,
        instagram_handle: formData.instagram_handle || null,
      });

      if (error) throw error;
      setStep(2);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none [&>button]:hidden">
        {/* Progress */}
        <div className="flex gap-1.5 px-8 pt-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="px-8 pb-8 pt-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">{currentStep.title}</h2>
              <p className="text-xs text-muted-foreground font-bold">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Step 0: Company Info */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome da empresa *</Label>
                <Input
                  placeholder="Ex: Studio Beleza Natural"
                  value={formData.company_name}
                  onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição do negócio</Label>
                <Textarea
                  placeholder="O que sua empresa faz? Ex: Clínica de estética especializada em tratamentos faciais..."
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="min-h-[80px] rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">@ do Instagram</Label>
                <Input
                  placeholder="@seuinstagram"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData(p => ({ ...p, instagram_handle: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button onClick={() => setStep(1)} className="w-full h-12 rounded-xl gap-2 font-bold" disabled={!formData.company_name.trim()}>
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Audience */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Público-alvo</Label>
                <Input
                  placeholder="Ex: Mulheres 25-45 anos, classe B/C, SP"
                  value={formData.target_audience}
                  onChange={(e) => setFormData(p => ({ ...p, target_audience: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria / Nicho</Label>
                <Input
                  placeholder="Ex: Beleza, Moda, Gastronomia, Fitness..."
                  value={formData.category}
                  onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 rounded-xl">Voltar</Button>
                <Button onClick={handleSave} className="flex-1 h-12 rounded-xl gap-2 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Salvar Perfil
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Done */}
          {step === 2 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center mx-auto shadow-lg">
                <Check className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Perfil Criado!</h3>
                <p className="text-sm text-muted-foreground">
                  Agora você pode gerar posts com IA, agendar publicações e muito mais.
                </p>
              </div>
              <Button onClick={onComplete} className="w-full h-12 rounded-xl gap-2 font-bold bg-gradient-to-r from-primary to-accent text-white">
                <Sparkles className="h-4 w-4" />
                Começar a Criar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
