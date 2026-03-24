
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Wand2, Calendar, Layout, BarChart, Instagram, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Demo() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-display">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">System Demo</h1>
                        <p className="text-muted-foreground">Experience the power of Studio Genius (Simulation Mode)</p>
                    </div>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold" onClick={() => navigate("/login")}>
                        Start Free Trial
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left Column - Creation */}
                    <Card className="p-6 space-y-6 md:col-span-2 shadow-xl border-none bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold">AI Post Generator</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-sm font-medium mb-2">Prompt:</p>
                                <div className="text-sm text-slate-600 dark:text-slate-400 italic">
                                    "Create a professional post about a new high-end coffee shop opening in Rio de Janeiro, highlighting aesthetic design and premium beans."
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 pt-4">
                                <div className="space-y-4">
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative group">
                                        <img
                                            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
                                            alt="Coffee Shop"
                                            className="object-cover w-full h-full"
                                        />
                                        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                                            <p className="text-white text-center font-bold text-lg drop-shadow-md">Elegance in every drop.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1"><Wand2 className="h-3 w-3 mr-2" /> Redesign</Button>
                                        <Button variant="outline" size="sm" className="flex-1">Add Text Overlay</Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl h-full border border-slate-200 dark:border-slate-700">
                                        <p className="text-sm font-bold mb-2">AI Generated Caption:</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                            ☕✨ Discover the true essence of coffee at Rio's newest sanctuary.
                                            From hand-picked beans to our artisanal architecture, every detail
                                            is crafted for your inspiration. 🏙️🌿
                                            <br /><br />
                                            Come breathe in the aroma of perfection. Now open in Leblon.
                                            <br /><br />
                                            #RioCoffee #LeblonLife #PremiumRoast #StudioGenius
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-purple-600 font-bold">
                                            <BarChart className="h-3 w-3" /> Predicted Engagement: High (94%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Right Column - Workflow */}
                    <div className="space-y-8">
                        <Card className="p-6 shadow-xl border-none bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold">Smart Calendar</h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { time: "Mon, 10:00 AM", title: "Opening Promo", status: "Scheduled" },
                                    { time: "Wed, 03:30 PM", title: "Menu Showcase", status: "Draft" },
                                    { time: "Fri, 06:00 PM", title: "Weekend Vibes", status: "Scheduled" },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
                                        <div>
                                            <p className="font-bold">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.time}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${item.status === 'Scheduled' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6 shadow-xl border-none bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                            <h2 className="text-lg font-bold mb-2">Automate Your Growth</h2>
                            <p className="text-sm text-purple-100 mb-6">Connect your page and let Studio Genius handle the rest.</p>
                            <Button className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold">
                                Connect Instagram
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
