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
  BellRing,
  Cog,
  History,
  Sparkles,
  Zap,
  Home,
  Rocket,
} from "lucide-react";
import { AutomationConfigDialog } from "@/components/automation/AutomationConfigDialog";
import { AutomationJobsList } from "@/components/automation/AutomationJobsList";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
      case 'mentions_collection': return <Bot className="h-5 w-5 text-violet-400" />;
      case 'seo_analysis': return <BarChart3 className="h-5 w-5 text-cyan-400" />;
      case 'geo_metrics': return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'weekly_report': return <Mail className="h-5 w-5 text-amber-400" />;
      case 'alerts_check': return <BellRing className="h-5 w-5 text-rose-400" />;
      default: return <Clock className="h-5 w-5 text-primary" />;
    }
  };

  const getAutomationGradient = (type: string) => {
    switch (type) {
      case 'mentions_collection': return 'from-violet-500/20 to-purple-500/20';
      case 'seo_analysis': return 'from-cyan-500/20 to-blue-500/20';
      case 'geo_metrics': return 'from-emerald-500/20 to-green-500/20';
      case 'weekly_report': return 'from-amber-500/20 to-orange-500/20';
      case 'alerts_check': return 'from-rose-500/20 to-pink-500/20';
      default: return 'from-primary/20 to-primary-glow/20';
    }
  };

  const getAutomationBorder = (type: string) => {
    switch (type) {
      case 'mentions_collection': return 'border-violet-500/30 hover:border-violet-500/50';
      case 'seo_analysis': return 'border-cyan-500/30 hover:border-cyan-500/50';
      case 'geo_metrics': return 'border-emerald-500/30 hover:border-emerald-500/50';
      case 'weekly_report': return 'border-amber-500/30 hover:border-amber-500/50';
      case 'alerts_check': return 'border-rose-500/30 hover:border-rose-500/50';
      default: return 'border-primary/30 hover:border-primary/50';
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

  if (isLoading) return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <LoadingState variant="data" message="Carregando automações..." />
    </div>
  );
  
  if (error) return (
    <EnhancedError 
      title="Erro ao carregar automações" 
      message={error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'} 
      variant="error" 
    />
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/8 to-blue-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/8 to-purple-500/4 rounded-full blur-3xl" />
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
                <Cog className="h-4 w-4" />
                Automações
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-xl transition-all duration-500 group-hover:from-cyan-500/20 group-hover:via-violet-500/25 group-hover:to-purple-500/20" />
          <Card className="relative p-8 bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden transition-all duration-500 group-hover:border-cyan-500/40 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.15),0_0_80px_rgba(6,182,212,0.1)] group-hover:bg-card/60">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl transition-all duration-500 group-hover:from-cyan-500/20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-2xl transition-all duration-500 group-hover:from-violet-500/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30 transition-all duration-500 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Cog className="w-10 h-10 text-cyan-400 transition-all duration-500 group-hover:text-cyan-300" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Automações
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Configure e gerencie suas tarefas automatizadas
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowNewConfig(true)}
                className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Automação
              </Button>
            </div>
          </Card>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="configs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card/40 backdrop-blur-sm border border-border/50 p-1 h-14 rounded-xl">
            <TabsTrigger 
              value="configs" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-violet-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/30 rounded-lg h-10 transition-all"
            >
              <Cog className="w-4 h-4" />
              <span className="font-medium">Configurações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-300 data-[state=active]:border data-[state=active]:border-amber-500/30 rounded-lg h-10 transition-all"
            >
              <History className="w-4 h-4" />
              <span className="font-medium">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configs" className="space-y-4">
            {!configs || configs.length === 0 ? (
              <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
                <div className="relative text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                    <Cog className="w-10 h-10 text-cyan-400" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-4">Nenhuma automação configurada</p>
                  <Button 
                    onClick={() => setShowNewConfig(true)}
                    className="bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white border-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Automação
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {configs.map((config) => (
                  <Card 
                    key={config.id} 
                    className={`relative overflow-hidden bg-card/40 backdrop-blur-sm border transition-all duration-300 group/card ${getAutomationBorder(config.automation_type)}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getAutomationGradient(config.automation_type)} opacity-0 group-hover/card:opacity-100 transition-opacity`} />
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-violet-500 rounded-l-lg" />
                    
                    <div className="p-6 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAutomationGradient(config.automation_type)} flex items-center justify-center border border-current/20`}>
                            {getAutomationIcon(config.automation_type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{getAutomationLabel(config.automation_type)}</h3>
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
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500"
                        />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-cyan-400" />
                          <span>{getFrequencyLabel(config.frequency)}</span>
                        </div>
                        
                        {config.schedule_time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-violet-400" />
                            <span>Horário: {config.schedule_time}</span>
                          </div>
                        )}

                        {config.last_run && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Última: {new Date(config.last_run).toLocaleString('pt-BR')}</span>
                          </div>
                        )}

                        {config.next_run && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Zap className="h-4 w-4 text-amber-400" />
                            <span>Próxima: {new Date(config.next_run).toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runMutation.mutate(config.id)}
                          disabled={runMutation.isPending}
                          className="border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
                        >
                          <Play className="mr-2 h-3 w-3 text-cyan-400" />
                          Executar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(config.id)}
                          disabled={deleteMutation.isPending}
                          className="border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="mr-2 h-3 w-3 text-rose-400" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500 rounded-l-lg" />
              <div className="p-6 relative">
                <AutomationJobsList jobs={recentJobs || []} />
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <AutomationConfigDialog
          open={showNewConfig}
          onOpenChange={setShowNewConfig}
        />
      </div>
    </div>
  );
}
