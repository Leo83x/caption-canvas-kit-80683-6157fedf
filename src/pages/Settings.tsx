import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, ArrowLeft, Settings as SettingsIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [defaultTone, setDefaultTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [brandColors, setBrandColors] = useState<string[]>(["#8b5cf6", "#ec4899", "#f59e0b"]);
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [maxHashtags, setMaxHashtags] = useState(10);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setCompanyName(data.company_name || "");
        setCategory(data.category || "");
        setBio(data.bio || "");
        setDefaultTone(data.default_tone || "professional");
        setTargetAudience(data.target_audience || "");
        const typedData = data as any;
        setKeywordsInput((typedData.keywords || []).join(", "));
        setBrandColors(typedData.brand_colors || ["#8b5cf6", "#ec4899", "#f59e0b"]);
        setHeadingFont(typedData.heading_font || "Inter");
        setBodyFont(typedData.body_font || "Inter");
        setLogoUrl(typedData.logo_url || "");
        setInstagramHandle(data.instagram_handle || "");
        setWebsiteUrl(data.website_url || "");
        setMaxHashtags(data.max_hashtags || 10);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Max 2MB");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      const publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Error uploading logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const keywordsArray = keywordsInput
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const profileData = {
        user_id: user.id,
        company_name: companyName,
        category: category || null,
        bio: bio || null,
        default_tone: defaultTone,
        target_audience: targetAudience || null,
        keywords: keywordsArray,
        brand_colors: brandColors,
        heading_font: headingFont,
        body_font: bodyFont,
        logo_url: logoUrl || null,
        instagram_handle: instagramHandle || null,
        website_url: websiteUrl || null,
        max_hashtags: maxHashtags,
      };

      const { data: existing } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("company_profiles")
          .update(profileData)
          .eq("user_id", user.id));
      } else {
        ({ error } = await supabase
          .from("company_profiles")
          .insert(profileData));
      }

      if (error) throw error;

      toast.success("Perfil salvo com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Erro ao salvar o perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 md:space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pb-8 border-b border-white/10 relative">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-primary/10 text-primary transition-all group"
          >
            <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-foreground/90 tracking-tighter italic uppercase flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary/40" />
              Configurações
            </h1>
            <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-[0.2em] italic">
              Ajuste o DNA da sua marca e a precisão da IA
            </p>
          </div>
        </div>
      </div>

      <div className="glass-premium p-8 md:p-12 rounded-[3rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group/main">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-full -mr-80 -mt-80 blur-[100px] opacity-50" />
        
        <div className="space-y-12 relative z-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Identidade da Marca *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Studio High-End"
                className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Nicho Estratégico</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Luxury Home Decor"
                className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Proposta de Valor (Bio)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva a essência e os diferenciais da sua marca..."
              rows={4}
              className="rounded-3xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-medium p-6 focus-visible:ring-primary/40 backdrop-blur-xl transition-all resize-none leading-relaxed"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="defaultTone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Arquétipo de Voz</Label>
              <Select value={defaultTone} onValueChange={setDefaultTone}>
                <SelectTrigger id="defaultTone" className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold focus-visible:ring-primary/40 backdrop-blur-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none bg-black/80 backdrop-blur-2xl text-white">
                  <SelectItem value="professional">Sóbrio & Profissional</SelectItem>
                  <SelectItem value="casual">Vibrante & Casual</SelectItem>
                  <SelectItem value="emotional">Inspirador & Emocional</SelectItem>
                  <SelectItem value="humorous">Engenhoso & Divertido</SelectItem>
                  <SelectItem value="educational">Autoridade & Educacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="targetAudience" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Avatar Ideal (Público)</Label>
              <Input
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Mulheres 25-40, Classe A"
                className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="keywords" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Conceitos Chave (Tags SEO)</Label>
            <Input
              id="keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="minimalismo, exclusividade, design, futuro"
              className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="instagramHandle" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Instagram (@)</Label>
              <Input
                id="instagramHandle"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@sua_marca"
                className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="websiteUrl" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Domínio (Site)</Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://suamarca.com"
                className="h-14 rounded-2xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10 text-sm font-bold tracking-tight focus-visible:ring-primary/40 backdrop-blur-xl transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
                 <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent" />
                 Identidade Visual High-End
               </h4>
               
               <div className="grid gap-10 md:grid-cols-3">
                 <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic ml-1">Logo Master</Label>
                   <div className="relative group/logo">
                     <div className="h-32 w-32 rounded-[2rem] bg-white/40 dark:bg-black/20 border border-white/60 dark:border-white/10 overflow-hidden flex items-center justify-center p-4 group-hover/logo:scale-105 transition-all duration-500 shadow-xl group-hover/logo:shadow-primary/10">
                       {logoUrl ? (
                         <img src={logoUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
                       ) : (
                         <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => document.getElementById('logo-input')?.click()}>
                         <Upload className="h-6 w-6 text-white" />
                       </div>
                     </div>
                     <input id="logo-input" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                   </div>
                 </div>

                 <div className="md:col-span-2 space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic ml-1">Paleta da Marca</Label>
                      <div className="flex flex-wrap gap-4">
                        {brandColors.map((color, index) => (
                          <div key={index} className="space-y-2 group/color">
                            <div className="relative h-14 w-14 rounded-2xl overflow-hidden shadow-lg border border-white/20 cursor-pointer group-hover/color:scale-110 transition-all duration-300">
                               <Input
                                 type="color"
                                 value={color}
                                 onChange={(e) => {
                                   const newColors = [...brandColors];
                                   newColors[index] = e.target.value;
                                   setBrandColors(newColors);
                                 }}
                                 className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0 border-none"
                               />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground/40 block text-center uppercase">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                       <div className="space-y-3">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic ml-1">Tipografia Títulos</Label>
                         <Select value={headingFont} onValueChange={setHeadingFont}>
                           <SelectTrigger className="h-12 rounded-xl bg-white/20 dark:bg-black/20 border-white/40 dark:border-white/10">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-black/90 text-white">
                             <SelectItem value="Inter">Inter (Clean)</SelectItem>
                             <SelectItem value="Playfair Display">Playfair (Luxo)</SelectItem>
                             <SelectItem value="Montserrat">Montserrat (Modern)</SelectItem>
                             <SelectItem value="Poppins">Poppins (Friendly)</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                    </div>
                 </div>
               </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-12 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              disabled={saving}
              className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all italic"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-14 px-12 rounded-2xl bg-gradient-to-r from-primary via-accent to-pink-500 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_15px_30px_rgba(124,58,237,0.3)] hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                "Salvar Estratégia Visual"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
