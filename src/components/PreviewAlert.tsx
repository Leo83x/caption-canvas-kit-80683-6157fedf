import { Sparkles } from "lucide-react";

interface PreviewAlertProps {
    show: boolean;
}

export function PreviewAlert({ show }: PreviewAlertProps) {
    if (!show) return null;

    return (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                    👁️ Preview em Tempo Real disponível abaixo!
                </p>
                <p className="text-xs text-muted-foreground">
                    Role a página para ver como seu post ficará no Instagram
                </p>
            </div>
        </div>
    );
}
