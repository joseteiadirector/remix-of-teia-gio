import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle2,
  ArrowRight,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'success' | 'info';
  title: string;
  description: string;
  action?: string;
  actionPath?: string;
}

export function DashboardAlertsBanner() {
  const { user } = useAuth();
  const { selectedBrandId } = useBrand();
  const navigate = useNavigate();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['dashboard-alerts-banner', selectedBrandId, user?.id],
    queryFn: async () => {
      if (!user || !selectedBrandId) return [];

      const alertsList: Alert[] = [];

      // Fetch recent alerts
      const { data: dbAlerts } = await supabase
        .from('alerts_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (dbAlerts) {
        dbAlerts.forEach((alert) => {
          alertsList.push({
            id: alert.id,
            type: alert.priority === 'critical' ? 'critical' : alert.priority === 'high' ? 'warning' : 'info',
            title: alert.title,
            description: alert.message,
            action: 'Ver detalhes',
            actionPath: '/alerts'
          });
        });
      }

      // Check for SEO performance issues
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('ctr, avg_position')
        .eq('brand_id', selectedBrandId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (seoData && seoData.ctr < 0.02) {
        alertsList.push({
          id: 'low-ctr',
          type: 'warning',
          title: 'CTR abaixo do esperado',
          description: `Taxa de cliques está em ${(seoData.ctr * 100).toFixed(2)}%. Recomendado: acima de 2%`,
          action: 'Ver recomendações',
          actionPath: '/insights-ia'
        });
      }

      if (alertsList.length === 0) {
        alertsList.push({
          id: 'all-good',
          type: 'success',
          title: 'Tudo em ordem',
          description: 'Não há alertas pendentes para sua marca',
        });
      }

      return alertsList.slice(0, 3);
    },
    enabled: !!user && !!selectedBrandId,
    staleTime: 60 * 1000,
  });

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          iconBg: 'bg-red-500/20',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          icon: <TrendingDown className="h-5 w-5 text-amber-400" />,
          iconBg: 'bg-amber-500/20',
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
          iconBg: 'bg-emerald-500/20',
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30',
          icon: <Bell className="h-5 w-5 text-blue-400" />,
          iconBg: 'bg-blue-500/20',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-48" />
      </div>
    );
  }

  return (
    <div 
      className="space-y-3"
      style={{
        animation: 'fade-in 0.5s ease-out forwards',
        animationDelay: '400ms',
        opacity: 0
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Atenção Necessária
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/alerts')}
        >
          Ver todos
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <div className="grid gap-3">
        {alerts.map((alert, index) => {
          const styles = getAlertStyles(alert.type);
          return (
            <div
              key={alert.id}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                "hover:shadow-md cursor-pointer",
                styles.bg
              )}
              onClick={() => alert.actionPath && navigate(alert.actionPath)}
              style={{
                animationDelay: `${500 + index * 100}ms`,
                animation: 'fade-in 0.4s ease-out forwards',
                opacity: 0
              }}
            >
              <div className={cn("p-2.5 rounded-lg", styles.iconBg)}>
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
              </div>
              {alert.action && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  {alert.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}