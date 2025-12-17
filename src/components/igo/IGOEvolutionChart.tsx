import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

interface HistoryData {
  calculated_at: string;
  ice: number;
  gap: number;
  cpi: number;
  cognitive_stability: number;
}

interface IGOEvolutionChartProps {
  data: HistoryData[];
  brandName?: string;
}

export default function IGOEvolutionChart({ data, brandName }: IGOEvolutionChartProps) {
  const chartData = data.map(item => ({
    date: format(new Date(item.calculated_at), "dd/MM", { locale: ptBR }),
    ICE: item.ice,
    GAP: item.gap,
    CPI: item.cpi,
    Estabilidade: item.cognitive_stability,
  })).reverse(); // Mais antigo para mais recente

  return (
    <Card id="igo-evolution-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução das Métricas IGO
        </CardTitle>
        <CardDescription>
          {brandName ? `Histórico de ${brandName} nos últimos 30 dias` : "Histórico dos últimos 30 dias"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <p>Histórico ainda não disponível. As métricas serão coletadas ao longo do tempo.</p>
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ICE" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                type="monotone" 
                dataKey="GAP" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
              <Line 
                type="monotone" 
                dataKey="CPI" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-3))' }}
              />
              <Line 
                type="monotone" 
                dataKey="Estabilidade" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-4))' }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
