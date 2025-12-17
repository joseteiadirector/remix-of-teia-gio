import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/LoadingState";
import { EnhancedError } from "@/components/ui/enhanced-error";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Bot,
  Mail,
  BarChart3,
  TrendingUp,
  Bell,
} from "lucide-react";
import { AutomationConfigDialog } from "@/components/automation/AutomationConfigDialog";
import { AutomationJobsList } from "@/components/automation/AutomationJobsList";

export default function Automation() {
  const queryClient = useQueryClient();
  const [showNewConfig, setShowNewConfig] = useState(false);

  // Buscar configurações de automação
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['automation-configs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('automation_configs')
        .select('*, brands(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Buscar histórico de jobs
  const { data: recentJobs } = useQuery({
    queryKey: ['automation-jobs-recent'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('automation_jobs')
        .select('*, brands(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Toggle automação
  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('automation_configs')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-configs'] });
      toast.success('Automação atualizada');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar automação', {
        description: error.message,
      });
    },
  });

  // Deletar automação
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-configs'] });
      toast.success('Automação removida');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover automação', {
        description: error.message,
      });
    },
  });

  // Executar automação manualmente
  const runMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('automation-orchestrator');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-jobs-recent'] });
      toast.success('Automação executada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao executar automação', {
        description: error.message,
      });
    },
  });

  const getAutomationIcon = (type: string) => {
    switch (type) {
      case 'mentions_collection': return <Bot className="h-4 w-4" />;
      case 'seo_analysis': return <BarChart3 className="h-4 w-4" />;
      case 'geo_metrics': return <TrendingUp className="h-4 w-4" />;
      case 'weekly_report': return <Mail className="h-4 w-4" />;
      case 'alerts_check': return <Bell className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getAutomationLabel = (type: string) => {
    const labels: Record<string, string> = {
      mentions_collection: 'Coleta de Menções',
      seo_analysis: 'Análise SEO',
      geo_metrics: 'Métricas GEO',
      weekly_report: 'Relatório Semanal',
      alerts_check: 'Verificação de Alertas',
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      hourly: 'A cada hora',
      daily: 'Diariamente',
      weekly: 'Semanalmente',
      monthly: 'Mensalmente',
    };
    return labels[frequency] || frequency;
  };

  if (isLoading) return <LoadingState variant="data" message="Carregando automações..." />;
  if (error) return (
    <EnhancedError 
      title="Erro ao carregar automações" 
      message={error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'} 
      variant="error" 
    />
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automações</h1>
          <p className="text-muted-foreground mt-1">
            Configure e gerencie suas tarefas automatizadas
          </p>
        </div>
        <Button onClick={() => setShowNewConfig(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {!configs || configs.length === 0 ? (
            <div className="flex justify-center">
              <Button onClick={() => setShowNewConfig(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Automação
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {configs.map((config) => (
                <Card key={config.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {getAutomationIcon(config.automation_type)}
                      <div>
                        <h3 className="font-semibold">{getAutomationLabel(config.automation_type)}</h3>
                        {config.brands && (
                          <p className="text-sm text-muted-foreground">{config.brands.name}</p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled) => 
                        toggleMutation.mutate({ id: config.id, enabled })
                      }
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{getFrequencyLabel(config.frequency)}</span>
                    </div>
                    
                    {config.schedule_time && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Horário: {config.schedule_time}</span>
                      </div>
                    )}

                    {config.last_run && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Última execução: {new Date(config.last_run).toLocaleString('pt-BR')}</span>
                      </div>
                    )}

                    {config.next_run && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Próxima execução: {new Date(config.next_run).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runMutation.mutate(config.id)}
                      disabled={runMutation.isPending}
                    >
                      <Play className="mr-2 h-3 w-3" />
                      Executar Agora
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(config.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Remover
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <AutomationJobsList jobs={recentJobs || []} />
        </TabsContent>
      </Tabs>

      <AutomationConfigDialog
        open={showNewConfig}
        onOpenChange={setShowNewConfig}
      />
    </div>
  );
}