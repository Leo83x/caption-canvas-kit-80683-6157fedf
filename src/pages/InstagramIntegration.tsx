import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InstagramIntegration() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accessToken, setAccessToken] = useState("");
  const [instagramUserId, setInstagramUserId] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [useOAuth, setUseOAuth] = useState(true); // Default to OAuth flow

  useEffect(() => {
    checkConnection();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    // Check if we're returning from OAuth
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      console.error("OAuth error:", error, errorDescription);
      toast.error(errorDescription || "Erro de autenticação com Facebook", {
        duration: 10000,
      });
      navigate("/instagram", { replace: true });
      return;
    }

    if (code) {
      setLoading(true);

      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        const redirectUri = `${window.location.origin}/instagram`;

        const { data, error } = await supabase.functions.invoke(
          "facebook-oauth-callback",
          {
            body: {
              code,
              redirectUri,
              userId: user?.id || null
            },
            headers: {},
          }
        );

        if (error) throw error;

        if (data.success) {
          toast.success(`Instagram conectado! Conta: @${data.instagramUsername}`);
          setIsConnected(true);
          setInstagramUsername(data.instagramUsername);
          setInstagramUserId(data.instagramUserId);
          setTokenExpiresAt(data.expiresAt);
          navigate("/instagram", { replace: true });
        } else {
          throw new Error(data.error || "Erro na conexão");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        toast.error(error.message || "Erro ao completar a autenticação");
        navigate("/instagram", { replace: true });
      } finally {
        setLoading(false);
      }
    }
  };

  const checkConnection = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) return;

      const { data, error } = await supabase
        .from("company_profiles")
        .select("instagram_access_token, instagram_user_id, token_expires_at" as any)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.instagram_access_token && data?.instagram_user_id) {
        setIsConnected(true);
        setInstagramUserId(data.instagram_user_id);
        setTokenExpiresAt(data.token_expires_at);

        try {
          const response = await fetch(
            `https://graph.facebook.com/v20.0/${data.instagram_user_id}?fields=username&access_token=${data.instagram_access_token}`
          );
          const userData = await response.json();
          if (userData.username) {
            setInstagramUsername(userData.username);
          }
        } catch (err) {
          console.error("Error fetching username from Instagram:", err);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const startOAuthFlow = () => {
    const appId = "1590532242091370";
    if (appId) {
      const redirectUri = `${window.location.origin}/instagram`;
      const scope = "public_profile,instagram_basic,instagram_content_publish,pages_read_engagement,instagram_manage_comments,instagram_manage_insights,pages_show_list,business_management";
      const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${scope}&response_type=code&auth_type=rerequest`;
      window.location.href = oauthUrl;
    }
  };

  const refreshToken = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "refresh-instagram-token"
      );
      if (error) throw error;
      if (data.success) {
        setTokenExpiresAt(data.expiresAt);
        toast.success(data.message);
        await checkConnection();
      } else {
        throw new Error(data.error || "Error refreshing token");
      }
    } catch (error: any) {
      console.error("Token refresh error:", error);
      toast.error(error.message || "Erro ao renovar token");
    } finally {
      setRefreshing(false);
    }
  };

  const testConnection = async () => {
    if (!accessToken || !instagramUserId) {
      toast.error("Por favor, preencha todos os campos");
      return false;
    }

    setTesting(true);
    try {
      if (accessToken.startsWith("IG") || accessToken.startsWith("IGQV")) {
        throw new Error(
          "Este token parece ser do Instagram Basic Display. Para publicar, gere um User Access Token do Facebook Graph (começa com EAA)."
        );
      }

      const testUrl = `https://graph.facebook.com/v20.0/${instagramUserId}?fields=id,username&access_token=${accessToken}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "Token Inválido");
      }

      toast.success(`Conexão validada! Conta: @${data.username}`);
      return true;
    } catch (error: any) {
      console.error("Test connection error:", error);
      toast.error(error.message || "Erro ao validar credenciais.");
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!accessToken || !instagramUserId) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const isValid = await testConnection();
    if (!isValid) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("company_profiles")
        .update({
          instagram_access_token: accessToken,
          instagram_user_id: instagramUserId,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Instagram conectado com sucesso!");
      setIsConnected(true);
      await checkConnection();
    } catch (error: any) {
      console.error("Error connecting Instagram:", error);
      toast.error(error.message || "Erro ao conectar Instagram");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error("No authenticated user found.");

      const { error } = await supabase.from("company_profiles").update({
        instagram_access_token: null,
        instagram_user_id: null,
        facebook_page_id: null,
        token_expires_at: null,
      }).eq("user_id", user.id);

      if (error) throw error;

      setAccessToken("");
      setInstagramUserId("");
      setInstagramUsername("");
      setTokenExpiresAt(null);
      setIsConnected(false);
      toast.success("Instagram desconectado");
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error(`Erro ao desconectar Instagram: ${error.message}`);
    }
  };

  const isTokenExpiringSoon = () => {
    if (!tokenExpiresAt) return false;
    const expiryDate = new Date(tokenExpiresAt);
    const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7;
  };

  const isTokenExpired = () => {
    if (!tokenExpiresAt) return false;
    return new Date(tokenExpiresAt) < new Date();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b pb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="rounded-full hover:bg-primary/10 text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg transform -rotate-3">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            Integração Instagram
          </h1>
          <p className="text-sm text-muted-foreground italic font-medium">
            Conecte sua conta para automatizar suas publicações
          </p>
        </div>
      </div>

      <Card className="p-8 shadow-smooth border-none ring-1 ring-border bg-white/40 backdrop-blur-sm rounded-3xl overflow-hidden relative">
        {isConnected ? (
          <div className="space-y-8">
            <div className="flex items-center gap-4 p-5 bg-emerald-500/10 border-none ring-1 ring-emerald-500/20 rounded-2xl">
              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest">
                  Conta Conectada
                </p>
                {instagramUsername && (
                  <p className="text-base font-bold text-emerald-800 italic">
                    @{instagramUsername}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="h-6 border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[10px] font-bold uppercase">Ativo</Badge>
            </div>

            {isTokenExpired() && (
              <Alert variant="destructive" className="rounded-2xl border-none ring-1 ring-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold leading-relaxed italic">
                  Seu token expirou! Clique em "Renovar Token" ou reconecte sua conta para garantir as postagens.
                </AlertDescription>
              </Alert>
            )}

            {!isTokenExpired() && isTokenExpiringSoon() && (
              <Alert className="rounded-2xl border-none ring-1 ring-amber-500/20 bg-amber-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold leading-relaxed italic text-amber-800">
                  Seu token expira em breve. Recomendamos renovar agora para evitar interrupções no agendamento.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Instagram User ID</Label>
                <div className="h-11 bg-slate-100/50 flex items-center px-4 rounded-xl border-none ring-1 ring-border text-sm font-mono text-muted-foreground">
                  {instagramUserId || "••••••••"}
                </div>
              </div>
              {tokenExpiresAt && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Token expira em</Label>
                  <div className="h-11 bg-slate-100/50 flex items-center px-4 rounded-xl border-none ring-1 ring-border text-sm font-bold text-muted-foreground italic">
                    {new Date(tokenExpiresAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-dashed">
              <Button
                variant="outline"
                onClick={refreshToken}
                disabled={refreshing}
                className="flex-1 h-12 rounded-xl border-primary text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[11px]"
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Renovando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renovar Token
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="flex-1 h-12 rounded-xl bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border-none font-bold uppercase tracking-widest text-[11px] shadow-sm"
              >
                Desconectar
              </Button>
            </div>

            <div className="p-5 bg-slate-50/80 rounded-2xl border-none ring-1 ring-border shadow-sm flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-primary/50 mt-0.5" />
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                <strong>Dica Estratégica:</strong> Renovar seu token periodicamente garante que o Studio Genius possa colher métricas precisas e realizar postagens sem falhas técnicas.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {useOAuth ? (
              <div className="space-y-8">
                <div className="p-8 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-none ring-1 ring-primary/20 rounded-[2rem] space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="h-24 w-24 text-primary" />
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0 animate-pulse">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2 relative z-10">
                      <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">Conexão Simplificada</h3>
                      <p className="text-sm text-muted-foreground font-medium italic">
                        O futuro da automação começa com um login seguro e rápido.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 ml-2">
                    {[
                      "Clique no botão oficial do Facebook abaixo",
                      "Escolha sua conta Business e as Páginas desejadas",
                      "Autorize o Studio Genius a gerenciar o conteúdo"
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary border border-primary/20">
                          0{i + 1}
                        </div>
                        <p className="text-xs font-bold text-foreground/80 lowercase italic">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/10 border-none ring-1 ring-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-600 text-[10px] font-bold">!</div>
                    <p className="text-[10px] text-amber-900 font-medium leading-relaxed italic">
                      <strong>ATENÇÃO:</strong> Certifique-se de autorizar tanto a <u>Página do Facebook</u> quanto a <u>Conta conectada do Instagram</u> na tela de seleção do Facebook.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={startOAuthFlow}
                  disabled={loading}
                  className="w-full h-14 bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-xl shadow-[#1877F2]/20 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02]"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                      Iniciando Fluxo...
                    </>
                  ) : (
                    <>
                      <Instagram className="h-5 w-5 mr-3" />
                      Conectar com Facebook
                    </>
                  )}
                </Button>

                <div className="text-center space-y-6 pt-4">
                  <button
                    onClick={() => setUseOAuth(false)}
                    className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors underline decoration-primary/20 flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>Prefiro configurar manualmente com tokens</span>
                  </button>

                  <div className="pt-6 border-t border-dashed">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3 italic">
                      Está com sérios problemas de conexão?
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnect}
                      className="text-[10px] text-destructive hover:text-destructive hover:bg-destructive/5 w-full font-bold uppercase tracking-widest"
                    >
                      <XCircle className="h-3 w-3 mr-2" />
                      Reiniciar Cache de Autenticação (Reset)
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <Alert variant="destructive" className="rounded-2xl border-none ring-1 ring-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-bold italic leading-relaxed">
                    <strong>Aviso Técnico:</strong> O método manual exige a geração de tokens via Graph API Explorer da Meta. Use apenas para depuração.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="accessToken" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Token de Acesso (EAA...)</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Cole seu token de acesso de longa duração aqui"
                      className="h-11 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary/50 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userId" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Instagram User ID</Label>
                    <Input
                      id="userId"
                      value={instagramUserId}
                      onChange={(e) => setInstagramUserId(e.target.value)}
                      placeholder="Identificador numérico do Instagram Business"
                      className="h-11 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary/50 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={testConnection}
                    disabled={testing}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] border-primary/30 text-primary"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Validar Credenciais"
                    )}
                  </Button>
                  <Button
                    onClick={handleConnect}
                    disabled={loading}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg border-none"
                  >
                    Salvar Manualmente
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setUseOAuth(true)}
                    className="text-[10px] font-bold uppercase tracking-tight text-primary hover:underline"
                  >
                    Voltar para fluxo automático
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
