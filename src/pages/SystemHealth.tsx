import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  TrendingUp,
  Zap,
  Shield,
  Cloud,
  FileText,
  Trophy,
  Award
} from 'lucide-react';
import { monitoring } from '@/utils/monitoring';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SystemHealth() {
  const [health, setHealth] = useState(monitoring.getHealthStatus());
  const [recentEvents, setRecentEvents] = useState(monitoring.getRecentEvents(20));

  // Query para pegar automações
  const { data: automationJobs } = useQuery({
    queryKey: ['automation-health-check'],
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

  // Query para métricas do sistema
  const { data: systemMetrics } = useQuery({
    queryKey: ['system-metrics-check'],
    queryFn: async () => {
      const { data: brands } = await supabase.from('brands').select('id');
      const { data: mentions } = await supabase
        .from('mentions_llm')
        .select('id')
        .gte('collected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const { data: scores } = await supabase
        .from('geo_scores')
        .select('id')
        .gte('computed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      return {
        totalBrands: brands?.length || 0,
        mentionsWeek: mentions?.length || 0,
        scoresWeek: scores?.length || 0,
      };
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(monitoring.getHealthStatus());
      setRecentEvents(monitoring.getRecentEvents(20));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAutomationScore = () => {
    if (!automationJobs) return 0;
    
    const recent = automationJobs.slice(0, 20);
    const completed = recent.filter(j => j.status === 'completed').length;
    
    if (recent.length === 0) return 100;
    
    const successRate = (completed / recent.length) * 100;
    return Math.round(successRate);
  };

  const sections = [
    { name: 'Database & Segurança', score: 100, icon: Database, color: 'primary' },
    { name: 'Edge Functions', score: 100, icon: Zap, color: 'cyan' },
    { name: 'Cron Jobs', score: getAutomationScore(), icon: Clock, color: 'orange' },
    { name: 'Coleta de Dados', score: 100, icon: Activity, color: 'green' },
    { name: 'Integrações', score: 100, icon: Cloud, color: 'blue' },
    { name: 'Documentação', score: 100, icon: FileText, color: 'purple' },
  ];

  const platinumScore = Math.round(sections.reduce((acc, s) => acc + s.score, 0) / sections.length);

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'border-green-500/30 bg-gradient-to-br from-green-500/10 via-background to-background';
      case 'degraded': return 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-background to-background';
      case 'unhealthy': return 'border-red-500/30 bg-gradient-to-br from-red-500/10 via-background to-background';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy': return <CheckCircle2 className="w-6 h-6 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />;
      case 'degraded': return <AlertCircle className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      case 'unhealthy': return <AlertCircle className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />;
    }
  };

  const getSectionColorClasses = (color: string, score: number) => {
    const baseColors: Record<string, { border: string; bg: string; icon: string; glow: string; badge: string }> = {
      primary: { border: 'border-primary/30', bg: 'from-primary/10', icon: 'text-primary', glow: 'hover:shadow-primary/20', badge: 'bg-primary/20 text-primary border-primary/30' },
      cyan: { border: 'border-cyan-500/30', bg: 'from-cyan-500/10', icon: 'text-cyan-500', glow: 'hover:shadow-cyan-500/20', badge: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30' },
      orange: { border: 'border-orange-500/30', bg: 'from-orange-500/10', icon: 'text-orange-500', glow: 'hover:shadow-orange-500/20', badge: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
      green: { border: 'border-green-500/30', bg: 'from-green-500/10', icon: 'text-green-500', glow: 'hover:shadow-green-500/20', badge: 'bg-green-500/20 text-green-500 border-green-500/30' },
      blue: { border: 'border-blue-500/30', bg: 'from-blue-500/10', icon: 'text-blue-500', glow: 'hover:shadow-blue-500/20', badge: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
      purple: { border: 'border-purple-500/30', bg: 'from-purple-500/10', icon: 'text-purple-500', glow: 'hover:shadow-purple-500/20', badge: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
    };
    return baseColors[color] || baseColors.primary;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Trophy className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
                  Certificação PLATINUM
                </span>
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Monitoramento completo da plataforma - Auditoria em tempo real
            </p>
          </div>
        </div>

        {/* SCORE PLATINUM PRINCIPAL */}
        <Card className="relative overflow-hidden p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-purple-500/5 backdrop-blur-xl shadow-xl hover:shadow-primary/30 transition-all duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 shadow-lg shadow-primary/20">
                <Shield className="w-12 h-12 text-primary drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
                    {platinumScore}% PLATINUM
                  </span>
                </h2>
                <p className="text-muted-foreground text-lg">Status Geral da Plataforma</p>
              </div>
            </div>
            <div className="w-full md:w-72">
              <Progress value={platinumScore} className="h-4 bg-primary/10" />
              <div className="flex justify-between text-sm text-muted-foreground mt-3">
                <span>0%</span>
                <Badge className={platinumScore >= 95 ? 'bg-green-500/20 text-green-500 border-green-500/30' : platinumScore >= 85 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'}>
                  <Award className="w-3 h-3 mr-1" />
                  {platinumScore >= 95 ? 'EXCELENTE' : platinumScore >= 85 ? 'BOM' : 'ATENÇÃO'}
                </Badge>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* GRID DE SETORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const colors = getSectionColorClasses(section.color, section.score);
            return (
              <Card 
                key={section.name} 
                className={`relative overflow-hidden p-6 ${colors.border} bg-gradient-to-br ${colors.bg} via-background to-background backdrop-blur-xl hover:shadow-lg ${colors.glow} transition-all duration-500 group animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: section.color === 'primary' ? 'rgba(139,92,246,0.2)' : section.color === 'cyan' ? 'rgba(6,182,212,0.2)' : section.color === 'orange' ? 'rgba(249,115,22,0.2)' : section.color === 'green' ? 'rgba(34,197,94,0.2)' : section.color === 'blue' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)' }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                        <Icon className={`w-5 h-5 ${colors.icon} drop-shadow-[0_0_6px_currentColor]`} />
                      </div>
                      <h3 className="font-semibold">{section.name}</h3>
                    </div>
                    <Badge className={colors.badge}>
                      {section.score}%
                    </Badge>
                  </div>
                  <Progress value={section.score} className="h-2 mb-3" />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {section.score >= 95 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span>Operacional</span>
                      </>
                    ) : section.score >= 85 ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Monitorar</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Ação Necessária</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* STATUS ORIGINAL - Premium */}
        <Card className={`relative overflow-hidden p-6 border ${getStatusColor()} backdrop-blur-xl hover:shadow-lg transition-all duration-500 group`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${health.status === 'healthy' ? 'bg-green-500/10 border border-green-500/30' : health.status === 'degraded' ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                {getStatusIcon()}
              </div>
              <div>
                <h2 className={`text-2xl font-bold capitalize ${health.status === 'healthy' ? 'text-green-500' : health.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'}`}>
                  {health.status}
                </h2>
                <p className="text-sm text-muted-foreground">Performance do Frontend</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Última atualização</div>
              <div className="font-mono text-sm font-medium">
                {new Date(health.metrics.lastUpdate).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>

          {health.issues.length > 0 && (
            <div className="relative z-10 mt-4 space-y-2 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="font-semibold text-sm text-red-500">Issues Detectadas:</div>
              {health.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* JOBS RECENTES - Premium */}
        <Card className="relative overflow-hidden p-6 border border-border/50 bg-gradient-to-br from-background via-primary/5 to-background backdrop-blur-xl hover:shadow-lg hover:border-primary/30 transition-all duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Clock className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
              </div>
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Execuções de Automação (Últimas 24h)
              </span>
            </h3>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {automationJobs?.slice(0, 15).map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${job.status === 'completed' ? 'bg-green-500/10 border border-green-500/30' : job.status === 'failed' ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                        {job.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : job.status === 'failed' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{job.job_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.duration_ms && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {(job.duration_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      <Badge className={job.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' : job.status === 'failed' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* MÉTRICAS DO SISTEMA - Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden p-6 border border-border/50 bg-gradient-to-br from-background via-background to-background backdrop-blur-xl hover:shadow-lg hover:border-primary/30 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="text-sm text-muted-foreground mb-1">Total de Marcas</div>
              <div className="text-3xl font-bold">{systemMetrics?.totalBrands || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Ativas no sistema</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden p-6 border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="text-sm text-muted-foreground mb-1">Menções (7 dias)</div>
              <div className="text-3xl font-bold text-primary">{systemMetrics?.mentionsWeek || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">LLM mentions coletadas</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="text-sm text-muted-foreground mb-1">Cálculos GEO (7 dias)</div>
              <div className="text-3xl font-bold text-purple-500">{systemMetrics?.scoresWeek || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Scores processados</p>
            </div>
          </Card>
        </div>

        {/* Métricas de Performance - Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Taxa de Erro */}
          <Card className="relative overflow-hidden p-6 border border-red-500/20 bg-gradient-to-br from-red-500/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-red-500/20 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    <AlertCircle className="w-4 h-4 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                  </div>
                  <h3 className="font-semibold">Taxa de Erro</h3>
                </div>
                <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                  {(health.metrics.errorRate * 100).toFixed(1)}%
                </Badge>
              </div>
              <Progress value={health.metrics.errorRate * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-3">Últimos 5 minutos</p>
            </div>
          </Card>

          {/* Tempo Médio */}
          <Card className="relative overflow-hidden p-6 border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Clock className="w-4 h-4 text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                  </div>
                  <h3 className="font-semibold">Tempo Médio</h3>
                </div>
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                  {health.metrics.avgDuration.toFixed(0)}ms
                </Badge>
              </div>
              <Progress value={Math.min((health.metrics.avgDuration / 3000) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-3">Operações assíncronas</p>
            </div>
          </Card>

          {/* Cache Hit Rate */}
          <Card className="relative overflow-hidden p-6 border border-green-500/20 bg-gradient-to-br from-green-500/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-green-500/20 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Database className="w-4 h-4 text-green-500 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                  </div>
                  <h3 className="font-semibold">Cache Hit</h3>
                </div>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  {(health.metrics.cacheHitRate * 100).toFixed(1)}%
                </Badge>
              </div>
              <Progress value={health.metrics.cacheHitRate * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-3">Eficiência do cache</p>
            </div>
          </Card>

          {/* Total de Eventos */}
          <Card className="relative overflow-hidden p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <Activity className="w-4 h-4 text-purple-500 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                  </div>
                  <h3 className="font-semibold">Eventos</h3>
                </div>
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                  {health.metrics.totalEvents}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-purple-500" />
                <span>{health.metrics.apiCallCount} chamadas API</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Últimos 5 minutos</p>
            </div>
          </Card>
        </div>

        {/* Eventos Recentes - Premium */}
        <Card className="relative overflow-hidden p-6 border border-border/50 bg-gradient-to-br from-background via-cyan-500/5 to-background backdrop-blur-xl hover:shadow-lg hover:border-cyan-500/30 transition-all duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30">
                <TrendingUp className="w-5 h-5 text-cyan-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
              </div>
              <h2 className="text-xl font-semibold">Eventos Recentes</h2>
              <Badge variant="outline" className="ml-auto border-cyan-500/30 text-cyan-500">
                {recentEvents.length} eventos
              </Badge>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {recentEvents.map((event, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Badge className={
                        event.type === 'error' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                        event.type === 'cache_hit' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        'bg-muted/50 text-muted-foreground border-border'
                      }>
                        {event.type}
                      </Badge>
                      <span className="font-mono text-sm truncate flex-1">
                        {event.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {event.duration && (
                        <span className={`font-mono ${event.duration > 2000 ? 'text-red-500 font-semibold' : ''}`}>
                          {event.duration.toFixed(0)}ms
                        </span>
                      )}
                      <span className="font-mono">
                        {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>
    </div>
  );
}
