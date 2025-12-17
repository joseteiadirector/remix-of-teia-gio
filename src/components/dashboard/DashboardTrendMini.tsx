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
      className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        animation: 'fade-in 0.6s ease-out forwards',
        animationDelay: '600ms',
        opacity: 0
      }}
    >
      {/* Glass Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated Corner Gradient */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-blue-500 to-cyan-500" />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-lg opacity-50 bg-gradient-to-br from-blue-500 to-cyan-500" />
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-white/10">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Tendência 7 dias</h3>
            <p className="text-xs text-white/50">GEO Score</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/scores')}
          className="text-xs gap-1 text-white/60 hover:bg-white/10 hover:text-primary"
        >
          Detalhes
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {trendData ? (
        <div className="relative z-10 space-y-4">
          {/* Mini Chart with Premium Styling */}
          <div className="h-16 flex items-end gap-1 p-2 rounded-xl bg-white/5 border border-white/10">
            {trendData.values.map((value, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 rounded-t transition-all duration-300 relative",
                  index === trendData.values.length - 1 ? "bg-gradient-to-t from-primary to-primary/70" : 
                  trendData.isPositive ? "bg-gradient-to-t from-emerald-500/60 to-emerald-400/40" : "bg-gradient-to-t from-red-500/60 to-red-400/40"
                )}
                style={{ 
                  height: `${Math.max(value, 10)}%`,
                  boxShadow: index === trendData.values.length - 1 ? '0 0 10px rgba(139, 92, 246, 0.5)' : 'none'
                }}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <p className="text-2xl font-display font-bold text-white">{trendData.latest.toFixed(1)}</p>
              <p className="text-xs text-white/50">Score atual</p>
            </div>
            <div className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border border-white/10",
              trendData.isPositive 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-red-500/20 text-red-400"
            )}
            style={{
              boxShadow: trendData.isPositive ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(239, 68, 68, 0.2)'
            }}>
              <TrendingUp className={cn("h-4 w-4", !trendData.isPositive && "rotate-180")} />
              {trendData.isPositive ? '+' : ''}{trendData.changePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 h-24 flex items-center justify-center text-white/50 text-sm">
          Dados insuficientes
        </div>
      )}
    </div>
  );
}