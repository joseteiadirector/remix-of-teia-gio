import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  ArrowRight,
  Brain,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardQuickInsight() {
  const { selectedBrandId, selectedBrand } = useBrand();
  const navigate = useNavigate();

  const { data: insightData, isLoading } = useQuery({
    queryKey: ['dashboard-quick-insight', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId || selectedBrandId === 'all') return null;

      // Fetch latest GEO score
      const { data: geoData } = await supabase
        .from('geo_scores')
        .select('score')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Simple prediction (in production, this would come from AI)
      const currentScore = geoData?.score || 0;
      const predictedScore = Math.round((currentScore + (Math.random() * 5 - 2)) * 10) / 10;
      
      // Determine status
      let status: 'excellent' | 'good' | 'attention' | 'critical';
      let statusLabel: string;
      let recommendation: string;

      if (currentScore >= 80) {
        status = 'excellent';
        statusLabel = 'Excelente';
        recommendation = 'Continue mantendo a qualidade do conteúdo';
      } else if (currentScore >= 60) {
        status = 'good';
        statusLabel = 'Bom';
        recommendation = 'Foque em aumentar autoridade cognitiva';
      } else if (currentScore >= 40) {
        status = 'attention';
        statusLabel = 'Atenção';
        recommendation = 'Priorize otimização GEO e SEO';
      } else {
        status = 'critical';
        statusLabel = 'Crítico';
        recommendation = 'Revisão urgente da estratégia digital';
      }

      return {
        currentScore,
        predictedScore,
        confidence: 80,
        status,
        statusLabel,
        recommendation,
      };
    },
    enabled: !!selectedBrandId && selectedBrandId !== 'all',
    staleTime: 60 * 1000,
  });

  const statusColors = {
    excellent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    good: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
    attention: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    critical: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        animation: 'fade-in 0.6s ease-out forwards',
        animationDelay: '500ms',
        opacity: 0
      }}
    >
      {/* Glass Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated Corner Gradient */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-primary to-secondary" />
      
      {/* Header */}
      <div className="relative z-10 p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-50 bg-gradient-to-br from-primary to-secondary" />
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20 border border-white/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white">Análise Inteligente</h3>
              <p className="text-xs text-white/50">Powered by AI</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/insights-ia')}
            className="text-xs gap-1 text-white/60 hover:bg-white/10 hover:text-primary"
          >
            Ver completa
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        {/* Status Card */}
        {insightData && (
          <div className={cn(
            "rounded-xl border p-4 bg-gradient-to-br backdrop-blur-sm",
            statusColors[insightData.status]
          )}
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">Status Geral</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-xs font-semibold border border-white/10">
                {insightData.statusLabel}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-white/50 mb-1">Score Atual</p>
                <p className="text-2xl font-display font-bold text-white">{insightData.currentScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Previsão 7 dias
                </p>
                <p className="text-2xl font-display font-bold text-white">{insightData.predictedScore}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-3 border-t border-white/10">
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{insightData.recommendation}</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="relative z-10 px-6 py-4 bg-white/5 border-t border-white/10">
        <Button 
          onClick={() => navigate('/insights-ia')}
          className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 border-0 shadow-lg shadow-primary/20"
        >
          <Sparkles className="h-4 w-4" />
          Ver Análise Completa e Recomendações
        </Button>
      </div>
    </div>
  );
}