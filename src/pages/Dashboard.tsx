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
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-8">
        <DashboardHeader
          widgets={widgetStates}
          widgetNames={widgetNames}
          onToggleWidget={(widgetId) => toggleWidget(`${widgetId}-1`)}
          onReset={resetToDefault}
        />

        <DashboardQuickActions actions={quickActions} />

        {/* Widgets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" role="status" aria-label="Carregando widgets">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 animate-pulse rounded-lg border bg-card">
                <div className="h-32 bg-muted rounded" />
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
