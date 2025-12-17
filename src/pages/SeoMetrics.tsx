import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Home, 
  MousePointerClick,
  Target,
  ShoppingCart,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Table as TableIcon,
  Loader2,
  FileDown
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DataSourceBadge } from '@/components/DataSourceBadge';
import { useAudit } from "@/hooks/useAudit";
import { AuditButton } from "@/components/audit/AuditButton";
import { AuditBadge } from "@/components/audit/AuditBadge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportSEOReport } from "@/utils/pdf";
import { logger } from "@/utils/logger";

interface Brand {
  id: string;
  name: string;
  domain: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  trend: string;
  icon: any;
  available: boolean;
  source: 'ga4' | 'gsc' | 'integration';
  color: string;
  description: string;
}

const SeoMetrics = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  
  // Sistema de auditoria centralizado
  const { executeAudit, isAuditing, lastAuditResult } = useAudit({ autoGeneratePDF: true });

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchMetrics();
    }
  }, [selectedBrand]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, domain')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBrands(data || []);
      if (data && data.length > 0) {
        setSelectedBrand(data[0].id);
      }
    } catch (error) {
      logger.error('Erro ao buscar marcas em SEO Metrics', { error });
      toast({
        title: "Erro ao carregar marcas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    if (!selectedBrand) return;
    setLoading(true);
    
    const brand = brands.find(b => b.id === selectedBrand);
    if (!brand) {
      setLoading(false);
      return;
    }

    try {
      // Buscar últimos 30 dias de métricas
      const { data: metricsData, error } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('brand_id', brand.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      logger.debug('Métricas SEO carregadas', { count: metricsData.length, brandId: selectedBrand });

      // Calcular métricas atuais (dia mais recente)
      const latest = metricsData?.[0];
      
      // Atualizar data da última coleta com informação da data dos dados
      if (latest) {
        const collectedDate = new Date(latest.collected_at).toLocaleString('pt-BR');
        const dataDate = new Date(latest.date).toLocaleDateString('pt-BR');
        setLastUpdate(`${collectedDate} (dados de ${dataDate})`);
      }
      
      // Calcular tendências (comparar com 7 dias atrás)
      const weekAgo = metricsData?.[6];
      
      const calculateTrend = (current: number, previous: number) => {
        if (!previous || previous === 0) return "—";
        const diff = ((current - previous) / previous) * 100;
        return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
      };

      const realMetrics: MetricCard[] = [
        {
          title: "Tráfego Orgânico",
          value: latest?.organic_traffic?.toLocaleString('pt-BR') || "0",
          trend: weekAgo ? calculateTrend(latest?.organic_traffic || 0, weekAgo.organic_traffic || 0) : "—",
          icon: TrendingUp,
          available: true,
          source: 'ga4',
          color: 'from-blue-500 to-blue-600',
          description: "Visitantes do Google"
        },
        {
          title: "CTR Orgânico",
          value: latest?.ctr ? `${(latest.ctr * 100).toFixed(2)}%` : "0%",
          trend: weekAgo ? calculateTrend(latest?.ctr || 0, weekAgo.ctr || 0) : "—",
          icon: MousePointerClick,
          available: true,
          source: 'gsc',
          color: 'from-green-500 to-green-600',
          description: "Taxa de cliques nos resultados"
        },
        {
          title: "Posição Média",
          value: latest?.avg_position ? latest.avg_position.toFixed(1) : "0",
          trend: weekAgo ? calculateTrend(weekAgo.avg_position || 0, latest?.avg_position || 0) : "—", // Invertido (menor é melhor)
          icon: Target,
          available: true,
          source: 'gsc',
          color: 'from-purple-500 to-purple-600',
          description: "Ranking médio no Google"
        },
        {
          title: "Taxa de Conversão",
          value: latest?.conversion_rate ? `${(latest.conversion_rate * 100).toFixed(2)}%` : "0%",
          trend: weekAgo ? calculateTrend(latest?.conversion_rate || 0, weekAgo.conversion_rate || 0) : "—",
          icon: ShoppingCart,
          available: true,
          source: 'ga4',
          color: 'from-orange-500 to-orange-600',
          description: "Conversões do tráfego orgânico"
        }
      ];

      setMetrics(realMetrics);

      // Preparar dados do gráfico (reverter ordem para cronológica e formatar)
      const formattedChartData = (metricsData || [])
        .reverse()
        .map(item => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          trafego: item.organic_traffic || 0,
          ctr: item.ctr || 0,
          conversao: item.conversion_rate ? item.conversion_rate * 100 : 0,
          posicao: item.avg_position || 0,
        }));
      
      setChartData(formattedChartData);

      // Se não há dados, mostrar mensagem
      if (!metricsData || metricsData.length === 0) {
        toast({
          title: "Aguardando dados",
          description: "Execute a coleta de métricas para ver dados reais",
        });
        setChartData([]);
      }

    } catch (error) {
      logger.error('Erro ao carregar métricas SEO', { error, brandId: selectedBrand });
      toast({
        title: "Erro ao carregar métricas",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      // Fallback para métricas vazias
      setMetrics([
        {
          title: "Tráfego Orgânico",
          value: "0",
          trend: "—",
          icon: TrendingUp,
          available: true,
          source: 'ga4',
          color: 'from-blue-500 to-blue-600',
          description: "Visitantes do Google"
        },
        {
          title: "CTR Orgânico",
          value: "0%",
          trend: "—",
          icon: MousePointerClick,
          available: true,
          source: 'gsc',
          color: 'from-green-500 to-green-600',
          description: "Taxa de cliques nos resultados"
        },
        {
          title: "Posição Média",
          value: "0",
          trend: "—",
          icon: Target,
          available: true,
          source: 'gsc',
          color: 'from-purple-500 to-purple-600',
          description: "Ranking médio no Google"
        },
        {
          title: "Taxa de Conversão",
          value: "0%",
          trend: "—",
          icon: ShoppingCart,
          available: true,
          source: 'ga4',
          color: 'from-orange-500 to-orange-600',
          description: "Conversões do tráfego orgânico"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <LoadingSpinner size="lg" text="Carregando métricas SEO..." fullScreen />
        </div>
      </div>
    );
  }

  const selectedBrandData = brands.find(b => b.id === selectedBrand);

  return (
    <div className="min-h-screen bg-background p-8">
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
              <BreadcrumbPage>Métricas SEO</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex justify-between items-start animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold gradient-text">Métricas SEO</h1>
                <DataSourceBadge type="real" />
              </div>
              <p className="text-muted-foreground">
                Principais indicadores de desempenho em motores de busca
              </p>
            </div>
            {lastAuditResult && (
              <AuditBadge 
                status={lastAuditResult.status}
                maxDivergence={lastAuditResult.max_divergence_percentage}
                inconsistencies={lastAuditResult.inconsistencies_found}
              />
            )}
          </div>

          <div className="flex gap-3">
            {/* Export PDF Button */}
            <Button
              onClick={async () => {
                if (!selectedBrand || !brands.length) {
                  toast({
                    title: "Selecione uma marca",
                    description: "Por favor, selecione uma marca para exportar",
                    variant: "destructive",
                  });
                  return;
                }
                
                if (isExporting) return;
                
                setIsExporting(true);
                
                try {
                  const brand = brands.find(b => b.id === selectedBrand);
                  if (!brand) return;

                  // Buscar últimas métricas
                  const latest = chartData[chartData.length - 1];
                  const seoData = {
                    brandName: brand.name,
                    seoScore: metrics.find(m => m.title === 'Tráfego Orgânico')?.value === '0' ? 0 : 75,
                    metrics: {
                      organic_traffic: latest?.trafego || 0,
                      total_clicks: latest?.trafego || 0,
                      total_impressions: (latest?.trafego || 0) * 10,
                      ctr: latest?.ctr || 0,
                      avg_position: latest?.posicao || 0,
                      seo_score: metrics.find(m => m.title === 'Tráfego Orgânico')?.value === '0' ? 0 : 75,
                    },
                    period: 'Últimos 30 dias',
                  };

                  await exportSEOReport(seoData);

                  toast({
                    title: "PDF Exportado!",
                    description: "Relatório SEO gerado com sucesso",
                  });
                } catch (error) {
                  logger.error('Erro ao exportar PDF SEO', { error });
                  toast({
                    title: "Erro ao exportar",
                    description: "Não foi possível gerar o PDF",
                    variant: "destructive",
                  });
                } finally {
                  setIsExporting(false);
                }
              }}
              variant="outline"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar PDF
                </>
              )}
            </Button>
            
            {/* Audit Button */}
            <AuditButton 
              onClick={async () => {
                const brandName = brands.find(b => b.id === selectedBrand)?.name;
                if (selectedBrand) {
                  await executeAudit(selectedBrand, brandName);
                }
              }}
              isAuditing={isAuditing}
              disabled={!metrics.length}
            />
            
            {/* Manual Collection Button */}
            <Button
              onClick={async () => {
                setCollecting(true);
                try {
                  toast({
                    title: "Coletando métricas...",
                    description: "Isso pode levar alguns minutos",
                  });

                  const { data, error } = await supabase.functions.invoke('collect-seo-metrics');
                  
                  if (error) throw error;
                  
                  // Calcular SEO Score após coleta
                  if (selectedBrand) {
                    await supabase.functions.invoke('calculate-seo-score', {
                      body: { brandId: selectedBrand }
                    });
                  }
                  
                  toast({
                    title: "✅ Coleta concluída",
                    description: `${data.summary.successful} de ${data.summary.total} marcas processadas`,
                  });
                  
                  // Invalidate cache and reload metrics
                  await queryClient.invalidateQueries();
                await fetchMetrics();
              } catch (error) {
                logger.error('Erro na coleta SEO', { error, brandId: selectedBrand });
                  toast({
                    title: "Erro na coleta",
                    description: error instanceof Error ? error.message : "Erro desconhecido",
                    variant: "destructive",
                  });
                } finally {
                  setCollecting(false);
                }
              }}
              variant="outline"
              disabled={collecting}
              className="relative"
            >
              {collecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Coletando...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Coletar Agora
                </>
              )}
            </Button>
            
            {/* Brand Selector */}
            <div className="w-64">
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
          </div>
        </div>

        {/* Brand Info */}
        {selectedBrandData && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{selectedBrandData.name}</div>
                <div className="text-sm text-muted-foreground">{selectedBrandData.domain}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {lastUpdate ? `Última coleta: ${lastUpdate}` : 'Nenhum dado coletado ainda'}
              </div>
            </div>
          </Card>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden card-hover animate-scale-in ${
                !metric.available ? 'opacity-75' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10`} />
              
              {/* Content */}
              <div className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.color}`}>
                      <metric.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        {metric.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>

                {/* Value */}
                <div className="space-y-1">
                  <div className={`text-3xl font-bold ${
                    metric.available ? '' : 'text-muted-foreground'
                  }`}>
                    {metric.value}
                  </div>
                  
                  {/* Trend */}
                  {metric.available && metric.trend !== '—' && (
                    <div className={`text-sm flex items-center gap-1 ${
                      metric.trend.startsWith('+') ? 'text-green-600' : 
                      metric.trend.startsWith('-') ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {metric.trend.startsWith('+') && <TrendingUp className="h-3 w-3" />}
                      {metric.trend.startsWith('-') && <TrendingUp className="h-3 w-3 rotate-180" />}
                      <span>{metric.trend} vs mês anterior</span>
                    </div>
                  )}
                </div>

                {/* Source Badge */}
                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Fonte: {metric.source === 'ga4' ? 'Google Analytics 4' : 'Search Console'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Available Metrics Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Evolução das Métricas (Últimos 30 dias)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                📊 Dados reais da análise técnica SEO
              </p>
            </div>
            {chartData.length > 0 && chartData.length < 5 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">
                  {chartData.length} {chartData.length === 1 ? 'dia' : 'dias'} de histórico
                </span>
              </div>
            )}
          </div>

          {/* Mensagem explicativa quando há poucos dados */}
          {chartData.length > 0 && chartData.length < 5 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-foreground">📅 Acumulando histórico</p>
                  <p className="text-muted-foreground mt-1">
                    Continue coletando métricas diariamente para visualizar a evolução completa. 
                    {chartData.length < 5 && ` Faltam ${5 - chartData.length} dias para um histórico semanal.`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {chartData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum dado disponível ainda</p>
                <p className="text-sm mt-1">Clique em "Coletar Agora" para gerar os primeiros dados</p>
              </div>
            </div>
          ) : chartData.length < 5 ? (
            // Usa gráfico de barras quando há poucos dados
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="trafego" 
                  fill="hsl(217, 91%, 60%)" 
                  name="Tráfego Orgânico" 
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="ctr" 
                  fill="hsl(142, 76%, 36%)" 
                  name="CTR (%)" 
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="conversao" 
                  fill="hsl(24, 95%, 53%)" 
                  name="Conversão (%)" 
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="posicao" 
                  fill="hsl(262, 83%, 58%)" 
                  name="Posição Média" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            // Usa gráfico de linhas quando há 5+ dias de dados
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="trafego" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={2} 
                  name="Tráfego Orgânico" 
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="ctr" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2} 
                  name="CTR (%)" 
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversao" 
                  stroke="hsl(24, 95%, 53%)" 
                  strokeWidth={2} 
                  name="Conversão (%)" 
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="posicao" 
                  stroke="hsl(262, 83%, 58%)" 
                  strokeWidth={2} 
                  name="Posição Média" 
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Tabela de dados detalhados */}
          {chartData.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <TableIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Dados Detalhados</h4>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Data</th>
                        <th className="px-4 py-3 text-right font-medium">Tráfego</th>
                        <th className="px-4 py-3 text-right font-medium">CTR (%)</th>
                        <th className="px-4 py-3 text-right font-medium">Conversão (%)</th>
                        <th className="px-4 py-3 text-right font-medium">Posição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {chartData.slice().reverse().map((row, index) => (
                        <tr key={index} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{row.date}</td>
                          <td className="px-4 py-3 text-right">{row.trafego.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 text-right">{row.ctr.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-right">{row.conversao.toFixed(2)}%</td>
                          <td className="px-4 py-3 text-right">{row.posicao.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Principais Conquistas
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Monitoramento contínuo de métricas SEO ativo</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Dados históricos disponíveis para análise de tendências</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Integração com Google Search Console configurada</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Próximos Passos
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>Melhorar CTR com meta descriptions otimizadas</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>Focar em palavras-chave na posição 11-20</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>Aumentar taxa de conversão com landing pages otimizadas</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SeoMetrics;
