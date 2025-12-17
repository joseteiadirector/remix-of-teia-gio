import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { useIntelligentPrefetch } from "@/hooks/useIntelligentPrefetch";

import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Brands = lazy(() => import("./pages/Brands"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Scores = lazy(() => import("./pages/Scores"));
const SeoScores = lazy(() => import("./pages/SeoScores"));
const SeoMetrics = lazy(() => import("./pages/SeoMetrics"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportsGeo = lazy(() => import("./pages/ReportsGeo"));
const ReportsSeo = lazy(() => import("./pages/ReportsSeo"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Insights = lazy(() => import("./pages/Insights"));
const LLMMentions = lazy(() => import("./pages/LLMMentions"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BrandComparison = lazy(() => import("./pages/BrandComparison"));
const Subscription = lazy(() => import("./pages/Subscription"));
const UrlAnalysis = lazy(() => import("./pages/UrlAnalysis"));
const Documentation = lazy(() => import("./pages/Documentation"));
const GoogleSetup = lazy(() => import("./pages/GoogleSetup"));
const GeoMetrics = lazy(() => import("./pages/GeoMetrics"));
const Automation = lazy(() => import("./pages/Automation"));
const CronJobs = lazy(() => import("./pages/CronJobs"));
const KPIs = lazy(() => import("./pages/KPIs"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const ConnectionsTest = lazy(() => import("./pages/ConnectionsTest"));
const NucleusCommandCenter = lazy(() => import("./pages/NucleusCommandCenter"));
const IGODashboard = lazy(() => import("./pages/IGODashboard"));
const IGOObservability = lazy(() => import("./pages/IGOObservability"));
const AlgorithmicGovernance = lazy(() => import("./pages/AlgorithmicGovernance"));
const ScientificReports = lazy(() => import("./pages/ScientificReports"));
const Profile = lazy(() => import("./pages/Profile"));
const Status = lazy(() => import("./pages/Status"));

// Admin pages
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - dados considerados "frescos"
      gcTime: 10 * 60 * 1000, // 10 minutes - cache em memória
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// Loading fallback component
function LoadingFallback() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHelp(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  const handleReload = () => window.location.reload();

  const handleClearCacheAndReload = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignorar e recarregar mesmo assim
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Carregando...</p>

        {showHelp && (
          <div className="pt-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Se ficar preso aqui, normalmente é cache do navegador/Service Worker após uma atualização.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={handleReload} variant="secondary">
                Recarregar
              </Button>
              <Button onClick={handleClearCacheAndReload}>
                Limpar cache e recarregar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProtectedContent() {
  // Track navegação para prefetch inteligente
  useIntelligentPrefetch();
  
  return (
    <BrandProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-border/40 flex items-center px-4 bg-background/95 backdrop-blur sticky top-0 z-10">
              <SidebarTrigger />
            </header>
            <main className="flex-1">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="brands" element={<Brands />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="scores" element={<Scores />} />
                  <Route path="seo-scores" element={<SeoScores />} />
                  <Route path="seo-metrics" element={<SeoMetrics />} />
                  <Route path="geo-metrics" element={<GeoMetrics />} />
                  <Route path="comparison" element={<BrandComparison />} />
                  <Route path="url-analysis" element={<UrlAnalysis />} />
                  <Route path="insights" element={<Insights />} />
                  <Route path="llm-mentions" element={<LLMMentions />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="reports/geo" element={<ReportsGeo />} />
                  <Route path="reports/seo" element={<ReportsSeo />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="automation" element={<Automation />} />
                  <Route path="cron-jobs" element={<CronJobs />} />
                  <Route path="nucleus" element={<NucleusCommandCenter />} />
                  <Route path="igo-dashboard" element={<IGODashboard />} />
                  <Route path="igo-observability" element={<IGOObservability />} />
                  <Route path="algorithmic-governance" element={<AlgorithmicGovernance />} />
                  <Route path="scientific-reports" element={<ScientificReports />} />
                  <Route path="subscription" element={<Subscription />} />
                  <Route path="google-setup" element={<GoogleSetup />} />
                  <Route path="kpis" element={<KPIs />} />
                  <Route path="system-health" element={<SystemHealth />} />
                  <Route path="connections-test" element={<ConnectionsTest />} />
                  <Route path="profile" element={<Profile />} />
                  
                  <Route path="404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BrandProvider>
  );
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AuthProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes - Landing page com login integrado */}
                  <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
                  <Route path="/auth" element={<PublicRoute><Index /></PublicRoute>} />
                  <Route path="/status" element={<Status />} />
                  <Route path="/documentation" element={<Documentation />} />
                  
                  {/* Admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="brands" element={<AdminBrands />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  
                  {/* Protected routes with sidebar */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <ProtectedContent />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
