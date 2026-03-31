import { lazy, Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hash, Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const HashtagExplorer = lazy(() => import("./HashtagExplorer"));
const Benchmarking = lazy(() => import("./Benchmarking"));

const TabFallback = () => (
  <div className="space-y-6 p-4">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-40 w-full rounded-3xl" />
    <Skeleton className="h-40 w-full rounded-3xl" />
  </div>
);

export default function Research() {
  const [activeTab, setActiveTab] = useState("hashtags");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter uppercase flex items-center gap-3">
          <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Pesquisa</span>
          <span className="text-foreground/20">& Tendências</span>
        </h1>
        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">
          Hashtags inteligentes e análise competitiva em um só lugar
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md h-12 rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="hashtags" className="flex-1 rounded-xl gap-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Hash className="h-4 w-4" />
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="benchmarking" className="flex-1 rounded-xl gap-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Trophy className="h-4 w-4" />
            Benchmarking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hashtags" className="mt-6">
          <Suspense fallback={<TabFallback />}>
            <HashtagExplorer />
          </Suspense>
        </TabsContent>

        <TabsContent value="benchmarking" className="mt-6">
          <Suspense fallback={<TabFallback />}>
            <Benchmarking />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
