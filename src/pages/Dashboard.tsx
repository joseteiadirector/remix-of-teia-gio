import { Activity, Brain, FileText, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardPremiumHeader } from "@/components/dashboard/DashboardPremiumHeader";
import { DashboardKPIHero } from "@/components/dashboard/DashboardKPIHero";
import { DashboardAlertsBanner } from "@/components/dashboard/DashboardAlertsBanner";
import { DashboardQuickInsight } from "@/components/dashboard/DashboardQuickInsight";
import { DashboardTrendMini } from "@/components/dashboard/DashboardTrendMini";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    title: "IGO Dashboard",
    description: "Métricas de observabilidade",
    icon: Brain,
    path: "/igo-dashboard",
    color: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-400 bg-purple-500/20",
  },
  {
    title: "Menções LLM",
    description: "Presença em IAs",
    icon: Zap,
    path: "/llm-mentions",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400 bg-emerald-500/20",
  },
  {
    title: "Relatórios",
    description: "Análises detalhadas",
    icon: FileText,
    path: "/reports",
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400 bg-blue-500/20",
  },
  {
    title: "Análise de URL",
    description: "Diagnóstico de páginas",
    icon: Activity,
    path: "/url-analysis",
    color: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400 bg-amber-500/20",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Premium Header with Brand Selector */}
        <DashboardPremiumHeader />

        {/* KPI Hero Section */}
        <section>
          <DashboardKPIHero />
        </section>

        {/* Alerts Banner */}
        <section>
          <DashboardAlertsBanner />
        </section>

        {/* Quick Actions */}
        <section 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          style={{
            animation: 'fade-in 0.5s ease-out forwards',
            animationDelay: '700ms',
            opacity: 0
          }}
        >
          {quickActions.map((action, index) => (
            <Card
              key={action.path}
              onClick={() => navigate(action.path)}
              className={cn(
                "group cursor-pointer overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm",
                "hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
                "p-4 sm:p-5"
              )}
              style={{
                animationDelay: `${800 + index * 50}ms`,
                animation: 'fade-in 0.4s ease-out forwards',
                opacity: 0
              }}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", action.color)} />
              <div className="relative z-10 flex flex-col gap-3">
                <div className={cn("p-2.5 rounded-xl w-fit", action.iconColor)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Insights & Trends Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardQuickInsight />
          <DashboardTrendMini />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;