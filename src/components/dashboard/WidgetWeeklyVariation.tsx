import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card as WidgetCard } from "@/components/ui/card";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Minus, X, Calendar, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME } from "@/config/brandVisibility";

interface WidgetWeeklyVariationProps {
  onRemove?: () => void;
}

interface Brand {
  id: string;
  name: string;
}

interface GeoScore {
  score: number;
  computed_at: string;
  brand_id: string;
}

const WidgetWeeklyVariationComponent = ({ onRemove }: WidgetWeeklyVariationProps) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>("all");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Get current week boundaries
  const now = new Date();
  const weekStart = startOfWeek(now, { locale: ptBR });
  const weekEnd = endOfWeek(now, { locale: ptBR });

  // ✅ FILTRO CONTROLADO PELO CÓDIGO
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["brands", USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("brands")
        .select("*")
        .eq("user_id", user.id);
      
      if (USE_CODE_BASED_VISIBILITY) {
        query = query.eq('name', VISIBLE_BRAND_NAME);
      } else {
        query = query.eq('is_visible', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Brand[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const { data: weeklyData, isLoading: dataLoading, dataUpdatedAt } = useQuery({
    queryKey: ["weekly-variation", selectedBrandId, weekStart, weekEnd],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get scores from the last 7 days
      const sevenDaysAgo = subDays(now, 7);
      
      let query = supabase
        .from("geo_scores")
        .select("*, brands!inner(name, user_id)")
        .eq("brands.user_id", user.id)
        .gte("computed_at", sevenDaysAgo.toISOString())
        .lte("computed_at", now.toISOString())
        .order("computed_at", { ascending: true });

      if (selectedBrandId !== "all") {
        query = query.eq("brand_id", selectedBrandId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as (GeoScore & { brands: { name: string } })[];
    },
    enabled: !!brands && brands.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos - dados semanais mudam com menos frequência
  });

  const isLoading = brandsLoading || dataLoading;

  // Process data for chart
  const chartData = weeklyData?.reduce((acc: any[], score) => {
    const date = format(new Date(score.computed_at), "dd/MM", { locale: ptBR });
    const existingDate = acc.find(item => item.date === date);
    
    if (existingDate) {
      existingDate[score.brand_id] = score.score;
    } else {
      acc.push({
        date,
        [score.brand_id]: score.score,
      });
    }
    
    return acc;
  }, []) || [];

  // Calculate variations
  const variations = brands?.map(brand => {
    const brandScores = weeklyData?.filter(s => s.brand_id === brand.id) || [];
    if (brandScores.length < 2) return null;

    const firstScore = brandScores[0].score;
    const lastScore = brandScores[brandScores.length - 1].score;
    const change = lastScore - firstScore;
    const percentChange = ((change / firstScore) * 100).toFixed(2);

    return {
      brand,
      firstScore,
      lastScore,
      change,
      percentChange: parseFloat(percentChange),
    };
  }).filter(Boolean);

  const getTrendIcon = (change: number) => {
    if (change > 0.5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < -0.5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const handleGenerateWeeklyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const { error } = await supabase.functions.invoke('weekly-reset-notification');
      
      if (error) throw error;
      
      toast.success('Resumo semanal gerado!', {
        description: 'As notificações foram enviadas.'
      });
    } catch (error) {
      logger.error('Error generating weekly report', { error });
      toast.error('Erro ao gerar resumo', {
        description: 'Não foi possível gerar o resumo semanal.'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  return (
    <WidgetCard className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">
              Variação Semanal ({format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM", { locale: ptBR })})
            </h3>
          </div>
          {dataUpdatedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-7">
              <Clock className="w-3 h-3" />
              <span>Atualizado {formatDistanceToNow(dataUpdatedAt, { addSuffix: true, locale: ptBR })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWeeklyReport}
            disabled={isGeneratingReport}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingReport ? 'animate-spin' : ''}`} />
            Gerar Resumo
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Marcas</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !weeklyData || weeklyData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Sem dados suficientes para esta semana
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <ChartContainer
              config={{}}
              className="h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {selectedBrandId === "all" ? (
                    brands?.map((brand, index) => (
                      <Line
                        key={brand.id}
                        type="monotone"
                        dataKey={brand.id}
                        name={brand.name}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={selectedBrandId}
                      name={brands?.find(b => b.id === selectedBrandId)?.name}
                      stroke={colors[0]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="space-y-2">
              {variations?.map((v) => (
                <Card key={v.brand.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{v.brand.name}</span>
                      {getTrendIcon(v.change)}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {v.firstScore.toFixed(2)} → {v.lastScore.toFixed(2)}
                      </span>
                      <span className={v.percentChange >= 0 ? "text-green-600" : "text-red-600"}>
                        {v.percentChange >= 0 ? "+" : ""}{v.percentChange}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </WidgetCard>
  );
};

export const WidgetWeeklyVariation = memo(WidgetWeeklyVariationComponent);
