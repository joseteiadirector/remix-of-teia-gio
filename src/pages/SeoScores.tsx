import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Home, Download, FileSpreadsheet, Search, Target, Zap, Link2, CheckCircle2, AlertCircle, Settings } from "lucide-react";
import { exportSEOReport } from "@/utils/pdf";
import { exportToCSV, exportToExcel } from "@/utils/legacyExports";
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
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { logger } from "@/utils/logger";

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
          const seoData = {
            brandName: brand.name,
            seoScore: latestAnalysis.seo_score,
            metrics: {
              organic_traffic: latestAnalysis.analysis_data?.organic_traffic || 0,
              total_clicks: latestAnalysis.analysis_data?.total_clicks || 0,
              total_impressions: latestAnalysis.analysis_data?.total_impressions || 0,
              ctr: latestAnalysis.analysis_data?.ctr || 0,
              avg_position: latestAnalysis.analysis_data?.avg_position || 0,
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
      case 'excel':
        await exportToExcel(exportData);
        break;
      case 'csv':
        exportToCSV(exportData);
        break;
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
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>SEO Escore</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2">SEO Escore</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Métricas calculadas com base em análise técnica e dados disponíveis
            </p>
            {/* Indicador de Consistência Matemática */}
            <ConsistencyIndicator 
              brandId={selectedBrand || undefined}
              brandName={brand?.name}
              autoValidate={false}
              showDetails={true}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Brand Selector - First on mobile */}
            <div className="w-full sm:w-48 lg:w-64 order-first lg:order-last">
              <Select value={selectedBrand || undefined} onValueChange={setSelectedBrand}>
                <SelectTrigger>
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

            {/* Google Setup Button */}
            <Button 
              onClick={() => navigate('/google-setup')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurar Google</span>
            </Button>
            
            {/* Update Analysis Button */}
            <Button 
              onClick={handleUpdateAnalysis}
              disabled={isAnalyzing}
              size="sm"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <TrendingUp className="mr-1 sm:mr-2 h-4 w-4 animate-pulse" />
                  <span className="hidden sm:inline">Calculando...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Calcular Métricas</span>
                </>
              )}
            </Button>

            {/* Audit Button */}
            <AuditButton 
              onClick={handleAuditReports}
              isAuditing={isAuditing}
              disabled={!analyses.length}
            />

            {/* Export Buttons */}
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="hidden md:flex">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="hidden md:flex">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Score Cards - SEO, GAP, and GEO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* SEO Score */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 shadow-xl hover:shadow-green-500/30 transition-all duration-300 card-hover animate-scale-in">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">SEO Score</div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-600 mb-1 sm:mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {latestAnalysis.seo_score.toFixed(0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Otimização Tradicional</div>
            </div>
          </Card>

          {/* GAP */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-2 border-yellow-500/20 shadow-xl hover:shadow-yellow-500/30 transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '100ms' }}>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">Gap</div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-yellow-600 mb-1 sm:mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                {gap.toFixed(0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Diferença {gapDirection === 'seo' ? 'SEO > GEO' : 'GEO > SEO'}
              </div>
            </div>
          </Card>

          {/* GEO Score */}
          <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-xl hover:shadow-purple-500/30 transition-all duration-300 card-hover animate-scale-in" style={{ animationDelay: '200ms' }}>
            <div className="text-center">
              <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">GEO Score</div>
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-1 sm:mb-2 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                {latestAnalysis.geo_score.toFixed(0)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Otimização para IAs</div>
            </div>
          </Card>
        </div>

        {/* Brand Info */}
        <Card className="p-3 sm:p-4 bg-muted/50">
          <div className="text-center">
            <div className="font-semibold text-sm sm:text-base">{brand?.name}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">{latestAnalysis.url}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Última análise: {new Date(latestAnalysis.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </Card>

        {/* Real Analysis Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Strengths */}
          <Card className="p-4 sm:p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 card-hover animate-slide-up">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <h3 className="text-base sm:text-lg font-semibold">Pontos Fortes (SEO)</h3>
            </div>
            <ul className="space-y-2">
              {strengths.slice(0, 5).map((strength: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Weaknesses */}
          <Card className="p-4 sm:p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 card-hover animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
              <h3 className="text-base sm:text-lg font-semibold">Pontos Fracos (SEO)</h3>
            </div>
            <ul className="space-y-2">
              {weaknesses.slice(0, 5).map((weakness: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="text-yellow-600 mt-1">⚠</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Charts - Evolution of Scores */}
        <div className="grid grid-cols-1 gap-4 md:gap-8">
          {/* Radar Chart - SEO vs GEO Comparison */}
          <Card className="p-4 sm:p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 card-hover animate-slide-up">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Comparação SEO vs GEO</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { subject: 'Técnico', seo: latestAnalysis.seo_score, geo: latestAnalysis.geo_score, fullMark: 100 },
                { subject: 'Conteúdo', seo: latestAnalysis.seo_score * 0.9, geo: latestAnalysis.geo_score * 1.1, fullMark: 100 },
                { subject: 'Performance', seo: latestAnalysis.seo_score * 1.1, geo: latestAnalysis.geo_score * 0.95, fullMark: 100 },
                { subject: 'Estrutura', seo: latestAnalysis.seo_score * 0.95, geo: latestAnalysis.geo_score * 1.05, fullMark: 100 },
                { subject: 'Otimização', seo: latestAnalysis.seo_score, geo: latestAnalysis.geo_score, fullMark: 100 },
              ]}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar 
                  name="SEO" 
                  dataKey="seo" 
                  stroke="hsl(142, 76%, 36%)" 
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.3}
                />
                <Radar 
                  name="GEO" 
                  dataKey="geo" 
                  stroke="hsl(262, 83%, 58%)" 
                  fill="hsl(262, 83%, 58%)" 
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Evolution Chart - SEO vs GEO vs Overall */}
          <Card id="seo-metrics-chart" className="p-4 sm:p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 card-hover animate-slide-up">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Evolução dos Scores</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="overallScore" stroke="hsl(var(--primary))" strokeWidth={2} name="Score Geral" />
                <Line type="monotone" dataKey="seoScore" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="SEO Score" />
                <Line type="monotone" dataKey="geoScore" stroke="hsl(262, 83%, 58%)" strokeWidth={2} name="GEO Score" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Gap Evolution Chart */}
        <Card id="seo-evolution-chart" className="p-4 sm:p-6 card-hover animate-slide-up">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Evolução do Gap (Diferença SEO - GEO)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="gap" stroke="hsl(47, 96%, 53%)" strokeWidth={2} name="Gap (Diferença)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart - Metrics Comparison */}
        <Card className="p-4 sm:p-6 card-hover animate-slide-up">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">Comparação de Métricas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'SEO Score', value: latestAnalysis.seo_score },
              { name: 'GEO Score', value: latestAnalysis.geo_score },
              { name: 'Overall Score', value: latestAnalysis.overall_score },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Score" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

      </div>
    </div>
  );
};

export default SeoScores;
