import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Plus, X, Check, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ThemeEvent {
  id: string;
  date: Date;
  theme: any;
  completed?: boolean;
}

interface ThemeCalendarProps {
  savedThemes: any[];
}

export function ThemeCalendar({ savedThemes }: ThemeCalendarProps) {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<ThemeEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<any>(null);

  const handleAddTheme = () => {
    if (!date || !selectedTheme) return;

    const newEvent: ThemeEvent = {
      id: crypto.randomUUID(),
      date: date,
      theme: selectedTheme
    };

    setEvents([...events, newEvent]);
    toast.success(`Tema "${selectedTheme.theme_name}" agendado para ${format(date, "dd/MM/yyyy", { locale: ptBR })}`);
    setDialogOpen(false);
    setSelectedTheme(null);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    toast.success("Tema removido do calendário");
  };

  const toggleCompleted = (id: string) => {
    setEvents(events.map(e =>
      e.id === id ? { ...e, completed: !e.completed } : e
    ));
    const event = events.find(e => e.id === id);
    if (event && !event.completed) {
      toast.success("Tema marcado como concluído!");
    }
  };

  const createPostFromTheme = (theme: any) => {
    sessionStorage.setItem('prefillTheme', JSON.stringify({
      theme: theme.theme_name,
      description: theme.description,
      hashtags: theme.suggested_hashtags
    }));
    navigate('/');
    toast.info("Tema carregado no criador de posts!");
  };

  const getEventsForDate = (checkDate: Date) => {
    return events.filter(event =>
      format(event.date, "yyyy-MM-dd") === format(checkDate, "yyyy-MM-dd")
    );
  };

  const categoryColors: Record<string, string> = {
    "Educational Content": "bg-blue-500/10 text-blue-600 border-blue-200",
    "Promotions": "bg-green-500/10 text-green-600 border-green-200",
    "Engagement": "bg-purple-500/10 text-purple-600 border-purple-200",
    "Behind the Scenes": "bg-orange-500/10 text-orange-600 border-orange-200",
    "Tips": "bg-pink-500/10 text-pink-600 border-pink-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Calendário de Temas
        </h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agendar Tema
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4 border-none ring-1 ring-border shadow-sm">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            className="rounded-md"
            modifiers={{
              hasEvent: events.map(e => e.date)
            }}
            modifiersClassNames={{
              hasEvent: "bg-primary/20 font-bold text-primary"
            }}
          />
        </Card>

        <Card className="p-6 border-none ring-1 ring-border shadow-sm bg-muted/20">
          <h3 className="font-bold mb-4 flex items-center justify-between">
            <span>Temas Agendados</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {date ? format(date, "dd MMM", { locale: ptBR }) : "Selecione"}
            </Badge>
          </h3>
          <div className="space-y-3">
            {date && getEventsForDate(date).length > 0 ? (
              getEventsForDate(date).map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-xl flex items-start gap-3 transition-all ${event.completed ? 'bg-green-500/10 border-green-500/20' : 'bg-background border shadow-sm'
                    }`}
                >
                  <div className="pt-1">
                    <Checkbox
                      checked={event.completed}
                      onCheckedChange={() => toggleCompleted(event.id)}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold truncate ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {event.theme.theme_name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic">{event.theme.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[event.theme.category] || "border-muted"}`}>
                        {event.theme.category}
                      </Badge>
                    </div>
                    {!event.completed && (
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-4 w-full bg-primary text-white shadow-md"
                        onClick={() => createPostFromTheme(event.theme)}
                      >
                        <Sparkles className="h-3 w-3 mr-2" />
                        Criar Post Agora
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(event.id)}
                    className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl border-muted">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Nenhum tema agendado para esta data
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Tema</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block">Data Selecionada</label>
                <p className="text-sm font-semibold">
                  {date ? format(date, "PPPP", { locale: ptBR }) : "Selecione uma data"}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-bold block">Escolher um Tema Salvo</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {savedThemes.length > 0 ? (
                  savedThemes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedTheme?.id === theme.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                        }`}
                    >
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-sm leading-tight">{theme.theme_name}</h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{theme.description}</p>
                        <Badge variant="outline" className={`self-start text-[9px] mt-1 ${categoryColors[theme.category] || "border-muted"}`}>
                          {theme.category}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-muted-foreground italic">
                    Nenhum tema salvo na biblioteca
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddTheme} disabled={!selectedTheme} className="flex-1 shadow-lg bg-gradient-to-r from-primary to-purple-600">
                Agendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

