import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardWidget } from './DashboardWidget';
import { MessageSquare } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface WidgetMentionsChartProps {
  onRemove?: () => void;
}

function WidgetMentionsChartComponent({ onRemove }: WidgetMentionsChartProps) {
  const { user } = useAuth();

  const { data: mentionsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['widget-mentions', user?.id],
    queryFn: async () => {
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .eq('user_id', user!.id);

      if (!brands?.length) return [];

      const chartData = await Promise.all(
        brands.map(async (brand) => {
          const { count } = await supabase
            .from('mentions_llm')
            .select('*', { count: 'exact', head: true })
            .eq('brand_id', brand.id)
            .eq('mentioned', true);

          return {
            name: brand.name,
            mentions: count || 0,
          };
        })
      );

      return chartData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const chartConfig = {
    mentions: {
      label: "Menções",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <DashboardWidget
      id="mentions-widget"
      title="Menções por Marca"
      lastUpdated={dataUpdatedAt}
      icon={<MessageSquare className="w-5 h-5 text-primary" />}
      onRemove={onRemove}
    >
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : mentionsData && mentionsData.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={mentionsData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
            <XAxis 
              dataKey="name" 
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
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
            />
            <Bar 
              dataKey="mentions" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma menção registrada</p>
        </div>
      )}
    </DashboardWidget>
  );
}

export const WidgetMentionsChart = memo(WidgetMentionsChartComponent);
