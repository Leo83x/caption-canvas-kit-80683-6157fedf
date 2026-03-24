import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postTemplates, categories, type PostTemplate } from "@/data/templates";
import { Sparkles } from "lucide-react";

interface TemplateGalleryProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectTemplate: (template: PostTemplate) => void;
}

export function TemplateGallery({ open, onOpenChange, onSelectTemplate }: TemplateGalleryProps) {
    const handleSelect = (template: PostTemplate) => {
        onSelectTemplate(template);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Templates Prontos
                    </DialogTitle>
                    <DialogDescription>
                        Escolha um template para começar rapidamente
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="promocao" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-5">
                        {categories.map((cat) => (
                            <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                                <span className="mr-1">{cat.emoji}</span>
                                <span className="hidden sm:inline">{cat.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4">
                        {categories.map((cat) => (
                            <TabsContent key={cat.value} value={cat.value} className="mt-0">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {postTemplates
                                        .filter((t) => t.category === cat.value)
                                        .map((template) => (
                                            <Card
                                                key={template.id}
                                                className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                                                onClick={() => handleSelect(template)}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">{template.emoji}</span>
                                                            <div>
                                                                <h3 className="font-semibold">{template.name}</h3>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {template.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {template.theme}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {template.tone}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {template.style}
                                                        </Badge>
                                                        {template.cta && (
                                                            <Badge variant="outline" className="text-xs">
                                                                CTA incluído
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                                    >
                                                        Usar Template
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
