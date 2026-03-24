import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, Brain, Image as ImageIcon, Wand2, ArrowRight, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, label: "Analisando seu nicho...", icon: Brain, color: "text-blue-500" },
  { id: 2, label: "Criando legenda persuasiva...", icon: Wand2, color: "text-purple-500" },
  { id: 3, label: "Gerando imagem otimizada...", icon: ImageIcon, color: "text-pink-500" },
  { id: 4, label: "Finalizando variação...", icon: Sparkles, color: "text-amber-500" },
];

export function GenerationModal({ isOpen, onClose }: GenerationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Incrementos menores para durar mais tempo (médio 20s)
        const jump = Math.random() * 2;
        return prev + jump;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (progress < 25) setCurrentStep(0);
    else if (progress < 50) setCurrentStep(1);
    else if (progress < 75) setCurrentStep(2);
    else setCurrentStep(3);
  }, [progress]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative p-8 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />

          <div className="relative z-10 space-y-8 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
                <div className="relative h-16 w-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                A IA está criando sua arte...
              </h2>
              <p className="text-sm text-muted-foreground italic">
                Isso pode levar alguns segundos, mas o resultado vale a pena!
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 transition-all duration-500 ${
                        isActive ? "scale-105 opacity-100" : isCompleted ? "opacity-50" : "opacity-30"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isActive ? "bg-primary/20" : isCompleted ? "bg-primary/10" : "bg-muted"
                      }`}>
                        {isActive ? (
                          <Loader2 className={`h-4 w-4 animate-spin ${step.color}`} />
                        ) : (
                          <Icon className={`h-4 w-4 ${isCompleted ? step.color : "text-muted-foreground"}`} />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                      {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-ping" />}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2 bg-muted/50 rounded-full" />
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                  <span>Progresso da Geração</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-70">
                <Brain className="h-3 w-3" />
                <span>Powered by Groq LPU™ Engine</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
