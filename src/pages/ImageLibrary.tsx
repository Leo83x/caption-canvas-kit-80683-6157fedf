import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Search, Image as ImageIcon, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  url: string;
  storage_path: string;
  tags: string[];
  description: string | null;
  created_at: string;
}

export default function ImageLibrary() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("image_library" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages((data as any) || []);
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("Error loading images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    setUploadingFile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("image-library")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("image-library")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("image_library" as any)
        .insert({
          user_id: user.id,
          storage_path: fileName,
          url: publicUrl,
          tags: [],
          description: file.name
        });

      if (insertError) throw insertError;

      toast.success("Image uploaded successfully!");
      loadImages();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteImage = async (imageId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("image-library")
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("image_library" as any)
        .delete()
        .eq("id", imageId);

      if (dbError) throw dbError;

      toast.success("Image deleted");
      loadImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Error deleting image");
    }
  };

  const handleAddTag = async (imageId: string, currentTags: string[]) => {
    const tag = prompt("Digite uma nova etiqueta (tag) para organizar esta foto:");
    if (!tag) return;

    try {
      const newTags = [...currentTags, tag.toLowerCase()];
      const { error } = await supabase
        .from("image_library" as any)
        .update({ tags: newTags })
        .eq("id", imageId);

      if (error) throw error;

      toast.success("Tag added");
      loadImages();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Error adding tag");
    }
  };

  const filteredImages = images.filter((image) => {
    const matchesSearch =
      searchTerm === "" ||
      image.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => image.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(images.flatMap((img) => img.tags)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-8 border-b border-white/10 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Acervo</span>
            <span className="text-foreground/20">Visual</span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
            Ativos estratégicos para composições de alto impacto
          </p>
        </div>

        <div className="relative z-10">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploadingFile}
            id="file-upload"
            className="hidden"
          />
          <Label htmlFor="file-upload">
            <Button asChild disabled={uploadingFile} className="h-14 px-8 rounded-2xl bg-gradient-to-r from-primary via-accent to-pink-500 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:shadow-primary/40 hover:scale-[1.05] transition-all duration-300 border-none">
              <span className="cursor-pointer flex items-center gap-3">
                <Upload className="h-5 w-5" />
                {uploadingFile ? "Processando..." : "Upload High-End"}
              </span>
            </Button>
          </Label>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="glass-premium p-6 md:p-8 rounded-[2.5rem] border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden group/search transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/search:opacity-100 transition-opacity duration-700" />
        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="flex-1">
            <div className="relative group/input">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
              <Input
                placeholder="Buscar por descrição ou etiquetas estratégicas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-16 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
              />
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-3 items-center min-w-[300px]">
              <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] italic mr-2">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-300 rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest ${selectedTags.includes(tag) ? 'bg-primary text-white border-none shadow-lg' : 'bg-white/40 dark:bg-white/5 border-white/40 dark:border-white/10 backdrop-blur-md hover:bg-white/60'}`}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {filteredImages.length === 0 ? (
        <div className="glass-premium p-20 text-center rounded-[3rem] border-dashed border-2 border-white/10 relative overflow-hidden group/empty">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover/empty:scale-110 group-hover/empty:rotate-6 transition-all duration-700">
              <ImageIcon className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-black text-foreground/90 uppercase tracking-tighter italic mb-3">
              {images.length === 0 ? "Galeria Vazia" : "Vácuo de Resultados"}
            </h3>
            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest max-w-md mx-auto leading-relaxed">
              {images.length === 0
                ? "Sua biblioteca ainda não possui ativos. Comece o upload de suas fotos estratégicas."
                : "A busca não encontrou correspondências. Tente termos mais amplos ou outras tags."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
          {filteredImages.map((image) => (
            <div key={image.id} className="glass-premium overflow-hidden group/card border-none shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] bg-white/40 dark:bg-black/20 p-4">
              <div className="aspect-square relative rounded-[2rem] overflow-hidden bg-black/5">
                <img
                  src={image.url}
                  alt={image.description || ""}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[4px] duration-500">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-11 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/20 text-white backdrop-blur-md border border-white/20 hover:bg-white/40 transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(image.url);
                      toast.success("Link copiado para o acervo!");
                    }}
                  >
                    Copiar URL
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-11 w-11 p-0 rounded-xl bg-red-500/20 text-red-500 backdrop-blur-md border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => handleDeleteImage(image.id, image.storage_path)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Descrição</p>
                  <p className="text-sm font-bold text-foreground/80 line-clamp-1 italic">
                    {image.description || "Sem descrição"}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                  {image.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest border border-primary/10">
                      {tag}
                    </span>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-primary hover:bg-primary/10 rounded-lg group/tag transition-all"
                    onClick={() => handleAddTag(image.id, image.tags)}
                  >
                    <Tag className="h-3.5 w-3.5 mr-1.5 opacity-40 group-hover/tag:opacity-100" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Tag</span>
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">
                    {new Date(image.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
