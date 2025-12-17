import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Target, Shield } from "lucide-react";

interface Brand {
  id: string;
  name: string;
}

interface IGOMetrics {
  ice: number;
  gap: number;
  cpi: number;
  cognitive_stability: number;
}

interface BrandMetrics {
  brand: Brand;
  metrics: IGOMetrics | null;
}

interface IGOBrandsComparisonProps {
  brandsMetrics: BrandMetrics[];
  isLoading?: boolean;
}

export default function IGOBrandsComparison({ brandsMetrics, isLoading }: IGOBrandsComparisonProps) {
  const getMetricColor = (value: number, type: 'ice' | 'gap' | 'cpi' | 'stability') => {
    if (type === 'ice') {
      if (value >= 80) return "text-green-600";
      if (value >= 60) return "text-yellow-600";
      return "text-red-600";
    }
    if (type === 'gap') {
      if (value >= 75) return "text-green-600";
      if (value >= 50) return "text-yellow-600";
      return "text-red-600";
    }
    if (type === 'cpi') {
      if (value >= 85) return "text-green-600";
      if (value >= 70) return "text-yellow-600";
      return "text-red-600";
    }
    // stability
    if (value >= 95) return "text-green-600";
    if (value >= 90) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricBadge = (value: number, type: 'ice' | 'gap' | 'cpi' | 'stability') => {
    if (type === 'ice') {
      if (value >= 80) return { label: "Excelente", variant: "default" as const };
      if (value >= 60) return { label: "Bom", variant: "secondary" as const };
      return { label: "Baixo", variant: "destructive" as const };
    }
    if (type === 'gap') {
      if (value >= 75) return { label: "Excelente", variant: "default" as const };
      if (value >= 50) return { label: "Bom", variant: "secondary" as const };
      return { label: "Baixo", variant: "destructive" as const };
    }
    if (type === 'cpi') {
      if (value >= 85) return { label: "Excelente", variant: "default" as const };
      if (value >= 70) return { label: "Bom", variant: "secondary" as const };
      return { label: "Baixo", variant: "destructive" as const };
    }
    if (value >= 95) return { label: "Excelente", variant: "default" as const };
    if (value >= 90) return { label: "Bom", variant: "secondary" as const };
    return { label: "Atenção", variant: "destructive" as const };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação entre Marcas</CardTitle>
          <CardDescription>Carregando métricas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Usar marcas já filtradas pelo BrandContext (is_visible = true)
  const filteredBrands = brandsMetrics.filter(item => item?.brand);

  if (filteredBrands.length === 0) {
    return null;
  }

  return (
    <Card id="igo-brands-comparison-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {filteredBrands.length === 1 ? 'Métricas IGO da Marca' : 'Comparação IGO entre Marcas'}
        </CardTitle>
        <CardDescription>
          {filteredBrands.length === 1 
            ? 'Análise das métricas de inteligência cognitiva'
            : 'Análise comparativa das métricas de inteligência cognitiva'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-6 ${filteredBrands.length === 1 ? 'md:grid-cols-1 max-w-md' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredBrands.map(({ brand, metrics }) => (
            <Card key={brand.id} className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{brand.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics ? (
                  <>
                    {/* ICE */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">ICE</span>
                        </div>
                        <Badge variant={getMetricBadge(metrics.ice, 'ice').variant}>
                          {getMetricBadge(metrics.ice, 'ice').label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={metrics.ice} className="flex-1" />
                        <span className={`text-lg font-bold ${getMetricColor(metrics.ice, 'ice')}`}>
                          {metrics.ice}
                        </span>
                      </div>
                    </div>

                    {/* GAP */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">GAP</span>
                        </div>
                        <Badge variant={getMetricBadge(metrics.gap, 'gap').variant}>
                          {getMetricBadge(metrics.gap, 'gap').label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={metrics.gap} className="flex-1" />
                        <span className={`text-lg font-bold ${getMetricColor(metrics.gap, 'gap')}`}>
                          {metrics.gap}
                        </span>
                      </div>
                    </div>

                    {/* CPI */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">CPI</span>
                        </div>
                        <Badge variant={getMetricBadge(metrics.cpi, 'cpi').variant}>
                          {getMetricBadge(metrics.cpi, 'cpi').label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={metrics.cpi} className="flex-1" />
                        <span className={`text-lg font-bold ${getMetricColor(metrics.cpi, 'cpi')}`}>
                          {metrics.cpi}
                        </span>
                      </div>
                    </div>

                    {/* Estabilidade */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Estabilidade</span>
                        </div>
                        <Badge variant={getMetricBadge(metrics.cognitive_stability, 'stability').variant}>
                          {getMetricBadge(metrics.cognitive_stability, 'stability').label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={metrics.cognitive_stability} className="flex-1" />
                        <span className={`text-lg font-bold ${getMetricColor(metrics.cognitive_stability, 'stability')}`}>
                          {metrics.cognitive_stability}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Dados insuficientes
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
