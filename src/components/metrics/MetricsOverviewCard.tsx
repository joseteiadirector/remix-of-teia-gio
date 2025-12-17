import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricInterpretationBadge } from "./MetricInterpretationBadge";
import { TrendingUp, AlertTriangle, Target, Activity } from "lucide-react";

interface MetricsOverviewCardProps {
  brandName?: string;
  ice?: number;
  gap?: number;
  cpi?: number;
  stability?: number;
  className?: string;
}

export function MetricsOverviewCard({
  brandName,
  ice,
  gap,
  cpi,
  stability,
  className = ""
}: MetricsOverviewCardProps) {
  const hasMetrics = ice !== undefined || gap !== undefined || cpi !== undefined || stability !== undefined;

  if (!hasMetrics) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Visão Geral das Métricas KAPI
          {brandName && (
            <span className="text-primary/80 font-normal">- {brandName}</span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Indicadores de performance da sua presença digital em LLMs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ICE */}
        {ice !== undefined && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm">ICE</span>
              </div>
              <MetricInterpretationBadge metricType="ice" value={ice} />
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{ice.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <Progress value={ice} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Convergência Estratégica (GEO ↔️ SEO)
              </p>
            </div>
          </div>
        )}

        {/* GAP */}
        {gap !== undefined && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-sm">GAP</span>
              </div>
              <MetricInterpretationBadge metricType="gap" value={gap} />
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{gap.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">pontos</span>
              </div>
              <Progress value={Math.max(0, 100 - gap)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Prioridade de Ação (quanto menor, melhor)
              </p>
            </div>
          </div>
        )}

        {/* CPI */}
        {cpi !== undefined && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-sm">CPI</span>
              </div>
              <MetricInterpretationBadge metricType="cpi" value={cpi} />
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{cpi.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <Progress value={cpi} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Previsibilidade Cognitiva dos LLMs
              </p>
            </div>
          </div>
        )}

        {/* Estabilidade */}
        {stability !== undefined && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-sm">Estabilidade</span>
              </div>
              <MetricInterpretationBadge metricType="stability" value={stability} />
            </div>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{stability.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <Progress value={stability} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Consistência Temporal das Menções
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
