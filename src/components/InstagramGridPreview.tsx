import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Grid3X3, ImageIcon } from "lucide-react";

interface GridPost {
  id: string;
  image_url: string | null;
  caption: string;
  post_type: string;
}

export function InstagramGridPreview() {
  const [posts, setPosts] = useState<GridPost[]>([]);
  const [companyName, setCompanyName] = useState("your_company");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: profile }, { data: postsData, count }] = await Promise.all([
      supabase
        .from("company_profiles")
        .select("company_name, logo_url, instagram_handle")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("generated_posts")
        .select("id, image_url, caption, post_type", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(9),
    ]);

    if (profile) {
      setCompanyName(profile.instagram_handle || profile.company_name || "your_company");
      setLogoUrl(profile.logo_url);
    }
    setPosts(postsData || []);
    setPostCount(count || 0);
  };

  return (
    <Card className="p-6 shadow-smooth">
      <div className="flex items-center gap-2 mb-6">
        <Grid3X3 className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display font-bold">Preview do Feed (Grid)</h2>
      </div>

      {/* Instagram Profile Header */}
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="p-4 flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-16 w-16 rounded-full object-cover border-2 border-primary" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">
                {companyName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-sm">{companyName}</h3>
            <div className="flex gap-6 mt-2 text-center">
              <div>
                <span className="font-bold text-sm">{postCount}</span>
                <p className="text-xs text-muted-foreground">publicações</p>
              </div>
              <div>
                <span className="font-bold text-sm">-</span>
                <p className="text-xs text-muted-foreground">seguidores</p>
              </div>
              <div>
                <span className="font-bold text-sm">-</span>
                <p className="text-xs text-muted-foreground">seguindo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="border-t">
          <div className="flex items-center justify-center py-2 border-b">
            <Grid3X3 className="h-4 w-4 text-primary" />
          </div>

          {posts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum post salvo ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square bg-muted relative group cursor-pointer overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.caption.substring(0, 50)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs text-center px-2 line-clamp-3">
                      {post.caption.substring(0, 80)}...
                    </p>
                  </div>
                  {post.post_type !== "feed" && (
                    <Badge className="absolute top-1 right-1 text-[10px] px-1 py-0">
                      {post.post_type}
                    </Badge>
                  )}
                </div>
              ))}
              {/* Fill empty cells to complete the grid row */}
              {Array.from({ length: (3 - (posts.length % 3)) % 3 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-muted/30" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
