import { useCallback, useEffect, useState } from "react";
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

  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: scheduledUpdates, error } = await supabase
      .from("scheduled_posts")
      .select("id, generated_post_id, error_message, published_at, updated_at, status")
      .eq("user_id", user.id)
      .in("status", ["published", "failed"])
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error || !scheduledUpdates) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
      return;
    }

    const generatedPostIds = Array.from(
      new Set(
        scheduledUpdates
          .map((item) => item.generated_post_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    const captionsByPostId = new Map<string, string>();

    if (generatedPostIds.length > 0) {
      const { data: posts } = await supabase
        .from("generated_posts")
        .select("id, caption")
        .in("id", generatedPostIds);

      posts?.forEach((post) => {
        captionsByPostId.set(post.id, post.caption);
      });
    }

    const notifs: Notification[] = scheduledUpdates.map((item) => {
      const caption = item.generated_post_id
        ? captionsByPostId.get(item.generated_post_id)
        : undefined;

      return {
        id: `${item.status}-${item.id}`,
        title: item.status === "published" ? "Post publicado ✅" : "Falha na publicação ❌",
        message:
          item.status === "published"
            ? caption?.substring(0, 60)
              ? `${caption.substring(0, 60)}...`
              : "Post publicado com sucesso"
            : item.error_message?.substring(0, 80) || "Erro ao publicar",
        time: new Date(item.published_at || item.updated_at),
        read: false,
        link: item.status === "published" ? "/analytics" : "/schedule",
      };
    });

    setNotifications(notifs.slice(0, 10));
  }, []);

  useEffect(() => {
    loadNotifications();

    let channelCleanup = () => {};

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel(`scheduled-post-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "scheduled_posts",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      channelCleanup = () => {
        supabase.removeChannel(channel);
      };
    });

    return () => {
      channelCleanup();
    };
  }, [loadNotifications]);

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
