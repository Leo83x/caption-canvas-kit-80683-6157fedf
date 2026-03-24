import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ShieldCheck, Scale, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

export default function Terms() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display">
            <div className="container py-12 max-w-4xl">
                <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                </Button>

                <Card className="p-8 md:p-12 shadow-xl border-none bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Scale className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Terms of Service</h1>
                    </div>

                    <div className="space-y-8 text-slate-600 dark:text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <Globe className="h-5 w-5 text-primary" /> 1. Acceptance of Terms
                            </h2>
                            <p>
                                By accessing or using Studio Genius ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our Service. Studio Genius reserves the right to update these terms at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-primary" /> 2. Description of Service
                            </h2>
                            <p>
                                Studio Genius provides AI-powered tools for Instagram content creation and scheduling. This includes caption generation, image creation through third-party APIs (like Gemini and Pollinations), and automated publishing via the Facebook Graph API.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <ShieldCheck className="h-5 w-5 text-primary" /> 3. User Responsibility
                            </h2>
                            <p>
                                You are solely responsible for the content you generate and publish through our platform. You agree NOT to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2">
                                <li>Use the Service for any illegal purposes or violation of Instagram's Community Guidelines.</li>
                                <li>Generate spam, hate speech, or defamatory content.</li>
                                <li>Attempt to reverse engineer or scrape data from the platform.</li>
                                <li>Share your account credentials with third parties.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <FileText className="h-5 w-5 text-primary" /> 4. Payments and Subscriptions
                            </h2>
                            <p>
                                Some features of Studio Genius require a paid subscription. All payments are non-refundable unless otherwise specified. You may cancel your subscription at any time through your dashboard settings.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-slate-200 dark:border-slate-800 text-sm italic">
                            <p>Last updated: February 08, 2026</p>
                            <p>© 2026 Studio Genius. All rights reserved.</p>
                        </section>
                    </div>
                </Card>
            </div>
        </div>
    );
}
