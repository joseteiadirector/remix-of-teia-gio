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
  // ✅ CPI vem de geo_scores (fonte oficial conforme artigo científico)
  const { data: allBrandsMetrics } = useQuery({
    queryKey: ["all-brands-igo-metrics-direct", USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      if (!brands || brands.length === 0) return [];
      
      logger.info('Buscando métricas IGO de todas as marcas do banco', { totalMarcas: brands.length });
      
      const brandIds = brands.map(b => b.id);
      
      // 1. Buscar ICE, GAP, Stability de igo_metrics_history
      const { data: allMetrics, error } = await supabase
        .from("igo_metrics_history")
        .select("*")
        .in("brand_id", brandIds)
        .order("calculated_at", { ascending: false });
      
      if (error) {
        logger.error('Erro ao buscar métricas de todas as marcas', { error });
        return [];
      }
      
      // 2. Buscar CPI de geo_scores (FONTE OFICIAL - Artigo Científico)
      const { data: allGeoScores, error: geoError } = await supabase
        .from("geo_scores")
        .select("brand_id, cpi, computed_at")
        .in("brand_id", brandIds)
        .order("computed_at", { ascending: false });
      
      if (geoError) {
        logger.warn('Erro ao buscar geo_scores para CPI', { error: geoError });
      }
      
      // Agrupar por marca e pegar a mais recente de cada uma
      // MANTER estrutura compatível com IGOBrandsComparison
      const results = [];
      for (const brand of brands) {
        const brandMetrics = allMetrics?.filter(m => m.brand_id === brand.id);
        const latestMetric = brandMetrics?.[0];
        
        // CPI: prioridade para geo_scores (fonte oficial), fallback para igo_metrics_history
        const brandGeoScore = allGeoScores?.find(g => g.brand_id === brand.id);
        const officialCPI = brandGeoScore?.cpi || latestMetric?.cpi || 0;
        
        if (latestMetric) {
          results.push({
            brand: { id: brand.id, name: brand.name },
            metrics: {
              ice: latestMetric.ice || 0,
              gap: latestMetric.gap || 0,
              cpi: officialCPI, // ✅ CPI de geo_scores (fonte oficial)
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
              cpi: officialCPI, // ✅ CPI de geo_scores mesmo sem métricas IGO
              cognitive_stability: 0
            }
          });
        }
      }
      
      logger.info('Métricas IGO carregadas do banco (CPI de geo_scores)', { 
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 via-background to-cyan-900/20 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(6,182,212,0.2)] transition-all duration-500 hover:shadow-[0_0_80px_rgba(6,182,212,0.3)] hover:border-cyan-400/60 group">
          <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-cyan-500/30 transition-all duration-700" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 group-hover:bg-blue-500/25 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg mb-3">
                IGO Observability
              </h1>
              <p className="text-lg text-cyan-200/70 font-medium mb-3">
                Timeline multi-LLM, divergência semântica e governança contextual
              </p>
              <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 px-4 py-1.5">
                <Brain className="w-4 h-4 mr-2" />
                IA observando IA em tempo real
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                onClick={async () => {
                  try {
                    logger.info('Iniciando exportação IGO', { 
                      metricsCount: allBrandsMetrics?.length || 0,
                      brandsCount: brands?.length || 0
                    });
                    
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
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
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

                    await exportIGOReport({
                      brandName: brands?.find(b => b.id === selectedBrandId)?.name || 'Todas as Marcas',
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
                      title: "Relatório exportado!",
                      description: "O PDF foi baixado com sucesso.",
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
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] border-0 px-6 py-5 font-bold"
              >
                <Download className="h-5 w-5 mr-2" />
                Exportar PDF
              </Button>

              <select
                className="px-5 py-3 border-2 border-cyan-500/40 rounded-xl bg-background/50 backdrop-blur-xl hover:border-cyan-400/60 transition-all focus:ring-2 focus:ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-medium"
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

      {/* Official IGO Metrics - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-background to-cyan-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:shadow-[0_0_60px_rgba(6,182,212,0.25)] hover:border-cyan-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-cyan-100">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                <Target className="w-4 h-4 text-white" />
              </div>
              ICE
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">{igoMetrics?.ice || 0}</div>
            <Progress value={igoMetrics?.ice || 0} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500" />
            <p className="text-xs text-cyan-300/60 mt-3">
              Index of Cognitive Efficiency
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-background to-amber-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] hover:shadow-[0_0_60px_rgba(245,158,11,0.25)] hover:border-amber-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-amber-100">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Target className="w-4 h-4 text-white" />
              </div>
              GAP
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-amber-300 via-orange-200 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">{igoMetrics?.gap || 0}</div>
            <Progress value={igoMetrics?.gap || 0} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
            <p className="text-xs text-amber-300/60 mt-3">
              Governance Alignment Precision
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-background to-purple-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] hover:border-purple-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-purple-100">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              CPI
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-purple-300 via-violet-200 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">{igoMetrics?.cpi || 0}</div>
            <Progress value={igoMetrics?.cpi || 0} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-violet-500" />
            <p className="text-xs text-purple-300/60 mt-3">
              Cognitive Predictive Index
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-background to-emerald-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:shadow-[0_0_60px_rgba(16,185,129,0.25)] hover:border-emerald-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-emerald-100">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              Estabilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">{igoMetrics?.cognitive_stability || 0}%</div>
            <Progress value={igoMetrics?.cognitive_stability || 0} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-green-500" />
            <p className="text-xs text-emerald-300/60 mt-3">
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

      {/* Key Metrics - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-background to-emerald-900/20 backdrop-blur-xl shadow-[0_0_35px_rgba(16,185,129,0.15)] hover:shadow-[0_0_50px_rgba(16,185,129,0.25)] hover:border-emerald-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-emerald-100">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Target className="w-4 h-4 text-white" />
              </div>
              Convergência
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">{convergenceScore.toFixed(1)}%</div>
            <Progress value={convergenceScore} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-green-500" />
            <p className="text-xs text-emerald-300/60 mt-2">
              {convergenceScore > 80 ? "Alta coerência" : convergenceScore > 50 ? "Moderada" : "Divergente"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-background to-amber-900/20 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.15)] hover:shadow-[0_0_50px_rgba(245,158,11,0.25)] hover:border-amber-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-amber-100">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              Divergência Semântica
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">{divergenceScore.toFixed(1)}%</div>
            <Progress value={divergenceScore} className="mt-3 h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500" />
            <p className="text-xs text-amber-300/60 mt-2">
              Variação entre LLMs
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-background to-purple-900/20 backdrop-blur-xl shadow-[0_0_35px_rgba(168,85,247,0.15)] hover:shadow-[0_0_50px_rgba(168,85,247,0.25)] hover:border-purple-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-purple-100">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Brain className="w-4 h-4 text-white" />
              </div>
              LLMs Monitorados
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent">{providerData.length}</div>
            <p className="text-xs text-purple-300/60 mt-3">
              Provedores ativos
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-background to-cyan-900/20 backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.25)] hover:border-cyan-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-cyan-100">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <Clock className="w-4 h-4 text-white" />
              </div>
              Execuções
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">{executions?.length || 0}</div>
            <p className="text-xs text-cyan-300/60 mt-2">
              {executions?.length > 0 
                ? "Últimas 50 queries" 
                : "Nenhuma execução registrada ainda"}
            </p>
            {(!executions || executions.length === 0) && (
              <p className="text-xs text-cyan-400 mt-2">
                Execute queries no{" "}
                <a href="/nucleus-center" className="text-cyan-300 hover:underline font-bold">
                  Nucleus Center
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tabs - Premium Design */}
      <Tabs defaultValue="individual" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 !bg-transparent p-0 gap-3 h-auto">
          <TabsTrigger value="individual" className="!bg-slate-800/90 data-[state=active]:!bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_25px_rgba(6,182,212,0.5)] data-[state=inactive]:text-slate-300 data-[state=inactive]:border data-[state=inactive]:border-slate-600/50 rounded-xl py-4 px-6 font-black text-base transition-all duration-300 hover:!bg-cyan-500/30 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Análise Individual
            {selectedBrandId && (
              <Badge className="ml-2 text-xs bg-white/20 text-white border-0">
                {brands?.find(b => b.id === selectedBrandId)?.name}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="!bg-slate-800/90 data-[state=active]:!bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-[0_0_25px_rgba(168,85,247,0.5)] data-[state=inactive]:text-slate-300 data-[state=inactive]:border data-[state=inactive]:border-slate-600/50 rounded-xl py-4 px-6 font-black text-base transition-all duration-300 hover:!bg-purple-500/30 flex items-center gap-2">
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
    </div>
  );
}
