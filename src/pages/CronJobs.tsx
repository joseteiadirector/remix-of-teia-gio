import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { EnhancedError } from "@/components/ui/enhanced-error";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Database, 
  Rocket, 
  Home, 
  Sparkles,
  Timer,
  Zap,
  Activity,
  Server
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
    refetchInterval: 60000,
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
    refetchInterval: 30000,
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

  if (isLoading) return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <LoadingState variant="data" message="Carregando cron jobs..." />
    </div>
  );
  
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
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/8 to-green-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/8 to-blue-500/4 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-primary-glow/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Premium Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList className="bg-card/30 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Sparkles className="h-3 w-3 text-primary/50" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2 text-primary font-medium">
                <Timer className="h-4 w-4" />
                Cron Jobs
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl transition-all duration-500 group-hover:from-emerald-500/20 group-hover:via-cyan-500/25 group-hover:to-blue-500/20" />
          <Card className="relative p-8 bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden transition-all duration-500 group-hover:border-emerald-500/40 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15),0_0_80px_rgba(16,185,129,0.1)] group-hover:bg-card/60">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl transition-all duration-500 group-hover:from-emerald-500/20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-2xl transition-all duration-500 group-hover:from-cyan-500/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30 transition-all duration-500 group-hover:border-emerald-400/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Timer className="w-10 h-10 text-emerald-400 transition-all duration-500 group-hover:text-emerald-300" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    Cron Jobs
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Monitoramento de jobs agendados e execuções automáticas
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleTestOrchestrator}
                disabled={isTestingOrchestrator}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all gap-2"
              >
                <Rocket className="h-4 w-4" />
                {isTestingOrchestrator ? 'Executando...' : 'Executar Agora'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-blue-500/30 transition-all duration-300 group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500 rounded-l-lg" />
              <div className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                    <Clock className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Execuções (24h)</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-emerald-500/30 transition-all duration-300 group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-500 rounded-l-lg" />
              <div className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground">Concluídas</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-rose-500/30 transition-all duration-300 group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-pink-500 rounded-l-lg" />
              <div className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/30">
                    <XCircle className="h-7 w-7 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.failed}</div>
                    <div className="text-sm text-muted-foreground">Falhadas</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-violet-500/30 transition-all duration-300 group/stat">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-500 rounded-l-lg" />
              <div className="p-6 relative">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30">
                    <Activity className="h-7 w-7 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-foreground">{stats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Configured Cron Jobs */}
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-cyan-500/30 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 rounded-l-lg" />
          
          <div className="p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                  <Server className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    Jobs Configurados
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </h2>
                  <p className="text-sm text-muted-foreground">Scheduled Functions via config.toml</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Via config.toml
              </Badge>
            </div>
            
            {!cronJobs || cronJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                  <Clock className="h-8 w-8 text-cyan-400" />
                </div>
                <p>Nenhum cron job configurado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cronJobs.map((job: any) => (
                  <Card key={job.jobid} className="relative overflow-hidden bg-card/30 border-border/50 hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-l-lg" />
                    <div className="p-4 relative">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{job.jobname}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getScheduleDescription(job.schedule)}
                          </p>
                        </div>
                        <Badge className={job.active 
                          ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30" 
                          : "bg-muted text-muted-foreground"
                        }>
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
                        <div className="p-2 rounded-lg bg-background/50">
                          <span className="text-muted-foreground">Schedule:</span>
                          <code className="ml-2 bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded">{job.schedule}</code>
                        </div>
                        <div className="p-2 rounded-lg bg-background/50">
                          <span className="text-muted-foreground">Database:</span>
                          <span className="ml-2 font-mono text-foreground">{job.database}</span>
                        </div>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                          Ver comando SQL
                        </summary>
                        <pre className="mt-2 p-3 bg-background/50 rounded-lg text-xs overflow-x-auto border border-border/50">
                          {job.command}
                        </pre>
                      </details>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Executions */}
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-amber-500/30 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500 rounded-l-lg" />
          
          <div className="p-6 relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  Execuções Recentes
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-sm text-muted-foreground">50 últimas execuções</p>
              </div>
            </div>
            
            {!recentJobs || recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
                <p>Nenhuma execução registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.slice(0, 20).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        job.status === 'completed' 
                          ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' 
                          : job.status === 'failed'
                          ? 'bg-gradient-to-br from-rose-500/20 to-pink-500/20'
                          : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                      }`}>
                        {job.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : job.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-rose-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{job.job_type}</div>
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
                      <Badge className={
                        job.status === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30'
                          : job.status === 'failed'
                          ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Documentation Card */}
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-emerald-500/30 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-l-lg" />
          
          <div className="p-6 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30">
                <Database className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                  Documentação
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  ✅ <strong className="text-emerald-400">Scheduled Functions ativo:</strong> <code className="bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded">automation-orchestrator</code> executa automaticamente a cada hora via <code className="bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded">supabase/config.toml</code>
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  🚀 Use o botão "Executar Agora" acima para testar manualmente a qualquer momento.
                </p>
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Próxima execução automática:</strong> No próximo minuto 0 de qualquer hora (ex: 12:00, 13:00, 14:00...)
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
