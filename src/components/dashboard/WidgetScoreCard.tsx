import { memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidget } from './DashboardWidget';
import { TrendingUp, Target, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { logger } from '@/utils/logger';

interface WidgetScoreCardProps {
  onRemove?: () => void;
}

function WidgetScoreCardComponent({ onRemove }: WidgetScoreCardProps) {
  const { user } = useAuth();

  // Real-time sync para scores
  const handleBroadcast = useCallback((payload: any) => {
    logger.debug('Score broadcast recebido', { payload });
  }, []);

  const { isConnected } = useRealtimeSync({
    channelName: 'score-updates',
    presenceKey: user?.id,
    onBroadcast: handleBroadcast,
    enabled: !!user,
  });

  const { data: avgScore, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['widget-avg-score', user?.id],
    queryFn: async () => {
      const { data: brands } = await supabase
        .from('brands')
        .select('id')
        .eq('user_id', user!.id)
        .limit(50);

      if (!brands?.length) return null;

      const { data: scores } = await supabase
        .from('geo_scores')
        .select('score, brand_id, computed_at')
        .in('brand_id', brands.map(b => b.id))
        .order('computed_at', { ascending: false })
        .limit(brands.length);

      if (!scores?.length) return null;

      const avg = scores.reduce((acc, s) => acc + Number(s.score), 0) / scores.length;
      return Math.round(avg * 10) / 10;
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutos - cálculos agregados
  });

  return (
    <DashboardWidget
      id="score-widget"
      title="Score Médio"
      lastUpdated={dataUpdatedAt}
      icon={
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Target className="w-5 h-5 text-primary cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-semibold mb-1">Fonte: Análises GEO</p>
              <p className="text-xs text-muted-foreground">Calculado a partir da tabela geo_scores</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
      onRemove={onRemove}
    >
      {isLoading ? (
        <div className="h-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : avgScore !== null ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-primary">{avgScore}</span>
            <div className="flex items-center gap-1 text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+2.3%</span>
            </div>
          </div>
          <Progress value={avgScore} className="h-2" />
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">
              Score médio de todas as suas marcas
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Baseado nas últimas análises GEO de todas as marcas cadastradas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum score calculado ainda</p>
        </div>
      )}
    </DashboardWidget>
  );
}

export const WidgetScoreCard = memo(WidgetScoreCardComponent);
