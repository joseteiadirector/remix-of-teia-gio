import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { EnhancedError } from "@/components/ui/enhanced-error";
import { Clock, CheckCircle2, XCircle, Play, Database, Rocket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

export default function CronJobs() {
  const [isTestingOrchestrator, setIsTestingOrchestrator] = useState(false);

  // Buscar informações sobre cron jobs via query customizada
  const { data: cronJobs, isLoading, error, refetch: refetchCronJobs } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn: async () => {
      // Retornar dados configurados (cron jobs estão no Supabase, não podem ser consultados diretamente)
      return [
        {
          jobid: 7,
          jobname: 'automation-orchestrator-hourly',
          schedule: '0 * * * *',
          active: true,
          database: 'postgres',
          command: 'SELECT net.http_post(...)',
        }
      ];
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Buscar histórico recente de execuções de automação
  const { data: recentJobs, refetch: refetchRecentJobs } = useQuery({
    queryKey: ['automation-jobs-recent-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  const getScheduleDescription = (schedule: string) => {
    const schedules: Record<string, string> = {
      '0 * * * *': 'A cada hora',
      '*/30 * * * *': 'A cada 30 minutos',
      '0 9 * * *': 'Diariamente às 9h',
      '0 3 * * *': 'Diariamente às 3h',
      '0 2 * * 0': 'Domingos às 2h',
      '0 0 * * 0': 'Domingos à meia-noite',
    };
    return schedules[schedule] || schedule;
  };

  const getJobStats = () => {
    if (!recentJobs) return null;

    const last24h = recentJobs.filter(
      (job) => new Date(job.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const completed = last24h.filter((j) => j.status === 'completed').length;
    const failed = last24h.filter((j) => j.status === 'failed').length;
    const successRate = last24h.length > 0 ? (completed / last24h.length) * 100 : 0;

    return { total: last24h.length, completed, failed, successRate };
  };

  if (isLoading) return <LoadingState variant="data" message="Carregando cron jobs..." />;
  if (error) return (
    <EnhancedError 
      title="Erro ao carregar cron jobs" 
      message={error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'} 
      variant="warning" 
    />
  );

  const stats = getJobStats();

  const handleTestOrchestrator = async () => {
    setIsTestingOrchestrator(true);
    toast.info('🚀 Disparando automation-orchestrator manualmente...');

    try {
      const { data, error } = await supabase.functions.invoke('automation-orchestrator', {
        body: { manual: true, source: 'cron-jobs-page' }
      });

      if (error) throw error;

      toast.success('✅ Orchestrator executado com sucesso!', {
        description: `${data?.processed || 0} automações processadas`
      });

      // Recarregar dados após 2 segundos
      setTimeout(() => {
        refetchRecentJobs();
        refetchCronJobs();
      }, 2000);

    } catch (error) {
      console.error('Erro ao executar orchestrator:', error);
      toast.error('❌ Erro ao executar orchestrator', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsTestingOrchestrator(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Cron Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento de jobs agendados e execuções automáticas
          </p>
        </div>
        <Button 
          onClick={handleTestOrchestrator}
          disabled={isTestingOrchestrator}
          size="lg"
          className="gap-2"
        >
          <Rocket className="h-4 w-4" />
          {isTestingOrchestrator ? 'Executando...' : 'Executar Agora'}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Execuções (24h)</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Falhadas</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Configured Cron Jobs */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Jobs Configurados (Scheduled Functions)</h2>
          <Badge variant="outline" className="gap-2">
            <Clock className="h-3 w-3" />
            Via config.toml
          </Badge>
        </div>
        
        {!cronJobs || cronJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum cron job configurado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cronJobs.map((job: any) => (
              <Card key={job.jobid} className="p-4 border-l-4 border-l-primary">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{job.jobname}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getScheduleDescription(job.schedule)}
                    </p>
                  </div>
                  <Badge variant={job.active ? "default" : "secondary"}>
                    {job.active ? (
                      <>
                        <Play className="mr-1 h-3 w-3" />
                        Ativo
                      </>
                    ) : (
                      'Inativo'
                    )}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Schedule:</span>
                    <code className="ml-2 bg-muted px-2 py-1 rounded">{job.schedule}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Database:</span>
                    <span className="ml-2 font-mono">{job.database}</span>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Ver comando SQL
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {job.command}
                  </pre>
                </details>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Executions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Execuções Recentes (50 últimas)</h2>
        
        {!recentJobs || recentJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma execução registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.slice(0, 20).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {job.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : job.status === 'failed' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <div className="font-medium">{job.job_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(job.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  {job.duration_ms && (
                    <div className="text-muted-foreground">
                      {(job.duration_ms / 1000).toFixed(2)}s
                    </div>
                  )}
                  <Badge
                    variant={
                      job.status === 'completed'
                        ? 'default'
                        : job.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Documentation Link */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <Database className="h-6 w-6 text-primary mt-1" />
          <div>
            <h3 className="font-semibold mb-2">Documentação</h3>
            <p className="text-sm text-muted-foreground mb-3">
              ✅ <strong>Scheduled Functions ativo:</strong> <code className="bg-muted px-2 py-1 rounded">automation-orchestrator</code> executa automaticamente a cada hora via <code>supabase/config.toml</code>
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              🚀 Use o botão "Executar Agora" acima para testar manualmente a qualquer momento.
            </p>
            <div className="text-xs text-muted-foreground">
              <strong>Próxima execução automática:</strong> No próximo minuto 0 de qualquer hora (ex: 12:00, 13:00, 14:00...)
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}