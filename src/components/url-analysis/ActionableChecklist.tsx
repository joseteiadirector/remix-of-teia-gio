import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle2, 
  Circle, 
  Target,
  Zap,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Award
} from 'lucide-react';

interface ActionableChecklistProps {
  url: string;
  analysisId?: string;
}

type TaskPriority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in_progress' | 'completed';
type TaskCategory = 'geo' | 'seo' | 'technical' | 'content' | 'performance';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  estimated_impact: number;
  completed_at: string | null;
  created_at: string;
}

export function ActionableChecklist({ url, analysisId }: ActionableChecklistProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | TaskPriority>('all');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['optimization-tasks', url],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_optimization_tasks')
        .select('*')
        .eq('url', url)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user && !!url,
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('url_optimization_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-tasks', url] });
      toast({
        title: 'Tarefa Atualizada',
        description: 'Status da tarefa atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'geo': return Target;
      case 'seo': return TrendingUp;
      case 'technical': return Zap;
      case 'content': return AlertCircle;
      case 'performance': return Award;
    }
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.priority === filter);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const highPriorityPending = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  if (!url) return null;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Checklist de Otimização
          </h3>
          <Badge variant={highPriorityPending > 0 ? 'destructive' : 'default'}>
            {highPriorityPending > 0 ? `${highPriorityPending} Alta Prioridade` : 'Tudo em dia!'}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-semibold">{completedCount}/{totalCount} concluídas</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({totalCount})
          </Button>
          <Button
            variant={filter === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('high')}
          >
            Alta ({tasks.filter(t => t.priority === 'high').length})
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('medium')}
          >
            Média ({tasks.filter(t => t.priority === 'medium').length})
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('low')}
          >
            Baixa ({tasks.filter(t => t.priority === 'low').length})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando tarefas...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filter === 'all' 
              ? 'Nenhuma tarefa encontrada. Execute uma análise para gerar recomendações!'
              : `Nenhuma tarefa com prioridade ${filter}`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const CategoryIcon = getCategoryIcon(task.category);
            const isCompleted = task.status === 'completed';

            return (
              <Card
                key={task.id}
                className={`p-4 transition-all ${
                  isCompleted ? 'opacity-60 bg-muted/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => {
                      updateTaskStatus.mutate({
                        taskId: task.id,
                        status: checked ? 'completed' : 'pending',
                      });
                    }}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-semibold ${isCompleted ? 'line-through' : ''}`}>
                          {task.title}
                        </h4>
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CategoryIcon className="w-3 h-3" />
                          <span className="uppercase">{task.category}</span>
                        </div>
                      </div>

                      {task.estimated_impact && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          +{task.estimated_impact.toFixed(0)} pontos
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {task.description}
                    </p>

                    {isCompleted && task.completed_at && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Concluída em {new Date(task.completed_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {completedCount === totalCount && totalCount > 0 && (
        <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">🎉 Parabéns! Todas as tarefas concluídas!</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Execute uma nova análise para verificar as melhorias e gerar novas recomendações.
              </p>
              <Button size="sm" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-analisar URL
              </Button>
            </div>
          </div>
        </Card>
      )}
    </Card>
  );
}