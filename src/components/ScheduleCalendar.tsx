import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";

export function ScheduleCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          generated_posts (*)
        `)
        .eq("user_id", user.id)
        .eq("status", "scheduled")
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setScheduledPosts(data || []);
    } catch (error: any) {
      console.error("Error loading scheduled posts:", error);
    }
  };

  const handleSchedule = async () => {
    if (!date) {
      toast.error("Selecione uma data");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if Instagram is connected
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("instagram_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.instagram_access_token) {
        toast.error("Conecte sua conta do Instagram primeiro em Configurações");
        setLoading(false);
        return;
      }

      const scheduleData = {
        user_id: user.id,
        scheduled_date: format(date, "yyyy-MM-dd"),
        scheduled_time: selectedTime,
        status: "scheduled",
      };

      const { error } = await supabase
        .from("scheduled_posts")
        .insert(scheduleData);

      if (error) throw error;

      toast.success("Post agendado! Será publicado automaticamente no Instagram.");
      setShowDialog(false);
      loadScheduledPosts();
    } catch (error: any) {
      console.error("Error scheduling post:", error);
      toast.error("Erro ao agendar post");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Agendamento removido");
      loadScheduledPosts();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error("Erro ao remover agendamento");
    }
  };

  const nextPost = scheduledPosts[0];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <h2 className="text-xl font-display font-bold mb-4">Calendário de Publicações</h2>
        <div className="flex justify-center mb-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            className="rounded-md border"
          />
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Agendar Publicação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Publicação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Data Selecionada</Label>
                <div className="text-sm text-muted-foreground">
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Nenhuma data selecionada"}
                </div>
              </div>
              <div>
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSchedule}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="mt-6 space-y-2 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Posts agendados: <span className="font-semibold">{scheduledPosts.length}</span>
          </p>
          {nextPost && (
            <p className="text-sm text-muted-foreground">
              Próxima publicação:{" "}
              <span className="font-semibold">
                {format(new Date(nextPost.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às {nextPost.scheduled_time}
              </span>
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-display font-bold mb-4">Posts Agendados</h2>
        <div className="space-y-4">
          {scheduledPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum post agendado
            </p>
          ) : (
            scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {format(new Date(post.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {post.scheduled_time}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
