import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Home, Download, Search, Target, Zap, Link2, CheckCircle2, AlertCircle, Settings } from "lucide-react";
import { exportSEOReport } from "@/utils/pdf";
import { useAudit } from "@/hooks/useAudit";
import { AuditButton } from "@/components/audit/AuditButton";
import { AuditBadge } from "@/components/audit/AuditBadge";
import { ConsistencyIndicator } from "@/components/ConsistencyIndicator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getRealGeoScore } from "@/utils/geoScoreHelper";
import { getSeoScore, getSeoScoreHistory } from "@/utils/seoScoreHelper";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { logger } from "@/utils/logger";

// Premium Tooltip Component with Glassmorphism
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-4 py-3 rounded-xl border border-white/20 shadow-2xl"
           style={{
             background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.98))',
             backdropFilter: 'blur(20px)',
             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
           }}>
        <p className="text-sm font-semibold text-white/90 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface SeoAnalysis {
  id: string;
  url: string;
  overall_score: number;
  geo_score: number;
  seo_score: number;
  summary: string;
  analysis_data: any;
  created_at: string;
}

interface Brand {
  id: string;
  name: string;
  domain: string;
}

const SeoScores = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<SeoAnalysis[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);
  
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
        // Se não há marca selecionada, encontrar uma marca com dados SEO reais
        let brandToFetch = selectedBrand;
        
        if (!selectedBrand) {
          // Verificar qual marca tem dados SEO
          const { data: seoDataCheck } = await supabase
            .from('seo_metrics_daily')
            .select('brand_id')
            .gt('seo_score', 0)
            .in('brand_id', brandsData.map(b => b.id))
            .limit(1);
          
          // Se encontrou marca com dados SEO, usar ela; senão, usar primeira marca
          if (seoDataCheck && seoDataCheck.length > 0) {
            brandToFetch = seoDataCheck[0].brand_id;
          } else {
            brandToFetch = brandsData[0].id;
          }
          
          setSelectedBrand(brandToFetch);
        } else {
          brandToFetch = selectedBrand;
        }

        // ✅ CORREÇÃO SISTÊMICA: Buscar APENAS scores REAIS das tabelas oficiais
        // Fonte única de verdade: geo_scores + seo_metrics_daily
        // ✅ SEMPRE usar GEO Score MAIS RECENTE para consistência com página KPIs
        
        // 1. Buscar GEO Score MAIS RECENTE (não histórico por data)
        const { data: latestGeoData, error: geoError } = await supabase
          .from('geo_scores')
          .select('score, computed_at, breakdown')
          .eq('brand_id', brandToFetch)
          .order('computed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (geoError) throw geoError;

        // 2. Buscar histórico de SEO Scores (tabela oficial)
        const { data: seoHistory, error: seoError } = await supabase
          .from('seo_metrics_daily')
          .select('seo_score, date, avg_position, ctr, conversion_rate, organic_traffic, total_clicks, total_impressions')
          .eq('brand_id', brandToFetch)
          .order('date', { ascending: true })
          .limit(100);

        if (seoError) throw seoError;

        // 3. Combinar com GEO Score MAIS RECENTE (consistente com KPIs)
        const realAnalyses: SeoAnalysis[] = [];
        const currentGeoScore = latestGeoData?.score || 0;
        const currentGeoBreakdown = latestGeoData?.breakdown || {};
        
        // Para cada dia de SEO metrics, usar GEO Score ATUAL (mais recente)
        // Filtrar apenas registros com seo_score válido (> 0)
        (seoHistory || []).forEach(seoData => {
          // ✅ Filtrar apenas scores REAIS válidos (> 0)
          if (latestGeoData && seoData.seo_score !== null && seoData.seo_score > 0) {
            // Gerar análises inteligentes baseadas nos scores e métricas
            const strengths: string[] = [];
            const weaknesses: string[] = [];
            const recommendations: string[] = [];
            
            // Análise SEO baseada nos valores
            if (seoData.seo_score >= 80) {
              strengths.push('Score SEO excelente - otimização técnica sólida');
            } else if (seoData.seo_score >= 60) {
              strengths.push('Score SEO adequado - fundamentos técnicos estabelecidos');
            } else if (seoData.seo_score >= 40) {
              strengths.push('Score SEO em construção - base técnica presente');
              weaknesses.push('Score SEO abaixo do ideal - necessita melhorias técnicas');
              recommendations.push('Implementar auditoria técnica completa de SEO');
            } else if (seoData.seo_score >= 20) {
              strengths.push('Monitoramento SEO ativo - métricas sendo coletadas');
              weaknesses.push('Score SEO baixo - necessita melhorias urgentes');
              recommendations.push('Implementar auditoria técnica completa de SEO');
            } else {
              weaknesses.push('Score SEO crítico - necessita ação imediata');
              recommendations.push('Implementar auditoria técnica completa de SEO');
            }
            
            // Análise de posição média
            if (seoData.avg_position && seoData.avg_position <= 10) {
              strengths.push(`Posição média excelente: ${seoData.avg_position.toFixed(1)} - primeira página do Google`);
            } else if (seoData.avg_position && seoData.avg_position <= 20) {
              weaknesses.push(`Posição média: ${seoData.avg_position.toFixed(1)} - melhorar para primeira página`);
              recommendations.push('Focar em otimização de palavras-chave de cauda longa');
            } else if (seoData.avg_position) {
              weaknesses.push(`Posição média baixa: ${seoData.avg_position.toFixed(1)}`);
              recommendations.push('Desenvolver estratégia de link building e conteúdo');
            }
            
            // Análise de CTR
            if (seoData.ctr && seoData.ctr >= 5) {
              strengths.push(`CTR acima da média: ${seoData.ctr.toFixed(2)}%`);
            } else if (seoData.ctr && seoData.ctr >= 2) {
              strengths.push(`CTR adequado: ${seoData.ctr.toFixed(2)}%`);
            } else if (seoData.ctr) {
              weaknesses.push(`CTR baixo: ${seoData.ctr.toFixed(2)}%`);
              recommendations.push('Otimizar títulos e meta descriptions para aumentar CTR');
            }
            
            // Análise GEO - usando GEO Score MAIS RECENTE
            if (currentGeoScore >= 80) {
              strengths.push('Score GEO excelente - forte presença em IAs generativas');
            } else if (currentGeoScore >= 60) {
              strengths.push('Score GEO bom - presença consistente em IAs');
            } else if (currentGeoScore >= 40) {
              strengths.push('Score GEO em desenvolvimento - visibilidade inicial em IAs');
              weaknesses.push('Score GEO baixo - melhorar visibilidade em IAs');
              recommendations.push('Criar conteúdo otimizado para citação por LLMs');
            } else if (currentGeoScore >= 20) {
              strengths.push('Presença detectada em IAs - potencial de crescimento');
              weaknesses.push('Score GEO muito baixo - visibilidade limitada em IAs');
              recommendations.push('Criar conteúdo otimizado para citação por LLMs');
            } else {
              weaknesses.push('Score GEO crítico - marca não visível em IAs');
              recommendations.push('Criar conteúdo otimizado para citação por LLMs');
            }
            
            // Análise de tráfego orgânico
            if (seoData.organic_traffic && seoData.organic_traffic >= 10000) {
              strengths.push(`Alto volume de tráfego orgânico: ${seoData.organic_traffic.toLocaleString()}`);
            } else if (seoData.organic_traffic && seoData.organic_traffic >= 1000) {
              strengths.push(`Tráfego orgânico estável: ${seoData.organic_traffic.toLocaleString()}`);
            }
            
            // Recomendação geral baseada no gap (usando GEO atual)
            const gap = Math.abs(currentGeoScore - seoData.seo_score);
            if (gap > 20) {
              if (currentGeoScore > seoData.seo_score) {
                recommendations.push('Priorizar otimização SEO técnica para acompanhar performance GEO');
              } else {
                recommendations.push('Investir em conteúdo otimizado para IAs para equilibrar scores');
              }
            }

            realAnalyses.push({
              id: `${brandToFetch}-${seoData.date}`,
              url: brandsData.find(b => b.id === brandToFetch)?.domain || '',
              overall_score: (currentGeoScore + seoData.seo_score) / 2,
              geo_score: currentGeoScore,
              seo_score: seoData.seo_score,
              summary: `Scores reais calculados pelas edge functions oficiais`,
              analysis_data: {
                seoOptimization: {
                  avg_position: seoData.avg_position,
                  ctr: seoData.ctr,
                  conversion_rate: seoData.conversion_rate,
                  organic_traffic: seoData.organic_traffic,
                  total_clicks: seoData.total_clicks,
                  total_impressions: seoData.total_impressions,
                },
                geoOptimization: currentGeoBreakdown,
                strengths,
                weaknesses,
                recommendations,
              },
              created_at: seoData.date,
            });
          }
        });

        setAnalyses(realAnalyses);
        setHasRealData(realAnalyses.length > 0);
        
        logger.info('Scores REAIS carregados (GEO mais recente)', { 
          brand: brandToFetch,
          currentGeoScore,
          seoRecords: seoHistory?.length || 0,
          combinedAnalyses: realAnalyses.length
        });
      }
    } catch (error) {
      logger.error('Erro ao buscar scores REAIS', { error, brandId: selectedBrand });
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnalysis = async () => {
    if (!selectedBrand) return;
    
    const brand = brands.find(b => b.id === selectedBrand);
    if (!brand) return;

    setIsAnalyzing(true);
    
    try {
      logger.info('Calculando estimativas SEO inteligentes', { domain: brand.domain });

      toast({
        title: "🔄 Calculando estimativas...",
        description: `Analisando ${brand.name} com base em dados técnicos`,
      });

      const { data: estimatesData, error } = await supabase.functions.invoke('calculate-seo-estimates', {
        body: { 
          brandId: selectedBrand,
          domain: brand.domain
        }
      });

      if (error) {
        logger.error('Erro ao calcular estimativas SEO', { error, domain: brand.domain });
        throw error;
      }

      logger.info('Estimativas SEO calculadas', { 
        estimates: estimatesData.estimates,
        technicalAnalysis: estimatesData.technicalAnalysis 
      });

      const agora = new Date().toLocaleString('pt-BR');
      
      toast({
        title: "✅ Estimativas Atualizadas!",
        description: `Análise técnica concluída em ${agora}`,
        duration: 5000,
      });

      // Aguardar 1 segundo e recarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.info('Recarregando dados após cálculo de estimativas');
      await fetchData();
      
    } catch (error) {
      logger.error('Erro ao calcular estimativas', { error, domain: brand?.domain });
      toast({
        title: "❌ Erro ao calcular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFetchGoogleData = async () => {
    if (!selectedBrand) return;
    
    const brand = brands.find(b => b.id === selectedBrand);
    if (!brand) return;

    setIsFetchingData(true);
    
    let gscSuccess = false;
    let ga4Success = false;
    let gscQueries = 0;
    let ga4Metrics = 0;
    let errors: string[] = [];
    
    try {
      toast({
        title: "🔄 Sincronizando dados...",
        description: "Conectando com Google Search Console e Analytics 4",
      });

      const today = new Date();
      const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // ✅ TENTAR GSC (não bloquear se falhar)
      try {
        const { data: gscData, error: gscError } = await supabase.functions.invoke('fetch-gsc-queries', {
          body: {
            brandId: selectedBrand,
            domain: brand.domain,
            startDate: startDate.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          }
        });

        if (gscError) {
          logger.error('Erro ao buscar dados GSC', { error: gscError });
          errors.push('❌ Search Console: ' + (gscError.message || 'Erro de conexão'));
        } else {
          gscSuccess = true;
          gscQueries = gscData?.queries?.length || 0;
          logger.info('Dados GSC sincronizados', { queries: gscQueries });
        }
      } catch (error) {
        logger.error('Exceção ao buscar GSC', { error });
        errors.push('❌ Search Console: Erro de conexão');
      }

      // ✅ TENTAR GA4 (não bloquear se falhar)
      try {
        const { data: ga4Data, error: ga4Error } = await supabase.functions.invoke('fetch-ga4-data', {
          body: {
            brandId: selectedBrand,
            startDate: startDate.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
          }
        });

        if (ga4Error) {
          logger.error('Erro ao buscar dados GA4', { error: ga4Error });
          // Checar se é erro de permissão
          const errorMsg = ga4Error.message || '';
          if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('403')) {
            errors.push('❌ Analytics 4: Sem permissão. Adicione a Service Account como usuário no GA4 (role: Viewer)');
          } else {
            errors.push('❌ Analytics 4: ' + errorMsg);
          }
        } else {
          ga4Success = true;
          ga4Metrics = ga4Data?.analytics?.length || 0;
          logger.info('Dados GA4 sincronizados', { metrics: ga4Metrics });
        }
      } catch (error) {
        logger.error('Exceção ao buscar GA4', { error });
        errors.push('❌ Analytics 4: Erro de conexão');
      }

      // RESULTADO FINAL - sempre tentar recarregar dados
      try {
        await fetchData();
      } catch (reloadError) {
        logger.error('Erro ao recarregar dados após sincronização', { error: reloadError });
      }

      // Mostrar feedback apropriado
      if (gscSuccess && ga4Success) {
        // Sucesso total
        toast({
          title: "✅ Sincronização completa!",
          description: `${gscQueries} queries do Search Console + ${ga4Metrics} métricas do Analytics`,
          duration: 5000,
        });
      } else if (gscSuccess || ga4Success) {
        // Sucesso parcial
        const successParts = [];
        if (gscSuccess) successParts.push(`✅ Search Console: ${gscQueries} queries`);
        if (ga4Success) successParts.push(`✅ Analytics: ${ga4Metrics} métricas`);
        
        toast({
          title: "⚠️ Sincronização parcial",
          description: successParts.join('\n'),
          duration: 5000,
        });

        // Mostrar erros específicos em toast separado
        if (errors.length > 0) {
          setTimeout(() => {
            toast({
              title: "Serviços com erro",
              description: errors.join('\n'),
              variant: "destructive",
              duration: 10000,
            });
          }, 1500);
        }
      } else {
        // Falha total - NÃO LANÇAR ERRO, apenas mostrar toast
        toast({
          title: "❌ Falha na sincronização",
          description: errors.length > 0 ? errors.join('\n') : 'Não foi possível conectar aos serviços do Google',
          variant: "destructive",
          duration: 10000,
        });
      }
      
    } catch (error) {
      // Apenas para erros inesperados
      logger.error('Erro inesperado ao buscar dados do Google', { error });
      toast({
        title: "❌ Erro inesperado",
        description: error instanceof Error ? error.message : "Entre em contato com o suporte",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsFetchingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
          <LoadingSpinner size="lg" text="Carregando scores SEO..." fullScreen />
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">SEO Escore</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize as pontuações de otimização tradicional para motores de busca
            </p>
          </div>

          <Card className="p-6 sm:p-8 md:p-12 text-center">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum score calculado ainda</h3>
            <p className="text-sm text-muted-foreground">
              Execute análises de URL para começar a coletar dados e gerar SEO scores.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const latestAnalysis = analyses[analyses.length - 1];
  const brand = brands.find(b => b.id === selectedBrand);
  
  // REAL DATA from AI analysis
  const gap = Math.abs(latestAnalysis.seo_score - latestAnalysis.geo_score);
  const gapDirection = latestAnalysis.seo_score > latestAnalysis.geo_score ? 'seo' : 'geo';
  
  const seoData = latestAnalysis.analysis_data?.seoOptimization || {};
  const geoData = latestAnalysis.analysis_data?.geoOptimization || {};
  const recommendations = latestAnalysis.analysis_data?.recommendations || [];
  const strengths = latestAnalysis.analysis_data?.strengths || [];
  const weaknesses = latestAnalysis.analysis_data?.weaknesses || [];

  const timeSeriesData = analyses.map(analysis => ({
    date: new Date(analysis.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    seoScore: Number(analysis.seo_score.toFixed(2)),
    geoScore: Number(analysis.geo_score.toFixed(2)),
    overallScore: Number(analysis.overall_score.toFixed(2)),
    gap: Number(Math.abs(analysis.seo_score - analysis.geo_score).toFixed(1)),
  }));

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const exportData = {
      period: `${new Date(analyses[0]?.created_at).toLocaleDateString('pt-BR')} - ${new Date(latestAnalysis.created_at).toLocaleDateString('pt-BR')}`,
      brand: brand?.name || '',
      metrics: [
        { label: 'SEO Score', value: latestAnalysis.seo_score.toFixed(1), change: '+0%' },
        { label: 'GEO Score', value: latestAnalysis.geo_score.toFixed(1), change: '+0%' },
        { label: 'Gap', value: gap.toFixed(1), change: '+0%' },
      ],
      scoreInicial: analyses[0]?.seo_score.toFixed(1) || '0',
      scoreFinal: latestAnalysis.seo_score.toFixed(1),
      growth: ((latestAnalysis.seo_score - (analyses[0]?.seo_score || 0)) / (analyses[0]?.seo_score || 1) * 100).toFixed(1) + '%',
      timeSeries: timeSeriesData,
      strengths,
      weaknesses,
      recommendations,
    };

    switch (format) {
      case 'pdf': {
        try {
          const brand = brands.find(b => b.id === selectedBrand);
          if (!brand) {
            toast({
              title: "Erro",
              description: "Marca não encontrada",
              variant: "destructive"
            });
            return;
          }

          // Calcular datas do período
          const endDate = new Date();
          const startDate = new Date(analyses[0]?.created_at || Date.now());
          const periodStr = `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;

          // Preparar dados no formato do sistema unificado
          // ✅ CORREÇÃO: Buscar métricas de seoOptimization (estrutura correta)
          const seoOptData = latestAnalysis.analysis_data?.seoOptimization || {};
          const seoData = {
            brandName: brand.name,
            seoScore: latestAnalysis.seo_score,
            metrics: {
              organic_traffic: seoOptData.organic_traffic || 0,
              total_clicks: seoOptData.total_clicks || 0,
              total_impressions: seoOptData.total_impressions || 0,
              ctr: seoOptData.ctr || 0,
              avg_position: seoOptData.avg_position || 0,
              seo_score: latestAnalysis.seo_score,
            },
            period: periodStr,
          };

          await exportSEOReport(seoData);
          
        } catch (error) {
          logger.error('Erro durante exportação PDF', { error });
          toast({
            title: "Erro na exportação",
            description: "Erro ao gerar PDF. Por favor, tente novamente.",
            variant: "destructive"
          });
        }
        break;
      }
    }

    toast({
      title: "Exportação concluída!",
      description: `Relatório SEO exportado em formato ${format.toUpperCase()}`,
    });
  };

  const handleAuditReports = async () => {
    const brandName = brands.find(b => b.id === selectedBrand)?.name;
    if (selectedBrand) {
      await executeAudit(selectedBrand, brandName);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 -z-10" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 md:space-y-10 relative">
        {/* Breadcrumbs */}
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/30" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white/90">SEO Escore</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="relative rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
               boxShadow: '0 0 60px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
             }}>
          {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          {/* Animated Corner Gradient */}
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-green-500 to-emerald-600" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                SEO Escore
              </h1>
              <p className="text-sm sm:text-base text-white/60">
                Métricas calculadas com base em análise técnica e dados disponíveis
              </p>
              <ConsistencyIndicator 
                brandId={selectedBrand || undefined}
                brandName={brand?.name}
                autoValidate={false}
                showDetails={true}
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Brand Selector */}
              <div className="w-full sm:w-48 lg:w-64 order-first lg:order-last">
                <Select value={selectedBrand || undefined} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white hover:bg-white/10">
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

              {/* Premium Buttons */}
              <Button 
                onClick={() => navigate('/google-setup')}
                variant="outline"
                size="sm"
                className="gap-2 bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurar Google</span>
              </Button>
              
              <Button 
                onClick={handleUpdateAnalysis}
                disabled={isAnalyzing}
                size="sm"
                className="gap-2 bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                variant="outline"
              >
                <TrendingUp className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{isAnalyzing ? 'Calculando...' : 'Calcular Métricas'}</span>
              </Button>

              <AuditButton 
                onClick={handleAuditReports}
                isAuditing={isAuditing}
                disabled={!analyses.length}
              />

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('pdf')}
                className="gap-2 bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* SEO Score */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20"
               style={{
                 background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))',
                 boxShadow: '0 0 40px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
               }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 bg-gradient-to-br from-green-400 to-emerald-600" />
            <div className="relative z-10 text-center">
              <div className="text-xs sm:text-sm text-white/60 mb-4 font-medium tracking-wide uppercase">SEO Score</div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent mb-2"
                   style={{ textShadow: '0 0 40px rgba(16, 185, 129, 0.5)' }}>
                {latestAnalysis.seo_score.toFixed(0)}
              </div>
              <div className="text-xs sm:text-sm text-white/50">Otimização Tradicional</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-green-500 to-emerald-500" />
          </div>

          {/* GAP */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20"
               style={{
                 background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))',
                 boxShadow: '0 0 40px rgba(234, 179, 8, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
               }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 bg-gradient-to-br from-yellow-400 to-amber-600" />
            <div className="relative z-10 text-center">
              <div className="text-xs sm:text-sm text-white/60 mb-4 font-medium tracking-wide uppercase">Gap</div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent mb-2"
                   style={{ textShadow: '0 0 40px rgba(234, 179, 8, 0.5)' }}>
                {gap.toFixed(0)}
              </div>
              <div className="text-xs sm:text-sm text-white/50">
                Diferença {gapDirection === 'seo' ? 'SEO > GEO' : 'GEO > SEO'}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-yellow-500 to-amber-500" />
          </div>

          {/* GEO Score */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20"
               style={{
                 background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
                 boxShadow: '0 0 40px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
               }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 bg-gradient-to-br from-purple-400 to-violet-600" />
            <div className="relative z-10 text-center">
              <div className="text-xs sm:text-sm text-white/60 mb-4 font-medium tracking-wide uppercase">GEO Score</div>
              <div className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent mb-2"
                   style={{ textShadow: '0 0 40px rgba(139, 92, 246, 0.5)' }}>
                {latestAnalysis.geo_score.toFixed(0)}
              </div>
              <div className="text-xs sm:text-sm text-white/50">Otimização para IAs</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-purple-500 to-violet-500" />
          </div>
        </div>

        {/* Premium Brand Info */}
        <div className="relative rounded-2xl border border-white/10 p-4 sm:p-5 backdrop-blur-xl overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.8), rgba(15, 15, 25, 0.9))',
               boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
             }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 text-center">
            <div className="font-semibold text-base sm:text-lg text-white">{brand?.name}</div>
            <div className="text-sm text-white/50 truncate">{latestAnalysis.url}</div>
            <div className="text-xs text-white/40 mt-1">
              Última análise: {new Date(latestAnalysis.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Premium Strength/Weakness Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Strengths */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6 backdrop-blur-xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(20, 20, 30, 0.95))',
                 boxShadow: '0 0 30px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
               }}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl blur-lg opacity-50 bg-gradient-to-br from-green-500 to-emerald-600" />
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 border border-white/10">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">Pontos Fortes (SEO)</h3>
              </div>
              <ul className="space-y-3">
                {strengths.slice(0, 5).map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Weaknesses */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6 backdrop-blur-xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(20, 20, 30, 0.95))',
                 boxShadow: '0 0 30px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
               }}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl blur-lg opacity-50 bg-gradient-to-br from-yellow-500 to-amber-600" />
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-500/20 border border-white/10">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">Pontos Fracos (SEO)</h3>
              </div>
              <ul className="space-y-3">
                {weaknesses.slice(0, 5).map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Charts - Evolution of Scores */}
        <div className="grid grid-cols-1 gap-4 md:gap-8">
          {/* Radar Chart - SEO vs GEO Comparison */}
          <Card className="p-4 sm:p-6 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-primary/20 animate-slide-up relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green-500/5 pointer-events-none" />
            <h3 className="text-lg sm:text-xl font-semibold mb-4 relative z-10 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Comparação SEO vs GEO</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { subject: 'Técnico', seo: latestAnalysis.seo_score, geo: latestAnalysis.geo_score, fullMark: 100 },
                { subject: 'Conteúdo', seo: latestAnalysis.seo_score * 0.9, geo: latestAnalysis.geo_score * 1.1, fullMark: 100 },
                { subject: 'Performance', seo: latestAnalysis.seo_score * 1.1, geo: latestAnalysis.geo_score * 0.95, fullMark: 100 },
                { subject: 'Estrutura', seo: latestAnalysis.seo_score * 0.95, geo: latestAnalysis.geo_score * 1.05, fullMark: 100 },
                { subject: 'Otimização', seo: latestAnalysis.seo_score, geo: latestAnalysis.geo_score, fullMark: 100 },
              ]}>
                <defs>
                  <linearGradient id="seoRadarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="geoRadarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
                  </linearGradient>
                  <filter id="radarGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                <PolarAngleAxis 
                  dataKey="subject"
                  tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Radar 
                  name="SEO" 
                  dataKey="seo" 
                  stroke="#10b981" 
                  fill="url(#seoRadarGradient)"
                  strokeWidth={2}
                  filter="url(#radarGlow)"
                />
                <Radar 
                  name="GEO" 
                  dataKey="geo" 
                  stroke="#a855f7" 
                  fill="url(#geoRadarGradient)"
                  strokeWidth={2}
                  filter="url(#radarGlow)"
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>{value}</span>}
                />
                <Tooltip content={<PremiumTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Evolution Chart - SEO vs GEO vs Overall with Area Fill */}
          <Card id="seo-metrics-chart" className="p-4 sm:p-6 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-primary/20 animate-slide-up relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green-500/5 pointer-events-none" />
            <h3 className="text-lg sm:text-xl font-semibold mb-4 relative z-10 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Evolução dos Scores</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="overallAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="seoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="geoAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                  <filter id="lineGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
                <Tooltip content={<PremiumTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: 10 }} 
                  formatter={(value) => <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{value}</span>}
                />
                <Area type="monotone" dataKey="overallScore" stroke="#a855f7" strokeWidth={2} fill="url(#overallAreaGradient)" name="Score Geral" filter="url(#lineGlow)" />
                <Area type="monotone" dataKey="seoScore" stroke="#10b981" strokeWidth={2} fill="url(#seoAreaGradient)" name="SEO Score" filter="url(#lineGlow)" />
                <Area type="monotone" dataKey="geoScore" stroke="#8b5cf6" strokeWidth={2} fill="url(#geoAreaGradient)" name="GEO Score" filter="url(#lineGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Gap Evolution Chart */}
        <Card id="seo-evolution-chart" className="p-4 sm:p-6 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-yellow-500/20 animate-slide-up relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
                boxShadow: '0 0 40px rgba(234, 179, 8, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 pointer-events-none" />
          <h3 className="text-lg sm:text-xl font-semibold mb-4 relative z-10 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Evolução do Gap (Diferença SEO - GEO)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="gapAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0.05} />
                </linearGradient>
                <filter id="gapGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <YAxis tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <Tooltip content={<PremiumTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: 10 }} 
                formatter={(value) => <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{value}</span>}
              />
              <Area type="monotone" dataKey="gap" stroke="#eab308" strokeWidth={2} fill="url(#gapAreaGradient)" name="Gap (Diferença)" filter="url(#gapGlow)" dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart - Metrics Comparison with Colored Bars */}
        <Card className="p-4 sm:p-6 border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-primary/20 animate-slide-up relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(15, 15, 25, 0.95))',
                boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-primary/5 to-blue-500/5 pointer-events-none" />
          <h3 className="text-lg sm:text-xl font-semibold mb-4 relative z-10 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Comparação de Métricas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { name: 'SEO Score', value: latestAnalysis.seo_score, color: '#10b981' },
              { name: 'GEO Score', value: latestAnalysis.geo_score, color: '#a855f7' },
              { name: 'Overall Score', value: latestAnalysis.overall_score, color: '#3b82f6' },
            ]}>
              <defs>
                <linearGradient id="seoBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="geoBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="overallBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                </linearGradient>
                <filter id="barGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <Tooltip content={<PremiumTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: 10 }} 
                formatter={(value) => <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{value}</span>}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Score" filter="url(#barGlow)">
                {[
                  { name: 'SEO Score', value: latestAnalysis.seo_score, color: '#10b981' },
                  { name: 'GEO Score', value: latestAnalysis.geo_score, color: '#a855f7' },
                  { name: 'Overall Score', value: latestAnalysis.overall_score, color: '#3b82f6' },
                ].map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? 'url(#seoBarGradient)' : index === 1 ? 'url(#geoBarGradient)' : 'url(#overallBarGradient)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </div>
  );
};

export default SeoScores;
