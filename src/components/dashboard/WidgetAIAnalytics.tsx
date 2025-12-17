import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardWidget } from "./DashboardWidget";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WidgetAIAnalyticsProps {
  onRemove?: () => void;
}

const WidgetAIAnalytics = ({ onRemove }: WidgetAIAnalyticsProps) => {
  const { user } = useAuth();

  const { data: aiAnalytics, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['ai-analytics', user?.id],
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

      const { data, error } = await supabase.functions.invoke('ai-analytics', {
        body: { brandId: brands[0].id }
      });

      if (error) throw error;
      return data.analytics;
    },
    enabled: !!user?.id,
    refetchInterval: 300000, // 5 minutos
  });

  if (isLoading) {
    return (
      <DashboardWidget 
        id="ai-analytics-1" 
        title="Insights com IA" 
        icon={<Brain className="w-5 h-5 text-purple-600" />} 
        onRemove={onRemove}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Analisando dados com IA...</p>
          </div>
        </div>
      </DashboardWidget>
    );
  }

  if (!aiAnalytics) {
    return (
      <DashboardWidget 
        id="ai-analytics-1" 
        title="Insights com IA" 
        lastUpdated={dataUpdatedAt}
        icon={<Brain className="w-5 h-5 text-purple-600" />} 
        onRemove={onRemove}
      >
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Brain className="h-16 w-16 mb-3 opacity-50" />
          <p className="text-sm">Dados insuficientes para análise</p>
          <p className="text-xs mt-1">Colete mais métricas primeiro</p>
        </div>
      </DashboardWidget>
    );
  }

  const getTrendIcon = (direction: string) => {
    if (direction === 'crescente') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (direction === 'decrescente') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 rounded-full bg-yellow-600" />;
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'crescente') return 'text-green-600 bg-green-100 border-green-200';
    if (direction === 'decrescente') return 'text-red-600 bg-red-100 border-red-200';
    return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  };

  return (
    <DashboardWidget 
      id="ai-analytics-1" 
      title="Analytics com IA" 
      lastUpdated={dataUpdatedAt}
      icon={<Sparkles className="w-5 h-5 text-purple-600" />} 
      onRemove={onRemove}
    >
      <div className="space-y-4">
        {/* Diagnóstico */}
        {aiAnalytics.insights?.diagnosis && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">Diagnóstico IA</p>
                <p className="text-sm text-purple-800">{aiAnalytics.insights.diagnosis}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Ação Urgente */}
        {aiAnalytics.insights?.urgentAction && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">⚡ Ação Urgente</p>
                <p className="text-sm text-red-800">{aiAnalytics.insights.urgentAction}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Previsão */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Previsão (7 dias)</span>
            </div>
            <Badge variant="outline" className="bg-white">
              {Math.round(aiAnalytics.forecast.confidence * 100)}% confiança
            </Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">
              {aiAnalytics.forecast.geoScore.toFixed(1)}
            </span>
            <span className="text-sm text-blue-700">GEO Score previsto</span>
          </div>
          <Progress 
            value={aiAnalytics.forecast.geoScore} 
            className="h-2 mt-2" 
          />
        </Card>

        {/* Tendências */}
        <div className="grid grid-cols-3 gap-2">
          <Card className={`p-3 ${getTrendColor(aiAnalytics.trends.geo.direction)} border`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">GEO</span>
              {getTrendIcon(aiAnalytics.trends.geo.direction)}
            </div>
            <div className="text-lg font-bold">
              {aiAnalytics.trends.geo.change >= 0 ? '+' : ''}
              {aiAnalytics.trends.geo.change.toFixed(1)}%
            </div>
          </Card>

          <Card className="p-3 bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-green-900">Menções</span>
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-900">
              {aiAnalytics.trends.mentions.totalMentions}
            </div>
            <div className="text-xs text-green-700">
              {aiAnalytics.trends.mentions.avgConfidence.toFixed(0)}% confiança
            </div>
          </Card>

          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-900">SEO</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-900">
              #{aiAnalytics.trends.seo.avgPosition.toFixed(1)}
            </div>
            <div className="text-xs text-blue-700">
              {aiAnalytics.trends.seo.avgCtr.toFixed(2)}% CTR
            </div>
          </Card>
        </div>

        {/* Insights Principais */}
        {aiAnalytics.insights?.keyInsights && aiAnalytics.insights.keyInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              Insights Principais
            </p>
            {aiAnalytics.insights.keyInsights.map((insight: string, idx: number) => (
              <div key={idx} className="text-sm text-muted-foreground pl-6 py-1 border-l-2 border-yellow-200">
                {insight}
              </div>
            ))}
          </div>
        )}

        {/* Recomendações */}
        {aiAnalytics.insights?.recommendations && aiAnalytics.insights.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              Recomendações
            </p>
            {aiAnalytics.insights.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="text-sm text-muted-foreground pl-6 py-1 border-l-2 border-green-200">
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default WidgetAIAnalytics;
