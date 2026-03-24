import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import type { Session } from "@supabase/supabase-js";

// Lazy load pages
const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const InstagramIntegration = lazy(() => import("./pages/InstagramIntegration"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ThemeSuggestions = lazy(() => import("./pages/ThemeSuggestions"));
const ImageLibrary = lazy(() => import("./pages/ImageLibrary"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Engagement = lazy(() => import("./pages/Engagement"));
const LeadHunter = lazy(() => import("./pages/LeadHunter"));
const HashtagExplorer = lazy(() => import("./pages/HashtagExplorer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contact = lazy(() => import("./pages/Contact"));
const Demo = lazy(() => import("./pages/Demo"));
const PublicApproval = lazy(() => import("./pages/PublicApproval"));
import Benchmarking from "./pages/Benchmarking";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    console.log("SYNC_CHECK: Lovable is running the latest code from GitHub (Build: 2026-03-23-2218)");
  }, []);

  return (
    <ErrorBoundary>
      <div id="sync-check-marker" style={{ display: 'none' }}>SYNC_20260323_2218</div>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            }>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/approve/:id" element={<PublicApproval />} />
                <Route path="/login" element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                    <Auth />
                  </div>
                } />

                {/* Protected Routes Wrapper */}
                <Route element={<ProtectedRoute><DashboardLayout><Outlet /></DashboardLayout></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/posts" element={<SavedPosts />} />
                  <Route path="/instagram" element={<InstagramIntegration />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/themes" element={<ThemeSuggestions />} />
                  <Route path="/images" element={<ImageLibrary />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/engagement" element={<Engagement />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/leads" element={<LeadHunter />} />
                  <Route path="/hashtags" element={<HashtagExplorer />} />
                  <Route path="/benchmarking" element={<Benchmarking />} />
                </Route>

                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/demo" element={<Demo />} />

                {/* Catch all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
