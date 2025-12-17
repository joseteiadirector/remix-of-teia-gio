import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, Brain, Target, Award, Sparkles, BarChart3, Zap, FileDown } from "lucide-react";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { exportGEOReport } from "@/utils/pdf";
import { useAudit } from "@/hooks/useAudit";
import { AuditButton } from "@/components/audit/AuditButton";
import { AuditBadge } from "@/components/audit/AuditBadge";
import { ConsistencyIndicator } from "@/components/ConsistencyIndicator";
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { logger } from "@/utils/logger";

const GeoMetrics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBrandId, setSelectedBrandId, brands } = useBrand();
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Sistema de auditoria centralizado
  const { executeAudit, isAuditing, lastAuditResult } = useAudit({ autoGeneratePDF: true });

  // Buscar GEO score mais recente
  const { data: geoScores, refetch: refetchGeoScores } = useQuery({
    queryKey: ['geo-scores-latest', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data, error } = await supabase
        .from('geo_scores')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedBrandId
  });

  // Buscar histórico GEO (últimos 30 dias)
  const { data: geoHistory } = useQuery({
    queryKey: ['geo-history', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const { data, error } = await supabase
        .from('geo_scores')
        .select('id, brand_id, score, breakdown, computed_at')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBrandId
  });

  // Buscar SEO score VÁLIDO (> 0) para calcular GAP
  const { data: seoMetrics } = useQuery({
    queryKey: ['seo-metrics-latest', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      const { data, error } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .gt('seo_score', 0)  // ✅ Filtrar apenas scores válidos
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedBrandId
  });

  const handleCalculateMetrics = async () => {
    if (!selectedBrandId || !user?.id) return;

    setIsCalculating(true);
    try {
      // 1. Calcular métricas GEO
      const { data: geoData, error: geoError } = await supabase.functions.invoke('calculate-geo-metrics', {
        body: { brandId: selectedBrandId, userId: user.id }
      });

      if (geoError) throw geoError;

      // 2. Calcular SEO Score após cálculo GEO
      const { error: seoError } = await supabase.functions.invoke('calculate-seo-score', {
        body: { brandId: selectedBrandId }
      });

      if (seoError) {
        logger.error('Erro ao calcular SEO Score', { seoError, brandId: selectedBrandId });
        // Não falhar todo o processo se apenas o SEO Score falhar
      }

      toast.success('Métricas GEO e SEO calculadas com sucesso!');
      refetchGeoScores();
    } catch (error) {
      logger.error('Erro ao calcular métricas GEO', { error, brandId: selectedBrandId });
      toast.error('Erro ao calcular métricas GEO');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAuditReports = async () => {
    const brandName = brands?.find(b => b.id === selectedBrandId)?.name;
    if (selectedBrandId) {
      await executeAudit(selectedBrandId, brandName);
    }
  };

  const breakdown = geoScores?.breakdown as any;
  const geoScore = geoScores?.score || 0;
  
  // Buscar SEO score PRÉ-CALCULADO VÁLIDO (> 0) da tabela de métricas diárias
  const { data: latestSeoMetrics } = useQuery({
    queryKey: ['latest-seo-metrics', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;
      
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('seo_score')
        .eq('brand_id', selectedBrandId)
        .gt('seo_score', 0)  // ✅ Filtrar apenas scores válidos
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return seoData;
    },
    enabled: !!selectedBrandId
  });

  // SEO Score vem PRÉ-CALCULADO pela edge function calculate-seo-score
  const seoScore = latestSeoMetrics?.seo_score || 0;
  
  // FÓRMULA GAP PADRONIZADA: Diferença absoluta entre GEO e SEO
  // GAP = |GEO Score - SEO Score|
  // Quanto maior o GAP, maior a divergência entre otimização para IA vs busca tradicional
  const gapScore = Math.round(Math.abs(geoScore - seoScore));

  const selectedBrand = brands?.find(b => b.id === selectedBrandId);

  // Formatar dados para gráfico de evolução (com validação 0-100)
  const chartData = geoHistory
    ?.filter(item => item.score >= 0 && item.score <= 100) // Filtrar scores válidos
    ?.map(item => ({
      date: new Date(item.computed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: Number(item.score)
    })) || [];

  // Formatar dados para gráfico radar
  const radarData = breakdown ? [
    { pilar: "Base Técnica", valor: breakdown.base_tecnica || 0 },
    { pilar: "Estrutura Semântica", valor: breakdown.estrutura_semantica || 0 },
    { pilar: "Relevância Conversacional", valor: breakdown.relevancia_conversacional || 0 },
    { pilar: "Autoridade Cognitiva", valor: breakdown.autoridade_cognitiva || 0 },
    { pilar: "Inteligência Estratégica", valor: breakdown.inteligencia_estrategica || 0 },
  ] : [];

  // Componente customizado para labels do radar (quebra em 2 linhas)
  const CustomRadarTick = ({ payload, x, y, textAnchor, cx }: any) => {
    const words = payload.value.split(' ');
    const midPoint = Math.ceil(words.length / 2);
    const line1 = words.slice(0, midPoint).join(' ');
    const line2 = words.slice(midPoint).join(' ');
    
    // Calcular se está no topo, bottom, left ou right
    const isTop = y < cx;
    const offsetY = isTop ? -25 : 10;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={offsetY}
          textAnchor={textAnchor}
          fill="#6b7280"
          fontSize={11}
          fontWeight={500}
        >
          <tspan x={0} dy={0}>{line1}</tspan>
          <tspan x={0} dy={12}>{line2}</tspan>
        </text>
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Actions */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Métricas GEO
                </h1>
                <DataSourceBadge type="real" />
              </div>
              <p className="text-muted-foreground mt-2">
                Visualize as pontuações de otimização para motores generativos
              </p>
              {/* Indicador de Consistência Matemática */}
              <ConsistencyIndicator 
                brandId={selectedBrandId || undefined}
                brandName={brands?.find(b => b.id === selectedBrandId)?.name}
                autoValidate={false}
                showDetails={true}
              />
            </div>
          </div>

          {/* Brand Selector - Positioned prominently */}
          {brands && brands.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-xs">
                <Select value={selectedBrandId || undefined} onValueChange={setSelectedBrandId}>
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    if (!selectedBrandId || !geoScores) {
                      toast.error("Selecione uma marca e aguarde o carregamento dos dados");
                      return;
                    }
                    
                    if (isExportingPdf) return;
                    setIsExportingPdf(true);
                    
                    try {
                      const brand = brands.find(b => b.id === selectedBrandId);
                      if (!brand) {
                        toast.error("Marca não encontrada");
                        return;
                      }

                      // Preparar dados no formato do sistema unificado
                      const breakdown = geoScores.breakdown as any;
                      const geoData = {
                        brandName: brand.name,
                        brandDomain: brand.domain,
                        geoScore: geoScores.score || 0,
                        pillars: [
                          { name: 'Base Técnica', value: breakdown?.base_tecnica || 0 },
                          { name: 'Estrutura Semântica', value: breakdown?.estrutura_semantica || 0 },
                          { name: 'Relevância Conversacional', value: breakdown?.relevancia_conversacional || 0 },
                          { name: 'Autoridade Cognitiva', value: breakdown?.autoridade_cognitiva || 0 },
                          { name: 'Inteligência Estratégica', value: breakdown?.inteligencia_estrategica || 0 },
                        ],
                        mentions: [],
                        period: geoScores.computed_at 
                          ? new Date(geoScores.computed_at).toLocaleDateString('pt-BR')
                          : new Date().toLocaleDateString('pt-BR'),
                      };

                      await exportGEOReport(geoData);
                      toast.success("✅ Relatório GEO exportado com sucesso!");
                      
                    } catch (error) {
                      logger.error('Erro ao exportar PDF GEO', { error });
                      toast.error("Erro ao gerar PDF");
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  variant="outline"
                  disabled={isExportingPdf}
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </>
                  )}
                </Button>

                {/* Audit Button */}
                <AuditButton 
                  onClick={handleAuditReports}
                  isAuditing={isAuditing}
                  disabled={!geoScores}
                />
                
                <Button
                  onClick={handleCalculateMetrics}
                  disabled={isCalculating}
                  size="default"
                  className="relative"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Atualizar Dados
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

          {/* Brand Info */}
          {selectedBrandId && brands && geoScores && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">{brands.find(b => b.id === selectedBrandId)?.name}</div>
                  <div className="text-sm text-muted-foreground">{brands.find(b => b.id === selectedBrandId)?.domain}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {geoScores.computed_at 
                    ? `Última atualização: ${new Date(geoScores.computed_at).toLocaleString('pt-BR')}` 
                    : 'Nenhum dado coletado ainda'}
                </div>
              </div>
            </Card>
          )}

          {/* Verificar se há marcas */}
          {!brands || brands.length === 0 ? (
          <Card className="p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Você precisa cadastrar ao menos uma marca antes de analisar métricas GEO
            </p>
            <Button 
              onClick={() => window.location.href = '/brands'}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Cadastrar Marca
            </Button>
          </Card>
        ) : (
          <>
            {/* Main Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* GEO Score */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">GEO Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-5xl font-bold text-purple-600">{geoScore}</h2>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <Progress value={geoScore} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">Presença em respostas de IA</p>
          </Card>

          {/* SEO Score */}
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SEO Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-5xl font-bold text-blue-600">{seoScore}</h2>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
            <Progress value={seoScore} className="h-2 mb-2" />
            {seoScore === 0 && (
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <p className="text-yellow-600 font-medium text-xs mb-2">⚠️ Sem dados do GSC</p>
                <p className="text-muted-foreground text-xs mb-3">Configure Google Search Console para calcular SEO Score</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => navigate('/google-setup')}
                >
                  Configurar GSC
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Otimização tradicional</p>
          </Card>

          {/* GAP GEO/SEO */}
          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gap GEO/SEO</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-5xl font-bold text-orange-600">{gapScore}</h2>
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                GEO: <span className="font-semibold">{geoScore}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                SEO: <span className="font-semibold">{seoScore}</span>
              </p>
            </div>
            {seoScore === 0 ? (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <p className="text-yellow-600 font-medium text-xs mb-1">⚠️ GAP não calculável</p>
                <p className="text-muted-foreground text-xs mb-3">Configure o GSC para calcular a diferença entre GEO e SEO</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => navigate('/google-setup')}
                >
                  Configurar GSC
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-3">
                {geoScore > seoScore ? '✅ GEO está melhor' : '⚠️ SEO está melhor'}
              </p>
            )}
          </Card>
        </div>

        {breakdown && (
          <>
            {/* Gráfico Radar dos 5 Pilares */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Análise dos 5 Pilares GEO
              </h3>
              <div id="geo-radar-chart">
                <ResponsiveContainer width="100%" height={450}>
                <RadarChart data={radarData} margin={{ top: 60, right: 100, bottom: 40, left: 100 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="pilar" 
                    tick={<CustomRadarTick cx={225} />}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Score" 
                    dataKey="valor" 
                    stroke="#9b87f5" 
                    fill="#9b87f5" 
                    fillOpacity={0.5}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              </div>
            </Card>

            {/* Breakdown dos 5 Pilares GEO */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-blue-600">{breakdown.base_tecnica || 0}</h3>
                <p className="text-sm text-muted-foreground mt-1">Base Técnica</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-green-600">{breakdown.estrutura_semantica || 0}</h3>
                <p className="text-sm text-muted-foreground mt-1">Estrutura Semântica</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-purple-600">{breakdown.relevancia_conversacional || 0}</h3>
                <p className="text-sm text-muted-foreground mt-1">Relevância Conversacional</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-3xl font-bold text-orange-600">{breakdown.autoridade_cognitiva || 0}</h3>
                <p className="text-sm text-muted-foreground mt-1">Autoridade Cognitiva</p>
              </Card>

              <Card className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-3xl font-bold text-pink-600">{breakdown.inteligencia_estrategica || 0}</h3>
                <p className="text-sm text-muted-foreground mt-1">Inteligência Estratégica</p>
              </Card>
            </div>

            {/* Gráfico de Evolução */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Evolução do Score GEO
              </h3>
              <div id="geo-evolution-chart">
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#9b87f5" 
                    strokeWidth={2}
                    dot={{ fill: '#9b87f5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {!geoScores && (
          <Card className="p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma métrica GEO calculada ainda</h3>
            <p className="text-muted-foreground mb-6">
              Clique em "Calcular Métricas" para analisar a presença da sua marca em IAs
            </p>
            <Button 
              onClick={handleCalculateMetrics}
              disabled={isCalculating}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isCalculating ? 'Calculando...' : 'Calcular Agora'}
            </Button>
          </Card>
        )}
        </>
      )}
    </div>
  </div>
);
};

export default GeoMetrics;
