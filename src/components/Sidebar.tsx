import { NavLink, useLocation } from "react-router-dom";
import { 
  Settings as SettingsIcon, 
  LogOut, 
  BookmarkCheck, 
  BarChart3, 
  Lightbulb, 
  Image, 
  CalendarDays, 
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const NAV_GROUPS = [
  {
    label: "Criação",
    items: [
      { to: "/dashboard", label: "Estúdio IA", icon: Sparkles },
      { to: "/themes", label: "Temas de Conteúdo", icon: Lightbulb },
      { to: "/images", label: "Biblioteca", icon: Image },
    ]
  },
  {
    label: "Gestão",
    items: [
      { to: "/posts", label: "Meus Posts", icon: BookmarkCheck },
      { to: "/schedule", label: "Agendamentos", icon: CalendarDays },
      { to: "/engagement", label: "Respostas Prontas", icon: MessageSquare },
    ]
  },
  {
    label: "Crescimento",
    items: [
      { to: "/research", label: "Pesquisa & Tendências", icon: Search },
      { to: "/analytics", label: "Desempenho", icon: BarChart3 },
      { to: "/leads", label: "Caçador de Leads", icon: Search, badge: "Novo" },
    ]
  }
];

export function Sidebar({ collapsed: initialCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed || false);

  const toggleSidebar = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    if (onToggle) onToggle();
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão encerrada.");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao sair.");
    }
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-in-out border-r border-white/20 bg-white/20 dark:bg-black/40 backdrop-blur-2xl flex flex-col shadow-2xl",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="px-5 py-6 flex items-center gap-3 mb-2 min-w-0">
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-primary via-accent to-orange-400 flex items-center justify-center text-white shadow-[0_0_25px_rgba(124,58,237,0.4)] transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <Sparkles className="h-6 w-6" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500 min-w-0">
            <h1 className="text-lg font-black leading-none tracking-tight text-foreground/90 font-display whitespace-nowrap overflow-hidden text-ellipsis">Studio Genius</h1>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.3em] mt-1.5 font-bold">AI Assistant</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 py-4 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-4">
            {!isCollapsed && (
              <p className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 transition-colors">
                {group.label}
              </p>
            )}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-r from-primary via-accent to-pink-500 text-white shadow-[0_8px_20px_rgba(124,58,237,0.3)] scale-[1.02]" 
                        : "hover:bg-white/40 dark:hover:bg-white/5 text-muted-foreground/80 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                    {!isCollapsed && (
                      <span className={cn(
                        "text-sm font-bold tracking-tight animate-in fade-in slide-in-from-left-1 duration-500",
                        isActive ? "text-white" : "text-foreground/70"
                      )}>
                        {item.label}
                      </span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="ml-auto text-[8px] bg-primary text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                        {item.badge}
                      </span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 glass text-foreground text-xs font-bold rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 whitespace-nowrap border-none">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-white/10">
        <button 
          onClick={toggleSidebar}
          className={cn(
            "w-full h-10 flex items-center rounded-xl transition-all duration-300 hover:bg-white/10 dark:hover:bg-white/5 group/toggle",
            isCollapsed ? "justify-center px-2" : "justify-start gap-3 px-4"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-primary group-hover/toggle:text-primary/80 shrink-0 group-hover/toggle:translate-x-0.5 transition-transform" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 text-primary group-hover/toggle:text-primary/80 shrink-0 group-hover/toggle:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold text-muted-foreground/60 group-hover/toggle:text-primary/80 uppercase tracking-widest transition-colors animate-in fade-in slide-in-from-left-1 duration-300">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
