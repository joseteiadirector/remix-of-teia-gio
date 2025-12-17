import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Clock, Target, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import IGOBrandsComparison from "@/components/igo/IGOBrandsComparison";
import IGOEvolutionChart from "@/components/igo/IGOEvolutionChart";
import { Button } from "@/components/ui/button";
import { exportIGOReport } from "@/utils/pdf";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useKAPIMetrics } from "@/hooks/useKAPIMetrics";
import { logger } from "@/utils/logger";
import { RealCollectionButton } from "@/components/llm/RealCollectionButton";
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME, DISABLE_MULTI_BRAND_COMPARISON } from "@/config/brandVisibility";

// Helper para retry com backoff exponencial
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, onRateLimit?: () => void) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || 
                          error?.message?.includes('Rate limit') ||
                          error?.message?.includes('rate limit');
      
      if (isRateLimit) {
        const waitTime = Math.min(1000 * Math.pow(2, i), 30000); // Max 30s
        logger.warn('Rate limit atingido', { waitTime, tentativa: i + 1 });
        
        if (onRateLimit && i === 0) {
          onRateLimit(); // Notifica apenas na primeira vez
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        if (i === maxRetries - 1) throw error;
      } else {
        throw error;
      }
    }
  }
};

export default function IGOObservability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  
  // Debounce para evitar chamadas excessivas ao trocar de marca
  const debouncedBrandId = useDebounce(selectedBrandId, 500);
  
  // ✅ HOOK CENTRALIZADO PARA MÉTRICAS KAPI
  const kapiMetricsHook = useKAPIMetrics({ brandId: debouncedBrandId });
  const igoMetrics = {
    ice: kapiMetricsHook.raw.ice,
    gap: kapiMetricsHook.raw.gap,
    cpi: kapiMetricsHook.raw.cpi,
    cognitive_stability: kapiMetricsHook.raw.stability
  };

  // Fetch brands - ✅ USANDO CONFIGURAÇÃO CENTRALIZADA
  const { data: brands } = useQuery({
    queryKey: ["brands", USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      let query = supabase
        .from("brands")
        .select("*");
      
      // ✅ FILTRO CONTROLADO PELO CÓDIGO
      if (USE_CODE_BASED_VISIBILITY) {
        query = query.eq('name', VISIBLE_BRAND_NAME);
        logger.info('IGOObservability: Filtro por código', { marca: VISIBLE_BRAND_NAME });
      } else {
        query = query.eq('is_visible', true);
      }
      
      query = query.order("name");
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Pré-selecionar marca da URL se disponível
  useEffect(() => {
    const brandIdFromUrl = searchParams.get('brandId');
    if (brandIdFromUrl && brands?.some(b => b.id === brandIdFromUrl)) {
      setSelectedBrandId(brandIdFromUrl);
    }
  }, [searchParams, brands]);

  // Fetch nucleus executions (timeline)
  const { data: executions } = useQuery({
    queryKey: ["nucleus-executions", selectedBrandId],
    queryFn: async () => {
      let query = supabase
        .from("nucleus_executions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      
      if (selectedBrandId) {
        query = query.eq("brand_id", selectedBrandId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch mentions for divergence analysis
  const { data: mentions } = useQuery({
    queryKey: ["mentions-observability", selectedBrandId],
    queryFn: async () => {
      let query = supabase
        .from("mentions_llm")
        .select("*, brands(name)")
        .order("collected_at", { ascending: false })
        .limit(200);
      
      if (selectedBrandId) {
        query = query.eq("brand_id", selectedBrandId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate observability metrics
  const observabilityMetrics = mentions?.reduce((acc, m) => {
    const provider = m.provider;
    if (!acc[provider]) {
      acc[provider] = { total: 0, mentioned: 0, avgConfidence: 0, confidences: [] };
    }
    acc[provider].total++;
    if (m.mentioned) acc[provider].mentioned++;
    acc[provider].confidences.push(Number(m.confidence));
    return acc;
  }, {} as Record<string, { total: number; mentioned: number; avgConfidence: number; confidences: number[] }>);

  // Calculate divergence score
  const calculateDivergence = () => {
    if (!observabilityMetrics) return 0;
    const providers = Object.keys(observabilityMetrics);
    if (providers.length < 2) return 0;

    const mentionRates = providers.map(p => 
      (observabilityMetrics[p].mentioned / observabilityMetrics[p].total) * 100
    );
    
    const mean = mentionRates.reduce((a, b) => a + b, 0) / mentionRates.length;
    const variance = mentionRates.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / mentionRates.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.min(stdDev, 100);
  };

  const divergenceScore = calculateDivergence();
  const convergenceScore = 100 - divergenceScore;

  // Fetch IGO Metrics DIRETO DO BANCO (evita rate limit do edge function)
  const { data: igoMetricsData, refetch: refetchIgoMetrics } = useQuery({
    queryKey: ["igo-metrics-direct", debouncedBrandId],
    queryFn: async () => {
      logger.info('Buscando métricas IGO do banco', { brandId: debouncedBrandId || 'todas' });
      
      // Buscar métrica mais recente do histórico (ICE, GAP, Stability)
      let query = supabase
        .from("igo_metrics_history")
        .select("*")
        .order("calculated_at", { ascending: false })
        .limit(1);
      
      if (debouncedBrandId) {
        query = query.eq("brand_id", debouncedBrandId);
      }
      
      const { data: igoData, error } = await query.maybeSingle();
      
      // Buscar CPI de geo_scores (FONTE OFICIAL)
      let geoQuery = supabase
        .from("geo_scores")
        .select("cpi")
        .gt("cpi", 0)
        .order("computed_at", { ascending: false })
        .limit(1);
      
      if (debouncedBrandId) {
        geoQuery = geoQuery.eq("brand_id", debouncedBrandId);
      }
      
      const { data: geoData } = await geoQuery.maybeSingle();
      
      if (error) {
        logger.error('Erro ao buscar métricas IGO', { error });
        throw error;
      }
      
      const cpi = geoData?.cpi || igoData?.cpi || 0;
      
      logger.debug('Métricas IGO recebidas (CPI de geo_scores)', { cpi });
      return {
        ice: igoData?.ice || 0,
        gap: igoData?.gap || 0,
        cpi: cpi,
        cognitive_stability: igoData?.cognitive_stability || 0
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Cache de 2 minutos
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Não precisa mais do useEffect para setIgoMetrics - agora vem do hook centralizado

  // Fetch histórico de métricas IGO
  const { data: metricsHistory } = useQuery({
    queryKey: ["igo-metrics-history", selectedBrandId],
    queryFn: async () => {
      let query = supabase
        .from("igo_metrics_history")
        .select("*")
        .order("calculated_at", { ascending: false })
        .limit(30);
      
      if (selectedBrandId) {
        query = query.eq("brand_id", selectedBrandId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch métricas de todas as marcas DIRETO DO BANCO (evita rate limit)
  // ✅ Usa brands já filtradas pela configuração centralizada
  const { data: allBrandsMetrics } = useQuery({
    queryKey: ["all-brands-igo-metrics-direct", USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      if (!brands || brands.length === 0) return [];
      
      logger.info('Buscando métricas IGO de todas as marcas do banco', { totalMarcas: brands.length });
      
      // Buscar métricas mais recentes de cada marca em uma única query
      const brandIds = brands.map(b => b.id);
      
      const { data: allMetrics, error } = await supabase
        .from("igo_metrics_history")
        .select("*")
        .in("brand_id", brandIds)
        .order("calculated_at", { ascending: false });
      
      if (error) {
        logger.error('Erro ao buscar métricas de todas as marcas', { error });
        return [];
      }
      
      // Agrupar por marca e pegar a mais recente de cada uma
      // MANTER estrutura compatível com IGOBrandsComparison
      const results = [];
      for (const brand of brands) {
        const brandMetrics = allMetrics?.filter(m => m.brand_id === brand.id);
        const latestMetric = brandMetrics?.[0];
        
        if (latestMetric) {
          results.push({
            brand: { id: brand.id, name: brand.name },
            metrics: {
              ice: latestMetric.ice || 0,
              gap: latestMetric.gap || 0,
              cpi: latestMetric.cpi || 0,
              cognitive_stability: latestMetric.cognitive_stability || 0
            }
          });
        } else {
          // Fallback com valores zerados se não houver histórico
          results.push({
            brand: { id: brand.id, name: brand.name },
            metrics: {
              ice: 0,
              gap: 0,
              cpi: 0,
              cognitive_stability: 0
            }
          });
        }
      }
      
      logger.info('Métricas IGO carregadas do banco', { 
        carregadas: results.length, 
        total: brands.length 
      });
      return results;
    },
    enabled: !!user && !!brands && brands.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Prepare timeline data with intelligent fallback
  const hasExecutions = executions && executions.length > 0;
  const usingFallback = !hasExecutions && mentions && mentions.length > 0;
  
  // Primary data: nucleus_executions (orchestrated multi-LLM)
  const timelineData = hasExecutions 
    ? executions.map(ex => ({
        date: format(new Date(ex.started_at), "dd/MM HH:mm", { locale: ptBR }),
        queries: ex.total_queries || 0,
        mentions: ex.total_mentions || 0,
        llms: Array.isArray(ex.llms_used) ? ex.llms_used.length : 0,
        status: ex.status,
      }))
    : usingFallback
    ? // Fallback data: mentions_llm grouped by date
      Object.entries(
        mentions.reduce((acc, m) => {
          const dateKey = format(new Date(m.collected_at), "dd/MM HH:mm", { locale: ptBR });
          if (!acc[dateKey]) {
            acc[dateKey] = { mentions: 0, providers: new Set() };
          }
          acc[dateKey].mentions++;
          acc[dateKey].providers.add(m.provider.toLowerCase());
          return acc;
        }, {} as Record<string, { mentions: number; providers: Set<string> }>)
      ).map(([date, data]) => ({
        date,
        queries: 0,
        mentions: data.mentions,
        llms: data.providers.size,
        status: 'completed',
      }))
      .slice(-20) // Last 20 data points
    : [];

  // Prepare provider comparison data
  const providerData = observabilityMetrics ? Object.entries(observabilityMetrics).map(([provider, metrics]) => {
    const avgConf = metrics.confidences.reduce((a, b) => a + b, 0) / metrics.confidences.length;
    return {
      provider: provider.toUpperCase(),
      mentions: metrics.mentioned,
      total: metrics.total,
      rate: ((metrics.mentioned / metrics.total) * 100).toFixed(1),
      confidence: avgConf.toFixed(1),
    };
  }) : [];

  // Prepare semantic divergence scatter data
  const divergenceData = mentions?.map(m => ({
    confidence: Number(m.confidence),
    mentioned: m.mentioned ? 1 : 0,
    provider: m.provider,
  })) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "running": return "bg-blue-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            IGO Observability
          </h1>
          <p className="text-muted-foreground mt-2">
            Timeline multi-LLM, divergência semântica e governança contextual
          </p>
          <Badge variant="outline" className="mt-2">
            <Brain className="w-3 h-3 mr-1" />
            IA observando IA em tempo real
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={async () => {
              try {
                logger.info('Iniciando exportação IGO', { 
                  metricsCount: allBrandsMetrics?.length || 0,
                  brandsCount: brands?.length || 0
                });
                
                // Validar dados antes de exportar
                if (!allBrandsMetrics || allBrandsMetrics.length === 0) {
                  toast({
                    title: "Erro",
                    description: "Nenhuma métrica disponível para exportar. Aguarde o carregamento dos dados.",
                    variant: "destructive",
                  });
                  return;
                }
                
                toast({
                  title: "Gerando relatório PDF...",
                  description: "Aguarde enquanto capturamos os gráficos",
                });
                
                // Aguardar um momento para garantir que os gráficos estejam renderizados
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Preparar dados com estrutura garantida
                let metricsToExport = allBrandsMetrics
                  .filter(bm => bm && bm.brand && bm.metrics)
                  .map(bm => ({
                    brand: {
                      id: bm.brand.id,
                      name: bm.brand.name
                    },
                    metrics: {
                      ice: Number(bm.metrics.ice) || 0,
                      gap: Number(bm.metrics.gap) || 0,
                      cpi: Number(bm.metrics.cpi) || 0,
                      cognitive_stability: Number(bm.metrics.cognitive_stability) || 0
                    }
                  }));
                
                // FILTRAR apenas a marca selecionada se houver
                if (selectedBrandId) {
                  metricsToExport = metricsToExport.filter(bm => bm.brand.id === selectedBrandId);
                  logger.info('Exportando apenas marca selecionada', { 
                    brandId: selectedBrandId,
                    brandName: brands?.find(b => b.id === selectedBrandId)?.name
                  });
                } else {
                  logger.info('Exportando todas as marcas', { count: metricsToExport.length });
                }
                
                if (metricsToExport.length === 0) {
                  toast({
                    title: "Erro",
                    description: "Nenhuma métrica válida encontrada para exportar",
                    variant: "destructive",
                  });
                  return;
                }
                
                const brandName = brands?.find(b => b.id === selectedBrandId)?.name || 'Todas as marcas';
                
                await exportIGOReport({
                  brandName,
                  brands: metricsToExport.map(bm => ({
                    name: bm.brand.name,
                    metrics: {
                      ice: bm.metrics.ice,
                      gap: bm.metrics.gap,
                      cpi: bm.metrics.cpi,
                      stability: bm.metrics.cognitive_stability
                    }
                  })),
                  period: 'Últimos 30 dias'
                });
                
                toast({
                  title: "Sucesso!",
                  description: "Relatório exportado com sucesso",
                });
              } catch (error) {
                logger.error('Erro ao exportar relatório IGO', { 
                  error,
                  stack: error instanceof Error ? error.stack : 'N/A'
                });
                toast({
                  title: "Erro",
                  description: error instanceof Error ? error.message : "Erro ao gerar relatório PDF",
                  variant: "destructive",
                });
              }
            }}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>

          {selectedBrandId && (
            <RealCollectionButton 
              brandId={selectedBrandId}
              brandName={brands?.find(b => b.id === selectedBrandId)?.name || ''}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['llm-mentions', selectedBrandId] });
                queryClient.invalidateQueries({ queryKey: ['igo-metrics', selectedBrandId] });
                queryClient.invalidateQueries({ queryKey: ['all-brands-igo-metrics'] });
              }}
            />
          )}

          <select
            className="px-4 py-2 rounded-lg border bg-background"
            value={selectedBrandId || ""}
            onChange={(e) => setSelectedBrandId(e.target.value || null)}
          >
            <option value="">Todas as marcas</option>
            {brands?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Brand Context Card */}
      {selectedBrandId && (
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <span>Análise da Marca: {brands?.find(b => b.id === selectedBrandId)?.name}</span>
              <Badge variant="secondary" className="ml-auto">Marca Selecionada</Badge>
            </CardTitle>
            <CardDescription>
              As métricas abaixo são específicas desta marca. Para comparar com outras marcas, 
              veja a aba "Comparação entre Marcas" mais abaixo.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Official IGO Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              ICE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{igoMetrics?.ice || 0}</div>
            <Progress value={igoMetrics?.ice || 0} className="mt-2 [&>div]:bg-blue-500" />
            <p className="text-xs text-muted-foreground mt-2">
              Index of Cognitive Efficiency
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              GAP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{igoMetrics?.gap || 0}</div>
            <Progress value={igoMetrics?.gap || 0} className="mt-2 [&>div]:bg-accent" />
            <p className="text-xs text-muted-foreground mt-2">
              Governance Alignment Precision
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              CPI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{igoMetrics?.cpi || 0}</div>
            <Progress value={igoMetrics?.cpi || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Cognitive Predictive Index
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Estabilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{igoMetrics?.cognitive_stability || 0}%</div>
            <Progress value={igoMetrics?.cognitive_stability || 0} className="mt-2 [&>div]:bg-green-500" />
            <p className="text-xs text-muted-foreground mt-2">
              Estabilidade Cognitiva
            </p>
          </CardContent>
        </Card>
      </div>

      {igoMetrics && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                <strong>ICE:</strong> {igoMetrics.ice}%
              </span>
              <span className="text-muted-foreground">
                <strong>GAP:</strong> {igoMetrics.gap}%
              </span>
              <span className="text-muted-foreground">
                <strong>Estabilidade:</strong> {igoMetrics.cognitive_stability}%
              </span>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
              ✓ Validado
            </Badge>
          </div>
        </div>
      )}

      {/* Métricas Adicionais da Marca */}
      {selectedBrandId && (
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              Métricas de Observabilidade
              <Badge variant="outline" className="ml-2">
                {brands?.find(b => b.id === selectedBrandId)?.name}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Análise de convergência, divergência semântica e provedores LLM para a marca selecionada
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Convergência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{convergenceScore.toFixed(1)}%</div>
            <Progress value={convergenceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {convergenceScore > 80 ? "Alta coerência" : convergenceScore > 50 ? "Moderada" : "Divergente"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Divergência Semântica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{divergenceScore.toFixed(1)}%</div>
            <Progress value={divergenceScore} className="mt-2 [&>div]:bg-yellow-500" />
            <p className="text-xs text-muted-foreground mt-2">
              Variação entre LLMs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              LLMs Monitorados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{providerData.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Provedores ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{executions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {executions?.length > 0 
                ? "Últimas 50 queries" 
                : "Nenhuma execução registrada ainda"}
            </p>
            {(!executions || executions.length === 0) && (
              <p className="text-xs text-muted-foreground mt-2">
                Execute queries no{" "}
                <a href="/nucleus-center" className="text-primary hover:underline font-medium">
                  Nucleus Center
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tabs - Separação clara de contextos */}
      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Análise Individual
            {selectedBrandId && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {brands?.find(b => b.id === selectedBrandId)?.name}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Comparação entre Marcas
          </TabsTrigger>
        </TabsList>

        {/* TAB: Análise Individual */}
        <TabsContent value="individual" className="space-y-6">
          {!selectedBrandId && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    Selecione uma marca acima para visualizar a análise individual detalhada
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedBrandId && (
            <>
              {/* Evolução Temporal das Métricas IGO */}
              {metricsHistory && metricsHistory.length > 0 && (
                <div data-chart="igo-evolution">
                  <IGOEvolutionChart 
                    data={metricsHistory}
                    brandName={brands?.find(b => b.id === selectedBrandId)?.name}
                  />
                </div>
              )}

              {/* Sub-tabs para diferentes análises */}
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline Multi-LLM</TabsTrigger>
                  <TabsTrigger value="divergence">Divergência Semântica</TabsTrigger>
                  <TabsTrigger value="providers">Comparação de Provedores</TabsTrigger>
                </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    Timeline de Observações IGO
                    {selectedBrandId && (
                      <Badge variant="outline" className="text-xs">
                        {brands?.find(b => b.id === selectedBrandId)?.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Histórico de queries executadas e menções coletadas por múltiplos LLMs
                  </CardDescription>
                </div>
                {usingFallback && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Dados não-orquestrados
                  </Badge>
                )}
              </div>
              {usingFallback && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground">
                    ℹ️ Exibindo menções diretas agrupadas. Para dados orquestrados completos, execute queries no{" "}
                    <a href="/nucleus-center" className="text-primary hover:underline font-medium">
                      Nucleus Command Center
                    </a>
                    .
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div data-chart="timeline">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="queries" stroke="hsl(var(--primary))" name="Queries" strokeWidth={2} />
                    <Line type="monotone" dataKey="mentions" stroke="hsl(var(--accent))" name="Menções" strokeWidth={2} />
                    <Line type="monotone" dataKey="llms" stroke="hsl(var(--chart-3))" name="LLMs Usados" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Divergence Tab */}
        <TabsContent value="divergence" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Análise de Divergência Semântica
                    {selectedBrandId && (
                      <Badge variant="outline" className="text-xs">
                        {brands?.find(b => b.id === selectedBrandId)?.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Distribuição de confiança vs menções por provedor LLM
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div data-chart="divergence">
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="confidence" name="Confiança" unit="%" domain={[0, 100]} />
                    <YAxis type="number" dataKey="mentioned" name="Mencionado" domain={[-0.1, 1.1]} ticks={[0, 1]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="ChatGPT" data={divergenceData.filter(d => d.provider.toLowerCase() === 'chatgpt')} fill="hsl(var(--chart-1))" />
                    <Scatter name="Gemini" data={divergenceData.filter(d => d.provider.toLowerCase() === 'gemini')} fill="hsl(var(--chart-2))" />
                    <Scatter name="Claude" data={divergenceData.filter(d => d.provider.toLowerCase() === 'claude')} fill="hsl(var(--chart-3))" />
                    <Scatter name="Perplexity" data={divergenceData.filter(d => d.provider.toLowerCase() === 'perplexity')} fill="hsl(var(--chart-4))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interpretação da Divergência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Convergência Alta (&gt;80%)</p>
                    <p className="text-sm text-muted-foreground">LLMs concordam, resultado confiável</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Divergência Moderada (50-80%)</p>
                    <p className="text-sm text-muted-foreground">Variação esperada, monitorar contexto</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Divergência Alta (&lt;50%)</p>
                    <p className="text-sm text-muted-foreground">LLMs discordam, requer análise manual</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score de Governança Contextual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {convergenceScore.toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Governança Contextual IGO
                  </p>
                  <Badge variant="outline" className="mt-4">
                    {convergenceScore > 80 ? "Excelente" : convergenceScore > 50 ? "Bom" : "Requer atenção"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Comparação entre Provedores LLM
                    {selectedBrandId && (
                      <Badge variant="outline" className="text-xs">
                        {brands?.find(b => b.id === selectedBrandId)?.name}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Taxa de menção e confiança média por provedor
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div data-chart="providers">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={providerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="provider" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rate" fill="hsl(var(--primary))" name="Taxa de Menção (%)" />
                    <Bar dataKey="confidence" fill="hsl(var(--accent))" name="Confiança Média (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 space-y-3">
                {providerData.map(p => (
                  <div key={p.provider} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-semibold">{p.provider}</p>
                      <p className="text-sm text-muted-foreground">{p.mentions} menções de {p.total} queries</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{p.rate}%</p>
                      <p className="text-xs text-muted-foreground">Confiança: {p.confidence}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

              </Tabs>
            </>
          )}
        </TabsContent>

        {/* TAB: Comparação entre Marcas - SOMENTE visível quando "Todas as marcas" estiver selecionado */}
        <TabsContent value="comparison" className="space-y-6">
          {!selectedBrandId ? (
            // Mostra comparação quando NENHUMA marca específica está selecionada (= "Todas as marcas")
            allBrandsMetrics && allBrandsMetrics.length > 1 ? (
              <IGOBrandsComparison 
                brandsMetrics={allBrandsMetrics} 
                isLoading={!allBrandsMetrics}
              />
            ) : (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm font-medium">
                      É necessário ter pelo menos 2 marcas cadastradas para visualizar a comparação
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            // Mensagem quando uma marca específica está selecionada
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
                  <Brain className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    Para visualizar a comparação entre marcas, selecione "Todas as marcas" no seletor acima
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Hidden charts for PDF export - rendered but invisible */}
      <div id="pdf-export-charts" className="fixed -left-[9999px] top-0 w-[1200px]">
        {/* IGO Brands Comparison for PDF */}
        {allBrandsMetrics && allBrandsMetrics.length > 0 && (
          <div className="bg-white p-6 rounded-lg mb-4">
            <IGOBrandsComparison brandsMetrics={allBrandsMetrics} />
          </div>
        )}

        {/* IGO Evolution Chart for PDF (if brand selected) */}
        {selectedBrandId && metricsHistory && metricsHistory.length > 0 && (
          <div className="bg-white p-6 rounded-lg mb-4">
            <IGOEvolutionChart 
              data={metricsHistory}
              brandName={brands?.find(b => b.id === selectedBrandId)?.name}
            />
          </div>
        )}

        {/* Timeline chart for PDF */}
        <div data-chart="timeline" data-pdf-export="true" className="bg-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Timeline Multi-LLM</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="queries" stroke="#3b82f6" name="Queries" strokeWidth={2} />
              <Line type="monotone" dataKey="mentions" stroke="#8b5cf6" name="Menções" strokeWidth={2} />
              <Line type="monotone" dataKey="llms" stroke="#06b6d4" name="LLMs Usados" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Divergence chart for PDF */}
        <div data-chart="divergence" data-pdf-export="true" className="bg-white p-6 rounded-lg mt-4">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Análise de Divergência Semântica</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="confidence" name="Confiança" unit="%" domain={[0, 100]} />
              <YAxis type="number" dataKey="mentioned" name="Mencionado" domain={[-0.1, 1.1]} ticks={[0, 1]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="ChatGPT" data={divergenceData.filter(d => d.provider.toLowerCase() === 'chatgpt')} fill="#3b82f6" />
              <Scatter name="Gemini" data={divergenceData.filter(d => d.provider.toLowerCase() === 'gemini')} fill="#8b5cf6" />
              <Scatter name="Claude" data={divergenceData.filter(d => d.provider.toLowerCase() === 'claude')} fill="#06b6d4" />
              <Scatter name="Perplexity" data={divergenceData.filter(d => d.provider.toLowerCase() === 'perplexity')} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Providers chart for PDF */}
        <div data-chart="providers" data-pdf-export="true" className="bg-white p-6 rounded-lg mt-4">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Comparação entre Provedores LLM</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={providerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rate" fill="#3b82f6" name="Taxa de Menção (%)" />
              <Bar dataKey="confidence" fill="#8b5cf6" name="Confiança Média (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
