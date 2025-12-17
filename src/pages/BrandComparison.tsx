import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Home } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
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

      // ✅ OTIMIZADO: Query única com IN ao invés de N+1 queries
      const brandIds = (brandsData || []).map(b => b.id);
      
      if (brandIds.length > 0) {
        const { data: allScores, error: scoresError } = await supabase
          .from('geo_scores')
          .select('*')
          .in('brand_id', brandIds)
          .order('computed_at', { ascending: true });

        if (scoresError) throw scoresError;

        // Agrupar scores por brand_id
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
      <div className="min-h-screen bg-background p-8">
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

  const colors = ['hsl(215, 90%, 35%)', 'hsl(190, 85%, 45%)', 'hsl(280, 80%, 50%)', 'hsl(30, 85%, 50%)'];

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
              <BreadcrumbPage>Comparação de Marcas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Comparação de Marcas</h1>
          <p className="text-muted-foreground">
            Compare o desempenho GEO entre diferentes marcas
          </p>
        </div>

        {/* Brands Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          {brands.map((brand, index) => {
            const scores = scoresMap.get(brand.id);
            const latestScore = scores?.[scores.length - 1];
            const previousScore = scores?.[scores.length - 2];
            const change = latestScore && previousScore 
              ? ((latestScore.score - previousScore.score) / previousScore.score) * 100 
              : 0;

            return (
              <Card 
                key={brand.id} 
                className="p-6 card-hover animate-scale-in flex flex-col justify-between h-full"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{brand.name}</h3>
                    {latestScore && (
                      <Badge variant={change >= 0 ? "default" : "destructive"}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {change.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
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
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground break-all">
                    {brand.domain}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Time Series Comparison */}
        <Card className="p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-xl font-semibold mb-4">Evolução Temporal dos Scores</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {brands.map((brand, index) => (
                <Line 
                  key={brand.id}
                  type="monotone" 
                  dataKey={brand.name} 
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar Chart for Pillar Comparison */}
        <Card className="p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-xl font-semibold mb-4">Comparação por Pilares</h3>
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={radarData[0] ? Object.keys(radarData[0]).filter(k => k !== 'brand' && k !== 'color').map(key => {
              const dataPoint: any = { pillar: key };
              radarData.forEach(brand => {
                dataPoint[brand.brand] = brand[key as keyof typeof brand];
              });
              return dataPoint;
            }) : []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="pillar" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              {brands.map((brand, index) => (
                <Radar
                  key={brand.id}
                  name={brand.name}
                  dataKey={brand.name}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default BrandComparison;
