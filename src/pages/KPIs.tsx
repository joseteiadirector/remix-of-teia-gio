import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, TrendingUp, Brain, Activity, Download, Zap, Loader2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { KPICard } from '@/components/kpis/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { GaugeChart } from '@/components/kpis/GaugeChart';
import { exportKPIsReport } from '@/utils/pdf';
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs';
import { useKAPIMetrics } from '@/hooks/useKAPIMetrics';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logger } from "@/utils/logger";

interface Brand {
  id: string;
  name: string;
}

export default function KPIs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  // ✅ HOOK CENTRALIZADO PARA MÉTRICAS KAPI
  const kapiMetricsHook = useKAPIMetrics({ brandId: selectedBrand || undefined });
  
  // Sistema de auditoria centralizado
  const { executeAudit, isAuditing, lastAuditResult } = useAudit({ autoGeneratePDF: true });

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadKPIData();
    }
  }, [selectedBrand]);

  // Callback estável para atualização em tempo real
  const handleRealtimeUpdate = useCallback(() => {
    if (selectedBrand) {
      loadKPIData();
    }
  }, [selectedBrand]);

  // Hook de notificações em tempo real
  useRealtimeKPIs({
    brandId: selectedBrand,
    onDataChange: handleRealtimeUpdate,
    enabled: realtimeEnabled,
  });

  const loadBrands = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_visible', true);

      if (error) throw error;

      setBrands(data || []);
      if (data && data.length > 0) {
        setSelectedBrand(data[0].id);
      }
    } catch (error) {
      logger.error('Erro ao carregar marcas em KPIs', { error });
    }
  };

  const loadKPIData = async () => {
    setLoading(true);
    try {
      const { data: geoData } = await supabase
        .from('geo_scores')
        .select('*')
        .eq('brand_id', selectedBrand)
        .order('computed_at', { ascending: false })
        .limit(1);

      const { data: mentionsData } = await supabase
        .from('mentions_llm')
        .select('*')
        .eq('brand_id', selectedBrand)
        .order('collected_at', { ascending: false })
        .limit(100);

      // ✅ Buscar SEO score válido (> 0), não apenas o mais recente
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('brand_id', selectedBrand)
        .gt('seo_score', 0)  // Filtrar apenas scores válidos
        .order('date', { ascending: false })
        .limit(1);

      // Buscar métricas IGO (CPI e Estabilidade Cognitiva)
      const { data: igoData } = await supabase
        .from('igo_metrics_history')
        .select('*')
        .eq('brand_id', selectedBrand)
        .order('calculated_at', { ascending: false })
        .limit(1);

      const geoScore = geoData?.[0]?.score || 0;
      const geoBreakdown = (geoData?.[0]?.breakdown || {}) as {
        base_tecnica?: number;
        estrutura_semantica?: number;
        relevancia_conversacional?: number;
        autoridade_cognitiva?: number;
        inteligencia_estrategica?: number;
      };
      const totalMentions = mentionsData?.length || 0;
      const positiveMentions = mentionsData?.filter(m => m.mentioned)?.length || 0;
      const mentionRate = totalMentions > 0 ? (positiveMentions / totalMentions) * 100 : 0;
      const uniqueTopics = new Set(mentionsData?.map(m => m.query)).size;
      
      // Calcular confidence score corretamente
      let avgConfidence = 0;
      if (mentionsData && mentionsData.length > 0) {
        const sum = mentionsData.reduce((acc, m) => acc + Number(m.confidence || 0), 0);
        avgConfidence = sum / mentionsData.length;
        if (avgConfidence > 1) {
          avgConfidence = Math.min(avgConfidence, 100);
        } else {
          avgConfidence = avgConfidence * 100;
        }
      }

      // SEO Metrics - usar score PRÉ-CALCULADO da tabela oficial
      const seoMetrics = seoData?.[0];
      const organicTraffic = seoMetrics?.organic_traffic || 0;
      const avgPosition = seoMetrics?.avg_position || 0;
      const totalClicks = seoMetrics?.total_clicks || 0;
      const ctr = seoMetrics?.ctr || 0;
      const conversionRate = seoMetrics?.conversion_rate || 0;
      
      // ✅ CORREÇÃO: Usar SEO Score oficial PRÉ-CALCULADO pela edge function
      // NÃO recalcular localmente - usar valor da tabela seo_metrics_daily
      const seoScore = seoMetrics?.seo_score || 0;

      // ✅ FONTE ÚNICA DA VERDADE: Métricas KAPI da tabela igo_metrics_history
      // NUNCA recalcular no frontend - usar valores pré-calculados pela edge function
      const ice = igoData?.[0]?.ice || 0;
      const gap = igoData?.[0]?.gap || 0;
      const cognitiveStability = igoData?.[0]?.cognitive_stability || 0;
      
      // CPI: Fonte oficial é geo_scores.cpi, fallback para igo_metrics_history
      const cpi = geoData?.[0]?.cpi || igoData?.[0]?.cpi || 0;

      setKpiData({
        geo: {
          score: geoScore,
          mentionRate,
          topicCoverage: uniqueTopics,
          confidence: avgConfidence,
          breakdown: {
            base_tecnica: geoBreakdown.base_tecnica || 0,
            estrutura_semantica: geoBreakdown.estrutura_semantica || 0,
            relevancia_conversacional: geoBreakdown.relevancia_conversacional || 0,
            autoridade_cognitiva: geoBreakdown.autoridade_cognitiva || 0,
            inteligencia_estrategica: geoBreakdown.inteligencia_estrategica || 0,
          }
        },
        seo: {
          score: seoScore,
          traffic: organicTraffic,
          position: avgPosition,
          clicks: totalClicks,
          ctr: ctr,
          conversionRate: conversionRate,
        },
        convergence: {
          ice: ice,
          gap: gap,
        },
        igo: {
          cpi: cpi,
          cognitiveStability: cognitiveStability,
        }
      });
    } catch (error) {
      logger.error('Erro ao carregar KPIs', { error, brandId: selectedBrand });
    } finally {
      setLoading(false);
    }
  };

  const selectedBrandName = brands.find(b => b.id === selectedBrand)?.name || 'Marca';

  const handleExportPDF = async () => {
    if (!kpiData) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const brand = brands.find(b => b.id === selectedBrand);
    if (!brand) {
      toast.error('Marca não encontrada');
      return;
    }

    setIsExporting(true);
    try {
      // Preparar dados para exportação de KPIs
      const kpisData = {
        brandName: brand.name,
        geoScore: kpiData.geo.score,
        seoScore: kpiData.seo.score,
        pillars: [
          { name: 'Base Técnica', value: kpiData.geo.breakdown.base_tecnica },
          { name: 'Estrutura Semântica', value: kpiData.geo.breakdown.estrutura_semantica },
          { name: 'Relevância Conversacional', value: kpiData.geo.breakdown.relevancia_conversacional },
          { name: 'Autoridade Cognitiva', value: kpiData.geo.breakdown.autoridade_cognitiva },
          { name: 'Inteligência Estratégica', value: kpiData.geo.breakdown.inteligencia_estrategica },
        ],
        kapiMetrics: {
          // ✅ FONTE ÚNICA: Valores já estão em escala 0-100 da igo_metrics_history
          ice: kpiData.convergence.ice,
          gap: kpiData.convergence.gap,
          cpi: kpiData.igo.cpi,
          stability: kpiData.igo.cognitiveStability,
        },
        geoMetrics: {
          mentionRate: kpiData.geo.mentionRate,
          topicCoverage: kpiData.geo.topicCoverage,
          confidence: kpiData.geo.confidence,
        },
        seoMetrics: {
          traffic: kpiData.seo.traffic,
          position: kpiData.seo.position,
          clicks: kpiData.seo.clicks,
          // CTR e conversionRate já estão em percentual na tela, garantir formato correto
          ctr: kpiData.seo.ctr > 1 ? kpiData.seo.ctr : kpiData.seo.ctr * 100,
          conversionRate: kpiData.seo.conversionRate > 1 ? kpiData.seo.conversionRate : kpiData.seo.conversionRate * 100,
        },
        period: 'Últimos 30 dias',
      };

      await exportKPIsReport(kpisData);

      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      logger.error('Erro ao exportar KPIs', { error });
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto p-6 space-y-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground font-medium">KPIs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-green-500/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                    KPIs
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Indicadores-chave de performance em linguagem simples
                  </p>
                  <ConsistencyIndicator 
                    brandId={selectedBrand}
                    brandName={brands.find(b => b.id === selectedBrand)?.name}
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
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {brands.length > 0 && (
                <>
                  <Button
                    onClick={() => {
                      setRealtimeEnabled(!realtimeEnabled);
                      toast.success(
                        realtimeEnabled 
                          ? 'Notificações em tempo real desativadas' 
                          : 'Notificações em tempo real ativadas',
                        { duration: 3000 }
                      );
                    }}
                    variant="outline"
                    size="icon"
                    className={`relative transition-all duration-300 ${
                      realtimeEnabled 
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50' 
                        : 'border-border/50 hover:bg-muted/50'
                    }`}
                    title={realtimeEnabled ? 'Desativar notificações' : 'Ativar notificações'}
                  >
                    {realtimeEnabled ? (
                      <Bell className="h-4 w-4 text-green-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    {realtimeEnabled && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                    )}
                  </Button>

                  <Button
                    onClick={loadKPIData}
                    disabled={loading}
                    size="default"
                    className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] animate-shimmer" />
                    {loading ? (
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
                  
                  {kpiData && (
                    <>
                      <AuditButton 
                        onClick={async () => {
                          const brandName = brands.find(b => b.id === selectedBrand)?.name;
                          if (selectedBrand) {
                            await executeAudit(selectedBrand, brandName);
                          }
                        }}
                        isAuditing={isAuditing}
                        disabled={!kpiData}
                        className="bg-foreground/90 text-background hover:bg-foreground transition-all duration-300"
                      />

                      <Button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="gap-2 bg-foreground/90 text-background hover:bg-foreground transition-all duration-300"
                      >
                        {isExporting ? (
                          <>
                            <Download className="w-4 h-4 animate-pulse" />
                            Gerando PDF...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Exportar PDF
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="w-[200px] border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all">
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[180px] rounded-xl" />
              ))}
            </div>
          </div>
        ) : kpiData ? (
          <div className="space-y-10">
            {/* Score Cards Premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="group relative p-8 overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-background backdrop-blur-xl shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl group-hover:bg-primary/40 transition-colors" />
                <div className="relative text-center space-y-3">
                  <h2 className="text-sm font-bold text-primary/80 uppercase tracking-widest">
                    Score GEO (IAs)
                  </h2>
                  <div className="text-7xl font-black bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent drop-shadow-2xl">
                    {kpiData.geo.score.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Posicionamento nas Inteligências Artificiais
                  </p>
                </div>
              </Card>

              <Card className="group relative p-8 overflow-hidden rounded-2xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background backdrop-blur-xl shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/30 rounded-full blur-3xl group-hover:bg-green-500/40 transition-colors" />
                <div className="relative text-center space-y-3">
                  <h2 className="text-sm font-bold text-green-500/80 uppercase tracking-widest">
                    Score SEO
                  </h2>
                  <div className="text-7xl font-black bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 bg-clip-text text-transparent drop-shadow-2xl">
                    {kpiData.seo.score.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Otimização para Motores de Busca
                  </p>
                </div>
              </Card>
            </div>

            {/* Presença nas IAs Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Presença nas IAs
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Dados coletados diretamente das respostas das Inteligências Artificiais
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard
                  title="Menções Positivas"
                  value={`${kpiData.geo.mentionRate.toFixed(0)}%`}
                  icon={Target}
                  description="Sua marca é mencionada positivamente"
                  dataSource="real"
                  colorClass="from-primary/10 to-primary/5 border-primary/30"
                  tooltip={{
                    title: "O que são Menções Positivas?",
                    description: "É a porcentagem de vezes que sua marca aparece quando as IAs respondem perguntas relevantes ao seu negócio.",
                    whyMatters: "Quanto maior, mais as IAs recomendam você. Isso significa mais visibilidade e credibilidade."
                  }}
                />

                <KPICard
                  title="Tópicos Cobertos"
                  value={kpiData.geo.topicCoverage}
                  icon={Activity}
                  description="Temas onde você aparece"
                  dataSource="real"
                  colorClass="from-secondary/10 to-secondary/5 border-secondary/30"
                  tooltip={{
                    title: "O que são Tópicos Cobertos?",
                    description: "É a quantidade de assuntos diferentes onde sua marca é mencionada pelas IAs.",
                    whyMatters: "Mais tópicos significa que você é relevante em mais áreas. Isso amplia seu alcance."
                  }}
                />

                <KPICard
                  title="Confiança das IAs"
                  value={`${kpiData.geo.confidence.toFixed(0)}%`}
                  icon={TrendingUp}
                  description="Certeza ao recomendar você"
                  dataSource="real"
                  colorClass="from-accent/10 to-accent/5 border-accent/30"
                  tooltip={{
                    title: "O que é Confiança das IAs?",
                    description: "É o nível de certeza que as IAs têm ao mencionar sua marca nas respostas.",
                    whyMatters: "Alta confiança significa que as IAs têm informações confiáveis sobre você e recomendam com segurança."
                  }}
                />
              </div>
            </div>

            {/* Otimização SEO Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Otimização SEO
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Desempenho nos motores de busca tradicionais
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard
                  title="Tráfego Orgânico"
                  value={kpiData.seo.traffic.toLocaleString('pt-BR')}
                  icon={TrendingUp}
                  description="Visitantes do Google"
                  dataSource="real"
                  colorClass="from-green-500/10 to-green-500/5 border-green-500/30"
                  tooltip={{
                    title: "O que é Tráfego Orgânico?",
                    description: "É o número de visitantes que chegam ao seu site através dos resultados de busca do Google.",
                    whyMatters: "Mais tráfego orgânico significa maior visibilidade e potencial de conversões sem custo de anúncios."
                  }}
                />

                <KPICard
                  title="Posição Média"
                  value={kpiData.seo.position.toFixed(1)}
                  icon={Target}
                  description="Ranking médio no Google"
                  dataSource="real"
                  colorClass="from-emerald-500/10 to-emerald-500/5 border-emerald-500/30"
                  tooltip={{
                    title: "O que é Posição Média?",
                    description: "É a posição média do seu site nos resultados de busca do Google para as palavras-chave relevantes.",
                    whyMatters: "Posições mais altas (números menores) significam mais visibilidade e cliques. A primeira página (posições 1-10) recebe a maioria dos cliques."
                  }}
                />

                <KPICard
                  title="CTR (Taxa de Cliques)"
                  value={`${(kpiData.seo.ctr * 100).toFixed(1)}%`}
                  icon={Activity}
                  description="Cliques / Impressões"
                  dataSource="real"
                  colorClass="from-teal-500/10 to-teal-500/5 border-teal-500/30"
                  tooltip={{
                    title: "O que é CTR?",
                    description: "É a porcentagem de pessoas que clicam no seu site após vê-lo nos resultados de busca.",
                    whyMatters: "Um CTR alto indica que seu título e descrição são atrativos e relevantes para as buscas."
                  }}
                />
              </div>
            </div>

            {/* Indicadores de Convergência Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Indicadores de Convergência
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Análise estratégica do alinhamento GEO-SEO
                  </p>
                </div>
              </div>

              {/* Card de Fundamentação Premium */}
              <Card className="p-6 overflow-hidden relative rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-cyan-500/10 border border-amber-500/30 backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-2xl" />
                <div className="relative space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20">
                        <Activity className="w-4 h-4 text-cyan-400" />
                      </div>
                      ICE (Index of Cognitive Efficiency)
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">O que é:</strong> Mede o consenso entre diferentes LLMs sobre a taxa de menção da sua marca. Fórmula: ICE = 1 - σ(taxas de menção entre LLMs).
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      <strong className="text-foreground">Como interpretar:</strong> Um ICE alto (≥75) significa que os LLMs concordam sobre sua presença. Valores baixos indicam percepções divergentes entre provedores que precisam ser harmonizadas.
                    </p>
                  </div>

                  <div className="border-t border-border/50 pt-6">
                    <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      GAP (Precisão de Alinhamento de Observabilidade)
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">O que é:</strong> Mede a precisão do alinhamento entre provedores de LLM. Fórmula: GAP = (Pₐ / Pₜ) × 100 × C, onde Pₐ = provedores alinhados, Pₜ = total de provedores, C = fator de consenso.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                      <strong className="text-foreground">Como interpretar:</strong> Um GAP alto (≥60) significa que os provedores estão alinhados na representação da sua marca. Valores baixos indicam divergências que exigem ação para aumentar a consistência.
                    </p>
                  </div>

                  <div className="bg-background/50 p-4 rounded-xl border border-amber-500/20">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-amber-400 font-semibold">💡 Dica Estratégica:</span> Priorize ações quando ICE e GAP estão baixos. Isso indica inconsistências na percepção da sua marca entre LLMs que precisam ser corrigidas.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KPICard
                  title="ICE - Índice de Convergência Estratégica"
                  value={kpiData.convergence.ice.toFixed(1)}
                  icon={Activity}
                  description="Consenso entre LLMs (0 a 100, maior = melhor)"
                  dataSource="real"
                  colorClass="from-cyan-500/10 to-blue-500/5 border-cyan-500/30"
                  tooltip={{
                    title: "O que é o ICE?",
                    description: "Mede o consenso entre diferentes LLMs sobre a taxa de menção da sua marca. Calculado como 1 - σ(taxas de menção).",
                    whyMatters: "Um ICE alto (≥75) significa que os LLMs concordam sobre sua marca. Valores baixos indicam percepções divergentes que precisam ser harmonizadas."
                  }}
                />

                <KPICard
                  title="GAP - Prioridade Estratégica de Ação"
                  value={kpiData.convergence.gap.toFixed(1)}
                  icon={Zap}
                  description="Alinhamento de observabilidade (0 a 100, maior = melhor)"
                  dataSource="real"
                  colorClass="from-amber-500/10 to-orange-500/5 border-amber-500/30"
                  tooltip={{
                    title: "O que é o GAP?",
                    description: "Mede a precisão do alinhamento de observabilidade entre provedores de LLM. Fórmula: (Pₐ/Pₜ) × 100 × C.",
                    whyMatters: "Um GAP alto (≥60) significa que os provedores estão alinhados na representação da sua marca. Valores baixos indicam divergências que precisam de atenção."
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
              {/* Gráfico ICE - Mostrar Pilares */}
              <Card className="p-6 glass-card border-2 shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
                <h3 className="text-lg font-bold mb-4 text-center">Índice de Convergência Estratégica (ICE)</h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Consenso entre LLMs: {kpiData.convergence.ice.toFixed(1)}/100
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Score GEO', value: kpiData.geo.score },
                      { name: 'Score SEO', value: kpiData.seo.score },
                      { name: 'ICE', value: kpiData.convergence.ice },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: 'Valor (0-100)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1), '']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#67e8f9" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Componentes do ICE - {selectedBrandName}
                </p>
              </Card>

              {/* Gráfico GAP - Mostrar Pilares */}
              <Card className="p-6 glass-card border-2 shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
                <h3 className="text-lg font-bold mb-4 text-center">GAP - Precisão de Alinhamento de Observabilidade</h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Alinhamento entre provedores: {kpiData.convergence.gap.toFixed(1)}/100 (maior = melhor)
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Score GEO', value: kpiData.geo.score },
                      { name: 'Score SEO', value: kpiData.seo.score },
                      { name: 'GAP', value: kpiData.convergence.gap },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      domain={[0, 'auto']} 
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      label={{ value: 'Valor', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(2), '']}
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#fb8772" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  GAP = (Provedores Alinhados / Total) × 100 × Consenso - {selectedBrandName}
                </p>
              </Card>
            </div>
          </div>

            {/* Card CTA Premium */}
            <Card className="p-8 overflow-hidden relative rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-accent/10 border border-primary/30 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
              <div className="relative flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Quer melhorar seus KPIs?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Conecte suas ferramentas de análise para obter insights mais detalhados e recomendações personalizadas.
                  </p>
                  <Button 
                    onClick={() => navigate('/google-setup')}
                    className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 shadow-lg shadow-primary/25"
                  >
                    Conectar Google Search Console
                  </Button>
                </div>
              </div>
            </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma marca selecionada</h3>
          <p className="text-muted-foreground">
            Selecione uma marca para visualizar os KPIs
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
