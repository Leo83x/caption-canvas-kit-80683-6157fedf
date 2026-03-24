import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Type,
  Image as ImageIcon,
  Check,
  X,
  Palette,
  Plus,
  Trash2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Layers,
  Sun,
  Contrast,
  Move,
  RotateCw,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

const FONTS = [
  { label: "Arial (Clássica)", value: "Arial, sans-serif" },
  { label: "Impact (Destaque)", value: "Impact, Haettenschweiler, sans-serif" },
  { label: "Roboto (Moderna)", value: "'Roboto', sans-serif" },
  { label: "Georgia (Elegante)", value: "Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Courier (Mono)", value: "'Courier New', monospace" },
];

const PRESETS = [
  { label: "Branco Bold", color: "#FFFFFF", fontFamily: "Impact, Haettenschweiler, sans-serif", fontSize: 1.2, bold: true, italic: false },
  { label: "Preto Elegante", color: "#1A1A1A", fontFamily: "Georgia, serif", fontSize: 1, bold: false, italic: true },
  { label: "Gradiente Rosa", color: "#FF6B9D", fontFamily: "'Montserrat', sans-serif", fontSize: 1, bold: true, italic: false },
  { label: "Dourado Luxo", color: "#F5C842", fontFamily: "Georgia, serif", fontSize: 1, bold: true, italic: true },
];

const STICKERS = ["🔥", "⭐", "💡", "✨", "🚀", "💎", "🎯", "❤️", "👑", "🌟", "📣", "💬", "📍", "🎉", "🏆", "💪", "✅", "⚡", "🎨", "🌈", "📢", "🛍️", "🔖", "🎁"];

const TEMPLATES = [
  {
    id: "minimal_luxury",
    label: "Luxo Minimalista",
    icon: "💎",
    layers: [
      { type: "text", text: "COLEÇÃO EXCLUSIVA", y: 0.8, scale: 0.6, color: "#FFFFFF", fontFamily: "'Montserrat', sans-serif", bold: true, letterSpacing: 4 },
      { type: "text", text: "Elegância em cada detalhe", y: 0.85, scale: 0.5, color: "#F5C842", fontFamily: "Georgia, serif", bold: false, italic: true }
    ]
  },
  {
    id: "social_proof",
    label: "Prova Social",
    icon: "⭐",
    layers: [
      { type: "text", text: '"Melhor investimento que já fiz para minha marca!"', y: 0.5, scale: 0.9, color: "#FFFFFF", fontFamily: "Georgia, serif", italic: true, bold: false },
      { type: "text", text: "⭐⭐⭐⭐⭐", y: 0.42, scale: 0.7, color: "#F5C842" },
      { type: "text", text: "@cliente_satisfeito", y: 0.58, scale: 0.5, color: "#FFFFFF", opacity: 0.8, bold: true }
    ]
  },
  {
    id: "flash_sale",
    label: "Oferta Relâmpago",
    icon: "⚡",
    layers: [
      { type: "text", text: "OFERTA", y: 0.2, scale: 1.2, color: "#000000", backgroundColor: "#F5C842", rotation: -5, bold: true, strokeWidth: 0 },
      { type: "text", text: "SÓ HOJE", y: 0.35, scale: 2.2, color: "#FFFFFF", bold: true, strokeWidth: 4, strokeColor: "#000000" },
      { type: "text", text: "50% OFF", y: 0.55, scale: 1.5, color: "#FF6B9D", bold: true, strokeWidth: 2 }
    ]
  },
  {
    id: "top_tips",
    label: "Dica de Ouro",
    icon: "💡",
    layers: [
      { type: "text", text: "DICA DO DIA", y: 0.15, scale: 0.7, color: "#FFFFFF", backgroundColor: "#6366f1", borderRadius: 20, bold: true, padding: "4px 12px" },
      { type: "text", text: "Como dobrar seu engajamento", y: 0.5, scale: 1.1, color: "#FFFFFF", bold: true, strokeWidth: 4 }
    ]
  }
];

