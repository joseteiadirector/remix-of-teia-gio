import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidget } from './DashboardWidget';
import { TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface WidgetTrendsChartProps {
  onRemove?: () => void;
}

function WidgetTrendsChartComponent({ onRemove }: WidgetTrendsChartProps) {
  const { user } = useAuth();

  const { data: trendsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['widget-trends', user?.id],
    queryFn: async () => {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .eq('user_id', user!.id)
        .limit(3);

      if (!brands?.length) return [];

      // Fetch real scores from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: scores } = await supabase
        .from('geo_scores')
        .select('brand_id, score, computed_at')
        .in('brand_id', brands.map(b => b.id))
        .gte('computed_at', sevenDaysAgo.toISOString())
        .order('computed_at', { ascending: true })
        .limit(100);

      if (!scores?.length) return { data: [], brands };

      // Group scores by date
      const scoresByDate = new Map<string, Map<string, number>>();
      
      scores.forEach(score => {
        const date = new Date(score.computed_at);
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const brand = brands.find(b => b.id === score.brand_id);
        
        if (!brand) return;
        
        if (!scoresByDate.has(dateStr)) {
          scoresByDate.set(dateStr, new Map());
        }
        
        scoresByDate.get(dateStr)!.set(brand.name, Number(score.score));
      });

      // Convert to chart data format
      const chartData = Array.from(scoresByDate.entries()).map(([date, brandScores]) => {
        const dayData: any = { date };
        brandScores.forEach((score, brandName) => {
          dayData[brandName] = score;
        });
        return dayData;
      });

      return { data: chartData, brands };
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000, // 3 minutos - dados históricos agregados
  });

  const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  const chartConfig = trendsData && 'brands' in trendsData 
    ? trendsData.brands?.reduce((acc, brand, index) => {
        acc[brand.name] = {
          label: brand.name,
          color: colors[index % colors.length],
        };
        return acc;
      }, {} as any) || {}
    : {};

  return (
    <DashboardWidget
      id="trends-widget"
      title="Evolução de Scores"
      lastUpdated={dataUpdatedAt}
      icon={<TrendingUp className="w-5 h-5 text-primary" />}
      onRemove={onRemove}
    >
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : trendsData && 'data' in trendsData && trendsData.data.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={trendsData.data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              className="text-xs fill-muted-foreground"
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {'brands' in trendsData && trendsData.brands?.map((brand, index) => (
              <Line
                key={brand.id}
                type="monotone"
                dataKey={brand.name}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Dados insuficientes para mostrar tendências</p>
        </div>
      )}
    </DashboardWidget>
  );
}

export const WidgetTrendsChart = memo(WidgetTrendsChartComponent);
