import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Clock, PlayCircle, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  recommendation_type: string;
  recommendation_title: string;
  recommendation_description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  estimated_impact: number;
  completed_at: string | null;
  created_at: string;
}

interface RecommendationsChecklistProps {
  brandId?: string;
  brandName?: string;
}

export default function RecommendationsChecklist({ brandId, brandName }: RecommendationsChecklistProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations-checklist', brandId, userId],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from('recommendation_checklist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (brandId && brandId !== 'all') {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Recommendation[];
    },
    enabled: !!userId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('recommendation_checklist')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations-checklist'] });
      toast({
        title: "Status atualizado",
        description: "A recomendação foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a recomendação.",
        variant: "destructive",
      });
    },
  });

  const deleteRecommendationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recommendation_checklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations-checklist'] });
      toast({
        title: "Recomendação removida",
        description: "A recomendação foi removida da lista.",
      });
    },
  });

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true;
    return rec.status === filter;
  });

  const statusCounts = {
    pending: recommendations.filter(r => r.status === 'pending').length,
    in_progress: recommendations.filter(r => r.status === 'in_progress').length,
    completed: recommendations.filter(r => r.status === 'completed').length,
  };

  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
    info: 'bg-gray-500',
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    in_progress: <PlayCircle className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    dismissed: <X className="h-4 w-4" />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-1">
          <span>Checklist de Recomendações</span>
          {brandName && (
            <span className="text-sm font-normal text-muted-foreground">
              {brandName}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Acompanhe e gerencie suas recomendações de melhoria
        </CardDescription>
        
        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({recommendations.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes ({statusCounts.pending})
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in_progress')}
          >
            Em Andamento ({statusCounts.in_progress})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Concluídas ({statusCounts.completed})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma recomendação encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => (
              <Card key={rec.id} className="border-l-4" style={{ borderLeftColor: `var(--${priorityColors[rec.priority]})` }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        {statusIcons[rec.status]}
                        <Badge variant="outline" className={priorityColors[rec.priority]}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{rec.recommendation_title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {rec.recommendation_description}
                        </p>
                        {rec.estimated_impact && (
                          <p className="text-xs text-primary">
                            Impacto estimado: +{rec.estimated_impact}%
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.status !== 'completed' && (
                        <>
                          {rec.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'in_progress' })}
                            >
                              Iniciar
                            </Button>
                          )}
                          {rec.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'completed' })}
                            >
                              Concluir
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRecommendationMutation.mutate(rec.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
