import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Home,
  Filter,
  Share2,
  TrendingUp,
  Info
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
import { exportSEOReport } from "@/utils/pdf";

interface Brand {
  id: string;
  name: string;
  domain: string;
}

interface SeoMetrics {
  organicTraffic: number;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  ctr: number;
  conversionRate: number;
  trafficChange: number;
  clicksChange: number;
  impressionsChange: number;
  positionChange: number;
}

const ReportsSeo = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<SeoMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysWithData, setDaysWithData] = useState(0);

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

      const { data: seoData, error } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('brand_id', selectedBrands[0])
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      setDaysWithData(seoData?.length || 0);

      if (seoData && seoData.length > 0) {
        const totalClicks = seoData.reduce((sum, d) => sum + (d.total_clicks || 0), 0);
        const totalImpressions = seoData.reduce((sum, d) => sum + (d.total_impressions || 0), 0);
        const totalTraffic = seoData.reduce((sum, d) => sum + (d.organic_traffic || 0), 0);
        const avgPosition = seoData.reduce((sum, d) => sum + (d.avg_position || 0), 0) / seoData.length;
        const avgCtr = seoData.reduce((sum, d) => sum + (d.ctr || 0), 0) / seoData.length;
        const avgConversion = seoData.reduce((sum, d) => sum + (d.conversion_rate || 0), 0) / seoData.length;

        // Calculate changes (comparing first vs last records)
        let trafficChange = 0;
        let clicksChange = 0;
        let impressionsChange = 0;
        let positionChange = 0;

        if (seoData.length >= 2) {
          const firstRecord = seoData[0];
          const lastRecord = seoData[seoData.length - 1];

          // Traffic change
          const firstTraffic = firstRecord.organic_traffic || 0;
          const lastTraffic = lastRecord.organic_traffic || 0;
          if (firstTraffic > 0) {
            trafficChange = ((lastTraffic - firstTraffic) / firstTraffic) * 100;
          } else if (lastTraffic > 0) {
            trafficChange = 100; // Se começou de 0 e agora tem valor, é +100%
          }

          // Clicks change
          const firstClicks = firstRecord.total_clicks || 0;
          const lastClicks = lastRecord.total_clicks || 0;
          if (firstClicks > 0) {
            clicksChange = ((lastClicks - firstClicks) / firstClicks) * 100;
          } else if (lastClicks > 0) {
            clicksChange = 100;
          }

          // Impressions change
          const firstImpressions = firstRecord.total_impressions || 0;
          const lastImpressions = lastRecord.total_impressions || 0;
          if (firstImpressions > 0) {
            impressionsChange = ((lastImpressions - firstImpressions) / firstImpressions) * 100;
          } else if (lastImpressions > 0) {
            impressionsChange = 100;
          }

          // Position change (inverted - lower position is better)
          const firstPosition = firstRecord.avg_position || 0;
          const lastPosition = lastRecord.avg_position || 0;
          if (firstPosition > 0 && lastPosition > 0) {
            positionChange = ((firstPosition - lastPosition) / firstPosition) * 100;
          }
        }

        setMetrics({
          organicTraffic: Math.round(totalTraffic / seoData.length),
          totalClicks,
          totalImpressions,
          avgPosition: Number(avgPosition.toFixed(1)),
          ctr: Number(avgCtr.toFixed(2)),
          conversionRate: Number(avgConversion.toFixed(2)),
          trafficChange: Number(trafficChange.toFixed(1)),
          clicksChange: Number(clicksChange.toFixed(1)),
          impressionsChange: Number(impressionsChange.toFixed(1)),
          positionChange: Number(positionChange.toFixed(1))
        });
      } else {
        setDaysWithData(0);
        setMetrics({
          organicTraffic: 0,
          totalClicks: 0,
          totalImpressions: 0,
          avgPosition: 0,
          ctr: 0,
          conversionRate: 0,
          trafficChange: 0,
          clicksChange: 0,
          impressionsChange: 0,
          positionChange: 0
        });
      }
    } catch (error) {
      logger.error('Error fetching SEO metrics', { error });
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as métricas SEO",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const metricsDisplay = metrics ? [
    { 
      label: "Tráfego Orgânico Médio", 
      value: metrics.organicTraffic.toLocaleString(), 
      change: `${metrics.trafficChange > 0 ? '+' : ''}${metrics.trafficChange}%`,
      badge: "SEO",
      source: "Google Analytics",
      description: "Número médio de visitantes orgânicos diários vindos de mecanismos de busca."
    },
    { 
      label: "Cliques Totais (GSC)", 
      value: metrics.totalClicks.toLocaleString(), 
      change: `${metrics.clicksChange > 0 ? '+' : ''}${metrics.clicksChange}%`,
      badge: "SEO",
      source: "Google Search Console",
      description: "Total de cliques nas páginas do seu site nos resultados de busca do Google."
    },
    { 
      label: "Impressões Totais", 
      value: metrics.totalImpressions.toLocaleString(), 
      change: `${metrics.impressionsChange > 0 ? '+' : ''}${metrics.impressionsChange}%`,
      badge: "SEO",
      source: "Google Search Console",
      description: "Número de vezes que seu site apareceu nos resultados de busca do Google."
    },
    { 
      label: "Posição Média", 
      value: metrics.avgPosition.toFixed(1), 
      change: `${metrics.positionChange > 0 ? '+' : ''}${metrics.positionChange}%`,
      badge: "SEO",
      source: "Google Search Console",
      description: "Posição média do seu site nos resultados de busca. Menor é melhor (1ª posição é a melhor)."
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
    scoreInicial: "N/A",
    scoreFinal: "N/A",
    growth: "N/A"
  };

  const exportReport = async (format: string) => {
    if (format !== 'pdf' || !selectedBrands.length || !metrics) return;

    toast({
      title: "📊 Gerando PDF SEO",
      description: "Aguarde enquanto preparamos seu relatório...",
    });

    try {
      const brandName = brands.find(b => b.id === selectedBrands[0])?.name || '';

      await exportSEOReport({
        brandName,
        seoScore: metrics.organicTraffic, // Usar tráfego como proxy de score
        metrics: {
          organic_traffic: metrics.organicTraffic,
          total_clicks: metrics.totalClicks,
          total_impressions: metrics.totalImpressions,
          ctr: metrics.ctr,
          avg_position: metrics.avgPosition,
          seo_score: metrics.organicTraffic
        },
        period: periodLabels[selectedPeriod]
      });

      toast({
        title: "✅ Exportação concluída!",
        description: "Relatório SEO exportado com sucesso",
      });
    } catch (error) {
      logger.error('Erro ao exportar PDF SEO', { error });
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
              <BreadcrumbLink href="/reports">Relatórios</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>SEO</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Relatórios SEO
              </h1>
            </div>
            <p className="text-muted-foreground">
              Métricas tradicionais de otimização para mecanismos de busca
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
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Nenhuma marca selecionada</p>
              <p className="text-sm text-muted-foreground">
                Selecione uma marca para visualizar métricas SEO
              </p>
            </Card>
          ) : selectedBrands.length === 1 && loading ? (
            <div className="col-span-4">
              <LoadingSpinner size="md" text="Carregando métricas SEO..." className="py-8" />
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
                            <p className="text-xs font-semibold mb-1">📈 {metric.source}</p>
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
                      : metric.change.startsWith('-')
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-gray-500 bg-gray-500/10'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-3xl font-bold">{metric.value}</p>
              </Card>
            ))
          ) : (
            <Card className="col-span-4 p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-semibold mb-2">Múltiplas marcas selecionadas</p>
              <p className="text-sm text-muted-foreground">
                Selecione apenas uma marca para visualizar métricas SEO detalhadas
              </p>
            </Card>
          )}
        </div>

        {/* Export Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Exportar Dados SEO</h2>
          <Tabs defaultValue="month" value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="week">Semana (7d)</TabsTrigger>
              <TabsTrigger value="month">Mês (30d)</TabsTrigger>
              <TabsTrigger value="quarter">Trimestre (90d)</TabsTrigger>
              <TabsTrigger value="year">Ano (365d)</TabsTrigger>
            </TabsList>
            <TabsContent value={selectedPeriod} className="mt-4">
              {selectedBrands.length === 1 && daysWithData > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    📊 Dados disponíveis: <span className="font-semibold text-foreground">{daysWithData} {daysWithData === 1 ? 'dia' : 'dias'}</span> de {periodLabels[selectedPeriod].toLowerCase()}
                    {daysWithData < (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : selectedPeriod === 'quarter' ? 90 : 365) && (
                      <span className="ml-2 text-amber-600 dark:text-amber-500">
                        • Aguarde mais coletas para comparações precisas
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div className="flex gap-4">
                <Button onClick={() => exportReport('pdf')} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button onClick={() => exportReport('excel')} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button onClick={() => exportReport('csv')} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ReportsSeo;
