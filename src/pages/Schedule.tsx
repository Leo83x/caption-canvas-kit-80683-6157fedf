import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { InstagramGridPreview } from "@/components/InstagramGridPreview";

export default function Schedule() {
  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in">
      <div className="flex flex-col gap-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-black text-foreground/90 tracking-tighter italic-fix uppercase flex items-center gap-3">
          <span className="bg-gradient-to-r from-primary via-accent to-pink-500 bg-clip-text text-transparent">Agendamentos</span>
          <span className="text-foreground/20">de Elite</span>
        </h1>
        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] italic">Visualize e organize sua trajetória de autoridade no tempo</p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <ScheduleCalendar />
        </div>
        <div className="xl:col-span-1">
          <InstagramGridPreview />
        </div>
      </div>
    </div>
  );
}
