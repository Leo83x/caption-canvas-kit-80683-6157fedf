import { Header } from "@/components/Header";
import { StatsOverview } from "@/components/StatsOverview";
import { PostCreator } from "@/components/PostCreator";
import { PostPreview } from "@/components/PostPreview";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [generatedVariations, setGeneratedVariations] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("create");
  const navigate = useNavigate();

  const handlePostGenerated = (variations: any) => {
    setGeneratedVariations(variations);
    setActiveTab("preview");
  };

  useEffect(() => {
    if (activeTab === "saved") {
      navigate('/posts');
    }
  }, [activeTab, navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Transforme suas ideias em posts profissionais para Instagram
          </p>
        </div>

        <StatsOverview />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="create">Criar Post</TabsTrigger>
            <TabsTrigger value="preview">Visualizar</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="saved">Salvos</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <PostCreator onPostGenerated={handlePostGenerated} />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {generatedVariations ? (
              <PostPreview variations={generatedVariations} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Gere um post primeiro para visualizar
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleCalendar />
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {/* Redirects to /posts via useEffect */}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
