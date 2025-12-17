import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import { 
  TrendingUp,
  ArrowRight,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTrendMini() {
  const { selectedBrandId } = useBrand();
  const navigate = useNavigate();

  const { data: trendData, isLoading } = useQuery({
    queryKey: ['dashboard-trend-mini', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId || selectedBrandId === 'all') return null;

      // Fetch last 7 days of scores
      const { data: scores } = await supabase
        .from('geo_scores')
        .select('score, computed_at')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: false })
        .limit(7);

      if (!scores || scores.length === 0) return null;

      const values = scores.reverse().map(s => Number(s.score));
      const latest = values[values.length - 1];
      const previous = values[0];
      const change = latest - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      // Calculate simple trend line points for mini chart
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min || 1;
      const normalized = values.map(v => ((v - min) / range) * 100);

      return {
        values: normalized,
        latest,
        change,
        changePercent,
        isPositive: change >= 0,
      };
    },
    enabled: !!selectedBrandId && selectedBrandId !== 'all',
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
      style={{
        animation: 'fade-in 0.6s ease-out forwards',
        animationDelay: '600ms',
        opacity: 0
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Activity className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tendência 7 dias</h3>
            <p className="text-xs text-muted-foreground">GEO Score</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/scores')}
          className="text-xs gap-1 hover:bg-primary/10 hover:text-primary"
        >
          Detalhes
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {trendData ? (
        <div className="space-y-4">
          {/* Mini Chart */}
          <div className="h-16 flex items-end gap-1">
            {trendData.values.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 rounded-t transition-all duration-300",
                  trendData.isPositive ? "bg-emerald-500/60" : "bg-red-500/60",
                  index === trendData.values.length - 1 && "bg-primary"
                )}
                style={{ height: `${Math.max(value, 10)}%` }}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <p className="text-2xl font-display font-bold">{trendData.latest.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Score atual</p>
            </div>
            <div className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
              trendData.isPositive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-red-500/10 text-red-400"
            )}>
              <TrendingUp className={cn("h-4 w-4", !trendData.isPositive && "rotate-180")} />
              {trendData.isPositive ? '+' : ''}{trendData.changePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
          Dados insuficientes
        </div>
      )}
    </div>
  );
}