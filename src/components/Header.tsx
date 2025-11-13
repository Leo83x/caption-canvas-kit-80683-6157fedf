import { Instagram, Settings as SettingsIcon, LogOut, BookmarkCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "./NavLink";

export function Header() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-instagram">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">InstaGenius</h1>
              <p className="text-xs text-muted-foreground">Gerador de Conteúdo IA</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/posts">Posts Salvos</NavLink>
            <NavLink to="/instagram">Instagram</NavLink>
            <NavLink to="/settings">Configurações</NavLink>
          </nav>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
}
