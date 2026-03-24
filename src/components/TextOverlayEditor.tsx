import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export interface TextStyleConfig {
    position: 'top' | 'center' | 'bottom';
    color: string;
    strokeColor: string;
    fontSize: number; // percentage (0.04 - 0.10)
    fontFamily: string;
    text: string;
}

interface TextOverlayEditorProps {
    imageUrl: string;
    text: string;
    initialPosition?: 'top' | 'center' | 'bottom';
    onApply: (config: TextStyleConfig) => void;
    onCancel: () => void;
}

const FONT_FAMILIES = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Impact, sans-serif', label: 'Impact' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
];

export function TextOverlayEditor({
    imageUrl,
    text,
    initialPosition = 'center',
    onApply,
    onCancel
}: TextOverlayEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<TextStyleConfig>({
        position: initialPosition,
        color: '#FFFFFF',
        strokeColor: '#000000',
        fontSize: 0.06,
        fontFamily: 'Arial, sans-serif',
        text: text
    });

    const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        maxWidth: number
    ): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const renderPreview = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.floor(img.height * config.fontSize);
            ctx.font = `bold ${fontSize}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = img.width * 0.8;
            const lines = wrapText(ctx, config.text.toUpperCase(), maxWidth).slice(0, 3);
            const lineHeight = fontSize * 1.3;
            const totalTextHeight = lines.length * lineHeight;

            let startY: number;
            const padding = img.height * 0.1;

            switch (config.position) {
                case 'top':
                    startY = padding + fontSize / 2;
                    break;
                case 'bottom':
                    startY = img.height - padding - totalTextHeight + fontSize / 2;
                    break;
                case 'center':
                default:
                    startY = (img.height - totalTextHeight) / 2 + fontSize / 2;
                    break;
            }

            lines.forEach((line, index) => {
                const y = startY + index * lineHeight;
                const x = img.width / 2;

                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;

                ctx.strokeStyle = config.strokeColor;
                ctx.lineWidth = fontSize * 0.08;
                ctx.strokeText(line, x, y);

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                ctx.fillStyle = config.color;
                ctx.fillText(line, x, y);
            });

            setLoading(false);
        };

        img.onerror = () => {
            setLoading(false);
        };

        img.src = imageUrl;
    };

    useEffect(() => {
        renderPreview();
    }, [config, imageUrl]);

    const handleApply = () => {
        onApply(config);
    };

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Text on Image</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="relative bg-muted rounded-lg overflow-hidden border">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            className="w-full h-auto"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="textContent">Text Overlay Content</Label>
                            <div className="relative">
                                <Input
                                    id="textContent"
                                    type="text"
                                    value={config.text}
                                    onChange={(e) => setConfig({ ...config, text: e.target.value })}
                                    placeholder="Type your message..."
                                    maxLength={50}
                                    className="mt-1 pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                    {config.text.length}/50
                                </span>
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block">Text Position</Label>
                            <div className="flex gap-2">
                                <Button
                                    variant={config.position === 'top' ? 'default' : 'outline'}
                                    onClick={() => setConfig({ ...config, position: 'top' })}
                                    className="flex-1"
                                >
                                    Top
                                </Button>
                                <Button
                                    variant={config.position === 'center' ? 'default' : 'outline'}
                                    onClick={() => setConfig({ ...config, position: 'center' })}
                                    className="flex-1"
                                >
                                    Center
                                </Button>
                                <Button
                                    variant={config.position === 'bottom' ? 'default' : 'outline'}
                                    onClick={() => setConfig({ ...config, position: 'bottom' })}
                                    className="flex-1"
                                >
                                    Bottom
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="textColor">Text Color</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        id="textColor"
                                        type="color"
                                        value={config.color}
                                        onChange={(e) => setConfig({ ...config, color: e.target.value })}
                                        className="w-16 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={config.color}
                                        onChange={(e) => setConfig({ ...config, color: e.target.value })}
                                        placeholder="#FFFFFF"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="strokeColor">Outline Color</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        id="strokeColor"
                                        type="color"
                                        value={config.strokeColor}
                                        onChange={(e) => setConfig({ ...config, strokeColor: e.target.value })}
                                        className="w-16 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={config.strokeColor}
                                        onChange={(e) => setConfig({ ...config, strokeColor: e.target.value })}
                                        placeholder="#000000"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Font Size: {Math.round(config.fontSize * 100)}%</Label>
                            <Slider
                                value={[config.fontSize * 100]}
                                onValueChange={(value) => setConfig({ ...config, fontSize: value[0] / 100 })}
                                min={4}
                                max={10}
                                step={0.5}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="fontFamily">Font Family</Label>
                            <Select
                                value={config.fontFamily}
                                onValueChange={(value) => setConfig({ ...config, fontFamily: value })}
                            >
                                <SelectTrigger id="fontFamily" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_FAMILIES.map((font) => (
                                        <SelectItem key={font.value} value={font.value}>
                                            {font.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {config.text.length > 30 && (
                            <p className="text-xs text-muted-foreground">
                                💡 Long texts will be broken into multiple lines automatically to fit the image.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t font-display">
                        <Button variant="outline" onClick={onCancel} className="px-6">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApply}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
                        >
                            Apply Text
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
