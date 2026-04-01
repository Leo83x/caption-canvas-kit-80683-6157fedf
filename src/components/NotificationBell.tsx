import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  link?: string;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for recently published posts
    const { data: published } = await supabase
      .from("scheduled_posts")
      .select("*, generated_posts(caption)")
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5);

    // Check for failed posts
    const { data: failed } = await supabase
      .from("scheduled_posts")
      .select("*, generated_posts(caption)")
      .eq("user_id", user.id)
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(5);

    const notifs: Notification[] = [];

    published?.forEach((p) => {
      notifs.push({
        id: `pub-${p.id}`,
        title: "Post publicado ✅",
        message: (p.generated_posts as any)?.caption?.substring(0, 60) + "..." || "Post publicado com sucesso",
        time: new Date(p.published_at || p.updated_at),
        read: false,
        link: "/analytics",
      });
    });

    failed?.forEach((p) => {
      notifs.push({
        id: `fail-${p.id}`,
        title: "Falha na publicação ❌",
        message: p.error_message?.substring(0, 60) || "Erro ao publicar",
        time: new Date(p.updated_at),
        read: false,
        link: "/schedule",
      });
    });

    notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
    setNotifications(notifs.slice(0, 10));
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação no momento
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                onClick={() => {
                  if (n.link) navigate(n.link);
                  setOpen(false);
                }}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(n.time, { addSuffix: true, locale: ptBR })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
