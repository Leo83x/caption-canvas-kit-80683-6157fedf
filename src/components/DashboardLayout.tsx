import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Menu, 
  User, 
  Bell, 
  Search as SearchIcon, 
  Settings as SettingsIcon, 
  Link2, 
  CreditCard,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão encerrada.");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao sair.");
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const scrollContainer = mainRef.current?.querySelector(".page-content-scroll");
    
    const handleScrollManual = () => {
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 20);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScrollManual, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScrollManual);
      }
    };
  }, []);

  // Get page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Estúdio de Criação";
    if (path === "/posts") return "Meus Conteúdos";
    if (path === "/schedule") return "Calendário Editorial";
    if (path === "/analytics") return "Análise de Desempenho";
    if (path === "/themes") return "Estratégia de Temas";
    if (path === "/images") return "Banco de Imagens";
    if (path === "/benchmarking") return "Análise Competitiva";
    if (path === "/engagement") return "Gestão de Comunidade";
    if (path === "/leads") return "Caçador de Leads";
    if (path === "/settings") return "Configurações";
    if (path === "/subscription") return "Assinatura & Créditos";
    return "Studio Genius";
  };

  return (
    <div className="min-h-screen bg-nebula transition-colors duration-500 flex selection:bg-primary/20">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          collapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      )}

      {/* Main Content Area */}
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ease-in-out",
          !isMobile && (isSidebarCollapsed ? "ml-16" : "ml-64")
        )}
      >
        {/* Top Navbar */}
        <header className="shrink-0 z-50 h-16 flex items-center justify-between px-8 border-b border-border/20" style={{ backgroundColor: '#f2effd00' }}>
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-foreground/70">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-none">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            )}
            <div>
              <h1 className="text-base font-bold text-foreground/80 tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center px-4 py-2 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full text-xs text-muted-foreground/80 gap-3 group hover:border-primary/30 transition-all shadow-sm">
              <SearchIcon className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
              <span className="font-medium">Buscar recursos...</span>
              <div className="flex items-center gap-1 opacity-40">
                <span className="text-[10px] font-bold">⌘</span>
                <span className="text-[10px] font-bold">K</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full relative text-foreground/70 hover:bg-white/40">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-primary rounded-full ring-2 ring-white/50" />
              </Button>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full border border-white/50 bg-white/40 dark:bg-black/20 backdrop-blur-md hover:bg-white/60">
                    <User className="h-5 w-5 text-foreground/80" />
                  </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-64 glass-premium p-2 rounded-2xl border-none">
                    <div className="px-3 py-3 mb-1">
                       <p className="text-sm font-bold text-foreground">Minha Conta</p>
                       <div className="flex items-center gap-2 mt-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Premium Explorer</p>
                       </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />

                    <DropdownMenuItem
                      className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-primary/10 gap-3"
                      onClick={() => navigate("/settings")}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-primary/10 gap-3"
                      onClick={() => navigate("/instagram")}
                    >
                      <Link2 className="h-4 w-4" />
                      Conectar IG
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="rounded-xl cursor-pointer py-2.5 px-3 focus:bg-primary/10 gap-3"
                      onClick={() => navigate("/subscription")}
                    >
                      <CreditCard className="h-4 w-4" />
                      Plano & Créditos
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="rounded-xl cursor-pointer py-2.5 px-3 text-destructive focus:bg-destructive/10 gap-3"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Encerrar Sessão
                    </DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content - only this area scrolls */}
        <div
          className="page-content-scroll p-8 md:p-10 flex-1 animate-glass-in overflow-x-hidden overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto space-y-10 pb-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
