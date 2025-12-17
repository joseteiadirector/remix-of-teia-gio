import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar,
  Filter,
  Share2,
  Home,
  CheckSquare,
  Square,
  FileBarChart,
  Info,
  ArrowRight
} from "lucide-react";
import { logger } from "@/utils/logger";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportCombinedReport } from "@/utils/pdf";
import { useQueryClient } from "@tanstack/react-query";
import { queryCache } from "@/utils/queryCache";

interface Brand {
  id: string;
  name: string;
  domain: string;
}

interface Metrics {
  scoreAtual: number;
  mencaoesTotais: number;
  visibilidade: number;
  autoridade: number;
  scoreInicial: number;
  crescimento: number;
}

const Reports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrands.length === 1) {
      fetchMetrics();
    } else {
      setMetrics(null);
      setLoading(false);
    }
  }, [selectedBrands, selectedPeriod]);

  // Reset metrics when brand changes to show loading state
  useEffect(() => {
    setMetrics(null);
    setLoading(true);
  }, [selectedBrands]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, domain')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBrands(data || []);
      if (data && data.length > 0) {
        setSelectedBrands([data[0].id]);
      }
    } catch (error) {
      logger.error('Error fetching brands', { error });
    }
  };

  const fetchMetrics = async () => {
    if (selectedBrands.length !== 1) return;
    
    setLoading(true);
    try {
      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365
      }[selectedPeriod];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      logger.info('Fetching metrics for brand', { brandId: selectedBrands[0], period: selectedPeriod });

      // Buscar scores do período
      const { data: scores, error: scoresError } = await supabase
        .from('geo_scores')
        .select('score, breakdown, computed_at')
        .eq('brand_id', selectedBrands[0])
        .gte('computed_at', startDate.toISOString())
        .order('computed_at', { ascending: true });

      if (scoresError) throw scoresError;

      // Buscar menções do período - apenas contar
      const { count: mentionsCount, error: mentionsError } = await supabase
        .from('mentions_llm')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', selectedBrands[0])
        .gte('collected_at', startDate.toISOString());

      if (mentionsError) throw mentionsError;

      logger.debug('Scores fetched', { count: scores?.length, latestScore: scores?.[scores.length - 1] });

      if (scores && scores.length > 0) {
        const latestScore = scores[scores.length - 1];
        const firstScore = scores[0];
        
        const scoreAtual = Number(latestScore.score) || 0;
        const scoreInicial = Number(firstScore.score) || 0;
        const crescimento = scoreInicial > 0 
          ? ((scoreAtual - scoreInicial) / scoreInicial) * 100 
          : 0;

        const breakdown = latestScore.breakdown as any;
        
        const newMetrics = {
          scoreAtual,
          mencaoesTotais: mentionsCount || 0,
          visibilidade: breakdown?.relevancia_conversacional || 0,
          autoridade: breakdown?.autoridade_cognitiva || 0,
          scoreInicial,
          crescimento
        };

        logger.debug('Setting metrics', { metrics: newMetrics });
        setMetrics(newMetrics);
      } else {
        const emptyMetrics = {
          scoreAtual: 0,
          mencaoesTotais: 0,
          visibilidade: 0,
          autoridade: 0,
          scoreInicial: 0,
          crescimento: 0
        };
        logger.debug('No scores found, setting empty metrics');
        setMetrics(emptyMetrics);
      }
    } catch (error) {
      logger.error('Error fetching metrics', { error });
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as métricas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentBrand = selectedBrands.length === 1 ? brands.find(b => b.id === selectedBrands[0]) : null;
  const selectedBrandNames = brands.filter(b => selectedBrands.includes(b.id)).map(b => b.name).join(", ");

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleAllBrands = () => {
    if (selectedBrands.length === brands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(brands.map(b => b.id));
    }
  };

  const generateReport = async (type: 'individual' | 'comparative') => {
    setGeneratingReport(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      toast({
        title: type === 'individual' ? "Gerando Relatório Individual" : "Gerando Relatório Comparativo",
        description: "Aguarde enquanto processamos os dados...",
      });

      const { data, error } = await supabase.functions.invoke('ai-report-generator', {
        body: {
          userId: user.id,
          reportType: type,
          brandIds: selectedBrands,
          period: selectedPeriod === 'week' ? '7days' : selectedPeriod === 'month' ? '30days' : '90days'
        }
      });

      if (error) throw error;

      // 🔥 CONSISTÊNCIA CRÍTICA: Invalidar cache em TODOS os lugares que geram insights
      logger.info('Relatório gerado, invalidando cache');
      queryCache.invalidatePattern(`insights-${user.id}`);
      await queryClient.invalidateQueries({ queryKey: ['ai-insights'] });

      toast({
        title: "Relatório Gerado!",
        description: "O relatório está disponível na seção de Insights IA",
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/insights')}
            className="gap-2"
          >
            Ver Insights
            <ArrowRight className="h-4 w-4" />
          </Button>
        ),
      });
    } catch (error: any) {
      logger.error('Error generating report', { error });
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const metricsDisplay = metrics ? [
    { 
      label: "Score GEO Médio", 
      value: metrics.scoreAtual.toFixed(1), 
      change: `${metrics.crescimento > 0 ? '+' : ''}${metrics.crescimento.toFixed(1)}%`,
      badge: "GEO Score",
      source: "Análises GEO",
      description: "Score médio das análises GEO do período. Calculado com base nos 5 pilares: Base Técnica, Estrutura Semântica, Relevância Conversacional, Autoridade Cognitiva e Inteligência Estratégica."
    },
    { 
      label: "Menções em LLMs", 
      value: metrics.mencaoesTotais.toString(), 
      change: "+8%",
      badge: "GEO",
      source: "Menções LLM",
      description: "Total de menções coletadas de modelos de linguagem (ChatGPT, Gemini, Perplexity). Parte fundamental da análise GEO de Relevância Conversacional."
    },
    { 
      label: "Visibilidade (GEO)", 
      value: `${metrics.visibilidade}%`, 
      change: "+5%",
      badge: "Pilar GEO",
      source: "Relevância Conversacional",
      description: "Um dos 5 pilares do GEO Score. Mede o quanto sua marca aparece e é relevante em conversas com assistentes de IA."
    },
    { 
      label: "Autoridade (GEO)", 
      value: `${metrics.autoridade}%`, 
      change: "+15%",
      badge: "Pilar GEO",
      source: "Autoridade Cognitiva",
      description: "Um dos 5 pilares do GEO Score. Avalia o nível de confiabilidade e expertise que sua marca demonstra para modelos de IA."
    },
  ] : [];

  const periodLabels: Record<string, string> = {
    week: "Última Semana",
    month: "Último Mês",
    quarter: "Último Trimestre",
    year: "Último Ano"
  };

  const reportData = {
    period: periodLabels[selectedPeriod],
    brand: selectedBrandNames || "Nenhuma marca selecionada",
    metrics: metricsDisplay,
    scoreInicial: metrics?.scoreInicial.toFixed(1) || "0.0",
    scoreFinal: metrics?.scoreAtual.toFixed(1) || "0.0",
    growth: `${metrics?.crescimento && metrics.crescimento > 0 ? '+' : ''}${metrics?.crescimento.toFixed(1) || '0.0'}%`
  };

  const exportReport = async (format: string) => {
    if (format !== 'pdf' || !selectedBrands.length || !metrics) return;

    toast({
      title: "📊 Gerando Relatório Combinado",
      description: "Aguarde enquanto preparamos GEO + SEO...",
    });

    try {
      const currentBrand = brands.find(b => b.id === selectedBrands[0]);
      if (!currentBrand) throw new Error('Marca não encontrada');

      // Buscar dados GEO
      const { data: geoScores } = await supabase
        .from('geo_scores')
        .select('score, breakdown')
        .eq('brand_id', selectedBrands[0])
        .order('computed_at', { ascending: false })
        .limit(1);

      const { data: mentions } = await supabase
        .from('mentions_llm')
        .select('provider, query, mentioned, confidence')
        .eq('brand_id', selectedBrands[0])
        .order('collected_at', { ascending: false })
        .limit(30);

      // Buscar dados SEO
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('brand_id', selectedBrands[0])
        .order('date', { ascending: false })
        .limit(1);

      const latestGeo = geoScores?.[0];
      const latestSeo = seoData?.[0];

      await exportCombinedReport(
        {
          brandName: currentBrand.name,
          brandDomain: currentBrand.domain,
          geoScore: latestGeo?.score || 0,
          pillars: latestGeo ? [
            { name: 'Base Técnica', value: (latestGeo.breakdown as any).base_tecnica },
            { name: 'Estrutura Semântica', value: (latestGeo.breakdown as any).estrutura_semantica },
            { name: 'Relevância Conversacional', value: (latestGeo.breakdown as any).relevancia_conversacional },
            { name: 'Autoridade Cognitiva', value: (latestGeo.breakdown as any).autoridade_cognitiva },
            { name: 'Inteligência Estratégica', value: (latestGeo.breakdown as any).inteligencia_estrategica }
          ] : [],
          mentions: mentions?.map(m => ({
            provider: m.provider,
            query: m.query,
            mentioned: m.mentioned,
            confidence: m.confidence
          })) || [],
          period: reportData.period
        },
        {
          brandName: currentBrand.name,
          seoScore: latestSeo?.seo_score || 0,
          metrics: {
            organic_traffic: latestSeo?.organic_traffic || 0,
            total_clicks: latestSeo?.total_clicks || 0,
            total_impressions: latestSeo?.total_impressions || 0,
            ctr: latestSeo?.ctr || 0,
            avg_position: latestSeo?.avg_position || 0,
            seo_score: latestSeo?.seo_score || 0
          },
          period: reportData.period
        }
      );

      toast({
        title: "✅ Exportação concluída!",
        description: "Relatório combinado GEO+SEO exportado",
      });
    } catch (error) {
      logger.error('Erro ao exportar relatório combinado', { error });
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Não foi possível gerar o arquivo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-8">
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
              <BreadcrumbPage>Relatórios</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-2">
              Análises detalhadas e exportação de dados
            </p>
          </div>
          
          <div className="flex gap-3 items-center">
            {/* Brand Multi-Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-between">
                  <span className="truncate">
                    {selectedBrands.length === 0 
                      ? "Selecione marcas" 
                      : selectedBrands.length === 1 
                        ? brands.find(b => b.id === selectedBrands[0])?.name 
                        : `${selectedBrands.length} marcas selecionadas`}
                  </span>
                  <Filter className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-4 space-y-2">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox 
                      id="all-brands"
                      checked={selectedBrands.length === brands.length}
                      onCheckedChange={toggleAllBrands}
                    />
                    <label htmlFor="all-brands" className="text-sm font-semibold cursor-pointer">
                      Todas as marcas
                    </label>
                  </div>
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={brand.id}
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => toggleBrand(brand.id)}
                      />
                      <label 
                        htmlFor={brand.id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Report Generation Buttons */}
            {selectedBrands.length === 1 && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => generateReport('individual')}
                disabled={generatingReport}
              >
                <FileBarChart className="w-4 h-4 mr-2" />
                Gerar Relatório Individual
              </Button>
            )}
            
            {selectedBrands.length > 1 && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => generateReport('comparative')}
                disabled={generatingReport}
              >
                <FileBarChart className="w-4 h-4 mr-2" />
                Gerar Relatório Comparativo
              </Button>
            )}

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {selectedBrands.length === 0 ? (
            <Card className="col-span-4 p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Nenhuma marca selecionada</p>
              <p className="text-sm text-muted-foreground">
                Selecione uma ou mais marcas para visualizar métricas e gerar relatórios
              </p>
            </Card>
          ) : selectedBrands.length === 1 && loading ? (
            <div className="col-span-4">
              <LoadingSpinner size="md" text="Carregando métricas..." className="py-8" />
            </div>
          ) : selectedBrands.length === 1 ? (
            metricsDisplay.map((metric, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {metric.badge}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs font-semibold mb-1">📊 {metric.source}</p>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    metric.change.startsWith('+') 
                      ? 'text-green-500 bg-green-500/10' 
                      : 'text-red-500 bg-red-500/10'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-3xl font-bold">{metric.value}</p>
              </Card>
            ))
          ) : (
            <Card className="col-span-4 p-8 text-center">
              <FileBarChart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-semibold mb-2">Múltiplas Marcas Selecionadas</p>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedBrands.length} marcas selecionadas para análise comparativa
              </p>
              <p className="text-xs text-muted-foreground">
                Clique em "Gerar Relatório Comparativo" para comparar o desempenho entre as marcas
              </p>
            </Card>
          )}
        </div>

        {/* Export Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Exportar Dados</h2>
                <p className="text-sm text-muted-foreground">
                  Baixe relatórios completos em diferentes formatos
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportReport("pdf")}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportReport("excel")}
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportReport("csv")}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="week" disabled={loading}>Semana</TabsTrigger>
              <TabsTrigger value="month" disabled={loading}>Mês</TabsTrigger>
              <TabsTrigger value="quarter" disabled={loading}>Trimestre</TabsTrigger>
              <TabsTrigger value="year" disabled={loading}>Ano</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="mt-6">
              {loading ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </Card>
              ) : (
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">
                      Período: {selectedPeriod === "week" ? "Última Semana" : 
                                selectedPeriod === "month" ? "Último Mês" :
                                selectedPeriod === "quarter" ? "Último Trimestre" : "Último Ano"}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Score Inicial</p>
                        <p className="text-2xl font-bold">{reportData.scoreInicial}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Score Final</p>
                        <p className="text-2xl font-bold">{reportData.scoreFinal}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${
                      metrics?.crescimento && metrics.crescimento >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold">{reportData.growth} de crescimento</span>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Detailed Analysis */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Análise Detalhada</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-lg">Principais Insights</h3>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li>• Crescimento significativo em Autoridade Cognitiva (+15%)</li>
                <li>• Aumento constante nas menções dos LLMs</li>
                <li>• Base técnica mantida em alto nível (40.0)</li>
                <li>• Inteligência estratégica atingiu pontuação máxima</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-4">
              <h3 className="font-semibold text-lg">Recomendações</h3>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                <li>• Focar em melhorar Estrutura Semântica (atualmente 0.0)</li>
                <li>• Aumentar Relevância Conversacional através de mais conteúdo</li>
                <li>• Manter estratégias atuais para Autoridade Cognitiva</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
