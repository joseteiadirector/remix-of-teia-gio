import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidget } from './DashboardWidget';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WidgetAlertsCardProps {
  onRemove?: () => void;
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-blue-500', variant: 'secondary' as const },
  medium: { label: 'Média', color: 'bg-yellow-500', variant: 'default' as const },
  high: { label: 'Alta', color: 'bg-orange-500', variant: 'default' as const },
  critical: { label: 'Crítica', color: 'bg-destructive', variant: 'destructive' as const },
};

function WidgetAlertsCardComponent({ onRemove }: WidgetAlertsCardProps) {
  const { user } = useAuth();

  const { data: alerts, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['widget-alerts', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('alerts_history')
        .select('id, title, created_at, priority')
        .eq('user_id', user!.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 segundos - alertas precisam ser mais atualizados
  });

  return (
    <DashboardWidget
      id="alerts-widget"
      title="Alertas Recentes"
      lastUpdated={dataUpdatedAt}
      icon={<Bell className="w-5 h-5 text-primary" />}
      onRemove={onRemove}
    >
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : alerts && alerts.length > 0 ? (
        <ScrollArea className="h-48">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge 
                    variant={priorityConfig[alert.priority as keyof typeof priorityConfig]?.variant || 'default'}
                    className="shrink-0"
                  >
                    {priorityConfig[alert.priority as keyof typeof priorityConfig]?.label || alert.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum alerta não lido</p>
        </div>
      )}
    </DashboardWidget>
  );
}

export const WidgetAlertsCard = memo(WidgetAlertsCardComponent);
