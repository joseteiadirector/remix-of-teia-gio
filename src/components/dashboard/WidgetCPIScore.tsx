import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { igoMetricsCache } from "@/utils/rateLimitHandler";
import { logger } from "@/utils/logger";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface WidgetCPIScoreProps {
  brandId: string;
}

export function WidgetCPIScore({ brandId }: WidgetCPIScoreProps) {
  const [cpiData, setCpiData] = useState<{current: number; trend: string; history: Array<{date: string; cpi: number}>}>({
    current: 0,
    trend: "stable",
    history: []
  });
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const loadCPIData = useCallback(async () => {
    // Evitar chamadas duplicadas
    if (loadingRef.current) {
      logger.debug('CPI: Ignorando chamada duplicada');
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `cpi-${brandId}`;
    const cached = igoMetricsCache.get(cacheKey);
    if (cached) {
      logger.debug('CPI: Usando dados do cache');
      setCpiData(cached);
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    
    try {
      // BUSCAR CPI DIRETAMENTE DO BANCO (fonte oficial - geo_scores)
      const { data: latestScore, error: scoreError } = await supabase
        .from("geo_scores")
        .select("cpi, computed_at")
        .eq("brand_id", brandId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scoreError) throw scoreError;

      // Buscar histórico dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historyData, error: historyError } = await supabase
        .from("geo_scores")
        .select("cpi, computed_at")
        .eq("brand_id", brandId)
        .gte("computed_at", thirtyDaysAgo.toISOString())
        .order("computed_at", { ascending: true });

      let current = latestScore?.cpi || 0;
      let history: Array<{date: string; cpi: number}> = [];
      let trend = "stable";

      if (!historyError && historyData && historyData.length > 0) {
        // Agrupar por dia para evitar muitos pontos
        const dailyData = new Map<string, number>();
        historyData.forEach(d => {
          const day = new Date(d.computed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (d.cpi && d.cpi > 0) {
            dailyData.set(day, d.cpi);
          }
        });

        history = Array.from(dailyData.entries()).map(([date, cpi]) => ({ date, cpi }));

        // Calcular tendência
        if (history.length >= 2) {
          const previous = history[history.length - 2].cpi;
          if (current > previous + 2) trend = "up";
          else if (current < previous - 2) trend = "down";
        }
      }

      // Se não houver CPI no geo_scores, buscar do igo_metrics_history
      if (!current || current === 0) {
        const { data: igoHistory } = await supabase
          .from("igo_metrics_history")
          .select("cpi, calculated_at")
          .eq("brand_id", brandId)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (igoHistory?.cpi) {
          current = igoHistory.cpi;
        }
      }

      const result = { current, trend, history };
      setCpiData(result);
      
      // Armazenar em cache por 30 segundos
      igoMetricsCache.set(cacheKey, result, 30000);
      
      logger.info('CPI data loaded', { brandId, current, historyCount: history.length });
    } catch (error: any) {
      logger.error("Error loading CPI", { error });
      
      // Fallback: calcular das menções
      await calculateCPIFromMentions();
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      // Debounce de 300ms para evitar chamadas rápidas ao trocar de marca
      const timeoutId = setTimeout(() => {
        loadCPIData();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [brandId, loadCPIData]);

  const calculateCPIFromMentions = async () => {
    try {
      // Calculate CPI from mentions consistency
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: mentions, error } = await supabase
        .from("mentions_llm")
        .select("provider, confidence, collected_at")
        .eq("brand_id", brandId)
        .gte("collected_at", thirtyDaysAgo.toISOString())
        .order("collected_at");

      if (error) throw error;

      if (mentions && mentions.length > 0) {
        // Group by provider and calculate variance
        const providerScores = new Map<string, number[]>();
        
        mentions.forEach(m => {
          if (!providerScores.has(m.provider)) {
            providerScores.set(m.provider, []);
          }
          // ✅ CORREÇÃO: Normalizar confidence corretamente (verificar se já está em escala 0-100)
          const normalizedConf = Number(m.confidence) > 1 ? Number(m.confidence) : Number(m.confidence) * 100;
          providerScores.get(m.provider)!.push(normalizedConf);
        });

        // Calculate CPI: lower variance = higher predictability
        let totalVariance = 0;
        let providerCount = 0;

        providerScores.forEach((scores) => {
          if (scores.length > 1) {
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
            totalVariance += variance;
            providerCount++;
          }
        });

        if (providerCount > 0) {
          const avgVariance = totalVariance / providerCount;
          // ✅ CORREÇÃO: CPI usando desvio padrão × 2 (mesma fórmula de calculate-geo-metrics)
          const avgStdDev = Math.sqrt(avgVariance);
          const cpi = Math.max(0, Math.min(100, 100 - (avgStdDev * 2)));
          
          setCpiData({
            current: Math.round(cpi),
            trend: "stable",
            history: []
          });
        }
      }
    } catch (error) {
      logger.error("Error calculating CPI", { error });
    }
  };

  const getTrendIcon = () => {
    if (cpiData.trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (cpiData.trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (cpiData.trend === "up") return "text-green-500";
    if (cpiData.trend === "down") return "text-red-500";
    return "text-muted-foreground";
  };

  const getCPILevel = (score: number) => {
    if (score >= 80) return { label: "Excelente", variant: "default" as const, desc: "Alta previsibilidade" };
    if (score >= 60) return { label: "Bom", variant: "secondary" as const, desc: "Boa consistência" };
    if (score >= 40) return { label: "Moderado", variant: "outline" as const, desc: "Variação moderada" };
    return { label: "Baixo", variant: "destructive" as const, desc: "Alta volatilidade" };
  };

  const level = getCPILevel(cpiData.current);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">CPI Score</CardTitle>
          </div>
          {getTrendIcon()}
        </div>
        <CardDescription className="text-xs">
          Cognitive Predictive Index — Consistência Inter-IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <div className={`text-4xl font-bold ${getTrendColor()}`}>
                {cpiData.current}
              </div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={level.variant}>{level.label}</Badge>
              <span className="text-xs text-muted-foreground">{level.desc}</span>
            </div>

            {cpiData.history.length > 0 && (
              <div className="pt-4">
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={cpiData.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      stroke="hsl(var(--border))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpi" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="CPI Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground">
              <p className="font-semibold mb-1">O que é CPI?</p>
              <p>
                Métrica proprietária que mede o quanto as IAs são <strong>consistentes e previsíveis</strong> ao mencionar sua marca. 
                Valores altos indicam respostas mais uniformes entre diferentes LLMs.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
