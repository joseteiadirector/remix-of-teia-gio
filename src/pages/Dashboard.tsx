import { Activity, Database, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardConfig } from "@/hooks/useDashboardConfig";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

const Dashboard = () => {
  const navigate = useNavigate();
  const { widgets, loading, toggleWidget, resetToDefault } = useDashboardConfig();

  // Convert Widget[] to Record<string, boolean> for child components
  const widgetStates = widgets.reduce((acc, widget) => {
    acc[widget.type] = widget.enabled;
    return acc;
  }, {} as Record<string, boolean>);

  const widgetNames = {
    aiAnalytics: 'Analytics com IA',
    unified: 'Score Unificado',
    weekly: 'Variação Semanal',
    score: 'Score Médio',
    mentions: 'Menções por Marca',
    alerts: 'Alertas Recentes',
    brands: 'Suas Marcas',
    trends: 'Evolução de Scores',
  };

  const quickActions = [
    {
      title: "Testar APIs",
      description: "Verificar conexão com OpenAI, Google, Perplexity, etc.",
      icon: Zap,
      onClick: () => navigate("/api-test"),
      color: "bg-blue-500",
    },
    {
      title: "Gerenciar Marcas",
      description: "Adicionar e gerenciar marcas monitoradas",
      icon: Database,
      onClick: () => navigate("/brands"),
      color: "bg-green-500",
    },
    {
      title: "Sincronizar Analytics",
      description: "Executar sincronização de GA4 e Search Console",
      icon: Activity,
      onClick: () => navigate("/analytics"),
      color: "bg-purple-500",
    },
    {
      title: "Ver GEO Scores",
      description: "Visualizar pontuações e métricas GEO",
      icon: TrendingUp,
      onClick: () => navigate("/scores"),
      color: "bg-orange-500",
    },
    {
      title: "Ver SEO Scores",
      description: "Visualizar pontuações e métricas SEO",
      icon: Activity,
      onClick: () => navigate("/seo-scores"),
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <DashboardHeader
          widgets={widgetStates}
          widgetNames={widgetNames}
          onToggleWidget={(widgetId) => toggleWidget(`${widgetId}-1`)}
          onReset={resetToDefault}
        />

        <DashboardQuickActions actions={quickActions} />

        {/* Widgets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6" role="status" aria-label="Carregando widgets">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i} 
                className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-20 bg-muted rounded-lg" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DashboardWidgets widgets={widgetStates} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
