import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

export default function Privacy() {
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
                            <Shield className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
                    </div>

                    <div className="space-y-8 text-slate-600 dark:text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <Eye className="h-5 w-5 text-primary" /> 1. Data Collection
                            </h2>
                            <p>
                                At Studio Genius, we collect only the strictly necessary information to provide our services. This includes your name and email address when you create an account, and technical information provided by social media connections (Meta/Facebook/Instagram) that you explicitly authorize.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <Lock className="h-5 w-5 text-primary" /> 2. Use of Facebook & Instagram Data
                            </h2>
                            <p>
                                Our application uses the Facebook Graph API to allow you to manage your Instagram Business presence. We request permissions to list your pages and publish media on your behalf.
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2">
                                <li>We do NOT store your Facebook or Instagram passwords.</li>
                                <li>We use secure Access Tokens provided by Meta to perform authorized actions.</li>
                                <li>Tokens are encrypted and stored securely in our database.</li>
                                <li>We do not share your private social data with third parties.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <Trash2 className="h-5 w-5 text-primary" /> 3. Data Deletion & Revocation
                            </h2>
                            <p>
                                You have full control over your data.
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2">
                                <li><strong>Revoking Access:</strong> You can disconnect your Instagram account at any time via the "Instagram Integration" settings page.</li>
                                <li><strong>Data Deletion Request:</strong> To request full deletion of your account and all associated data, please contact us at <span className="text-primary font-medium">support@studiogenius.online</span>. We will process your request within 48 hours.</li>
                                <li><strong>Facebook App Removal:</strong> You can also remove our application permission directly in your Facebook settings under "Apps and Websites" or visit <span className="text-primary font-medium">https://studio.convertamais.online/privacy</span> for instructions.</li>
                            </ul>
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
