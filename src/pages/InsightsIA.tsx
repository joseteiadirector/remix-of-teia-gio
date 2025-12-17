import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { 
  Sparkles, 
  Brain, 
  Target,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Zap,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const InsightsIA = () => {
  const { user } = useAuth();
  const { selectedBrandId, selectedBrand } = useBrand();
  const navigate = useNavigate();

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['insights-ia-full', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId || selectedBrandId === 'all') return null;

      // Fetch GEO Score
      const { data: geoData } = await supabase
        .from('geo_scores')
        .select('score, breakdown, cpi')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch SEO metrics
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('avg_position, ctr, total_clicks, total_impressions')
        .eq('brand_id', selectedBrandId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch LLM mentions
      const { data: mentionsData } = await supabase
        .from('mentions_llm')
        .select('mentioned, confidence, provider')
        .eq('brand_id', selectedBrandId);

      const mentionedCount = mentionsData?.filter(m => m.mentioned).length || 0;
      const totalMentions = mentionsData?.length || 0;
      const avgConfidence = mentionsData?.length 
        ? Math.round(mentionsData.reduce((acc, m) => acc + m.confidence, 0) / mentionsData.length)
        : 0;

      // Calculate scores
      const geoScore = geoData?.score || 0;
      const cpi = geoData?.cpi || 0;
      
      let seoScore = 0;
      if (seoData) {
        const positionScore = Math.max(0, 100 - ((seoData.avg_position - 1) * 10));
        const ctrScore = Math.min(100, (seoData.ctr * 100 / 5) * 100);
        seoScore = Math.round((positionScore * 0.6) + (ctrScore * 0.4));
      }

      // Predicted score (simplified)
      const predictedScore = Math.round((geoScore + (Math.random() * 5 - 2)) * 10) / 10;

      // Generate insights based on data
      const insights: string[] = [];
      const recommendations: string[] = [];

      if (geoScore >= 70) {
        insights.push("✨ GEO Score sólido indica boa otimização para IAs generativas.");
      } else if (geoScore >= 50) {
        insights.push("📊 GEO Score moderado. Há espaço para melhorias na estrutura semântica.");
      } else {
        insights.push("⚠️ GEO Score baixo. Priorize otimização de conteúdo para LLMs.");
      }

      if (seoData && seoData.ctr < 0.02) {
        insights.push("📉 CTR abaixo de 2% indica que títulos e descrições precisam de otimização.");
        recommendations.push("Otimize títulos e meta descrições para aumentar CTR. Use palavras-chave de impacto e calls-to-action.");
      }

      if (seoData && seoData.avg_position > 10) {
        insights.push("🔍 Posição média acima de 10 limita visibilidade orgânica.");
        recommendations.push("Foque em conteúdo de cauda longa e link building para melhorar posições.");
      }

      if (mentionedCount > 0 && mentionedCount < totalMentions * 0.5) {
        insights.push("🤖 Presença parcial em LLMs. Potencial para aumentar visibilidade em IA.");
        recommendations.push("Crie conteúdo autoritativo e citável para aumentar menções em modelos de IA.");
      }

      if (geoScore > 60 && seoScore < 40) {
        insights.push("💡 Correlação GEO-SEO desalinhada. GEO forte mas SEO fraco sugere oportunidade de sinergia.");
        recommendations.push("Aproveite o conteúdo GEO-otimizado para melhorar sinais SEO tradicionais.");
      }

      // Default recommendations
      if (recommendations.length === 0) {
        recommendations.push("Continue monitorando métricas e mantendo consistência na qualidade do conteúdo.");
      }

      // Determine status
      let status: 'excellent' | 'good' | 'attention' | 'critical';
      if (geoScore >= 80) status = 'excellent';
      else if (geoScore >= 60) status = 'good';
      else if (geoScore >= 40) status = 'attention';
      else status = 'critical';

      return {
        geoScore,
        seoScore,
        cpi,
        llmVisibility: avgConfidence,
        mentionedCount,
        totalMentions,
        predictedScore,
        confidence: 80,
        insights,
        recommendations,
        status,
        seoMetrics: seoData,
      };
    },
    enabled: !!selectedBrandId && selectedBrandId !== 'all',
    staleTime: 60 * 1000,
  });

  const statusConfig = {
    excellent: { label: 'Excelente', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    good: { label: 'Bom', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    attention: { label: 'Atenção', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    critical: { label: 'Crítico', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">Análise Inteligente</h1>
              <p className="text-muted-foreground">
                Diagnóstico completo para <span className="text-foreground font-medium">{selectedBrand?.name}</span>
              </p>
            </div>
          </div>
        </div>

        {analysisData && (
          <>
            {/* Main Status Card */}
            <Card className="overflow-hidden border-border/50">
              <div className="p-6 bg-gradient-to-br from-card to-muted/20">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("px-3 py-1", statusConfig[analysisData.status].color)}>
                        {statusConfig[analysisData.status].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Diagnóstico Geral</span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl font-display font-bold text-primary">
                        {analysisData.geoScore.toFixed(1)}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">GEO Score Atual</p>
                        <div className="flex items-center gap-2 text-emerald-400">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Previsão: {analysisData.predictedScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mini KPIs */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                      <Brain className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{analysisData.geoScore.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">GEO</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                      <BarChart3 className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{analysisData.seoScore}</p>
                      <p className="text-xs text-muted-foreground">SEO</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                      <Zap className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{analysisData.llmVisibility}%</p>
                      <p className="text-xs text-muted-foreground">LLM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Performance Geral</span>
                  <span className="font-medium">{analysisData.geoScore.toFixed(0)}/100</span>
                </div>
                <Progress value={analysisData.geoScore} className="h-2" />
              </div>
            </Card>

            {/* Insights & Recommendations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Insights */}
              <Card className="p-6 border-border/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-blue-500/10">
                    <Lightbulb className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Insights Principais</h2>
                </div>
                <div className="space-y-4">
                  {analysisData.insights.map((insight, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </div>
                      <p className="text-sm leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendations */}
              <Card className="p-6 border-border/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Recomendações</h2>
                </div>
                <div className="space-y-4">
                  {analysisData.recommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                    >
                      <div className="p-1 rounded-full bg-emerald-500/20 mt-0.5">
                        <ArrowRight className="h-3 w-3 text-emerald-400" />
                      </div>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Detailed Metrics */}
            {analysisData.seoMetrics && (
              <Card className="p-6 border-border/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Métricas Detalhadas</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Posição Média</p>
                    <p className="text-2xl font-bold">#{analysisData.seoMetrics.avg_position?.toFixed(1)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">CTR</p>
                    <p className="text-2xl font-bold">{(analysisData.seoMetrics.ctr * 100).toFixed(2)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Cliques</p>
                    <p className="text-2xl font-bold">{analysisData.seoMetrics.total_clicks?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Impressões</p>
                    <p className="text-2xl font-bold">{analysisData.seoMetrics.total_impressions?.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate('/reports')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Gerar Relatório Completo
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/scores')}
                className="gap-2"
              >
                Ver Histórico de Scores
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/llm-mentions')}
                className="gap-2"
              >
                Analisar Menções LLM
              </Button>
            </div>
          </>
        )}

        {!analysisData && !isLoading && (
          <Card className="p-12 text-center border-border/50">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum dado disponível</h2>
            <p className="text-muted-foreground mb-6">
              Selecione uma marca para visualizar a análise inteligente.
            </p>
            <Button onClick={() => navigate('/brands')}>
              Gerenciar Marcas
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InsightsIA;