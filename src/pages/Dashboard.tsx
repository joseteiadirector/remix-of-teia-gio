import { Activity, Brain, FileText, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardPremiumHeader } from "@/components/dashboard/DashboardPremiumHeader";
import { DashboardKPIHero } from "@/components/dashboard/DashboardKPIHero";
import { DashboardAlertsBanner } from "@/components/dashboard/DashboardAlertsBanner";
import { DashboardQuickInsight } from "@/components/dashboard/DashboardQuickInsight";
import { DashboardTrendMini } from "@/components/dashboard/DashboardTrendMini";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    title: "IGO Dashboard",
    description: "Métricas de observabilidade",
    icon: Brain,
    path: "/igo-dashboard",
    gradient: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    iconColor: "text-purple-400",
    glowColor: "group-hover:shadow-purple-500/30",
  },
  {
    title: "Menções LLM",
    description: "Presença em IAs",
    icon: Zap,
    path: "/llm-mentions",
    gradient: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconColor: "text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/30",
  },
  {
    title: "Relatórios",
    description: "Análises detalhadas",
    icon: FileText,
    path: "/reports",
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    iconColor: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/30",
  },
  {
    title: "Análise de URL",
    description: "Diagnóstico de páginas",
    icon: Activity,
    path: "/url-analysis",
    gradient: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    iconColor: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/30",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 -z-10" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 relative">
        {/* Premium Header with Brand Selector */}
        <DashboardPremiumHeader />

        {/* KPI Hero Section */}
        <section className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">Métricas Principais</h2>
          </div>
          <DashboardKPIHero />
        </section>

        {/* Alerts Banner */}
        <section>
          <DashboardAlertsBanner />
        </section>

        {/* Quick Actions - Premium Style */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 border border-secondary/20">
              <Activity className="h-5 w-5 text-secondary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">Ações Rápidas</h2>
          </div>
          <div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
            style={{
              animation: 'fade-in 0.5s ease-out forwards',
              animationDelay: '700ms',
              opacity: 0
            }}
          >
            {quickActions.map((action, index) => (
              <div
                key={action.path}
                onClick={() => navigate(action.path)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-border/50 bg-card/40 backdrop-blur-xl",
                  "hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
                  action.glowColor,
                  "p-5 sm:p-6"
                )}
                style={{
                  animationDelay: `${800 + index * 100}ms`,
                  animation: 'fade-in 0.5s ease-out forwards',
                  opacity: 0
                }}
              >
                {/* Background Effects */}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", action.bgGradient)} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Shimmer on Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col gap-4">
                  {/* Icon with Glow */}
                  <div className="relative w-fit">
                    <div className={cn("absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity", `bg-gradient-to-br ${action.gradient}`)} />
                    <div className={cn(
                      "relative p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg",
                      action.iconColor
                    )}>
                      <action.icon className="h-5 w-5" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  
                  {/* Arrow on Hover */}
                  <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                    <span className="text-xs font-semibold">Acessar</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
                
                {/* Bottom Gradient Line */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  `bg-gradient-to-r ${action.gradient}`
                )} />
              </div>
            ))}
          </div>
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