
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Wand2, BarChart3, Calendar, ShieldCheck, Zap, Sparkles, Type, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar */}
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex h-20 items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                        <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg border border-white/20 transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Studio Genius" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-2xl font-display font-black tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Studio Genius
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="hidden md:block text-sm font-medium hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                        >
                            Recursos
                        </button>
                        <Link to="/contact" className="hidden md:block text-sm font-medium hover:text-primary transition-colors">
                            Contato
                        </Link>
                        <Link to="/login">
                            <Button variant="ghost" className="font-semibold">Entrar</Button>
                        </Link>
                        <Link to="/demo">
                            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-purple-500/25 px-6 font-bold">
                                Ver Demo
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent -z-10" />
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-10 text-center">
                        <div className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400">
                            <Sparkles className="mr-2 h-4 w-4" /> O Cérebro de Marketing do seu Instagran
                        </div>

                        <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter max-w-5xl leading-[1.1]">
                            Escale sua Marca com a <br />
                            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent italic px-2">
                                Perfeição da IA
                            </span>
                        </h1>

                        <p className="max-w-[800px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                            Pare de perder horas com design e copies genéricas. O Studio Genius cria posts focados em conversão, legendas otimizadas para SEO e entrega métricas reais de economia de tempo.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center pt-4">
                            <Link to="/login">
                                <Button size="lg" className="h-14 px-10 text-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 transition-all shadow-xl shadow-purple-500/30 font-bold w-full sm:w-auto">
                                    Comece Grátis <ArrowRight className="ml-2 h-6 w-6" />
                                </Button>
                            </Link>
                            <Link to="/demo">
                                <Button size="lg" variant="outline" className="h-14 px-10 text-xl border-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all w-full sm:w-auto font-bold">
                                    Simular Sistema
                                </Button>
                            </Link>
                        </div>

                        {/* Visual Asset */}
                        <div className="relative mt-16 w-full max-w-5xl aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900 group">
                            <img
                                src="/hero-mockup.png"
                                alt="Studio Genius System"
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-white max-w-sm">
                                    <div className="flex gap-2 items-center mb-4">
                                        <div className="h-3 w-3 rounded-full bg-red-500" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                        <div className="h-3 w-3 rounded-full bg-green-500" />
                                    </div>
                                    <h4 className="font-bold text-xl mb-2">Geração com IA</h4>
                                    <p className="text-sm opacity-80">Criando um post com seu Brand Kit e inserindo legendas com SEO orgânico em 3 segundos...</p>
                                    <div className="mt-6 h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-3/4 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section className="py-32 bg-slate-950 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -z-10" />
                <div className="container px-4 md:px-6" id="features">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-display font-black italic">Tudo que você precisa para dominar</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Feito para criadores, por criadores. Nossa IA garante que sua marca seja única e de alta conversão.</p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-4">
                        <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2">
                            <div className="p-4 rounded-2xl bg-purple-500/20 text-purple-400 mb-6 inline-block">
                                <Wand2 className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">IA Consultiva</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Não apenas agende. A nossa IA entende seu tom, público alvo e gera copy com foco em vendas.</p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2">
                            <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400 mb-6 inline-block">
                                <Type className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Brand Kit Nativo</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Salve suas cores hexadecimais, fontes (tipologias) e logotipo. A IA aplicará automaticamente suas regras visuais.</p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2">
                            <div className="p-4 rounded-2xl bg-pink-500/20 text-pink-400 mb-6 inline-block">
                                <Calendar className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Calendário e Grid</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Visualize como ficará seu feed do Instagram e aproveite alertas de conteúdo sazonal para o seu nicho.</p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2">
                            <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6 inline-block">
                                <BarChart3 className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Métricas de ROI</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Acompanhe no dashboard quantas horas a ferramenta economizou para você em produção criativa de conteúdo.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Transformation */}
            <section className="py-24 bg-white dark:bg-slate-950">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight">
                                Transforme seu alcance de <br />
                                <span className="text-slate-400 line-through">Zero</span> para <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">300% de Crescimento</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                                Nossos usuários relatam economias massivas de tempo produzindo posts com IA. Otimizamos métricas de SEO orgânico e análise preditiva de performance para seu Instagram decolar.
                            </p>
                            <div className="grid gap-4 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="font-medium">Análise de IA de subnichos do mercado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="font-medium">Estratégia de Hashtags para Busca Orgânica</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="font-medium">Identidade Visual contínua com Brand Kit</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative p-1 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl shadow-2xl shadow-purple-500/20">
                            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Engagement Rate</span>
                                            <span className="text-green-500 font-bold">4.8%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: '80%' }} />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Industry Avg: 1.2%</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Weekly Reach</span>
                                            <span className="text-green-500 font-bold">12.4k</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: '95%' }} />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Industry Avg: 1.5k</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Sales Conversion</span>
                                            <span className="text-green-500 font-bold">2.1%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '70%' }} />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Industry Avg: 0.5%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24">
                <div className="container px-4 md:px-6">
                    <div className="relative rounded-[40px] bg-slate-950 p-12 overflow-hidden text-center text-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 -z-10" />
                        <div className="max-w-3xl mx-auto space-y-8">
                            <h2 className="text-4xl md:text-5xl font-display font-black italic tracking-tight leading-tight">
                                Ready to join the <br /> 1% of creators?
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl">
                                Join 1,000+ businesses using Studio Genius to automate their growth. No credit card required.
                            </p>
                            <Link to="/login">
                                <Button size="lg" className="h-16 px-12 text-2xl font-black bg-white text-slate-950 hover:bg-slate-100 transition-all rounded-2xl w-full sm:w-auto">
                                    Start My Free Trial
                                </Button>
                            </Link>
                            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Secure Auth</span>
                                <span className="flex items-center gap-1"><Zap className="h-4 w-4" /> Instant Setup</span>
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Meta Partner</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-20 bg-slate-50 dark:bg-slate-950">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-12 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 font-bold text-xl">
                                <img src="/logo.png" alt="Studio Genius" className="h-8 w-8 object-cover rounded-lg" />
                                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Studio Genius</span>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                The ultimate AI-powered content engine for professional social marketing. Elevate your brand today.
                            </p>
                        </div>
                        <div className="flex flex-col md:items-end gap-6 text-sm text-muted-foreground">
                            <div className="flex gap-8 font-semibold">
                                <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                                <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
                            </div>
                            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 w-full md:w-auto text-center md:text-right">
                                © {new Date().getFullYear()} Studio Genius. Professional AI Content Platform.
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
