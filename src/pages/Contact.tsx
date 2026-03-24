
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
    const navigate = useNavigate();
    return (
        <div className="container py-12 max-w-4xl min-h-screen">
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>

            <h1 className="text-4xl font-bold mb-8 tracking-tight">Contact Us</h1>

            <Card className="p-8 md:p-12 shadow-2xl border-none bg-white dark:bg-slate-900">
                <div className="grid gap-12 md:grid-cols-2">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-3">Support Channels</h3>
                            <p className="text-muted-foreground">Choose the best way to reach us. Our team responds within 24 business hours.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Mail className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Support Email</p>
                                    <a href="mailto:support@studiogenius.online" className="text-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">support@studiogenius.online</a>
                                </div>
                            </div>

                            <a href="https://wa.me/5521996982886" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group cursor-pointer no-underline">
                                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-2xl group-hover:scale-110 transition-transform">
                                    <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">WhatsApp</p>
                                    <p className="text-lg font-semibold text-green-600">+55 21 99698-2886</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold">Send us a Message</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="John Doe" className="h-12 bg-slate-50 dark:bg-slate-800 border-none shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" placeholder="john@example.com" className="h-12 bg-slate-50 dark:bg-slate-800 border-none shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" placeholder="How can we help your brand today?" className="min-h-[150px] bg-slate-50 dark:bg-slate-800 border-none shadow-inner p-4" />
                            </div>
                            <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] transition-transform shadow-xl shadow-purple-500/20">
                                Send Message
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
