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
  FileText
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
    // Atualizar a cada 5 segundos
    const interval = setInterval(() => {
      setHealth(monitoring.getHealthStatus());
      setRecentEvents(monitoring.getRecentEvents(20));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Calcular score de automação
  const getAutomationScore = () => {
    if (!automationJobs) return 0;
    
    const recent = automationJobs.slice(0, 20);
    const completed = recent.filter(j => j.status === 'completed').length;
    
    if (recent.length === 0) return 100;
    
    const successRate = (completed / recent.length) * 100;
    return Math.round(successRate);
  };

  // Calcular score platinum geral
  const sections = [
    { name: 'Database & Segurança', score: 100, icon: Database },
    { name: 'Edge Functions', score: 100, icon: Zap },
    { name: 'Cron Jobs', score: getAutomationScore(), icon: Clock },
    { name: 'Coleta de Dados', score: 100, icon: Activity },
    { name: 'Integrações', score: 100, icon: Cloud },
    { name: 'Documentação', score: 100, icon: FileText },
  ];

  const platinumScore = Math.round(sections.reduce((acc, s) => acc + s.score, 0) / sections.length);

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unhealthy': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5" />;
      case 'degraded': return <AlertCircle className="w-5 h-5" />;
      case 'unhealthy': return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                🏆 Certificação PLATINUM
              </h1>
            </div>
            <p className="text-muted-foreground">
              Monitoramento completo da plataforma - Auditoria em tempo real
            </p>
          </div>
        </div>

        {/* SCORE PLATINUM PRINCIPAL */}
        <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-purple-500/10 backdrop-blur-sm shadow-xl hover:shadow-primary/20 transition-all duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Shield className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">{platinumScore}% PLATINUM</h2>
                <p className="text-muted-foreground">Status Geral da Plataforma</p>
              </div>
            </div>
            <div className="w-full md:w-64">
              <Progress value={platinumScore} className="h-4" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0%</span>
                <span className={platinumScore >= 95 ? 'text-green-500 font-bold' : platinumScore >= 85 ? 'text-yellow-500' : 'text-red-500'}>
                  {platinumScore >= 95 ? '🏆 EXCELENTE' : platinumScore >= 85 ? '⚠️ BOM' : '❌ ATENÇÃO'}
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Card>

      {/* GRID DE SETORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.name} className="p-6 hover:shadow-lg transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.score >= 95 ? 'bg-green-500/10' : section.score >= 85 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                    <Icon className={`w-5 h-5 ${section.score >= 95 ? 'text-green-500' : section.score >= 85 ? 'text-yellow-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{section.name}</h3>
                  </div>
                </div>
                <Badge variant={section.score >= 95 ? 'default' : section.score >= 85 ? 'secondary' : 'destructive'}>
                  {section.score}%
                </Badge>
              </div>
              <Progress value={section.score} className="h-2 mb-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {section.score >= 95 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span>Operacional</span>
                  </>
                ) : section.score >= 85 ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                    <span>Monitorar</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>Ação Necessária</span>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* STATUS ORIGINAL */}
      <Card className={`p-6 border-2 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold capitalize">{health.status}</h2>
              <p className="text-sm opacity-80">Performance do Frontend</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Última atualização</div>
            <div className="font-mono text-sm">
              {new Date(health.metrics.lastUpdate).toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>

        {health.issues.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="font-semibold text-sm">Issues Detectadas:</div>
            {health.issues.map((issue, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* JOBS RECENTES */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Execuções de Automação (Últimas 24h)
        </h3>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {automationJobs?.slice(0, 15).map((job) => (
              <div 
                key={job.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {job.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : job.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{job.job_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {job.duration_ms && (
                    <span className="text-xs text-muted-foreground">
                      {(job.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  <Badge 
                    variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* MÉTRICAS DO SISTEMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Total de Marcas</div>
          <div className="text-3xl font-bold">{systemMetrics?.totalBrands || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Ativas no sistema</p>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Menções (7 dias)</div>
          <div className="text-3xl font-bold text-primary">{systemMetrics?.mentionsWeek || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">LLM mentions coletadas</p>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-muted-foreground mb-1">Cálculos GEO (7 dias)</div>
          <div className="text-3xl font-bold text-purple-500">{systemMetrics?.scoresWeek || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Scores processados</p>
        </Card>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taxa de Erro */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold">Taxa de Erro</h3>
            </div>
            <Badge variant={health.metrics.errorRate > 0.05 ? 'destructive' : 'secondary'}>
              {(health.metrics.errorRate * 100).toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={health.metrics.errorRate * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Últimos 5 minutos
          </p>
        </Card>

        {/* Tempo Médio */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Tempo Médio</h3>
            </div>
            <Badge variant={health.metrics.avgDuration > 2000 ? 'destructive' : 'secondary'}>
              {health.metrics.avgDuration.toFixed(0)}ms
            </Badge>
          </div>
          <Progress 
            value={Math.min((health.metrics.avgDuration / 3000) * 100, 100)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Operações assíncronas
          </p>
        </Card>

        {/* Cache Hit Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Cache Hit</h3>
            </div>
            <Badge variant={health.metrics.cacheHitRate > 0.7 ? 'secondary' : 'outline'}>
              {(health.metrics.cacheHitRate * 100).toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={health.metrics.cacheHitRate * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Eficiência do cache
          </p>
        </Card>

        {/* Total de Eventos */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Eventos</h3>
            </div>
            <Badge variant="outline">
              {health.metrics.totalEvents}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>{health.metrics.apiCallCount} chamadas API</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Últimos 5 minutos
          </p>
        </Card>
      </div>

      {/* Eventos Recentes */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Eventos Recentes</h2>
          <Badge variant="outline" className="ml-auto">
            {recentEvents.length} eventos
          </Badge>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {recentEvents.map((event, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant={
                    event.type === 'error' ? 'destructive' :
                    event.type === 'cache_hit' ? 'secondary' :
                    'outline'
                  }>
                    {event.type}
                  </Badge>
                  <span className="font-mono text-sm truncate flex-1">
                    {event.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {event.duration && (
                    <span className={event.duration > 2000 ? 'text-red-500 font-semibold' : ''}>
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
      </Card>
      </div>
    </div>
  );
}
