import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FileText, Clock, TrendingUp, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function StatsOverview() {
  const [stats, setStats] = useState({
    postsGerados: 0,
    postsAgendados: 0,
    aiCredits: 0,
    aiCreditsTotal: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get total generated posts
      const { count: postsCount } = await supabase
        .from("generated_posts")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      // 2. Get pending scheduled posts
      const { count: scheduledCount } = await supabase
        .from("scheduled_posts")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "scheduled");

      // 3. Get AI credits from profile
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("ai_credits_remaining, ai_credits_total" as any)
        .eq("user_id", user.id)
        .maybeSingle();

      setStats({
        postsGerados: postsCount || 0,
        postsAgendados: scheduledCount || 0,
        aiCredits: profile?.ai_credits_remaining ?? 0,
        aiCreditsTotal: profile?.ai_credits_total ?? 100,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      label: "Posts Gerados",
      value: stats.postsGerados.toString(),
      change: "Total",
      icon: FileText,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      label: "Posts Agendados",
      value: stats.postsAgendados.toString(),
      change: "Pendentes",
      icon: Calendar,
      gradient: "from-pink-500 to-orange-500"
    },
    {
      label: "Tempo Economizado",
      value: `${Math.floor(stats.postsGerados * 0.5)}h`,
      change: "Estimado",
      icon: Clock,
      gradient: "from-orange-500 to-yellow-500"
    },
    {
      label: "Créditos de IA",
      value: stats.aiCredits.toString(),
      change: `de ${stats.aiCreditsTotal}`,
      icon: CreditCard,
      gradient: "from-yellow-500 to-pink-500"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-4 md:p-6 animate-pulse">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="glass-card-white p-6 md:p-8 rounded-3xl transition-all duration-500 hover:scale-[1.03] group animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-3 min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">{stat.label}</p>
              <p className="text-3xl md:text-5xl font-black text-foreground/90 tracking-tighter tabular-nums drop-shadow-sm">{stat.value}</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.change}</p>
              </div>
            </div>
            <div className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0 shadow-[0_8px_16px_rgba(31,38,135,0.1)] transition-all duration-500 group-hover:rotate-6 group-hover:scale-110`}>
              <stat.icon className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
