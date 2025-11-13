import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Instagram, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function InstagramIntegration() {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState("");
  const [instagramUserId, setInstagramUserId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("company_profiles")
        .select("instagram_access_token, instagram_user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.instagram_access_token && data?.instagram_user_id) {
        setIsConnected(true);
        setInstagramUserId(data.instagram_user_id);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const testConnection = async () => {
    if (!accessToken || !instagramUserId) {
      toast.error("Preencha todos os campos");
      return;
    }

    setTesting(true);
    try {
      // Validação rápida de formato/tipo de token
      if (accessToken.startsWith("IG") || accessToken.startsWith("IGQV")) {
        throw new Error(
          "Este token parece do Instagram Basic Display (começa com IG/IGQV). Para publicar, gere um User Access Token do Facebook Graph (normalmente começa com EAA) com as permissões instagram_basic, pages_show_list e instagram_content_publish."
        );
      }

      // Testar o token fazendo uma requisição simples à API do Instagram
      const testUrl = `https://graph.facebook.com/v18.0/${instagramUserId}?fields=id,username&access_token=${accessToken}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (data.error) {
        if (
          typeof data.error.message === "string" &&
          data.error.message.toLowerCase().includes("cannot parse access token")
        ) {
          throw new Error(
            "Access Token rejeitado. Gere um User Access Token válido (EAA...) do Facebook Graph para o usuário que administra a Página vinculada ao Instagram Business."
          );
        }
        if (data.error.code === 100 && data.error.error_subcode === 33) {
          throw new Error(
            "Instagram User ID inválido ou sem permissões. Certifique-se de que:\n1. O ID informado é o Instagram Business Account ID (não o username numérico)\n2. O token tem permissão para acessar esta conta\n3. A conta Instagram está conectada a uma página do Facebook\n\nVeja as instruções acima sobre como obter o ID correto."
          );
        }
        throw new Error(data.error.message || "Token inválido");
      }

      toast.success(`Conexão validada! Conta: @${data.username}`);
      return true;
    } catch (error: any) {
      console.error("Test connection error:", error);
      toast.error(error.message || "Erro ao validar credenciais. Verifique se o Access Token e User ID estão corretos.");
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!accessToken || !instagramUserId) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validar credenciais antes de salvar
    const isValid = await testConnection();
    if (!isValid) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se já existe um perfil
      const { data: existingProfile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from("company_profiles")
          .update({
            instagram_access_token: accessToken,
            instagram_user_id: instagramUserId,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Criar novo perfil
        const { error } = await supabase
          .from("company_profiles")
          .insert({
            user_id: user.id,
            company_name: "Minha Empresa",
            instagram_access_token: accessToken,
            instagram_user_id: instagramUserId,
          });

        if (error) throw error;
      }

      toast.success("Instagram conectado com sucesso!");
      setIsConnected(true);
    } catch (error: any) {
      console.error("Error connecting Instagram:", error);
      toast.error(error.message || "Erro ao conectar Instagram");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("company_profiles")
        .update({
          instagram_access_token: null,
          instagram_user_id: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setAccessToken("");
      setInstagramUserId("");
      setIsConnected(false);
      toast.success("Instagram desconectado");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Erro ao desconectar Instagram");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Integração Instagram</h1>
              <p className="text-sm text-muted-foreground">
                Conecte sua conta para publicar automaticamente
              </p>
            </div>
          </div>

          {isConnected ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  Instagram conectado com sucesso
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Access Token</Label>
                  <Input value="••••••••••••••••" disabled />
                </div>
                <div>
                  <Label>Instagram User ID</Label>
                  <Input value={instagramUserId || "••••••••"} disabled />
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="w-full"
              >
                Desconectar Instagram
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
                  <p className="text-sm font-medium">Como obter suas credenciais do Instagram Graph API:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2">📱 Passo 1: Preparar sua conta Instagram</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                        <li>Converta sua conta para Instagram Business ou Creator</li>
                        <li>Conecte-a a uma Página do Facebook no Instagram → Configurações → Conta → Mudar para conta profissional</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-sm mb-2">🔑 Passo 2: Criar App no Meta for Developers</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                        <li>Acesse <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com/apps</a></li>
                        <li>Clique em "Criar App" → escolha tipo "Business"</li>
                        <li>Em "Adicionar produtos", adicione "Instagram Graph API"</li>
                        <li>Vá em "Ferramentas" (Tools) → "Ferramenta de Token de Acesso" (Access Token Tool)</li>
                        <li>Selecione sua Página conectada ao Instagram</li>
                        <li>Marque as permissões: <code className="text-xs bg-muted px-1 rounded">instagram_basic</code>, <code className="text-xs bg-muted px-1 rounded">instagram_content_publish</code>, <code className="text-xs bg-muted px-1 rounded">pages_show_list</code></li>
                        <li>Clique em "Gerar Token" - copie o token gerado (começa com EAA)</li>
                      </ol>
                    </div>

                    <div>
                      <p className="font-semibold text-sm mb-2">🆔 Passo 3: Obter Instagram Business Account ID</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                        <li>Acesse <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">business.facebook.com/settings</a></li>
                        <li>No menu lateral esquerdo, clique em "Contas" → "Contas do Instagram"</li>
                        <li>Clique na sua conta Instagram desejada (ex: @convertamaisoficial)</li>
                        <li>Veja a <strong>URL do navegador</strong>. Ela será algo como:<br/><code className="text-xs bg-muted px-1 py-0.5 rounded block mt-1">business.facebook.com/latest/settings/instagram_account?business_id=...&selected_asset_id=<strong>17841477061462489</strong></code></li>
                        <li>Copie apenas os <strong>números longos</strong> após <code className="text-xs">selected_asset_id=</code> (geralmente 17 dígitos)</li>
                        <li>No exemplo acima, o ID correto seria: <code className="text-xs bg-primary/20 px-1 py-0.5 rounded font-bold">17841477061462489</code></li>
                      </ol>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      <strong>⚠️ Importante:</strong> O Instagram Business Account ID é diferente do seu @username. É um número longo que você encontra no Facebook Business Manager. Certifique-se de que sua conta Instagram está conectada a uma Página do Facebook antes de começar.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="accessToken">Access Token *</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Cole seu access token aqui"
                  />
                </div>

                <div>
                  <Label htmlFor="userId">Instagram User ID *</Label>
                  <Input
                    id="userId"
                    value={instagramUserId}
                    onChange={(e) => setInstagramUserId(e.target.value)}
                    placeholder="Cole seu user ID aqui"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={testConnection}
                  disabled={testing || loading}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? "Testando..." : "Testar Conexão"}
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={loading || testing}
                  className="flex-1"
                >
                  {loading ? "Conectando..." : "Conectar Instagram"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
