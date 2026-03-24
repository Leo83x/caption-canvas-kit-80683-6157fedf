import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Trash2, GripVertical, ChevronLeft, ChevronRight, Image as ImageIcon, Info } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedPost {
  id: string;
  caption: string;
  image_url: string | null;
}

interface ScheduledPost {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  generated_post_id: string | null;
  generated_posts?: SavedPost;
}

const ItemType = {
  POST: "post"
};

function DraggablePost({ post }: { post: SavedPost }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType.POST,
    item: { postId: post.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move hover:bg-muted transition-colors ${isDragging ? "opacity-50" : ""
        }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{post.caption.substring(0, 50)}...</p>
        </div>
      </div>
    </div>
  );
}

function DroppableCalendarDay({
  date,
  currentMonth,
  onDrop,
  scheduledPostsForDay
}: {
  date: Date;
  currentMonth: Date;
  onDrop: (postId: string, date: Date) => void;
  scheduledPostsForDay: ScheduledPost[];
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType.POST,
    drop: (item: { postId: string }) => {
      onDrop(item.postId, date);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  const isToday = isSameDay(date, new Date());
  const isCurrentMonth = isSameMonth(date, currentMonth);

  return (
    <div
      ref={drop}
      className={`min-h-[120px] p-2 border-r border-b relative flex flex-col transition-colors ${
        !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-background"
      } ${isOver ? "bg-primary/10" : ""}`}
    >
      <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-2 ${
        isToday ? "bg-primary text-primary-foreground" : ""
      }`}>
        {format(date, "d")}
      </div>
      
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {scheduledPostsForDay.map(post => (
          <div key={post.id} className="bg-primary/5 border border-primary/20 rounded-md p-1.5 flex flex-col gap-1 text-[10px] items-start group relative">
             <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-primary/80">{post.scheduled_time}</span>
             </div>
             {post.generated_posts && (
               <div className="flex w-full items-start gap-1">
                 {post.generated_posts.image_url ? (
                   <img src={post.generated_posts.image_url} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                 ) : (
                   <div className="w-6 h-6 bg-muted rounded flex items-center justify-center flex-shrink-0">
                     <ImageIcon className="h-3 w-3 text-muted-foreground" />
                   </div>
                 )}
                 <p className="line-clamp-2 leading-tight flex-1" title={post.generated_posts.caption}>
                    {post.generated_posts.caption}
                 </p>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleCalendarContent() {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [loading, setLoading] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    loadScheduledPosts();
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("generated_posts")
        .select("id, caption, image_url")
        .eq("user_id", user.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedPosts(data || []);
    } catch (error: any) {
      console.error("Error loading saved posts:", error);
    }
  };

  const loadScheduledPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select(`
          *,
          generated_posts (id, caption, image_url)
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

  const handleDrop = async (postId: string, dropDate: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("company_profiles")
        .select("instagram_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.instagram_access_token) {
        toast.error("Conecte sua conta do Instagram primeiro nas Configurações");
        return;
      }

      const scheduleData = {
        user_id: user.id,
        generated_post_id: postId,
        scheduled_date: format(dropDate, "yyyy-MM-dd"),
        scheduled_time: "12:00",
        status: "scheduled",
      };

      const { error } = await supabase
        .from("scheduled_posts")
        .insert(scheduleData);

      if (error) throw error;

      toast.success(`Post agendado para ${format(dropDate, "dd/MM/yyyy")}`);
      loadScheduledPosts();
      loadSavedPosts();
    } catch (error: any) {
      console.error("Error scheduling post:", error);
      toast.error("Erro ao agendar post");
    }
  };

  const handleSchedule = async () => {
    if (!selectedScheduleDate) {
      toast.error("Selecione uma data");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("company_profiles")
        .select("instagram_access_token")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.instagram_access_token) {
        toast.error("Conecte sua conta do Instagram primeiro nas Configurações");
        setLoading(false);
        return;
      }

      const scheduleData = {
        user_id: user.id,
        scheduled_date: format(selectedScheduleDate, "yyyy-MM-dd"),
        scheduled_time: selectedTime,
        status: "scheduled",
      };

      const { error } = await supabase
        .from("scheduled_posts")
        .insert(scheduleData);

      if (error) throw error;

      toast.success("Post agendado! Ele será publicado automaticamente no Instagram.");
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
      loadSavedPosts();
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error("Erro ao remover agendamento");
    }
  };

  const nextPost = scheduledPosts[0];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-display font-bold">Calendário de Conteúdo</h2>
            <p className="text-sm text-muted-foreground mt-1">Planejamento Editorial do Mês</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Agendar via Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Data Selecionada</Label>
                  <div className="mt-2">
                    <Calendar
                      mode="single"
                      selected={selectedScheduleDate}
                      onSelect={setSelectedScheduleDate}
                      className="rounded-md border mx-auto w-fit"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="time">Horário (Padrão: 12:00)</Label>
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
        </div>

        <Alert className="mb-8 glass-premium border-none shadow-xl rounded-[2rem] p-8 relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-pink-500 opacity-20" />
          <div className="flex gap-6 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Info className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <AlertTitle className="text-sm font-black text-foreground uppercase tracking-widest italic">Protocolo de Operação:</AlertTitle>
              <AlertDescription className="text-xs font-bold text-muted-foreground leading-relaxed italic">
                Sincronize sua rota de engajamento clicando em qualquer ponto do radar temporal para injetar ativos ou arraste cards para reprogramar o alcance.
              </AlertDescription>
            </div>
          </div>
        </Alert>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonthDate(subMonths(currentMonthDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-lg capitalize w-48 text-center">
              {format(currentMonthDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonthDate(addMonths(currentMonthDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden flex-1 flex flex-col mb-4">
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1">
            {eachDayOfInterval({
              start: startOfWeek(startOfMonth(currentMonthDate)),
              end: endOfWeek(endOfMonth(currentMonthDate))
            }).map((day, idx) => (
              <DroppableCalendarDay 
                key={idx} 
                date={day} 
                currentMonth={currentMonthDate} 
                onDrop={handleDrop}
                scheduledPostsForDay={scheduledPosts.filter(p => isSameDay(new Date(p.scheduled_date + "T" + p.scheduled_time), day))}
              />
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-2 pt-6 border-t flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-2">
          <p className="text-sm text-muted-foreground">
            Posts agendados no mês: <span className="font-semibold text-primary">{scheduledPosts.filter(p => isSameMonth(new Date(p.scheduled_date), currentMonthDate)).length}</span>
          </p>
          <Button variant="outline" size="sm" className="md:hidden w-full flex" onClick={() => setShowDialog(true)}>
             <CalendarIcon className="h-4 w-4 mr-2" /> Agendar via Data
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-display font-bold mb-4">Posts Salvos</h2>
          <div className="space-y-2">
            {savedPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum post salvo
              </p>
            ) : (
              savedPosts.map((post) => (
                <DraggablePost key={post.id} post={post} />
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-display font-bold mb-4">Posts Agendados</h2>
          <div className="space-y-3">
            {scheduledPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum post agendado
              </p>
            ) : (
              scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {format(new Date(post.scheduled_date), "dd/MM/yyyy", { locale: enUS })}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {post.scheduled_time}
                      </div>
                      {post.generated_posts && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {post.generated_posts.caption.substring(0, 40)}...
                        </p>
                      )}
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
    </div>
  );
}

export function ScheduleCalendar() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ScheduleCalendarContent />
    </DndProvider>
  );
}