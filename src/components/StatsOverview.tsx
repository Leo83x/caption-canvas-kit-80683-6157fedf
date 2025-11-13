import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, FileText, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function StatsOverview() {
  const [stats, setStats] = useState({
    postsGerados: 0,
    postsAgendados: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: posts } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("user_id", user.id);

      const { data: scheduled } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "scheduled");

      setStats({
        postsGerados: posts?.length || 0,
        postsAgendados: scheduled?.length || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
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
      label: "Publicações",
      value: "Em breve",
      change: "Instagram",
      icon: TrendingUp,
      gradient: "from-yellow-500 to-pink-500"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="p-6 shadow-smooth transition-smooth hover:shadow-glow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
            <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
