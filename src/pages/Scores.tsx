import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, TrendingUp, Target, Zap, Database, Brain, Home, Download, FileSpreadsheet } from "lucide-react";
import { exportGEOReport } from "@/utils/pdf";
import { LoadingSpinner, SkeletonChart } from "@/components/LoadingSpinner";
import { useAudit } from "@/hooks/useAudit";
import { AuditButton } from "@/components/audit/AuditButton";
import { AuditBadge } from "@/components/audit/AuditBadge";
import { ConsistencyIndicator } from "@/components/ConsistencyIndicator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom Premium Tooltip
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="px-4 py-3 rounded-xl border border-purple-500/40 backdrop-blur-xl"
        style={{ 
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,20,50,0.95) 100%)',
          boxShadow: '0 0 30px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-lg font-bold" style={{ color: entry.color || '#a855f7' }}>
            {entry.name}: <span className="text-white">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
import { logger } from "@/utils/logger";

interface GeoScore {
  id: number;
  brand_id: string;
  score: number;
  breakdown: {
    base_tecnica: number;
    estrutura_semantica: number;
    relevancia_conversacional: number;
    autoridade_cognitiva: number;
    inteligencia_estrategica: number;
  };
  computed_at: string;
  cpi: number;
}

interface Brand {
  id: string;
  name: string;
  domain: string;
}

