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
        {/* Premium Header with Actions */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border-2 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Métricas GEO
                </h1>
                <DataSourceBadge type="real" />
              </div>
              <p className="text-slate-400 mt-2">
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
            
            {/* Actions */}
            {brands && brands.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Select value={selectedBrandId || undefined} onValueChange={setSelectedBrandId}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-600/50 hover:border-purple-500/50 transition-colors w-full">
                      <SelectValue placeholder="Selecione uma marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 z-50">
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  disabled={isExportingPdf}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all"
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
                  variant="outline"
                  className="border-slate-600/50 hover:border-purple-500/50 hover:bg-purple-500/10"
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
            )}
          </div>
        </div>

          {/* Brand Info - Premium */}
          {selectedBrandId && brands && geoScores && (
            <Card className="p-4 border-2 border-slate-700/50 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 shadow-[0_0_20px_rgba(100,116,139,0.1)] mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg text-white">{brands.find(b => b.id === selectedBrandId)?.name}</div>
                  <div className="text-sm text-slate-400">{brands.find(b => b.id === selectedBrandId)?.domain}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {geoScores.computed_at 
                    ? `Última atualização: ${new Date(geoScores.computed_at).toLocaleString('pt-BR')}` 
                    : 'Nenhum dado coletado ainda'}
                </div>
              </div>
            </Card>
          )}

          {/* Verificar se há marcas */}
          {!brands || brands.length === 0 ? (
          <Card className="p-12 text-center border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold mb-2 text-white">Nenhuma marca cadastrada</h3>
            <p className="text-slate-400 mb-6">
              Você precisa cadastrar ao menos uma marca antes de analisar métricas GEO
            </p>
            <Button 
              onClick={() => window.location.href = '/brands'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            >
              Cadastrar Marca
            </Button>
          </Card>
        ) : (
          <>
            {/* Main Scores - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* GEO Score */}
          <Card className="p-6 border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-slate-900/80 to-slate-950/80 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-400">GEO Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">{geoScore}</h2>
                  <span className="text-sm text-slate-500">/100</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <Progress value={geoScore} className="h-2 mb-2" />
            <p className="text-xs text-slate-500">Presença em respostas de IA</p>
          </Card>

          {/* SEO Score */}
          <Card className="p-6 border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-slate-900/80 to-slate-950/80 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-400">SEO Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-5xl font-bold text-blue-400">{seoScore}</h2>
                  <span className="text-sm text-slate-500">/100</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <Progress value={seoScore} className="h-2 mb-2" />
            {seoScore === 0 && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 font-medium text-xs mb-2">⚠️ Sem dados do GSC</p>
                <p className="text-slate-500 text-xs mb-3">Configure Google Search Console para calcular SEO Score</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={() => navigate('/google-setup')}
                >
                  Configurar GSC
                </Button>
              </div>
            )}
            <p className="text-xs text-slate-500">Otimização tradicional</p>
          </Card>

          {/* GAP GEO/SEO */}
          <Card className="p-6 border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-slate-900/80 to-slate-950/80 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-400">Gap GEO/SEO</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-5xl font-bold text-amber-400">{gapScore}</h2>
                  <span className="text-sm text-slate-500">pts</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-400">
                GEO: <span className="font-semibold text-purple-400">{geoScore}</span>
              </p>
              <p className="text-sm text-slate-400">
                SEO: <span className="font-semibold text-blue-400">{seoScore}</span>
              </p>
            </div>
            {seoScore === 0 ? (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 font-medium text-xs mb-1">⚠️ GAP não calculável</p>
                <p className="text-slate-500 text-xs mb-3">Configure o GSC para calcular a diferença entre GEO e SEO</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-7 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={() => navigate('/google-setup')}
                >
                  Configurar GSC
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3">
                {geoScore > seoScore ? '✅ GEO está melhor' : '⚠️ SEO está melhor'}
              </p>
            )}
          </Card>
        </div>

        {breakdown && (
          <>
            {/* Gráfico Radar dos 5 Pilares - Premium */}
            <Card className="p-6 mb-8 border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-600/20">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Análise dos 5 Pilares GEO</span>
              </h3>
              <div id="geo-radar-chart">
                <ResponsiveContainer width="100%" height={450}>
                <RadarChart data={radarData} margin={{ top: 60, right: 100, bottom: 40, left: 100 }}>
                  <PolarGrid stroke="rgba(148,163,184,0.2)" />
                  <PolarAngleAxis 
                    dataKey="pilar" 
                    tick={<CustomRadarTick cx={225} />}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Score" 
                    dataKey="valor" 
                    stroke="#a855f7" 
                    fill="#a855f7" 
                    fillOpacity={0.4}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              </div>
            </Card>

            {/* Breakdown dos 5 Pilares GEO - Premium */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="p-6 text-center border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-blue-400">{breakdown.base_tecnica || 0}</h3>
                <p className="text-sm text-slate-400 mt-1">Base Técnica</p>
              </Card>

              <Card className="p-6 text-center border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-emerald-400">{breakdown.estrutura_semantica || 0}</h3>
                <p className="text-sm text-slate-400 mt-1">Estrutura Semântica</p>
              </Card>

              <Card className="p-6 text-center border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-purple-400">{breakdown.relevancia_conversacional || 0}</h3>
                <p className="text-sm text-slate-400 mt-1">Relevância Conversacional</p>
              </Card>

              <Card className="p-6 text-center border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-amber-400">{breakdown.autoridade_cognitiva || 0}</h3>
                <p className="text-sm text-slate-400 mt-1">Autoridade Cognitiva</p>
              </Card>

              <Card className="p-6 text-center border-2 border-pink-500/30 bg-gradient-to-br from-pink-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(236,72,153,0.15)] hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-pink-400">{breakdown.inteligencia_estrategica || 0}</h3>
                <p className="text-sm text-slate-400 mt-1">Inteligência Estratégica</p>
              </Card>
            </div>

            {/* Gráfico de Evolução - Premium */}
            <Card className="p-6 mb-8 border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-600/20">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Evolução do Score GEO</span>
              </h3>
              <div id="geo-evolution-chart">
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 4 }}
                    activeDot={{ r: 6, fill: '#c084fc' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}

        {!geoScores && (
          <Card className="p-12 text-center border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold mb-2 text-white">Nenhuma métrica GEO calculada ainda</h3>
            <p className="text-slate-400 mb-6">
              Clique em "Calcular Métricas" para analisar a presença da sua marca em IAs
            </p>
            <Button 
              onClick={handleCalculateMetrics}
              disabled={isCalculating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
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
