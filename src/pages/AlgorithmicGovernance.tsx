import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Scale, Brain, ExternalLink, Edit, Eye, Search, RefreshCw, Database, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import RecommendationsChecklist from "@/components/recommendations/RecommendationsChecklist";
import RecommendationsImpact from "@/components/recommendations/RecommendationsImpact";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logger } from "@/utils/logger";
import { generateGovernanceHTML, ExportDataGovernance } from "@/utils/pdf";

export default function AlgorithmicGovernance() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedBrandId, setSelectedBrandId, brands: globalBrands, selectedBrand } = useBrand();
  const [isCollecting, setIsCollecting] = useState(false);

  // Resetar loading ao mudar de marca
  useEffect(() => {
    setIsCollecting(false);
  }, [selectedBrandId]);

  const { data: governanceMetrics, isLoading } = useQuery({
    queryKey: ["governance-metrics", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return null;

      // Buscar métricas IGO mais recentes
      const { data: igoData, error: igoError } = await supabase
        .from("igo_metrics_history")
        .select("*")
        .eq("brand_id", selectedBrandId)
        .order("calculated_at", { ascending: false })
        .limit(30);

      if (igoError) throw igoError;

      // Buscar CPI de geo_scores (FONTE OFICIAL)
      const { data: geoData } = await supabase
        .from("geo_scores")
        .select("cpi")
        .eq("brand_id", selectedBrandId)
        .gt("cpi", 0)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar menções LLM
      const { data: mentionsData, error: mentionsError } = await supabase
        .from("mentions_llm")
        .select("*")
        .eq("brand_id", selectedBrandId)
        .gte("collected_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (mentionsError) throw mentionsError;

      // ============================================================================
      // FONTES OFICIAIS DE MÉTRICAS KAPI (NÃO MODIFICAR SEM ATUALIZAR DOCUMENTAÇÃO)
      // ============================================================================
      // - ICE, GAP, Stability: igo_metrics_history (calculate-igo-metrics)
      // - CPI: geo_scores (calculate-geo-metrics) - FONTE OFICIAL para Compliance
      // ============================================================================
      const avgStability = igoData?.reduce((sum, d) => sum + d.cognitive_stability, 0) / (igoData?.length || 1);
      const avgCPI = geoData?.cpi || igoData?.reduce((sum, d) => sum + d.cpi, 0) / (igoData?.length || 1);
      const avgGAP = igoData?.reduce((sum, d) => sum + d.gap, 0) / (igoData?.length || 1);
      const avgICE = igoData?.reduce((sum, d) => sum + d.ice, 0) / (igoData?.length || 1);

      // Análise multi-LLM
      const byProvider = mentionsData?.reduce((acc: any, m: any) => {
        if (!acc[m.provider]) acc[m.provider] = [];
        acc[m.provider].push(m);
        return acc;
      }, {});

      // ============================================================================
      // NORMALIZAÇÃO DE CONFIANÇA - CRÍTICO PARA CONSISTÊNCIA PDF
      // ============================================================================
      // confidence no banco pode estar em escala 0-1 ou 0-100
      // Normalizamos para escala 0-100 para exibição consistente
      // ============================================================================
      const providerConsensus = Object.entries(byProvider || {}).map(([provider, data]: [string, any]) => {
        const rawAvgConfidence = data.reduce((sum: number, m: any) => sum + m.confidence, 0) / data.length;
        // Normalizar: se média <= 1, assume escala 0-1 e converte
        const normalizedAvgConfidence = rawAvgConfidence <= 1 ? rawAvgConfidence * 100 : rawAvgConfidence;
        return {
          provider,
          avgConfidence: normalizedAvgConfidence,
          mentionRate: (data.filter((m: any) => m.mentioned).length / data.length) * 100
        };
      });

      // Compliance score (baseado em ICE, estabilidade, CPI e GAP - todos maior = melhor)
      const complianceScore = (avgICE + avgStability + avgCPI + avgGAP) / 4;

      // Generate intelligent recommendations based on metrics
      const generateRecommendations = () => {
        const recommendations = [];
        
        // CPI Analysis
        if (avgCPI < 50) {
          recommendations.push({
            priority: 'critical',
            category: 'CPI - Consistência Preditiva',
            title: 'CPI Crítico: Alta Divergência entre LLMs',
            description: `Score atual: ${avgCPI.toFixed(1)}%. Os LLMs estão mostrando níveis de confiança muito diferentes, indicando inconsistência nas respostas.`,
            actions: [
              'Revisar e padronizar o contexto da marca fornecido aos LLMs',
              'Verificar se há ambiguidades nas descrições da marca',
              'Considerar ajustar os prompts para maior clareza',
              'Analisar quais LLMs específicos estão causando maior variância'
            ],
            impact: 'Alto impacto na confiabilidade das métricas GEO'
          });
        } else if (avgCPI < 70) {
          recommendations.push({
            priority: 'high',
            category: 'CPI - Consistência Preditiva',
            title: 'CPI Moderado: Melhorias Recomendadas',
            description: `Score atual: ${avgCPI.toFixed(1)}%. Há espaço para melhorar a consistência entre LLMs.`,
            actions: [
              'Refinar descrições da marca para maior clareza',
              'Uniformizar contexto fornecido aos diferentes LLMs',
              'Monitorar tendências de melhoria ao longo do tempo'
            ],
            impact: 'Médio impacto - otimização recomendada'
          });
        }

        // GAP Analysis
        if (avgGAP < 50) {
          recommendations.push({
            priority: 'high',
            category: 'GAP - Alinhamento de Governança',
            title: 'GAP Baixo: Alinhamento Insuficiente',
            description: `Score atual: ${avgGAP.toFixed(1)}%. Baixa confiança média dos LLMs ou cobertura incompleta.`,
            actions: [
              'Expandir cobertura para 4+ LLMs diferentes',
              'Melhorar qualidade e relevância do conteúdo da marca',
              'Otimizar SEO e presença digital para aumentar menções',
              'Verificar se contexto está atualizado e completo'
            ],
            impact: 'Alto impacto na visibilidade algorítmica'
          });
        } else if (avgGAP < 70) {
          recommendations.push({
            priority: 'medium',
            category: 'GAP - Alinhamento de Governança',
            title: 'GAP Adequado: Oportunidades de Crescimento',
            description: `Score atual: ${avgGAP.toFixed(1)}%. Bom alinhamento, mas pode melhorar.`,
            actions: [
              'Aumentar cobertura de LLMs se ainda não tem 4+',
              'Fortalecer presença em conteúdos relevantes',
              'Manter consistência nas menções positivas'
            ],
            impact: 'Médio impacto - crescimento gradual'
          });
        }

        // Cognitive Stability Analysis
        if (avgStability < 70) {
          recommendations.push({
            priority: 'high',
            category: 'Estabilidade Cognitiva',
            title: 'Volatilidade Temporal Detectada',
            description: `Score atual: ${avgStability.toFixed(1)}%. Alta variação entre períodos recentes e anteriores.`,
            actions: [
              'Investigar causas de mudanças abruptas nas menções',
              'Verificar se houve mudanças recentes no conteúdo/site',
              'Estabilizar presença digital com conteúdo consistente',
              'Monitorar eventos externos que possam afetar percepção'
            ],
            impact: 'Alto impacto na previsibilidade'
          });
        }

        // Overall Compliance
        if (complianceScore >= 85) {
          recommendations.push({
            priority: 'info',
            category: 'Compliance Geral',
            title: 'Excelente Compliance Algorítmico',
            description: `Score: ${complianceScore.toFixed(1)}%. Sistema em conformidade ótima.`,
            actions: [
              'Manter estratégias atuais',
              'Continuar monitoramento regular',
              'Documentar boas práticas para replicação'
            ],
            impact: 'Manutenção de excelência'
          });
        } else if (complianceScore < 50) {
          recommendations.push({
            priority: 'critical',
            category: 'Compliance Geral',
            title: 'Intervenção Imediata Necessária',
            description: `Score: ${complianceScore.toFixed(1)}%. Múltiplas áreas precisam de atenção urgente.`,
            actions: [
              'Revisar estratégia GEO completa',
              'Priorizar ações em CPI e GAP simultaneamente',
              'Considerar consultoria especializada',
              'Implementar plano de ação de 30 dias'
            ],
            impact: 'Crítico - ação imediata requerida'
          });
        }

        return recommendations;
      };

      const intelligentRecommendations = generateRecommendations();

      // Detectar riscos com detalhes completos
      const risks = [];
      
      if (avgStability < 70) {
        risks.push({ 
          level: 'high',
          title: 'Instabilidade Cognitiva Crítica',
          message: `Estabilidade em ${Math.round(avgStability)}% (mínimo: 70%)`,
          details: 'Respostas inconsistentes entre execuções. LLMs apresentando variações significativas nas inferências.',
          metric: avgStability,
          recommendation: 'Revisar prompts e contexto fornecido aos LLMs',
          timestamp: new Date().toISOString()
        });
      }
      
      if (avgCPI < 60) {
        risks.push({ 
          level: 'medium',
          title: 'CPI Abaixo do Threshold',
          message: `Cognitive Prominence Index em ${Math.round(avgCPI)}% (recomendado: 60%)`,
          details: 'Marca com baixa proeminência nas respostas dos LLMs. Possível competição com concorrentes.',
          metric: avgCPI,
          recommendation: 'Intensificar estratégias de posicionamento e autoridade cognitiva',
          timestamp: new Date().toISOString()
        });
      }
      
      if (avgGAP < 75) {
        risks.push({ 
          level: 'medium',
          title: 'Desalinhamento de Governança',
          message: `GAP em ${Math.round(avgGAP)}% (recomendado: 75%)`,
          details: 'Governança algorítmica apresenta gaps. Comportamento dos LLMs diverge das expectativas.',
          metric: avgGAP,
          recommendation: 'Auditar políticas de governança e ajustar estratégias de compliance',
          timestamp: new Date().toISOString()
        });
      }

      const consensusVariance = Math.max(...providerConsensus.map(p => p.mentionRate)) - 
                               Math.min(...providerConsensus.map(p => p.mentionRate));
      
      if (consensusVariance > 30) {
        const maxProvider = providerConsensus.find(p => p.mentionRate === Math.max(...providerConsensus.map(p => p.mentionRate)));
        const minProvider = providerConsensus.find(p => p.mentionRate === Math.min(...providerConsensus.map(p => p.mentionRate)));
        
        risks.push({ 
          level: 'high',
          title: 'Divergência Multi-LLM Crítica',
          message: `Variação de ${Math.round(consensusVariance)}% entre LLMs`,
          details: `${maxProvider?.provider} (${Math.round(maxProvider?.mentionRate || 0)}%) vs ${minProvider?.provider} (${Math.round(minProvider?.mentionRate || 0)}%). Possível alucinação ou viés algorítmico.`,
          metric: consensusVariance,
          recommendation: 'Investigar causas da divergência e executar detecção de alucinações',
          affectedLLMs: [maxProvider?.provider, minProvider?.provider].filter(Boolean),
          timestamp: new Date().toISOString()
        });
      }

      return {
        complianceScore,
        avgStability,
        avgCPI,
        avgGAP,
        avgICE,
        providerConsensus,
        risks,
        recommendations: intelligentRecommendations,
        totalDataPoints: igoData?.length || 0,
        lastUpdate: igoData?.[0]?.calculated_at
      };
    },
    enabled: !!selectedBrandId,
  });

  // Handler para mudança de marca com log detalhado
  const handleBrandChange = useCallback((brandId: string) => {
    const brand = globalBrands.find(b => b.id === brandId);
    logger.info('Mudança de marca no Select', {
      novaBrandId: brandId,
      novaBrandName: brand?.name,
      brandAnteriorId: selectedBrandId,
      brandAnteriorName: globalBrands.find(b => b.id === selectedBrandId)?.name
    });
    setSelectedBrandId(brandId);
  }, [globalBrands, selectedBrandId, setSelectedBrandId]);

  const collectLLMData = useCallback(async () => {
    // Capturar o brandId mais recente diretamente do estado
    const currentBrandId = selectedBrandId;
    
    logger.info('Estado atual no momento da coleta', {
      selectedBrandId: currentBrandId,
      selectedBrandName: globalBrands.find(b => b.id === currentBrandId)?.name,
      allBrands: globalBrands.map(b => ({ id: b.id, name: b.name }))
    });
    
    if (!currentBrandId) {
      toast({
        title: "Erro",
        description: "Selecione uma marca primeiro",
        variant: "destructive"
      });
      return;
    }

    setIsCollecting(true);
    
    // Timeout de segurança de 4 minutos (coletas podem levar até 3 minutos com múltiplos LLMs)
    const timeoutId = setTimeout(() => {
      setIsCollecting(false);
      toast({
        title: "Timeout",
        description: "A coleta está demorando mais que o esperado. Tente novamente.",
        variant: "destructive"
      });
    }, 240000); // 4 minutos
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      logger.info('Iniciando coleta para brandId', { brandId: currentBrandId });

      toast({
        title: "Coletando dados...",
        description: "Iniciando coleta de menções em LLMs. Isso pode levar alguns minutos.",
      });

      const { data, error } = await supabase.functions.invoke('collect-llm-mentions', {
        body: { 
          brandId: currentBrandId
        }
      });

      clearTimeout(timeoutId); // Cancelar timeout se sucesso

      if (error) {
        logger.error('Erro do edge function', { error });
        throw error;
      }

      logger.info('Coleta concluída', { data });

      toast({
        title: "Coleta concluída!",
        description: `${data?.mentions_collected || 0} menções coletadas. Calculando métricas...`,
      });

      // Calcular GEO Score + CPI automaticamente
      const { data: geoData, error: geoError } = await supabase.functions.invoke('calculate-geo-metrics', {
        body: { brandId: currentBrandId, userId: user?.id }
      });

      if (geoError) {
        logger.error('Erro ao calcular GEO e CPI', { geoError });
        toast({
          title: "Aviso",
          description: "Menções coletadas, mas houve erro ao calcular GEO/CPI.",
          variant: "destructive"
        });
      } else {
        logger.info('GEO e CPI calculados automaticamente', { geoData });
      }

      // Calcular métricas IGO
      const { data: igoData, error: igoError } = await supabase.functions.invoke('calculate-igo-metrics', {
        body: { brandId: currentBrandId }
      });

      if (igoError) {
        logger.error('Erro ao calcular métricas IGO', { igoError });
        toast({
          title: "Métricas parcialmente calculadas",
          description: "Menções coletadas, mas houve erro ao calcular IGO. Tente novamente.",
          variant: "destructive"
        });
      } else {
        logger.info('Métricas IGO calculadas', { igoData });
        toast({
          title: "✅ Sucesso Total!",
          description: `${data?.mentions_collected || 0} menções + GEO Score + CPI + IGO calculados`,
        });
      }

      // Recarregar dados
      await queryClient.invalidateQueries({ queryKey: ["governance-metrics", currentBrandId] });

    } catch (error: any) {
      clearTimeout(timeoutId); // Cancelar timeout se erro
      logger.error('Erro completo ao coletar dados', { error });
      
      const errorMessage = error?.message || error?.error || "Não foi possível coletar os dados dos LLMs";
      
      toast({
        title: "Erro na coleta",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCollecting(false);
    }
  }, [selectedBrandId, globalBrands, toast, queryClient]);

  const getComplianceLevel = (score: number) => {
    if (score >= 85) return { label: "Excelente", variant: "default" as const, color: "text-green-600" };
    if (score >= 70) return { label: "Bom", variant: "secondary" as const, color: "text-blue-600" };
    if (score >= 60) return { label: "Adequado", variant: "secondary" as const, color: "text-yellow-600" };
    return { label: "Crítico", variant: "destructive" as const, color: "text-red-600" };
  };

  const handleDownloadPDF = async () => {
    if (!governanceMetrics || !selectedBrand) {
      toast({
        title: "Erro",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Gerando PDF...",
        description: "Preparando relatório elegante de Governança Algorítmica",
      });

      // Preparar dados para o gerador HTML
      const exportData: ExportDataGovernance = {
        brandName: selectedBrand.name,
        complianceScore: governanceMetrics.complianceScore,
        avgICE: governanceMetrics.avgICE,
        avgStability: governanceMetrics.avgStability,
        avgCPI: governanceMetrics.avgCPI,
        avgGAP: governanceMetrics.avgGAP,
        totalDataPoints: governanceMetrics.totalDataPoints,
        risks: governanceMetrics.risks || [],
        recommendations: governanceMetrics.recommendations || [],
        providerConsensus: governanceMetrics.providerConsensus || [],
        period: 'Últimos 30 dias'
      };

      // Gerar HTML elegante
      const html = generateGovernanceHTML(exportData);
      const fileName = `governanca-algoritmica-${selectedBrand.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;

      // Chamar PDFShift via Edge Function
      const { data, error } = await supabase.functions.invoke('generate-pdf-with-pdfshift', {
        body: {
          html,
          filename: fileName,
          options: {
            format: 'A4',
            margin: '15mm'
          }
        }
      });

      if (error) throw error;

      // Criar blob e download
      const pdfBlob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF exportado!",
        description: `Relatório elegante de Governança Algorítmica salvo: ${fileName}`,
      });

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 border-2 border-purple-500/30 p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 to-transparent blur-3xl" />
        
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.5)]">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent">
              Governança Algorítmica
            </h1>
            <p className="text-purple-200/80 mt-1">
              Auditoria e compliance de comportamento de LLMs baseado em métricas IGO
            </p>
          </div>
        </div>
      </div>

      {/* Brand Selection Card - Premium */}
      <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Selecionar Marca para Auditoria
              </CardTitle>
              <CardDescription className="text-slate-400">
                Escolha uma marca para análise de governança algorítmica
              </CardDescription>
            </div>
            {selectedBrandId && governanceMetrics && (
              <Button 
                onClick={handleDownloadPDF}
                variant="outline"
                className="gap-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
              >
                <Download className="h-4 w-4" />
                Exportar PDF Completo
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1"></div>
            {selectedBrandId && governanceMetrics && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Database className="h-4 w-4 text-purple-400" />
                <span>
                  Última atualização: {governanceMetrics.lastUpdate 
                    ? formatDistanceToNow(new Date(governanceMetrics.lastUpdate), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })
                    : 'Sem dados'}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedBrandId || ""} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-full bg-slate-800/50 border-slate-600/50 text-slate-200">
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              {globalBrands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedBrandId && (
            <div className="flex items-center gap-3 pt-2">
              <Button 
                onClick={collectLLMData}
                disabled={isCollecting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                {isCollecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Coletando dados...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Coletar Dados dos LLMs
                  </>
                )}
              </Button>
              
              {governanceMetrics && (
                <Badge variant="outline" className="whitespace-nowrap border-slate-600 text-slate-300">
                  {governanceMetrics.totalDataPoints} pontos de dados
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && selectedBrandId && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Carregando métricas de governança...
          </CardContent>
        </Card>
      )}

      {governanceMetrics && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 bg-slate-900/80 border border-slate-700/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Visão Geral</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Compliance</TabsTrigger>
            <TabsTrigger value="risks" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Riscos</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Recomendações</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Checklist</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Impacto</TabsTrigger>
            <TabsTrigger value="multi-llm" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Multi-LLM</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Score de Compliance - Premium */}
            <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                    <Scale className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Score de Compliance Algorítmico</span>
                    {selectedBrand && (
                      <span className="text-sm font-normal text-slate-400">
                        {selectedBrand.name}
                      </span>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Índice geral baseado em IGO (ICE, Estabilidade, CPI, GAP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-5xl font-bold ${
                    governanceMetrics.complianceScore >= 85 ? 'bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent' :
                    governanceMetrics.complianceScore >= 70 ? 'bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent' :
                    governanceMetrics.complianceScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent' :
                    'bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent'
                  }`}>
                    {Math.round(governanceMetrics.complianceScore)}
                  </span>
                  <Badge className={`text-lg px-4 py-2 ${
                    governanceMetrics.complianceScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                    governanceMetrics.complianceScore >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' :
                    governanceMetrics.complianceScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
                    'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  }`}>
                    {getComplianceLevel(governanceMetrics.complianceScore).label}
                  </Badge>
                </div>
                <div className="h-3 rounded-full bg-slate-800/80 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      governanceMetrics.complianceScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                      governanceMetrics.complianceScore >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                      governanceMetrics.complianceScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                      'bg-gradient-to-r from-red-500 to-pink-400'
                    }`}
                    style={{ width: `${governanceMetrics.complianceScore}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Baseado em {governanceMetrics.totalDataPoints} pontos de dados
                </p>
              </CardContent>
            </Card>

            {/* Métricas Principais KAPI - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* ICE Card */}
              <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex flex-col gap-1">
                    <span className="text-emerald-300">ICE (Cognitive Efficiency)</span>
                    {selectedBrand && (
                      <span className="text-xs font-normal text-slate-500">
                        {selectedBrand.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                    {Math.round(governanceMetrics.avgICE)}%
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all" style={{ width: `${governanceMetrics.avgICE}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* Estabilidade Card */}
              <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:shadow-[0_0_35px_rgba(59,130,246,0.25)] transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex flex-col gap-1">
                    <span className="text-blue-300">Estabilidade Cognitiva</span>
                    {selectedBrand && (
                      <span className="text-xs font-normal text-slate-500">
                        {selectedBrand.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {Math.round(governanceMetrics.avgStability)}%
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${governanceMetrics.avgStability}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* CPI Card */}
              <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-slate-900 via-orange-950/20 to-slate-900 shadow-[0_0_25px_rgba(249,115,22,0.15)] hover:shadow-[0_0_35px_rgba(249,115,22,0.25)] transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex flex-col gap-1">
                    <span className="text-orange-300">CPI (Cognitive Index)</span>
                    {selectedBrand && (
                      <span className="text-xs font-normal text-slate-500">
                        {selectedBrand.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    {Math.round(governanceMetrics.avgCPI)}%
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all" style={{ width: `${governanceMetrics.avgCPI}%` }} />
                  </div>
                </CardContent>
              </Card>

              {/* GAP Card */}
              <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 shadow-[0_0_25px_rgba(139,92,246,0.15)] hover:shadow-[0_0_35px_rgba(139,92,246,0.25)] transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex flex-col gap-1">
                    <span className="text-purple-300">GAP (Governance Alignment)</span>
                    {selectedBrand && (
                      <span className="text-xs font-normal text-slate-500">
                        {selectedBrand.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-violet-500 bg-clip-text text-transparent">
                    {Math.round(governanceMetrics.avgGAP)}%
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all" style={{ width: `${governanceMetrics.avgGAP}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <CardHeader>
                <CardTitle className="flex flex-col gap-1">
                  <span className="text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Checklist de Compliance</span>
                  {selectedBrand && (
                    <span className="text-sm font-normal text-slate-400">
                      {selectedBrand.name}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Verificação de conformidade com diretrizes de governança algorítmica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  governanceMetrics.avgICE >= 80 
                    ? 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-yellow-500/30 bg-yellow-950/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      governanceMetrics.avgICE >= 80 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                    }`}>
                      {governanceMetrics.avgICE >= 80 ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">ICE (Eficiência Cognitiva)</p>
                      <p className="text-sm text-slate-400">Mínimo recomendado: 80%</p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 ${governanceMetrics.avgICE >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'}`}>
                    {Math.round(governanceMetrics.avgICE)}%
                  </Badge>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  governanceMetrics.avgStability >= 70 
                    ? 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-yellow-500/30 bg-yellow-950/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      governanceMetrics.avgStability >= 70 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                    }`}>
                      {governanceMetrics.avgStability >= 70 ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">Estabilidade Cognitiva</p>
                      <p className="text-sm text-slate-400">Mínimo recomendado: 70%</p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 ${governanceMetrics.avgStability >= 70 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'}`}>
                    {Math.round(governanceMetrics.avgStability)}%
                  </Badge>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  governanceMetrics.avgCPI >= 60 
                    ? 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-yellow-500/30 bg-yellow-950/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      governanceMetrics.avgCPI >= 60 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                    }`}>
                      {governanceMetrics.avgCPI >= 60 ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">CPI Score</p>
                      <p className="text-sm text-slate-400">Mínimo recomendado: 60%</p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 ${governanceMetrics.avgCPI >= 60 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'}`}>
                    {Math.round(governanceMetrics.avgCPI)}%
                  </Badge>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  governanceMetrics.avgGAP >= 75 
                    ? 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'border-yellow-500/30 bg-yellow-950/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      governanceMetrics.avgGAP >= 75 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                    }`}>
                      {governanceMetrics.avgGAP >= 75 ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">Alinhamento de Governança (GAP)</p>
                      <p className="text-sm text-slate-400">Mínimo recomendado: 75%</p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 ${governanceMetrics.avgGAP >= 75 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'}`}>
                    {Math.round(governanceMetrics.avgGAP)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Análise de Riscos</span>
                    {selectedBrand && (
                      <span className="text-sm font-normal text-slate-400">
                        {selectedBrand.name}
                      </span>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Riscos identificados através de monitoramento multi-LLM
                </CardDescription>
              </CardHeader>
              <CardContent>
                {governanceMetrics.risks.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 border-2 border-emerald-500/30 bg-emerald-950/20 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-emerald-300">Nenhum risco crítico detectado. Sistema operando dentro dos parâmetros.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {governanceMetrics.risks.map((risk: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          risk.level === 'high' 
                            ? 'border-red-500/40 bg-gradient-to-br from-red-950/30 to-slate-900/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                            : 'border-yellow-500/40 bg-gradient-to-br from-yellow-950/30 to-slate-900/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                risk.level === 'high' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-yellow-500 to-amber-600'
                              }`}>
                                <AlertTriangle className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg text-slate-100">{risk.title}</h4>
                                <p className={`text-sm ${
                                  risk.level === 'high' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                  {risk.message}
                                </p>
                              </div>
                            </div>
                            <Badge className={`px-3 py-1 ${
                              risk.level === 'high' 
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                                : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                            }`}>
                              {risk.level === 'high' ? 'Alto' : 'Médio'}
                            </Badge>
                          </div>

                          <div className="pl-12 space-y-2">
                            <p className="text-sm text-slate-300">
                              <span className="font-medium text-slate-200">Análise:</span> {risk.details}
                            </p>
                            
                            {risk.affectedLLMs && risk.affectedLLMs.length > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-slate-200">LLMs Afetados:</span>
                                {risk.affectedLLMs.map((llm: string) => (
                                  <Badge key={llm} variant="outline" className="text-xs border-slate-600 text-slate-300">
                                    {llm}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-700/50">
                              <p className="text-sm">
                                <span className="font-medium text-amber-400">💡 Recomendação:</span>{' '}
                                <span className="text-slate-300">{risk.recommendation}</span>
                              </p>
                            </div>

                            <p className="text-xs text-slate-500">
                              Detectado em {new Date(risk.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Recomendações Inteligentes IGO</span>
                    {selectedBrand && (
                      <span className="text-sm font-normal text-slate-400">
                        {selectedBrand.name}
                      </span>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Ações baseadas em análise matemática das métricas atuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {governanceMetrics.recommendations.map((rec: any, idx: number) => (
                    <Card key={idx} className={`border-2 transition-all ${
                      rec.priority === 'critical' ? 'border-red-500/40 bg-gradient-to-br from-red-950/20 to-slate-900/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' :
                      rec.priority === 'high' ? 'border-orange-500/40 bg-gradient-to-br from-orange-950/20 to-slate-900/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]' :
                      rec.priority === 'medium' ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-950/20 to-slate-900/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' :
                      'border-blue-500/40 bg-gradient-to-br from-blue-950/20 to-slate-900/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                    }`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge className={`mb-2 px-3 py-1 ${
                              rec.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' :
                              rec.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white' :
                              rec.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
                              'bg-gradient-to-r from-blue-500 to-cyan-600 text-white'
                            }`}>
                              {rec.priority === 'critical' ? 'CRÍTICO' :
                               rec.priority === 'high' ? 'ALTO' :
                               rec.priority === 'medium' ? 'MÉDIO' :
                               'INFO'}
                            </Badge>
                            <CardTitle className="text-lg text-slate-100">{rec.title}</CardTitle>
                            <CardDescription className="mt-1 text-xs font-semibold text-slate-400">
                              {rec.category}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-300">{rec.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-200">Ações Recomendadas:</p>
                          <ul className="space-y-1 text-sm text-slate-400">
                            {rec.actions.map((action: string, actionIdx: number) => (
                              <li key={actionIdx} className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                          <strong className="text-slate-200">Impacto:</strong> {rec.impact}
                        </div>

                        <div className="pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                          {(rec.category.includes('CPI') || rec.title.includes('contexto')) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/brands')}
                              className="gap-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                            >
                              <Edit className="h-4 w-4" />
                              Editar Contexto da Marca
                            </Button>
                          )}
                          
                          {(rec.category.includes('Estabilidade') || rec.category.includes('GAP') || rec.title.includes('Estabilidade')) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/igo-observability?brandId=${selectedBrandId}`)}
                              className="gap-2 border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                            >
                              <Eye className="h-4 w-4" />
                              Ver IGO Observability
                            </Button>
                          )}
                          
                          {(rec.title.includes('Divergência') || rec.title.includes('alucinação')) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/igo-observability?brandId=${selectedBrandId}`)}
                              className="gap-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
                            >
                              <Search className="h-4 w-4" />
                              Detectar Alucinações
                            </Button>
                          )}
                          
                          {rec.category.includes('Multi-LLM') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/llm-mentions?brandId=${selectedBrandId}`)}
                              className="gap-2 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver Menções LLM
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="multi-llm" className="space-y-6">
            <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
              <CardHeader>
                <CardTitle className="flex flex-col gap-1">
                  <span className="text-xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Consenso Multi-LLM</span>
                  {selectedBrand && (
                    <span className="text-sm font-normal text-slate-400">
                      {selectedBrand.name}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Análise comparativa do comportamento de cada LLM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {governanceMetrics.providerConsensus.map((provider: any) => (
                  <div key={provider.provider} className="p-4 rounded-xl border-2 border-slate-700/50 bg-slate-800/30 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-lg text-slate-200">{provider.provider}</span>
                      <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white px-3 py-1">
                        Confiança: {Math.round(provider.avgConfidence)}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Taxa de Menção</span>
                        <span className="font-medium text-purple-300">{Math.round(provider.mentionRate)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all" style={{ width: `${provider.mentionRate}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <RecommendationsChecklist brandId={selectedBrandId || undefined} brandName={selectedBrand?.name} />
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            <RecommendationsImpact brandId={selectedBrandId || undefined} brandName={selectedBrand?.name} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
