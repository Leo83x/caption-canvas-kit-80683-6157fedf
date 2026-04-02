import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Instagram, Settings, BookmarkCheck, BarChart3, Lightbulb, Image, CalendarDays, Trophy, MessageSquare, Link2, CreditCard, LayoutDashboard } from "lucide-react";

const pages = [
  { label: "Início", to: "/dashboard", icon: LayoutDashboard },
  { label: "Meus Posts", to: "/posts", icon: BookmarkCheck },
  { label: "Agendamentos", to: "/schedule", icon: CalendarDays },
  { label: "Desempenho", to: "/analytics", icon: BarChart3 },
  { label: "Temas", to: "/themes", icon: Lightbulb },
  { label: "Biblioteca de Imagens", to: "/images", icon: Image },
  { label: "Pesquisa & Benchmarking", to: "/research", icon: Trophy },
  { label: "Caçador de Leads", to: "/leads", icon: Instagram },
  { label: "Respostas Inteligentes", to: "/engagement", icon: MessageSquare },
  { label: "Integração Instagram", to: "/instagram", icon: Link2 },
  { label: "Planos e Assinatura", to: "/subscription", icon: CreditCard },
  { label: "Configurações", to: "/settings", icon: Settings },
];

interface SearchCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandPalette({ open, onOpenChange }: SearchCommandPaletteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar recursos..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem
                key={page.to}
                onSelect={() => {
                  navigate(page.to);
                  onOpenChange(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {page.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