interface EditorLayer {
  id: string;
  type: "text" | "image" | "shape";
  text: string;
  imageUrl?: string;
  shapeType?: "rect" | "circle" | "badge";
  backgroundColor?: string;
  borderRadius?: number;
  x: number; // 0 to 1
  y: number; // 0 to 1
  scale: number; // multiplier (1 = base)
  color: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  opacity: number; // 0 to 1
  strokeColor: string;
  strokeWidth: number;
  visible: boolean;
  rotation: number; // degrees
}

interface CanvasEditorProps {
  imageUrl: string;
  initialText: string;
  onSave: (finalImageUrl: string) => void;
  onClose: () => void;
}

function createDefaultLayer(text: string, id?: string, type: "text" | "image" = "text", imageUrl?: string): EditorLayer {
  return {
    id: id || crypto.randomUUID(),
    type,
    text: text || "",
    imageUrl,
    x: 0.5,
    y: 0.5,
    scale: 1,
    color: "#FFFFFF",
    fontFamily: "Impact, Haettenschweiler, sans-serif",
    bold: true,
    italic: false,
    align: "center",
    opacity: 1,
    strokeColor: "#000000",
    strokeWidth: 2,
    visible: true,
    rotation: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
    shapeType: "rect"
  };
}

function createLayerFromTemplate(data: any): EditorLayer {
  const base = createDefaultLayer(data.text || "");
  return {
    ...base,
    ...data,
    id: crypto.randomUUID(),
  };
}

