import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalysisHistoryProps {
  url: string;
}

export function AnalysisHistory({ url }: AnalysisHistoryProps) {
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ['url-analysis-history', user?.id, url],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_analysis_history')
        .select('*')
        .eq('user_id', user?.id)
        .eq('url', url)
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!url,
  });

  if (!url) return null;

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum histórico disponível ainda</p>
          <p className="text-sm mt-2">Analise esta URL novamente para começar a rastrear a evolução</p>
        </div>
      </Card>
    );
  }

  const chartData = history.map((item) => ({
    date: format(new Date(item.created_at), 'dd/MM'),
    'GEO Score': item.geo_score,
    'SEO Score': item.seo_score,
    'Score Geral': item.overall_score,
  }));

  const latestScore = history[history.length - 1];
  const previousScore = history.length > 1 ? history[history.length - 2] : null;

  const geoTrend = previousScore ? latestScore.geo_score - previousScore.geo_score : 0;
  const seoTrend = previousScore ? latestScore.seo_score - previousScore.seo_score : 0;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Histórico de Evolução</h3>
        <p className="text-sm text-muted-foreground">
          {history.length} análise(s) registrada(s) para esta URL
        </p>
      </div>

      {/* Tendências */}
      {previousScore && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
            {geoTrend >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
            <div>
              <div className="text-sm text-muted-foreground">GEO Score</div>
              <div className={`text-xl font-bold ${geoTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {geoTrend >= 0 ? '+' : ''}{geoTrend.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
            {seoTrend >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
            <div>
              <div className="text-sm text-muted-foreground">SEO Score</div>
              <div className={`text-xl font-bold ${seoTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {seoTrend >= 0 ? '+' : ''}{seoTrend.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="GEO Score"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="SEO Score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Score Geral"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
