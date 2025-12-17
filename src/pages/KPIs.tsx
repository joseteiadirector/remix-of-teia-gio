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
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>KPIs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">KPIs</h1>
              <p className="text-muted-foreground">
                Indicadores-chave de performance em linguagem simples
              </p>
              {/* Indicador de Consistência Matemática */}
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
        <div className="flex items-center gap-3">
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
                className={`relative ${
                  realtimeEnabled 
                    ? 'bg-green-100 dark:bg-green-950 border-green-300 hover:bg-green-200' 
                    : 'border-muted'
                }`}
                title={realtimeEnabled ? 'Desativar notificações' : 'Ativar notificações'}
              >
                {realtimeEnabled ? (
                  <Bell className="h-4 w-4 text-green-600" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
                {realtimeEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </Button>

              <Button
                onClick={loadKPIData}
                disabled={loading}
                size="default"
                className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
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
                    className="bg-foreground text-background hover:bg-foreground/90"
                  />

                  <Button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="gap-2 bg-foreground text-background hover:bg-foreground/90"
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
                <SelectTrigger className="w-[200px] border-purple-200">
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

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        </div>
      ) : kpiData ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 glass-card bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Score GEO (IAs)
                </h2>
                <div className="text-6xl font-bold gradient-text drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  {kpiData.geo.score.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Posicionamento nas Inteligências Artificiais
                </p>
              </div>
            </Card>

            <Card className="p-8 glass-card bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-2 border-green-500/20 shadow-xl hover:shadow-green-500/30 transition-all duration-300">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Score SEO
                </h2>
                <div className="text-6xl font-bold text-green-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  {kpiData.seo.score.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Otimização para Motores de Busca
                </p>
              </div>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              <div>
                <h2 className="text-2xl font-bold">Presença nas IAs</h2>
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
                colorClass="from-primary/5 to-primary/10 border-primary/20"
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
                colorClass="from-secondary/5 to-secondary/10 border-secondary/20"
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
                colorClass="from-accent/5 to-accent/10 border-accent/20"
                tooltip={{
                  title: "O que é Confiança das IAs?",
                  description: "É o nível de certeza que as IAs têm ao mencionar sua marca nas respostas.",
                  whyMatters: "Alta confiança significa que as IAs têm informações confiáveis sobre você e recomendam com segurança."
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-green-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <div>
                <h2 className="text-2xl font-bold">Otimização SEO</h2>
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
                colorClass="from-green-500/5 to-green-500/10 border-green-500/20"
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
                colorClass="from-emerald-500/5 to-emerald-500/10 border-emerald-500/20"
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
                colorClass="from-teal-500/5 to-teal-500/10 border-teal-500/20"
                tooltip={{
                  title: "O que é CTR?",
                  description: "É a porcentagem de pessoas que clicam no seu site após vê-lo nos resultados de busca.",
                  whyMatters: "Um CTR alto indica que seu título e descrição são atrativos e relevantes para as buscas."
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <div>
                <h2 className="text-2xl font-bold">Indicadores de Convergência</h2>
                <p className="text-sm text-muted-foreground">
                  Análise estratégica do alinhamento GEO-SEO
                </p>
              </div>
            </div>

            {/* Card de Fundamentação */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-amber-50/50 to-cyan-50/50 dark:from-amber-950/20 dark:to-cyan-950/20 border-2 border-amber-200/50 dark:border-amber-800/50">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    ICE (Index of Cognitive Efficiency)
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <strong>O que é:</strong> Mede o consenso entre diferentes LLMs sobre a taxa de menção da sua marca. Fórmula: ICE = 1 - σ(taxas de menção entre LLMs).
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                    <strong>Como interpretar:</strong> Um ICE alto (≥75) significa que os LLMs concordam sobre sua presença. Valores baixos indicam percepções divergentes entre provedores que precisam ser harmonizadas.
                  </p>
                </div>

                <div className="border-t border-amber-200/50 dark:border-amber-800/50 pt-4">
                  <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    GAP (Precisão de Alinhamento de Observabilidade)
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <strong>O que é:</strong> Mede a precisão do alinhamento entre provedores de LLM. Fórmula: GAP = (Pₐ / Pₜ) × 100 × C, onde Pₐ = provedores alinhados, Pₜ = total de provedores, C = fator de consenso.
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed mt-2">
                    <strong>Como interpretar:</strong> Um GAP alto (≥60) significa que os provedores estão alinhados na representação da sua marca. Valores baixos indicam divergências que exigem ação para aumentar a consistência.
                  </p>
                </div>

                <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
                  <p className="text-xs text-foreground/70 italic">
                    💡 <strong>Dica Estratégica:</strong> Priorize ações quando ICE e GAP estão baixos. Isso indica inconsistências na percepção da sua marca entre LLMs que precisam ser corrigidas.
                  </p>
                </div>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <KPICard
                title="ICE - Índice de Convergência Estratégica"
                value={kpiData.convergence.ice.toFixed(1)}
                icon={Activity}
                description="Consenso entre LLMs (0 a 100, maior = melhor)"
                dataSource="real"
                colorClass="from-cyan-500/5 to-blue-500/10 border-cyan-500/20"
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
                colorClass="from-amber-500/5 to-orange-500/10 border-amber-500/20"
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

          <Card className="p-6 glass-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-4">
              <Zap className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold mb-2">Quer melhorar seus KPIs?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Conecte suas ferramentas de análise para obter insights mais detalhados e recomendações personalizadas.
                </p>
                <Button 
                  onClick={() => navigate('/google-setup')}
                  className="gap-2"
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
  );
}