const EditorContent = ({ imageUrl: initialImageUrl, initialText, onSave, onClose }: CanvasEditorProps) => {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imageLoading, setImageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [layers, setLayers] = useState<EditorLayer[]>([createDefaultLayer(initialText, "main")]);
  const [selectedId, setSelectedId] = useState<string>("main");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"text" | "image" | "stickers" | "library" | "templates">("templates");
  const [libraryImages, setLibraryImages] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [imageFilter, setImageFilter] = useState({ brightness: 100, contrast: 100, saturation: 100, blur: 0 });
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "library" && libraryImages.length === 0) {
      loadLibrary();
    }
  }, [activeTab]);

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const { data, error } = await supabase.from("image_library").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setLibraryImages(data || []);
    } catch (error) {
      console.error("Error loading library:", error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const selected = layers.find(l => l.id === selectedId);
  const isImageLayer = selected?.type === "image";
  const isTextLayer = selected?.type === "text";
  const isStickerLayer = isTextLayer && STICKERS.includes(selected.text);

  const updateSelected = useCallback((updates: Partial<EditorLayer>) => {
    setLayers(prev => prev.map(l => l.id === selectedId ? { ...l, ...updates } : l));
  }, [selectedId]);

  const addLayer = () => {
    const newLayer = createDefaultLayer("Novo Texto");
    newLayer.y = Math.random() * 0.6 + 0.2;
    newLayer.x = 0.5;
    setLayers(prev => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  };

  const addSticker = (emoji: string) => {
    const newLayer = createDefaultLayer(emoji);
    newLayer.scale = 1.5;
    newLayer.strokeWidth = 0;
    newLayer.y = Math.random() * 0.6 + 0.2;
    setLayers(prev => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  };

  const addImageLayer = (url: string) => {
    const newLayer = createDefaultLayer("", undefined, "image", url);
    newLayer.scale = 0.5;
    newLayer.y = 0.5;
    setLayers(prev => [...prev, newLayer]);
    setSelectedId(newLayer.id);
    toast.success("Imagem adicionada como camada");
  };

  const duplicateLayer = () => {
    if (!selected) return;
    const copy = { ...selected, id: crypto.randomUUID(), x: selected.x + 0.05, y: selected.y + 0.05 };
    setLayers(prev => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const removeLayer = (id: string) => {
    if (layers.length === 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedId(layers.find(l => l.id !== id)?.id || "");
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    updateSelected({ color: preset.color, fontFamily: preset.fontFamily, scale: preset.fontSize, bold: preset.bold, italic: preset.italic });
  };

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    // Add all layers from template
    const newLayers = template.layers.map(l => createLayerFromTemplate(l));
    setLayers(prev => [...prev, ...newLayers]);
    setSelectedId(newLayers[newLayers.length - 1].id);
    toast.success(`Template "${template.label}" aplicado!`);
  };

  // Drag handling via pointer events (native, no library needed)
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
    const layer = layers.find(l => l.id === id);
    if (!layer || !canvasAreaRef.current) return;
    const rect = canvasAreaRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - (layer.x * rect.width + rect.left),
      y: e.clientY - (layer.y * rect.height + rect.top),
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId || !canvasAreaRef.current) return;
    const rect = canvasAreaRef.current.getBoundingClientRect();
    const newX = Math.max(0.02, Math.min(0.98, (e.clientX - dragOffset.x - rect.left) / rect.width));
    const newY = Math.max(0.02, Math.min(0.98, (e.clientY - dragOffset.y - rect.top) / rect.height));
    setLayers(prev => prev.map(l => l.id === draggingId ? { ...l, x: newX, y: newY } : l));
  }, [draggingId, dragOffset]);

  const handlePointerUp = () => setDraggingId(null);

  const getLayerStyle = (layer: EditorLayer): React.CSSProperties => ({
    position: "absolute",
    left: `${layer.x * 100}%`,
    top: `${layer.y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
    color: layer.color,
    fontSize: layer.type === "text" ? `${layer.scale * 42}px` : undefined,
    width: layer.type === "image" ? `${layer.scale * 100}%` : undefined,
    fontFamily: layer.fontFamily,
    fontWeight: layer.bold ? "bold" : "normal",
    fontStyle: layer.italic ? "italic" : "normal",
    textAlign: layer.align,
    opacity: layer.opacity,
    backgroundColor: layer.backgroundColor || "transparent",
    borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
    padding: layer.backgroundColor && layer.backgroundColor !== "transparent" ? "4px 12px" : "2px 6px",
    textShadow: layer.type === "text" && layer.strokeWidth > 0
      ? `${layer.strokeWidth}px ${layer.strokeWidth}px 0 ${layer.strokeColor}, -${layer.strokeWidth}px -${layer.strokeWidth}px 0 ${layer.strokeColor}, ${layer.strokeWidth}px -${layer.strokeWidth}px 0 ${layer.strokeColor}, -${layer.strokeWidth}px ${layer.strokeWidth}px 0 ${layer.strokeColor}, 2px 2px 8px rgba(0,0,0,0.6)`
      : (layer.type === "text" ? (layer.backgroundColor && layer.backgroundColor !== "transparent" ? "none" : "2px 2px 8px rgba(0,0,0,0.8)") : "none"),
    whiteSpace: "pre-wrap",
    cursor: draggingId === layer.id ? "grabbing" : "grab",
    userSelect: "none",
    zIndex: layer.id === selectedId ? 20 : 10,
    outline: layer.id === selectedId ? "2px dashed rgba(255,255,255,0.8)" : "none",
    outlineOffset: "4px",
    display: layer.visible ? "block" : "none",
  });

  const imageFilterStyle: React.CSSProperties = {
    filter: `brightness(${imageFilter.brightness}%) contrast(${imageFilter.contrast}%) saturate(${imageFilter.saturation}%) blur(${imageFilter.blur}px)`,
  };

  const handleExport = async () => {
    setIsSaving(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply image filters
      ctx.filter = `brightness(${imageFilter.brightness}%) contrast(${imageFilter.contrast}%) saturate(${imageFilter.saturation}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";

      // Render each visible layer
      for (const layer of layers.filter(l => l.visible)) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;

        const px = layer.x * img.width;
        const py = layer.y * img.height;
        ctx.translate(px, py);
        ctx.rotate((layer.rotation * Math.PI) / 180);

        if (layer.type === "text") {
          const baseFontSize = Math.floor(img.height * 0.08 * layer.scale);
          const fontStyle = [
            layer.italic ? "italic" : "",
            layer.bold ? "bold" : "",
            `${baseFontSize}px`,
            layer.fontFamily,
          ].filter(Boolean).join(" ");

          ctx.font = fontStyle;
          ctx.textAlign = layer.align;
          ctx.textBaseline = "middle";

          // Background box if color exists
          if (layer.backgroundColor && layer.backgroundColor !== "transparent") {
             ctx.fillStyle = layer.backgroundColor;
             const metrics = ctx.measureText(layer.text);
             const padding = 20 * (img.width / 1000);
             const bw = metrics.width + padding * 2;
             const bh = baseFontSize + padding;
             
             if (layer.borderRadius && layer.borderRadius > 0) {
               ctx.beginPath();
               ctx.roundRect(-bw/2, -bh/2, bw, bh, layer.borderRadius * (img.width/500));
               ctx.fill();
             } else {
               ctx.fillRect(-bw/2, -bh/2, bw, bh);
             }
          }

          // Stroke (outline)
          if (layer.strokeWidth > 0) {
            ctx.strokeStyle = layer.strokeColor;
            ctx.lineWidth = layer.strokeWidth * (img.width / 500);
            ctx.lineJoin = "round";
            ctx.strokeText(layer.text, 0, 0);
          }

          // Shadow if no background
          if (!layer.backgroundColor || layer.backgroundColor === "transparent") {
            ctx.shadowColor = "rgba(0,0,0,0.7)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }

          ctx.fillStyle = layer.color;
          ctx.fillText(layer.text, 0, 0);
        } else if (layer.type === "image" && layer.imageUrl) {
          const layerImg = new Image();
          layerImg.crossOrigin = "anonymous";
          await new Promise((res, rej) => {
            layerImg.onload = res;
            layerImg.onerror = rej;
            layerImg.src = layer.imageUrl!;
          });

          const targetWidth = img.width * layer.scale;
          const targetHeight = (layerImg.height / layerImg.width) * targetWidth;

          ctx.drawImage(layerImg, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
        }
        
        ctx.restore();
      }

      onSave(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row gap-4 h-full"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* ---- Left: Canvas Preview ---- */}
      <div className="flex-1 flex flex-col items-center gap-3 min-w-0">
        <div
          ref={canvasAreaRef}
          className="relative w-full max-w-[480px] aspect-square bg-muted rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/10 select-none"
          onClick={() => setSelectedId("")}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-30">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <img
            src={imageUrl}
            alt="Base"
            className="w-full h-full object-cover pointer-events-none"
            style={imageFilterStyle}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          {layers.map(layer => (
            <div
              key={layer.id}
              style={getLayerStyle(layer)}
              onPointerDown={(e) => handlePointerDown(e, layer.id)}
              onClick={(e) => { e.stopPropagation(); setSelectedId(layer.id); }}
            >
              {layer.type === "text" ? layer.text : (
                <img src={layer.imageUrl} alt="" className="w-full h-auto pointer-events-none select-none" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Clique para selecionar · Arraste para mover
        </p>

        {/* Layers Panel */}
        <div className="w-full max-w-[480px]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Camadas
            </p>
            <Button size="sm" variant="outline" onClick={addLayer} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
          </div>
          <div className="space-y-1.5">
            {[...layers].reverse().map(layer => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-xs ${layer.id === selectedId ? "bg-primary/15 ring-1 ring-primary/30" : "bg-muted/40 hover:bg-muted/60"}`}
                onClick={() => setSelectedId(layer.id)}
              >
                {layer.type === "image" ? <ImageIcon className="h-3 w-3 text-muted-foreground shrink-0" /> : <Type className="h-3 w-3 text-muted-foreground shrink-0" />}
                <span className="flex-1 truncate font-medium">{layer.type === "text" ? layer.text : (layer.imageUrl?.split('/').pop() || "Imagem")}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); updateSelected({ visible: !layer.visible }); setSelectedId(layer.id); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 opacity-40" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={layers.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Right: Controls Panel ---- */}
      <div className="w-full lg:w-72 flex flex-col gap-3 overflow-y-auto max-h-[80vh] lg:max-h-none">
        {/* Tab Switcher */}
        <div className="grid grid-cols-5 gap-1 bg-muted/40 p-1 rounded-xl">
          {(["templates", "text", "image", "stickers", "library"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 text-[8px] font-bold uppercase tracking-tighter rounded-lg transition-all ${activeTab === tab ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            >
              {tab === "templates" ? "Layouts" : tab === "text" ? "Texto" : tab === "image" ? "Imagem" : tab === "stickers" ? "Stickers" : "Biblio"}
            </button>
          ))}
        </div>

        {/* ---- TEMPLATES TAB ---- */}
        {activeTab === "templates" && (
          <div className="space-y-4 p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3 w-3" /> Layouts Especiais
            </p>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:bg-muted transition-all text-left group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    {t.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.layers.length} camadas aplicadas</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- TEXT TAB ---- */}
        {activeTab === "text" && selected && selected.type === "text" && (
          <div className="space-y-4 p-3 bg-muted/20 rounded-xl">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Estilos Rápidos</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className="text-[10px] p-1.5 rounded-lg border bg-background hover:bg-muted transition-colors font-medium truncate"
                    style={{ fontFamily: p.fontFamily, color: p.color === "#FFFFFF" ? "#333" : p.color }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Conteúdo</Label>
              <Textarea
                value={selected.text}
                onChange={(e) => updateSelected({ text: e.target.value })}
                className="text-sm resize-none"
                rows={2}
                placeholder="Digite aqui..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Fonte</Label>
              <Select value={selected.fontFamily} onValueChange={(v) => updateSelected({ fontFamily: v })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => (
                    <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <button onClick={() => updateSelected({ bold: !selected.bold })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-bold transition-colors ${selected.bold ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                <Bold className="h-3 w-3" /> Bold
              </button>
              <button onClick={() => updateSelected({ italic: !selected.italic })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs transition-colors ${selected.italic ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                <Italic className="h-3 w-3" /> Itálico
              </button>
            </div>

            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map(a => (
                <button key={a} onClick={() => updateSelected({ align: a })} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-colors ${selected.align === a ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
                  {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1"><Palette className="h-3 w-3" /> Cor</Label>
              <div className="flex gap-2">
                <Input type="color" value={selected.color} onChange={(e) => updateSelected({ color: e.target.value })} className="w-12 h-9 p-1 cursor-pointer rounded-lg" />
                <Input value={selected.color.toUpperCase()} onChange={(e) => updateSelected({ color: e.target.value })} className="flex-1 text-xs h-9 uppercase font-mono" />
              </div>
              <div className="grid grid-cols-8 gap-1">
                {["#FFFFFF", "#000000", "#FF6B9D", "#F5C842", "#4ECDC4", "#45B7D1", "#96CEB4", "#FF9A8B"].map(c => (
                  <button key={c} onClick={() => updateSelected({ color: c })} className="h-6 w-6 rounded-md border-2 transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: selected.color === c ? "#6366f1" : "transparent" }} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Contorno (Stroke)</Label>
                <span className="text-[10px] text-muted-foreground">{selected.strokeWidth}px</span>
              </div>
              <Slider value={[selected.strokeWidth]} min={0} max={8} step={1} onValueChange={([v]) => updateSelected({ strokeWidth: v })} />
            </div>
          </div>
        )}

        {/* ---- COMMON LAYER CONTROLS ---- */}
        {selected && (
          <div className="space-y-4 p-3 bg-muted/20 rounded-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{isImageLayer ? "Escala" : "Tamanho"}</Label>
                <span className="text-[10px] text-muted-foreground">{Math.round(selected.scale * 100)}%</span>
              </div>
              <Slider value={[selected.scale * 100]} min={5} max={250} step={5} onValueChange={([v]) => updateSelected({ scale: v / 100 })} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Opacidade</Label>
                <span className="text-[10px] text-muted-foreground">{Math.round(selected.opacity * 100)}%</span>
              </div>
              <Slider value={[selected.opacity * 100]} min={10} max={100} step={5} onValueChange={([v]) => updateSelected({ opacity: v / 100 })} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1"><RotateCw className="h-3 w-3" /> Rotação</Label>
                <span className="text-[10px] text-muted-foreground">{selected.rotation}°</span>
              </div>
              <Slider value={[selected.rotation]} min={-180} max={180} step={5} onValueChange={([v]) => updateSelected({ rotation: v })} />
            </div>

            <Button size="sm" variant="outline" onClick={duplicateLayer} className="w-full gap-1 text-xs">
              <Copy className="h-3 w-3" /> Duplicar Camada
            </Button>
          </div>
        )}

        {/* ---- IMAGE TAB (BG Adjustments) ---- */}
        {activeTab === "image" && (
          <div className="space-y-4 p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5"><Sun className="h-3 w-3" /> Ajustes de Imagem</p>
            {(
              [
                { key: "brightness", label: "Brilho", min: 50, max: 150 },
                { key: "contrast", label: "Contraste", min: 50, max: 200 },
                { key: "saturation", label: "Saturação", min: 0, max: 200 },
                { key: "blur", label: "Desfoque (px)", min: 0, max: 8 },
              ] as const
            ).map(({ key, label, min, max }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">{label}</Label>
                  <span className="text-[10px] text-muted-foreground">{imageFilter[key]}{key === "blur" ? "px" : "%"}</span>
                </div>
                <Slider
                  value={[imageFilter[key]]}
                  min={min}
                  max={max}
                  step={key === "blur" ? 1 : 5}
                  onValueChange={([v]) => setImageFilter(f => ({ ...f, [key]: v }))}
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setImageFilter({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })}
            >
              Restaurar Original
            </Button>
          </div>
        )}

        {/* ---- STICKERS TAB ---- */}
        {activeTab === "stickers" && (
          <div className="p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">Emojis & Stickers</p>
            <div className="grid grid-cols-5 gap-2">
              {STICKERS.map(s => (
                <button
                  key={s}
                  onClick={() => addSticker(s)}
                  className="text-2xl h-12 w-full flex items-center justify-center rounded-xl bg-background hover:bg-muted hover:scale-110 transition-all border"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center italic">Clique para adicionar à imagem</p>
          </div>
        )}

        {/* ---- LIBRARY TAB ---- */}
        {activeTab === "library" && (
          <div className="p-3 bg-muted/20 rounded-xl space-y-3">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Sua Coleção</p>
            {loadingLibrary ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : libraryImages.length === 0 ? (
              <p className="text-[10px] text-center text-muted-foreground py-4">Nenhuma imagem na biblioteca.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {libraryImages.map(img => (
                  <div key={img.id} className="relative group">
                    <img 
                      src={img.url} 
                      alt="" 
                      className={`aspect-square rounded-lg border-2 object-cover ${imageUrl === img.url ? "border-primary" : "border-transparent"}`} 
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center p-2 rounded-lg">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-[8px] h-6 uppercase font-bold"
                        onClick={() => { setImageUrl(img.url); setImageLoading(true); }}
                      >
                        Fundo
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-[8px] h-6 uppercase font-bold"
                        onClick={() => addImageLayer(img.url)}
                      >
                        Camada
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center italic">Clique para substituir o fundo</p>
          </div>
        )}

        {/* ---- Action Buttons ---- */}
        <div className="space-y-2 mt-auto pt-2">
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
            onClick={handleExport}
            disabled={isSaving}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Check className="h-4 w-4 mr-2" /> Aplicar Mudanças</>
            )}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Descartar
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CanvasEditor = (props: CanvasEditorProps) => {
  return (
    <Dialog open onOpenChange={props.onClose}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">🎨</span>
            Editor Visual — Personalize sua Arte
            <Badge variant="secondary" className="ml-auto text-[10px] uppercase tracking-widest">Beta</Badge>
          </DialogTitle>
        </DialogHeader>
        <EditorContent {...props} />
      </DialogContent>
    </Dialog>
  );
};