const Scores = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<GeoScore[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Sistema de auditoria centralizado
  const { executeAudit, isAuditing, lastAuditResult } = useAudit({ autoGeneratePDF: true });

  useEffect(() => {
    fetchData();
  }, [selectedBrand]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch brands - APENAS marcas visíveis
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, domain')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (brandsError) throw brandsError;

      setBrands(brandsData || []);

      if (brandsData && brandsData.length > 0) {
        // Set selected brand if not already set
        if (!selectedBrand) {
          setSelectedBrand(brandsData[0].id);
          return; // Will trigger useEffect again
        }

        // Fetch scores for selected brand
        const { data: scoresData, error: scoresError } = await supabase
          .from('geo_scores')
          .select('id, brand_id, score, breakdown, computed_at, cpi')
          .eq('brand_id', selectedBrand)
          .order('computed_at', { ascending: true })
          .limit(100);

        if (scoresError) throw scoresError;

        setScores(scoresData as GeoScore[] || []);
      }
    } catch (error) {
      logger.error('Erro ao buscar scores', { error, brandId: selectedBrand });
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateMetrics = async () => {
    if (!selectedBrand || !user?.id) return;

    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-geo-metrics', {
        body: { 
          brandId: selectedBrand,
          userId: user.id 
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Métricas GEO atualizadas com sucesso",
      });
      
      // Recarregar dados
      await fetchData();
    } catch (error) {
      logger.error('Erro ao calcular métricas de scores', { error, brandId: selectedBrand });
      toast({
        title: "Erro ao atualizar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <LoadingSpinner size="lg" text="Carregando scores..." fullScreen />
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">GEO Escore</h1>
            <p className="text-muted-foreground">
              Visualize as pontuações de otimização para motores generativos
            </p>
          </div>

          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum score calculado ainda</h3>
            <p className="text-muted-foreground">
              Execute a sincronização de analytics para começar a coletar dados e gerar GEO scores.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const latestScore = scores[scores.length - 1];
  const brand = brands.find(b => b.id === latestScore.brand_id);

  const radarData = [
    { subject: 'Base Técnica', value: latestScore.breakdown.base_tecnica, fullMark: 100 },
    { subject: 'Estrutura Semântica', value: latestScore.breakdown.estrutura_semantica, fullMark: 100 },
    { subject: 'Relevância Conversacional', value: latestScore.breakdown.relevancia_conversacional, fullMark: 100 },
    { subject: 'Autoridade Cognitiva', value: latestScore.breakdown.autoridade_cognitiva, fullMark: 100 },
    { subject: 'Inteligência Estratégica', value: latestScore.breakdown.inteligencia_estrategica, fullMark: 100 },
  ];

  // Componente customizado para labels do radar (quebra em 2 linhas)
  const CustomRadarTick = ({ payload, x, y, textAnchor, cx }: any) => {
    const words = payload.value.split(' ');
    const midPoint = Math.ceil(words.length / 2);
    const line1 = words.slice(0, midPoint).join(' ');
    const line2 = words.slice(midPoint).join(' ');
    
    // Calcular se está no topo
    const isTop = y < cx;
    const offsetY = isTop ? -25 : 10;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={offsetY}
          textAnchor={textAnchor}
          fill="hsl(var(--foreground))"
          fontSize={11}
          fontWeight={500}
        >
          <tspan x={0} dy={0}>{line1}</tspan>
          <tspan x={0} dy={12}>{line2}</tspan>
        </text>
      </g>
    );
  };

  const timeSeriesData = scores.map(score => ({
    date: new Date(score.computed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    score: Number(score.score.toFixed(2)),
  }));

  const pillars = [
    {
      name: 'Base Técnica',
      value: latestScore.breakdown.base_tecnica,
      icon: Database,
      color: 'bg-blue-500',
    },
    {
      name: 'Estrutura Semântica',
      value: latestScore.breakdown.estrutura_semantica,
      icon: Target,
      color: 'bg-green-500',
    },
    {
      name: 'Relevância Conversacional',
      value: latestScore.breakdown.relevancia_conversacional,
      icon: Zap,
      color: 'bg-purple-500',
    },
    {
      name: 'Autoridade Cognitiva',
      value: latestScore.breakdown.autoridade_cognitiva,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      name: 'Inteligência Estratégica',
      value: latestScore.breakdown.inteligencia_estrategica,
      icon: Brain,
      color: 'bg-pink-500',
    },
  ];

  const handleExport = async (format: 'pdf') => {
    if (!scores || scores.length === 0) {
      toast({
        title: "Dados insuficientes",
        description: "É necessário ter pelo menos um score calculado para exportar relatórios.",
        variant: "destructive",
      });
      return;
    }

    if (format === 'pdf') {
      setIsExporting(true);
      toast({
        title: "📊 Gerando PDF",
        description: "Aguarde enquanto preparamos seu relatório GEO...",
      });

      try {
        // Buscar menções LLM da marca
        const { data: mentions, error: mentionsError } = await supabase
          .from('mentions_llm')
          .select('provider, query, mentioned, confidence, answer_excerpt')
          .eq('brand_id', selectedBrand)
          .order('collected_at', { ascending: false })
          .limit(50);

        if (mentionsError) throw mentionsError;

        // Preparar dados completos para o PDF
        const firstScore = scores[0];
        await exportGEOReport({
          brandName: brand?.name || '',
          brandDomain: brand?.domain || '',
          geoScore: latestScore.score,
          pillars: pillars.map((p, index) => {
            const pillarKey = ['base_tecnica', 'estrutura_semantica', 'relevancia_conversacional', 'autoridade_cognitiva', 'inteligencia_estrategica'][index] as keyof typeof firstScore.breakdown;
            const initialValue = firstScore?.breakdown?.[pillarKey] || 0;
            const finalValue = p.value;
            const variation = initialValue > 0 ? ((finalValue - initialValue) / initialValue * 100) : 0;
            
            return {
              name: p.name,
              value: p.value,
              variation
            };
          }),
          mentions: mentions?.map(m => ({
            provider: m.provider,
            query: m.query,
            mentioned: m.mentioned,
            confidence: m.confidence,
            answer_excerpt: m.answer_excerpt || undefined
          })) || [],
          period: `${new Date(scores[0]?.computed_at).toLocaleDateString('pt-BR')} - ${new Date(latestScore.computed_at).toLocaleDateString('pt-BR')}`
        });

        toast({
          title: "✅ Exportação concluída!",
          description: "Relatório GEO exportado com sucesso",
        });
      } catch (error) {
        logger.error('Erro ao exportar PDF', { error });
        toast({
          title: "Erro na exportação",
          description: error instanceof Error ? error.message : "Não foi possível gerar o PDF",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>GEO Escore</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="flex justify-between items-start animate-fade-in p-6 rounded-xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border-2 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">GEO Escore</h1>
              </div>
              <p className="text-slate-400">
                Framework IGO · Governança Semântica · Otimização para Motores Generativos
              </p>
              {/* Indicador de Consistência Matemática */}
              <ConsistencyIndicator 
                brandId={selectedBrand || undefined}
                brandName={brand?.name}
                autoValidate={false}
                showDetails={true}
              />
            </div>
            {lastAuditResult && (
              <AuditBadge 
                status={lastAuditResult.status}
                maxDivergence={lastAuditResult.max_divergence_percentage}
                inconsistencies={lastAuditResult.inconsistencies_found}
              />
            )}
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {/* Brand Selector */}
            <div className="w-64">
              <Select value={selectedBrand || undefined} onValueChange={setSelectedBrand}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600/50 hover:border-purple-500/50 transition-colors">
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EXPORTAR PDF GEO */}
            <Button 
              onClick={() => handleExport('pdf')} 
              size="lg"
              disabled={isExporting}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Exportar Relatório GEO com Gráficos
                </>
              )}
            </Button>

            {/* Calculate Button */}
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
                  Calcular Métricas
                </>
              )}
            </Button>

            {/* Audit Button */}
            <AuditButton 
              onClick={async () => {
                const brandName = brands.find(b => b.id === selectedBrand)?.name;
                if (selectedBrand) {
                  await executeAudit(selectedBrand, brandName);
                }
              }}
              isAuditing={isAuditing}
              disabled={!scores.length}
            />
          </div>
        </div>


        {/* Overall Score - Premium Card */}
        <Card className="relative overflow-hidden p-8 border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-900/90 to-slate-950/90 animate-scale-in" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <div className="relative text-center">
            <div className="text-sm text-slate-300 mb-4 font-medium">
              {brand?.name} · {brand?.domain}
            </div>
            <div className="text-8xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-purple-400 bg-clip-text text-transparent mb-3 drop-shadow-lg">
              {latestScore.score.toFixed(1)}
            </div>
            <div className="text-lg text-slate-300 font-medium">Score GEO Geral</div>
            <div className="text-xs text-slate-500 mt-3">
              Última atualização: {new Date(latestScore.computed_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </Card>

        {/* Pillars Cards - Premium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Base Técnica */}
          <Card 
            className="relative overflow-hidden p-5 border-2 border-blue-500/40 bg-gradient-to-br from-blue-950/60 via-slate-900/80 to-slate-950/80 hover:scale-[1.03] transition-all duration-300 animate-slide-up"
            style={{ boxShadow: '0 0 30px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)', animationDelay: '0ms' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                <Database className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-blue-400">{pillars[0].value.toFixed(1)}</div>
            <div className="text-sm text-slate-300">{pillars[0].name}</div>
          </Card>

          {/* Estrutura Semântica */}
          <Card 
            className="relative overflow-hidden p-5 border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-slate-950/80 hover:scale-[1.03] transition-all duration-300 animate-slide-up"
            style={{ boxShadow: '0 0 30px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.1)', animationDelay: '100ms' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-2.5 rounded-xl" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-emerald-400">{pillars[1].value.toFixed(1)}</div>
            <div className="text-sm text-slate-300">{pillars[1].name}</div>
          </Card>

          {/* Relevância Conversacional */}
          <Card 
            className="relative overflow-hidden p-5 border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-900/80 to-slate-950/80 hover:scale-[1.03] transition-all duration-300 animate-slide-up"
            style={{ boxShadow: '0 0 30px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)', animationDelay: '200ms' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-2.5 rounded-xl" style={{ boxShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-purple-400">{pillars[2].value.toFixed(1)}</div>
            <div className="text-sm text-slate-300">{pillars[2].name}</div>
          </Card>

          {/* Autoridade Cognitiva */}
          <Card 
            className="relative overflow-hidden p-5 border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/60 via-slate-900/80 to-slate-950/80 hover:scale-[1.03] transition-all duration-300 animate-slide-up"
            style={{ boxShadow: '0 0 30px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,255,255,0.1)', animationDelay: '300ms' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl" style={{ boxShadow: '0 0 20px rgba(245,158,11,0.5)' }}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-amber-400">{pillars[3].value.toFixed(1)}</div>
            <div className="text-sm text-slate-300">{pillars[3].name}</div>
          </Card>

          {/* Inteligência Estratégica */}
          <Card 
            className="relative overflow-hidden p-5 border-2 border-pink-500/40 bg-gradient-to-br from-pink-950/60 via-slate-900/80 to-slate-950/80 hover:scale-[1.03] transition-all duration-300 animate-slide-up"
            style={{ boxShadow: '0 0 30px rgba(236,72,153,0.25), inset 0 1px 0 rgba(255,255,255,0.1)', animationDelay: '400ms' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2.5 rounded-xl" style={{ boxShadow: '0 0 20px rgba(236,72,153,0.5)' }}>
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 text-pink-400">{pillars[4].value.toFixed(1)}</div>
            <div className="text-sm text-slate-300">{pillars[4].name}</div>
          </Card>
        </div>

        {/* CPI Score Card - Premium */}
        <Card className="relative overflow-hidden p-6 border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/50 via-slate-900/90 to-pink-950/40" style={{ boxShadow: '0 0 50px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl" style={{ boxShadow: '0 0 25px rgba(139,92,246,0.6)' }}>
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">CPI Score</h3>
                  <p className="text-sm text-slate-400">Cognitive Predictive Index</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white border-purple-400/40" style={{ boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>
                Métrica Proprietária
              </Badge>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                {latestScore.cpi ? Number(latestScore.cpi).toFixed(1) : '0.0'}
              </div>
              <div className="text-slate-400 text-lg">/100</div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-200">
                <strong>Consistência Preditiva Inter-IA:</strong> Mede o quanto diferentes LLMs são 
                <strong className="text-purple-300"> previsíveis e consistentes</strong> ao mencionar sua marca.
              </p>
              <p className="text-xs text-slate-400">
                ✨ Valores altos (≥80) indicam respostas uniformes entre OpenAI, Claude, Gemini e Perplexity — 
                sinal de forte governança semântica e posicionamento consolidado.
              </p>
            </div>
          </div>
        </Card>

        {/* Charts - Premium Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart - Premium */}
          <Card className="relative overflow-hidden p-6 border-2 border-purple-500/30 bg-gradient-to-br from-slate-900/95 via-purple-950/30 to-slate-900/95 animate-slide-up" style={{ boxShadow: '0 0 50px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.08)', animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.1)_0%,_transparent_70%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="relative">
              <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white via-purple-200 to-slate-300 bg-clip-text text-transparent">Visão Geral dos Pilares</h3>
              <div id="geo-radar-chart" className="recharts-wrapper">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData} margin={{ top: 60, right: 100, bottom: 40, left: 100 }}>
                    <defs>
                      <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
                      </linearGradient>
                      <filter id="radarGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <PolarGrid stroke="rgba(139,92,246,0.2)" strokeWidth={1} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={<CustomRadarTick cx={200} />}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(148,163,184,0.3)" />
                    <Radar 
                      name="Score" 
                      dataKey="value" 
                      stroke="#a855f7" 
                      strokeWidth={3}
                      fill="url(#radarGradient)" 
                      fillOpacity={0.6}
                      filter="url(#radarGlow)"
                    />
                    <Tooltip content={<PremiumTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Area Chart - Premium Evolution */}
          <Card className="relative overflow-hidden p-6 border-2 border-emerald-500/30 bg-gradient-to-br from-slate-900/95 via-emerald-950/20 to-slate-900/95 animate-slide-up" style={{ boxShadow: '0 0 50px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.08)', animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            <div className="relative">
              <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white via-emerald-200 to-slate-300 bg-clip-text text-transparent">Evolução do Score GEO</h3>
              <div id="geo-evolution-chart" className="recharts-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <filter id="lineGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.2)' }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.2)' }} />
                    <Tooltip content={<PremiumTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="url(#lineGradient)" 
                      strokeWidth={3}
                      fill="url(#areaGradient)" 
                      name="Score GEO"
                      filter="url(#lineGlow)"
                      dot={{ fill: '#a855f7', strokeWidth: 2, stroke: '#c084fc', r: 5 }}
                      activeDot={{ r: 8, fill: '#c084fc', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Bar Chart - Premium Comparison */}
        <Card className="relative overflow-hidden p-6 border-2 border-pink-500/30 bg-gradient-to-br from-slate-900/95 via-pink-950/20 to-slate-900/95 animate-slide-up" style={{ boxShadow: '0 0 50px rgba(236,72,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)', animationDelay: '400ms' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(236,72,153,0.08)_0%,_transparent_60%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
          <div className="relative">
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-white via-pink-200 to-slate-300 bg-clip-text text-transparent">Comparação de Pilares</h3>
            <div id="geo-pillars-chart" className="recharts-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={radarData} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="barGradient3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="barGradient4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="barGradient5" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#db2777" stopOpacity={0.8} />
                    </linearGradient>
                    <filter id="barGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis 
                    dataKey="subject" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: 'rgba(148,163,184,0.2)' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.2)' }} />
                  <Tooltip content={<PremiumTooltip />} cursor={{ fill: 'rgba(139,92,246,0.1)' }} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Pontuação" 
                    radius={[8, 8, 0, 0]}
                    filter="url(#barGlow)"
                  >
                    {radarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#barGradient${(index % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Scores;