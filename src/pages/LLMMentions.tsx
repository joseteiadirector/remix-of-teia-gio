import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { exportLLMMentionsReport } from '@/utils/pdf';
import { ConsolidatedPDFExport } from "@/components/ConsolidatedPDFExport";
import { exportMentionsToExcel } from "@/utils/legacyExports";
import { getSentimentConfig, getContextConfig, getConfidenceLevel, getConfidenceDescription } from "@/utils/mentionHelpers";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home, MessageSquare, RefreshCw, CheckCircle2, XCircle, Loader2, AlertCircle, Filter, Download, FileSpreadsheet, Brain } from "lucide-react";
import { RealCollectionButton } from "@/components/llm/RealCollectionButton";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { logger } from "@/utils/logger";

export default function LLMMentions() {
  const { user } = useAuth();
  const { selectedBrandId, setSelectedBrandId, brands: globalBrands } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [isCollecting, setIsCollecting] = useState(false);
  const [isCollectingRealData, setIsCollectingRealData] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const parentRef = useRef<HTMLDivElement>(null);

  const handleCollectRealData = async () => {
    if (!globalBrands || globalBrands.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione marcas antes de coletar dados reais",
        variant: "destructive",
      });
      return;
    }

    setIsCollectingRealData(true);

    try {
      // ✅ OTIMIZADO: Promise.all ao invés de loop sequencial
      const results = await Promise.allSettled(
        globalBrands.map(async (brand) => {
          logger.debug('Coletando dados reais GSC', { brandName: brand.name, brandId: brand.id });
          
          // Coletar GSC e GA4 em paralelo para cada marca
          const [gscResult, ga4Result] = await Promise.allSettled([
            supabase.functions.invoke('fetch-gsc-queries', {
              body: { brandId: brand.id, domain: brand.domain }
            }),
            supabase.functions.invoke('fetch-ga4-data', {
              body: { brandId: brand.id }
            })
          ]);

          // Processar resultados GSC
          if (gscResult.status === 'fulfilled' && !gscResult.value.error) {
            logger.info('Queries GSC coletadas', { 
              brandName: brand.name, 
              count: gscResult.value.data.count 
            });
          } else {
            logger.error('Erro ao coletar GSC', { 
              brandName: brand.name,
              error: gscResult.status === 'fulfilled' ? gscResult.value.error : gscResult.reason
            });
          }

          // Processar resultados GA4
          if (ga4Result.status === 'fulfilled' && !ga4Result.value.error) {
            logger.info('Analytics coletado', { brandName: brand.name });
          } else {
            logger.error('Erro ao coletar GA4', {
              brandName: brand.name,
              error: ga4Result.status === 'fulfilled' ? ga4Result.value.error : ga4Result.reason
            });
          }

          return { brand: brand.name, gscResult, ga4Result };
        })
      );

      // Contar sucessos e falhas
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      toast({
        title: failCount > 0 ? "Coleta parcialmente concluída" : "Dados reais coletados!",
        description: failCount > 0
          ? `${successCount} marcas processadas, ${failCount} com erros`
          : "Queries do Google Search Console e Analytics foram importados",
        variant: failCount > 0 ? "default" : "default",
      });

      refetch();
    } catch (error) {
      logger.error('Erro ao coletar dados reais', { error });
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao coletar dados reais",
        variant: "destructive",
      });
    } finally {
      setIsCollectingRealData(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!filteredMentions || filteredMentions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há menções disponíveis para exportação",
        variant: "destructive",
      });
      return;
    }

    const brand = globalBrands?.find(b => b.id === selectedBrandId);
    
    if (format === 'pdf') {
      try {
        // Preparar dados específicos de menções LLM
        // IMPORTANTE: confidence já está em % (0-100) no banco, passar como decimal (0-1) para o PDF
        const avgConfidence = filteredMentions.length > 0 
          ? filteredMentions.reduce((sum, m) => sum + Number(m.confidence), 0) / filteredMentions.length 
          : 0;
        
        const mentionsData = {
          brandName: brand?.name || 'Todas as marcas',
          brandDomain: brand?.domain || '',
          visibilityScore: visibilityScore, // já está calculado corretamente (0-100)
          avgConfidence: avgConfidence, // média real das confianças (0-100)
          mentions: filteredMentions.map(m => ({
            provider: m.provider,
            query: m.query,
            mentioned: m.mentioned,
            confidence: Number(m.confidence) / 100, // converter para 0-1 para exibição como %
            answer_excerpt: m.answer_excerpt,
          })),
          period: 'Últimos 30 dias',
        };

        await exportLLMMentionsReport(mentionsData);
      } catch (error) {
        logger.error('Erro ao exportar PDF de menções', { error });
        toast({
          title: "Erro ao exportar",
          description: "Não foi possível gerar o PDF",
          variant: "destructive",
        });
      }
    } else {
      const mentionsData = filteredMentions.map(m => ({
        llm_name: m.provider,
        prompt: m.query,
        response: m.answer_excerpt || '',
        confidence_score: Number(m.confidence) / 100,
        created_at: m.collected_at,
      }));
      exportMentionsToExcel(mentionsData, brand?.name || 'Todas as marcas');
      
      toast({
        title: "Exportação concluída!",
        description: `${filteredMentions.length} menções exportadas em Excel`,
      });
    }
  };

  // Pré-selecionar marca da URL se disponível
  useEffect(() => {
    const brandIdFromUrl = searchParams.get('brandId');
    if (brandIdFromUrl && globalBrands?.some(b => b.id === brandIdFromUrl)) {
      setSelectedBrandId(brandIdFromUrl);
    }
  }, [searchParams, globalBrands, setSelectedBrandId]);

  const { data: mentions, isLoading, refetch } = useQuery({
    queryKey: ['llm-mentions', user?.id, selectedBrandId, page],
    queryFn: async () => {
      let query = supabase
        .from('mentions_llm')
        .select(`
          id,
          query,
          provider,
          mentioned,
          confidence,
          answer_excerpt,
          collected_at,
          brand_id,
          brands!inner (name, domain)
        `, { count: 'exact' })
        .order('collected_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (selectedBrandId && selectedBrandId !== "all") {
        query = query.eq('brand_id', selectedBrandId);
      } else if (globalBrands) {
        query = query.in('brand_id', globalBrands.map(b => b.id));
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!user && !!globalBrands,
  });

  const handleCollectMentions = async () => {
    if (!selectedBrandId || selectedBrandId === "all") {
      toast({
        title: "Selecione uma marca",
        description: "Escolha uma marca específica para coletar menções",
        variant: "destructive",
      });
      return;
    }

    setIsCollecting(true);
    
    // Toast inicial
    toast({
      title: "🚀 Iniciando coleta",
      description: "Consultando LLMs disponíveis...",
    });

    try {
      logger.info('Iniciando coleta de menções', { brandId: selectedBrandId });
      
      // Toast de progresso
      toast({
        title: "🤖 Coletando menções",
        description: "Enviando queries para ChatGPT, Claude, Gemini e Perplexity",
      });

      const { data, error } = await supabase.functions.invoke('collect-llm-mentions', {
        body: { brandId: selectedBrandId }
      });

      logger.debug('Resposta da coleta recebida', { hasData: !!data, hasError: !!error });

      if (error) throw error;

      const collected = data?.collected || data?.statistics?.totalMentions || 0;
      const providers = data?.statistics?.providers || 4;

      // Success com detalhes
      toast({
        title: "✅ Coleta concluída!",
        description: `${collected} menções coletadas • ${providers} LLMs consultados`,
        duration: 5000,
      });

      logger.info('Coleta concluída, atualizando dados', { collected, providers });
      refetch();
    } catch (error) {
      logger.error('Erro ao coletar menções', { error });
      toast({
        title: "❌ Falha na coleta",
        description: error instanceof Error ? error.message : 'Tente novamente em alguns instantes',
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const mentionsList = mentions?.data || [];
  const totalMentions = mentions?.count || 0;
  
  const stats = mentionsList.length > 0 ? {
    total: mentionsList.length,
    mentioned: mentionsList.filter(m => m.mentioned).length,
    chatgpt: mentionsList.filter(m => m.provider === 'ChatGPT' || m.provider === 'chatgpt').length,
    perplexity: mentionsList.filter(m => m.provider === 'Perplexity' || m.provider === 'perplexity').length,
    gemini: mentionsList.filter(m => m.provider === 'Google Gemini' || m.provider === 'google' || m.provider === 'Gemini').length,
    claude: mentionsList.filter(m => m.provider === 'Claude' || m.provider === 'Claude (Lovable)').length,
  } : null;

  const visibilityScore = stats ? Math.round((stats.mentioned / stats.total) * 100) : 0;

  // Filtrar menções por confiança
  const filteredMentions = mentionsList.filter(mention => {
    if (confidenceFilter === "all") return true;
    const confidence = Number(mention.confidence);
    if (confidenceFilter === "high") return confidence >= 80;
    if (confidenceFilter === "medium") return confidence >= 50 && confidence < 80;
    if (confidenceFilter === "low") return confidence < 50;
    return true;
  });

  // Configurar virtualizador com mais espaço para evitar sobreposição
  const rowVirtualizer = useVirtualizer({
    count: filteredMentions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Aumentado de 200 para 280 para acomodar alertas
    overscan: 5,
  });

  const totalPages = Math.ceil(totalMentions / pageSize);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
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
              <BreadcrumbPage>Menções em LLMs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                IGO Observational Layer
              </h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Camada de observação IA-sobre-IA · Monitore menções de marca em respostas generativas
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-semibold text-primary">Governança Semântica</span>
              · IA observando IA · Multi-LLM Tracking
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <ConsolidatedPDFExport />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('excel')}
              disabled={!filteredMentions || filteredMentions.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('pdf')}
              disabled={!filteredMentions || filteredMentions.length === 0}
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 md:gap-4">
          <Select value={selectedBrandId || "all"} onValueChange={setSelectedBrandId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {globalBrands?.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedBrandId && selectedBrandId !== "all" && (
            <RealCollectionButton 
              brandId={selectedBrandId}
              brandName={globalBrands?.find(b => b.id === selectedBrandId)?.name || ''}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['llm-mentions', selectedBrandId] });
                queryClient.invalidateQueries({ queryKey: ['igo-metrics', selectedBrandId] });
              }}
            />
          )}

          <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por confiança" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as confianças</SelectItem>
              <SelectItem value="high">🟢 Alta (≥80%)</SelectItem>
              <SelectItem value="medium">🟡 Média (50-79%)</SelectItem>
              <SelectItem value="low">🔴 Baixa (&lt;50%)</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleCollectRealData} 
            disabled={isCollectingRealData}
            variant="default"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isCollectingRealData ? (
              <>
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Importando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Importar Dados Reais (GSC+GA4)</span>
                <span className="sm:hidden">Dados Reais</span>
              </>
            )}
          </Button>

          <Button 
            onClick={handleCollectMentions} 
            disabled={isCollecting || selectedBrandId === "all"}
            className="w-full sm:w-auto"
          >
            {isCollecting ? (
              <>
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Coletando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Coletar Menções</span>
                <span className="sm:hidden">Coletar</span>
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Score de Visibilidade</p>
                <p className="text-3xl font-bold text-primary">{visibilityScore}%</p>
                <Progress value={visibilityScore} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total de Consultas</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{stats.mentioned} menções positivas</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Por Provider</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>ChatGPT:</span>
                    <span className="font-semibold">{stats.chatgpt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perplexity:</span>
                    <span className="font-semibold">{stats.perplexity}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Outros Providers</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Gemini:</span>
                    <span className="font-semibold">{stats.gemini}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Claude:</span>
                    <span className="font-semibold">{stats.claude}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Mentions List with Virtualization */}
        {isLoading ? (
          <LoadingSpinner size="lg" text="Carregando menções..." className="py-12" />
        ) : filteredMentions.length > 0 ? (
          <>
            <div 
              ref={parentRef}
              className="space-y-4 max-h-[900px] overflow-auto pr-2"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                  paddingBottom: '20px', // Espaço extra no final
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const mention = filteredMentions[virtualRow.index];
                  const confidence = Number(mention.confidence);
                  const confidenceLevel = getConfidenceLevel(confidence);
                  
                  // Derivar sentimento baseado em mentioned e confidence
                  const derivedSentiment = mention.mentioned 
                    ? (confidence >= 70 ? 'positive' : 'neutral')
                    : 'negative';
                  const sentimentConfig = getSentimentConfig(derivedSentiment);
                  
                  return (
                    <Card 
                      key={virtualRow.key}
                      className="p-4 md:p-6 hover:shadow-lg transition-all duration-200 absolute top-0 left-0 w-[calc(100%-8px)] border-border/50 bg-card/95 backdrop-blur-sm"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                        minHeight: '240px',
                      }}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              {mention.mentioned ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                              <Badge variant={mention.mentioned ? "default" : "secondary"}>
                                {mention.provider}
                              </Badge>
                              
                              {/* Badge de Sentimento */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant={sentimentConfig.variant}
                                      className={`gap-1.5 ${
                                        derivedSentiment === 'positive' ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' :
                                        derivedSentiment === 'negative' ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30' :
                                        'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
                                      }`}
                                    >
                                      <span className="text-base">{sentimentConfig.icon}</span>
                                      <span className="text-xs font-medium">{sentimentConfig.label}</span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Sentimento derivado: {sentimentConfig.label}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {mention.brands && (
                                <Badge variant="outline">
                                  {(mention.brands as any).name}
                                </Badge>
                              )}
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${confidenceLevel.color}`} />
                                      <Badge variant={confidenceLevel.variant} className="text-xs font-semibold">
                                        {confidence}% Confiança
                                      </Badge>
                                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-semibold">{confidenceLevel.label}</p>
                                      <p className="text-xs">{getConfidenceDescription(confidence, mention.mentioned)}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <span>Análise IA</span>
                                      <span className="text-blue-500">●</span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Análise inteligente de sentimento e contexto em desenvolvimento</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <span className="text-xs text-muted-foreground">
                                {new Date(mention.collected_at).toLocaleString('pt-BR')}
                              </span>
                            </div>

                            <p className="font-medium mb-3 text-foreground">{mention.query}</p>

                            {confidence < 50 && (
                              <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3 shadow-sm">
                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                                    Atenção: Confiança baixa
                                  </p>
                                  <p className="text-xs text-yellow-700 dark:text-yellow-400/90">
                                    Recomendamos verificar manualmente ou coletar novamente esta menção.
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="bg-muted/50 p-4 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {mention.answer_excerpt || "Sem resposta disponível"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        ) : mentionsList.length > 0 ? (
          <Card className="p-12 text-center">
            <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma menção encontrada</h3>
            <p className="text-muted-foreground mb-6">
              Ajuste os filtros para ver mais resultados
            </p>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma menção coletada ainda</h3>
            <p className="text-muted-foreground mb-6">
              Selecione uma marca e clique em "Coletar Menções" para começar
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
