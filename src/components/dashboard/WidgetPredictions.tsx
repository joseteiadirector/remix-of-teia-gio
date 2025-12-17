import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardWidget } from './DashboardWidget';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WidgetPredictionsProps {
  brandId?: string;
  onRemove?: () => void;
}

export function WidgetPredictions({ brandId, onRemove }: WidgetPredictionsProps) {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: brands } = useQuery({
    queryKey: ['brands', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      return data || [];
    },
    enabled: !!user?.id
  });

  const activeBrandId = brandId || brands?.[0]?.id;

  const { data: predictions, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['predictions', activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return null;

      const { data, error } = await supabase.functions.invoke('predict-geo-score', {
        body: { brandId: activeBrandId, daysAhead: [7, 14, 30] }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!activeBrandId,
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <DashboardWidget
        id="predictions-widget"
        title="Previsões com IA"
        lastUpdated={dataUpdatedAt}
        icon={<TrendingUp className="h-5 w-5" />}
        onRemove={onRemove}
      >
        <div className="text-sm text-muted-foreground text-center py-8">
          Carregando análise preditiva...
        </div>
      </DashboardWidget>
    );
  }

  if (!predictions || predictions.error) {
    return (
      <DashboardWidget
        id="predictions-widget"
        title="Previsões com IA"
        lastUpdated={dataUpdatedAt}
        icon={<AlertTriangle className="h-5 w-5" />}
        onRemove={onRemove}
      >
        <div className="text-sm text-muted-foreground text-center py-8">
          {predictions?.message || 'Pelo menos 7 dias de dados históricos são necessários'}
        </div>
      </DashboardWidget>
    );
  }

  const getTrendIcon = () => {
    switch (predictions.currentTrend) {
      case 'crescente':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'decrescente':
        return <TrendingDown className="h-5 w-5 text-destructive" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (predictions.currentTrend) {
      case 'crescente':
        return 'text-success';
      case 'decrescente':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const chartData = predictions.predictions.map((pred: any) => ({
    date: format(new Date(pred.date), 'dd/MMM', { locale: ptBR }),
    value: pred.value,
    lower: pred.confidenceInterval.lower,
    upper: pred.confidenceInterval.upper
  }));

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return { label: 'Alta', color: 'text-success' };
    if (confidence >= 60) return { label: 'Média', color: 'text-warning' };
    return { label: 'Baixa', color: 'text-destructive' };
  };

  const confidenceInfo = getConfidenceLabel(predictions.confidence);

  return (
    <DashboardWidget
      id="predictions-widget"
      title="Previsões com IA"
      lastUpdated={dataUpdatedAt}
      icon={<TrendingUp className="h-5 w-5" />}
      onRemove={onRemove}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon()}
              <span className="text-sm font-medium">Tendência</span>
            </div>
            <p className={`text-lg font-bold capitalize ${getTrendColor()}`}>
              {predictions.currentTrend}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Confiança</div>
            <div className="flex items-baseline gap-2">
              <p className={`text-lg font-bold ${confidenceInfo.color}`}>
                {predictions.confidence}%
              </p>
              <span className={`text-xs ${confidenceInfo.color}`}>
                {confidenceInfo.label}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-sm font-medium mb-2">R² Score</div>
            <p className="text-lg font-bold">
              {predictions.regression.rSquared.toFixed(3)}
            </p>
          </div>
        </div>

        {/* Predictions Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Previsões para 7, 14 e 30 dias</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              
              {/* Confidence Interval Area */}
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                name="Intervalo Superior"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                name="Intervalo Inferior"
              />
              
              {/* Prediction Line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                name="Previsão"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Predictions List */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Valores Previstos</h4>
          {predictions.predictions.map((pred: any, index: number) => {
            const daysAhead = [7, 14, 30][index];
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">+{daysAhead} dias</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(pred.date), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {pred.value.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IC: {pred.confidenceInterval.lower.toFixed(1)} - {pred.confidenceInterval.upper.toFixed(1)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {predictions.anomalies > 0 && (
          <div className="bg-warning/10 border border-warning rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Anomalias Detectadas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {predictions.anomalies} pontos anômalos identificados nos últimos 30 dias. 
                  Isso pode indicar eventos incomuns ou mudanças significativas nas métricas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Análise baseada em {predictions.dataPoints} pontos de dados históricos
        </div>
      </div>
    </DashboardWidget>
  );
}
