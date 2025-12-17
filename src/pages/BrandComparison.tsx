import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, Home, GitCompare, BarChart3, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { SkeletonChart } from "@/components/SkeletonCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { logger } from "@/utils/logger";

interface GeoScore {
  id: number;
  brand_id: string;
  score: number;
  breakdown: {
    base_tecnica: number;
    estrutura_semantica: number;
    relevancia_conversacional: number;
    autoridade_cognitiva: number;
    inteligencia_estrategica: number;
  };
  computed_at: string;
  cpi: number;
}

interface Brand {
  id: string;
  name: string;
  domain: string;
}

// Premium Tooltip Component
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-background/95 backdrop-blur-xl p-4 shadow-2xl shadow-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10">
          <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </span>
              <span className="font-bold text-foreground">{Number(entry.value).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const BrandComparison = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, GeoScore[]>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('is_visible', true);

      if (brandsError) throw brandsError;

      setBrands(brandsData || []);

      const brandIds = (brandsData || []).map(b => b.id);
      
      if (brandIds.length > 0) {
        const { data: allScores, error: scoresError } = await supabase
          .from('geo_scores')
          .select('*')
          .in('brand_id', brandIds)
          .order('computed_at', { ascending: true });

        if (scoresError) throw scoresError;

        const scoresData = new Map<string, GeoScore[]>();
        (allScores as GeoScore[] || []).forEach((score) => {
          if (!scoresData.has(score.brand_id)) {
            scoresData.set(score.brand_id, []);
          }
          scoresData.get(score.brand_id)!.push(score);
        });

        setScoresMap(scoresData);
      }
    } catch (error) {
      logger.error('Erro ao carregar dados de comparação', { error });
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">Comparação de Marcas</h1>
            <p className="text-muted-foreground">Compare o desempenho GEO entre diferentes marcas</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      </div>
    );
  }

  const colors = ['hsl(280, 80%, 60%)', 'hsl(190, 85%, 50%)', 'hsl(30, 85%, 55%)', 'hsl(150, 70%, 45%)'];
  const glowColors = ['rgba(168, 85, 247, 0.5)', 'rgba(6, 182, 212, 0.5)', 'rgba(249, 115, 22, 0.5)', 'rgba(34, 197, 94, 0.5)'];

  // Prepare time series data for all brands
  const timeSeriesData = Array.from(scoresMap.entries()).reduce((acc, [brandId, scores]) => {
    scores.forEach(score => {
      const date = new Date(score.computed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const brand = brands.find(b => b.id === brandId);
      
      const existingEntry = acc.find(e => e.date === date);
      if (existingEntry) {
        existingEntry[brand?.name || brandId] = Number(score.score.toFixed(2));
      } else {
        acc.push({
          date,
          [brand?.name || brandId]: Number(score.score.toFixed(2))
        });
      }
    });
    return acc;
  }, [] as any[]);

  // Prepare radar data for latest scores
  const radarData = brands.map((brand, index) => {
    const scores = scoresMap.get(brand.id);
    const latestScore = scores?.[scores.length - 1];
    
    return {
      brand: brand.name,
      'Base Técnica': latestScore?.breakdown.base_tecnica || 0,
      'Estrutura Semântica': latestScore?.breakdown.estrutura_semantica || 0,
      'Relevância': latestScore?.breakdown.relevancia_conversacional || 0,
      'Autoridade': latestScore?.breakdown.autoridade_cognitiva || 0,
      'Inteligência': latestScore?.breakdown.inteligencia_estrategica || 0,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary" />
                  Comparação de Marcas
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Premium Header */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                  <GitCompare className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  Comparação de Marcas
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                Compare o desempenho GEO entre diferentes marcas
              </p>
            </div>
          </div>

          {/* Brands Overview - Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {brands.map((brand, index) => {
              const scores = scoresMap.get(brand.id);
              const latestScore = scores?.[scores.length - 1];
              const previousScore = scores?.[scores.length - 2];
              const change = latestScore && previousScore 
                ? ((latestScore.score - previousScore.score) / previousScore.score) * 100 
                : 0;
              const isPositive = change >= 0;

              return (
                <Card 
                  key={brand.id} 
                  className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-xl p-6 group hover:shadow-lg hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: `${colors[index % colors.length]}20` }} />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg truncate">{brand.name}</h3>
                      {latestScore && (
                        <Badge 
                          variant="outline"
                          className={`gap-1 ${isPositive 
                            ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                            : 'bg-red-500/10 text-red-500 border-red-500/30'}`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {change.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-4xl font-bold" style={{ color: colors[index % colors.length] }}>
                        {latestScore ? latestScore.score.toFixed(1) : (
                          <span className="text-muted-foreground text-2xl">Sem dados</span>
                        )}
                      </div>
                      {latestScore && (
                        <div className="text-xs text-muted-foreground">
                          Score GEO
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground truncate">
                        {brand.domain}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Time Series Comparison - Premium Chart */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-xl hover:shadow-primary/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30">
                  <BarChart3 className="h-5 w-5 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold">Evolução Temporal dos Scores</h3>
              </div>
              
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    {brands.map((brand, index) => (
                      <linearGradient key={brand.id} id={`gradient-${brand.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip content={<PremiumTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-foreground">{value}</span>}
                  />
                  {brands.map((brand, index) => (
                    <Area 
                      key={brand.id}
                      type="monotone" 
                      dataKey={brand.name} 
                      stroke={colors[index % colors.length]}
                      strokeWidth={3}
                      fill={`url(#gradient-${brand.id})`}
                      dot={{ r: 4, fill: colors[index % colors.length], stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      activeDot={{ 
                        r: 6, 
                        fill: colors[index % colors.length], 
                        stroke: 'hsl(var(--background))', 
                        strokeWidth: 2,
                        style: { filter: `drop-shadow(0 0 8px ${glowColors[index % glowColors.length]})` }
                      }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Radar Chart for Pillar Comparison - Premium */}
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-xl hover:shadow-primary/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30">
                  <Target className="h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                </div>
                <h3 className="text-xl font-semibold">Comparação por Pilares</h3>
              </div>
              
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={radarData[0] ? Object.keys(radarData[0]).filter(k => k !== 'brand' && k !== 'color').map(key => {
                  const dataPoint: any = { pillar: key };
                  radarData.forEach(brand => {
                    dataPoint[brand.brand] = brand[key as keyof typeof brand];
                  });
                  return dataPoint;
                }) : []}>
                  <defs>
                    {brands.map((brand, index) => (
                      <linearGradient key={brand.id} id={`radar-gradient-${brand.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="pillar" 
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  {brands.map((brand, index) => (
                    <Radar
                      key={brand.id}
                      name={brand.name}
                      dataKey={brand.name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      fill={`url(#radar-gradient-${brand.id})`}
                      fillOpacity={0.4}
                    />
                  ))}
                  <Tooltip content={<PremiumTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-foreground">{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrandComparison;
