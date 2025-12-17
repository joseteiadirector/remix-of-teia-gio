import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardWidget } from "./DashboardWidget";
import { Brain, TrendingUp, Zap, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WidgetUnifiedScoreProps {
  onRemove?: () => void;
}

interface UnifiedScoreData {
  unifiedScore: number;
  geoScore: number;
  seoScore: number;
  llmVisibility: number;
  recommendation: string;
  level: 'low' | 'medium' | 'high' | 'excellent';
}

const WidgetUnifiedScore = ({ onRemove }: WidgetUnifiedScoreProps) => {
  const { user } = useAuth();

  const { data: unifiedData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['unified-score', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Buscar brand principal
      const { data: brands } = await supabase
        .from('brands')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!brands || brands.length === 0) return null;
      const brandId = brands[0].id;

      // Buscar GEO Score mais recente
      const { data: geoData } = await supabase
        .from('geo_scores')
        .select('score')
        .eq('brand_id', brandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar SEO Metrics mais recentes
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('avg_position, ctr, conversion_rate')
        .eq('brand_id', brandId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar LLM Mentions
      const { data: mentionsData, count: totalMentions } = await supabase
        .from('mentions_llm')
        .select('mentioned, confidence', { count: 'exact' })
        .eq('brand_id', brandId)
        .eq('mentioned', true);

      const geoScore = geoData?.score || 0;

      // Calcular SEO Score padronizado
      let seoScore = 0;
      if (seoData) {
        const ctrNormalized = seoData.ctr * 100;
        const ctrScore = Math.min(100, (ctrNormalized / 5) * 100);
        const positionScore = Math.max(0, 100 - ((seoData.avg_position - 1) * 11.11));
        const conversionScore = Math.min(100, (seoData.conversion_rate / 5) * 100);
        seoScore = Math.round((positionScore * 0.4) + (ctrScore * 0.3) + (conversionScore * 0.3));
      }

      // Calcular visibilidade LLM
      const avgConfidence = mentionsData?.reduce((acc, m) => acc + m.confidence, 0) / (mentionsData?.length || 1) || 0;
      const llmVisibility = Math.round(avgConfidence);

      // Calcular Score Unificado
      // Peso: 50% GEO + 30% SEO + 20% LLM Visibility
      const unifiedScore = Math.round(
        (geoScore * 0.5) + 
        (seoScore * 0.3) + 
        (llmVisibility * 0.2)
      );

      // Determinar nível e recomendação
      let level: 'low' | 'medium' | 'high' | 'excellent';
      let recommendation: string;

      if (unifiedScore >= 80) {
        level = 'excellent';
        recommendation = 'Excelente! Continue otimizando conteúdo.';
      } else if (unifiedScore >= 60) {
        level = 'high';
        recommendation = 'Bom desempenho. Foque em aumentar autoridade.';
      } else if (unifiedScore >= 40) {
        level = 'medium';
        recommendation = 'Média. Priorize otimização GEO e SEO.';
      } else {
        level = 'low';
        recommendation = 'Baixa. Urgente: revisar estratégia digital.';
      }

      return {
        unifiedScore,
        geoScore,
        seoScore,
        llmVisibility,
        recommendation,
        level,
      } as UnifiedScoreData;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Atualizar a cada 60s
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100 border-green-200';
      case 'high': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getLevelBadgeVariant = (level: string): "default" | "secondary" | "outline" => {
    switch (level) {
      case 'excellent': return 'default';
      case 'high': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <DashboardWidget id="unified-1" title="Score Unificado" lastUpdated={dataUpdatedAt} icon={<Award className="w-5 h-5" />} onRemove={onRemove}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardWidget>
    );
  }

  if (!unifiedData) {
    return (
      <DashboardWidget id="unified-1" title="Score Unificado" lastUpdated={dataUpdatedAt} icon={<Award className="w-5 h-5" />} onRemove={onRemove}>
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Brain className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget id="unified-1" title="Score Unificado GEO+SEO+IA" lastUpdated={dataUpdatedAt} icon={<Award className="w-5 h-5 text-yellow-600" />} onRemove={onRemove}>
      <div className="space-y-6">
        {/* Score Principal */}
        <Card className={`p-6 ${getLevelColor(unifiedData.level)} border-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium opacity-80">Score da Plataforma</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-6xl font-bold">{unifiedData.unifiedScore}</h2>
                <span className="text-lg opacity-60">/100</span>
              </div>
            </div>
            <Award className="w-16 h-16 opacity-20" />
          </div>
          <Progress value={unifiedData.unifiedScore} className="h-3 mb-3" />
          <Badge variant={getLevelBadgeVariant(unifiedData.level)} className="mb-2">
            {unifiedData.level === 'excellent' ? 'Excelente' :
             unifiedData.level === 'high' ? 'Alto' :
             unifiedData.level === 'medium' ? 'Médio' : 'Baixo'}
          </Badge>
          <p className="text-sm font-medium">{unifiedData.recommendation}</p>
        </Card>

        {/* Breakdown dos Componentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-200">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">GEO Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-purple-600">{unifiedData.geoScore}</span>
              <span className="text-xs text-muted-foreground">50% do peso</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">SEO Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">{unifiedData.seoScore}</span>
              <span className="text-xs text-muted-foreground">30% do peso</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-200">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Visibilidade LLM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">{unifiedData.llmVisibility}</span>
              <span className="text-xs text-muted-foreground">20% do peso</span>
            </div>
          </div>
        </div>

        {/* Fórmula */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground font-mono">
            Score = (GEO × 0.5) + (SEO × 0.3) + (LLM × 0.2)
          </p>
        </div>
      </div>
    </DashboardWidget>
  );
};

export default WidgetUnifiedScore;
