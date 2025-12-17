import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, CheckCircle2, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RecommendationsImpactProps {
  brandId?: string;
  brandName?: string;
}

export default function RecommendationsImpact({ brandId, brandName }: RecommendationsImpactProps) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: impactData = [] } = useQuery({
    queryKey: ['recommendations-impact', brandId, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from('recommendation_impact')
        .select(`
          *,
          recommendation_id,
          recommendation_checklist (
            recommendation_title,
            recommendation_type,
            priority
          )
        `)
        .eq('user_id', userId)
        .order('measured_at', { ascending: false });

      if (brandId && brandId !== 'all') {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: completedCount = 0 } = useQuery({
    queryKey: ['completed-recommendations', brandId, userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      let query = supabase
        .from('recommendation_checklist')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (brandId && brandId !== 'all') {
        query = query.eq('brand_id', brandId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  // Calculate aggregate statistics
  const totalImprovementPercentage = impactData.reduce((sum, item) => 
    sum + (item.improvement_percentage || 0), 0
  );
  const avgImprovementPercentage = impactData.length > 0 
    ? totalImprovementPercentage / impactData.length 
    : 0;

  // Prepare chart data
  const chartData = impactData
    .slice(0, 10)
    .reverse()
    .map(item => ({
      name: new Date(item.measured_at).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      before: item.before_value,
      after: item.after_value,
      metric: item.metric_name,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recomendações Aplicadas</p>
                <p className="text-3xl font-bold">{completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Melhoria Média</p>
                <p className="text-3xl font-bold">
                  +{avgImprovementPercentage.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Métricas Impactadas</p>
                <p className="text-3xl font-bold">{impactData.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <div className="flex flex-col gap-1">
                <span>Evolução do Impacto das Recomendações</span>
                {brandName && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {brandName}
                  </span>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Comparação antes e depois da aplicação das recomendações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="before" 
                  stackId="1" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  fillOpacity={0.6}
                  name="Antes"
                />
                <Area 
                  type="monotone" 
                  dataKey="after" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Depois"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Impact List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-1">
            <span>Detalhamento de Impactos</span>
            {brandName && (
              <span className="text-sm font-normal text-muted-foreground">
                {brandName}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Histórico de melhorias medidas após aplicação de recomendações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {impactData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum impacto medido ainda. Complete recomendações para começar a rastrear melhorias.
            </div>
          ) : (
            <div className="space-y-4">
              {impactData.map((impact) => (
                <Card key={impact.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-50">
                            +{impact.improvement_percentage?.toFixed(1)}%
                          </Badge>
                          <span className="text-sm font-semibold">{impact.metric_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="line-through">{impact.before_value}</span>
                          {' → '}
                          <span className="text-green-600 font-semibold">{impact.after_value}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Medido em {new Date(impact.measured_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
