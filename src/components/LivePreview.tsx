import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Heart, MessageCircle, Send, Bookmark, Youtube } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useMemo, useState, useEffect } from "react";

interface LivePreviewProps {
    caption: string;
    hashtags?: string[];
    imageUrl?: string;
    supabaseUrl?: string; // NEW
    companyName?: string;
    companyLogo?: string;
    postType?: "feed" | "story" | "reel" | "carousel" | "youtube_thumb";
}

export function LivePreview({
    caption,
    hashtags = [],
    imageUrl,
    supabaseUrl,
    companyName = "Sua Empresa",
    companyLogo,
    postType = "feed"
}: LivePreviewProps) {
    // Debounce para evitar updates excessivos
    const debouncedCaption = useDebounce(caption, 300);
    const debouncedHashtags = useDebounce(hashtags, 300);

    // Define aspect ratio e label baseado no tipo de post
    const aspectRatio = (postType === "story" || postType === "reel") ? "aspect-[9/16]" : postType === "youtube_thumb" ? "aspect-video" : "aspect-square";
    const postTypeLabel = postType === "feed" ? "Feed" : postType === "story" ? "Story" : postType === "reel" ? "Reel" : postType === "carousel" ? "Carrossel" : "YouTube Thumb";
    const maxWidth = postType === "youtube_thumb" ? "max-w-xl" : (postType === "feed" || postType === "carousel" ? "max-w-md" : "max-w-sm");

    // Calcula estatísticas
    const stats = useMemo(() => {
        const captionLength = debouncedCaption.length;
        const hashtagCount = debouncedHashtags.length;
        const totalLength = captionLength + (debouncedHashtags.length > 0 ? debouncedHashtags.join(' ').length + 2 : 0);
        const isOverLimit = totalLength > 2200;

        return {
            captionLength,
            hashtagCount,
            totalLength,
            isOverLimit,
            remaining: 2200 - totalLength,
        };
    }, [debouncedCaption, debouncedHashtags]);

    // Formata caption com hashtags
    const fullCaption = useMemo(() => {
        const hashtagsText = debouncedHashtags.length > 0
            ? '\n\n' + debouncedHashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
            : '';
        return debouncedCaption + hashtagsText;
    }, [debouncedCaption, debouncedHashtags]);

    const [currentImage, setCurrentImage] = useState<string | undefined>(imageUrl);

    useEffect(() => {
        setCurrentImage(imageUrl);
    }, [imageUrl]);

    const handleImageError = () => {
        console.warn("LivePreview: Image error, triggering fallback chain...");
        if (currentImage === imageUrl && supabaseUrl && supabaseUrl !== imageUrl) {
            console.log("LivePreview: Falling back to Supabase...");
            setCurrentImage(supabaseUrl);
        } else if (currentImage && !currentImage.includes('images.unsplash.com')) {
            console.log("LivePreview: Falling back to Emergency Unsplash...");
            const query = encodeURIComponent(caption || "marketing");
            setCurrentImage(`https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80&q=fallback&term=${query}`);
        } else {
            console.error("LivePreview: All image fallbacks failed.");
        }
    };

    return (
        <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group transition-all duration-500">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-foreground/90 uppercase tracking-tight flex items-center gap-3 italic">
                        {postType === 'youtube_thumb' ? (
                            <Youtube className="h-6 w-6 text-red-500" />
                        ) : (
                            <Instagram className="h-6 w-6 text-primary" />
                        )}
                        Preview <span className="text-muted-foreground/40 font-medium not-italic">- {postTypeLabel}</span>
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Visualize como seu post aparecerá na rede social</p>
                </div>
                <div className={`px-4 py-2 rounded-full border border-white/40 dark:border-white/10 backdrop-blur-md shadow-sm transition-all duration-300 ${stats.isOverLimit ? 'bg-red-500/10 border-red-500/30' : 'bg-white/40 dark:bg-white/5'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${stats.isOverLimit ? 'text-red-500' : 'text-primary'}`}>
                        {stats.remaining} <span className="text-muted-foreground/50">caracteres</span>
                    </span>
                </div>
            </div>

            {/* Simulação do card */}
            <div className={`border-none rounded-3xl overflow-hidden bg-white dark:bg-black/40 backdrop-blur-xl ${maxWidth} mx-auto shadow-2xl relative transition-all duration-500 group-hover:scale-[1.01]`}>
                {/* Header do post (Instagram style or simple) */}
                <div className="flex items-center gap-4 p-4 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary via-accent to-pink-500 p-[2px]">
                        <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                            {companyLogo ? (
                                <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-primary font-black text-sm">
                                    {companyName?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm tracking-tight text-foreground/90">{companyName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Agora</p>
                    </div>
                </div>

                {/* Imagem do post - aspect ratio dinâmico */}
                {currentImage ? (
                    <div className={`${aspectRatio} bg-black/5 dark:bg-white/5 relative`}>
                        <img
                            src={currentImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <div className={`${aspectRatio} bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center`}>
                        <div className="text-center">
                            {postType === 'youtube_thumb' ? (
                                <Youtube className="h-20 w-20 mx-auto mb-3 text-red-500/20" />
                            ) : (
                                <Instagram className="h-20 w-20 mx-auto mb-3 text-primary/20" />
                            )}
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Visualização de {postTypeLabel}</p>
                        </div>
                    </div>
                )}

                {/* Ações do post (Hide for YouTube) */}
                {postType !== 'youtube_thumb' && (
                    <div className="p-5 space-y-4 bg-white/50 dark:bg-black/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <Heart className="h-7 w-7 cursor-pointer hover:text-red-500 transition-all hover:scale-110 active:scale-90 text-foreground/70" />
                                <MessageCircle className="h-7 w-7 cursor-pointer hover:text-primary transition-all hover:scale-110 text-foreground/70" />
                                <Send className="h-7 w-7 cursor-pointer hover:text-primary transition-all hover:scale-110 -rotate-12 transform text-foreground/70" />
                            </div>
                            <Bookmark className="h-7 w-7 cursor-pointer hover:text-primary transition-all hover:scale-110 text-foreground/70" />
                        </div>

                        {/* Caption */}
                        {fullCaption && (
                            <div className="text-sm leading-relaxed">
                                <span className="font-black text-foreground/90 mr-2">{companyName}</span>{' '}
                                <span className="font-medium text-foreground/70 whitespace-pre-wrap break-words">
                                    {fullCaption}
                                </span>
                            </div>
                        )}

                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Ver todos os comentários</p>
                    </div>
                )}
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-6 pt-10 relative z-10">
                <div className="text-center group/stat">
                    <p className="text-3xl font-black text-foreground/90 tracking-tighter tabular-nums mb-1 transition-all duration-300 group-hover/stat:text-primary">{stats.captionLength}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Caracteres</p>
                </div>
                <div className="text-center group/stat">
                    <p className="text-3xl font-black text-foreground/90 tracking-tighter tabular-nums mb-1 transition-all duration-300 group-hover/stat:text-primary">{stats.hashtagCount}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Hashtags</p>
                </div>
                <div className="text-center group/stat">
                    <p className={`text-3xl font-black tracking-tighter tabular-nums mb-1 transition-all duration-300 ${stats.isOverLimit ? 'text-red-500' : 'text-foreground/90 group-hover/stat:text-primary'}`}>
                        {stats.totalLength}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Total</p>
                </div>
            </div>

            {stats.isOverLimit && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-in zoom-in-95 mt-6 relative z-10">
                    <p className="text-xs text-red-500 font-bold uppercase tracking-tight flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Atenção: O texto excede o limite do Instagram
                    </p>
                </div>
            )}
        </div>
    );
}
