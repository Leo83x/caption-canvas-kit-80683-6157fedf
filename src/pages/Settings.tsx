import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [brandColors, setBrandColors] = useState<string[]>(["#8b5cf6", "#ec4899", "#f59e0b"]);
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
        navigate("/");
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
        setKeywords(data.keywords || []);
        setKeywordsInput((data.keywords || []).join(", "));
        setBrandColors(data.brand_colors || ["#8b5cf6", "#ec4899", "#f59e0b"]);
        setLogoUrl(data.logo_url || "");
        setInstagramHandle(data.instagram_handle || "");
        setWebsiteUrl(data.website_url || "");
        setMaxHashtags(data.max_hashtags || 10);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB");
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

      setLogoUrl(urlData.publicUrl);
      toast.success("Logo enviado com sucesso!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Nome da empresa é obrigatório");
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
        logo_url: logoUrl || null,
        instagram_handle: instagramHandle || null,
        website_url: websiteUrl || null,
        max_hashtags: maxHashtags,
      };

      // Upsert via check (avoid onConflict when no unique index on user_id)
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
      navigate("/");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8">
          <h1 className="text-3xl font-display font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground mb-8">
            Configure o perfil da sua empresa para gerar conteúdo personalizado
          </p>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Minha Empresa"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria / Nicho</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Tecnologia, Moda, Alimentação"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio Curta</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Breve descrição sobre sua empresa..."
                rows={3}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="defaultTone">Tom de Voz Padrão</Label>
                <Select value={defaultTone} onValueChange={setDefaultTone}>
                  <SelectTrigger id="defaultTone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="casual">Casual / Amigável</SelectItem>
                    <SelectItem value="emotional">Emocional</SelectItem>
                    <SelectItem value="humorous">Bem-humorado</SelectItem>
                    <SelectItem value="educational">Educativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetAudience">Público-Alvo</Label>
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Jovens adultos, Empresários"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="keywords"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="inovação, qualidade, sustentabilidade"
              />
            </div>

            <div>
              <Label htmlFor="instagramHandle">Instagram Handle</Label>
              <Input
                id="instagramHandle"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@minhaempresa"
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://minhaempresa.com"
              />
            </div>

            <div>
              <Label htmlFor="maxHashtags">Máximo de Hashtags por Post</Label>
              <Input
                id="maxHashtags"
                type="number"
                min="1"
                max="30"
                value={maxHashtags}
                onChange={(e) => setMaxHashtags(parseInt(e.target.value) || 10)}
              />
            </div>

            <div>
              <Label>Cores da Marca</Label>
              <div className="flex gap-2 mt-2">
                {brandColors.map((color, index) => (
                  <Input
                    key={index}
                    type="color"
                    className="h-12 w-24 cursor-pointer"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...brandColors];
                      newColors[index] = e.target.value;
                      setBrandColors(newColors);
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4 mt-2">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-20 w-20 object-contain rounded border"
                  />
                )}
                <div className="flex-1">
                  <label htmlFor="logo-input" className="w-full">
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="w-full"
                      asChild
                    >
                      <span className="cursor-pointer flex items-center justify-center">
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {logoUrl ? "Alterar Logo" : "Upload Logo"}
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configurações"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
