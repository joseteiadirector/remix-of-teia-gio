import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Building2, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface PlatformHealth {
  timestamp: string;
  status: string;
  metrics: {
    total_brands: number;
    active_brands: number;
    total_automations: number;
    total_alerts: number;
    unread_alerts: number;
    total_mentions: number;
    total_geo_scores: number;
    total_igo_metrics: number;
  };
  last_activities: {
    last_mention: string | null;
    last_geo_score: string | null;
    last_igo_metric: string | null;
    last_automation_run: string | null;
  };
}

interface ConsistencyCheck {
  check_name: string;
  status: string;
  details: string;
}

export default function AdminDashboard() {
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [consistency, setConsistency] = useState<ConsistencyCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersCount, setUsersCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch platform health
      const { data: healthData } = await supabase.rpc('get_platform_health');
      if (healthData) setHealth(healthData as unknown as PlatformHealth);

      // Fetch consistency validation
      const { data: consistencyData } = await supabase.rpc('validate_platform_consistency');
      if (consistencyData) setConsistency(consistencyData as ConsistencyCheck[]);

      // Count unique users from brands
      const { count } = await supabase
        .from('brands')
        .select('user_id', { count: 'exact', head: true });
      setUsersCount(count || 0);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'WARNING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'INFO': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema Teia GEO</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
            <p className="text-xs text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Marcas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.metrics.active_brands || 0}
              <span className="text-sm text-muted-foreground font-normal ml-1">
                / {health?.metrics.total_brands || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Marcas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Menções LLM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.metrics.total_mentions?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total coletadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.metrics.unread_alerts || 0}
              <span className="text-sm text-muted-foreground font-normal ml-1">
                / {health?.metrics.total_alerts || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Não lidos</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Consistency */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Sistema
            </CardTitle>
            <CardDescription>Últimas atividades registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {health?.status || 'Desconhecido'}
              </Badge>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Última menção
                </span>
                <span>{formatDate(health?.last_activities.last_mention || null)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Último GEO Score
                </span>
                <span>{formatDate(health?.last_activities.last_geo_score || null)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Última automação
                </span>
                <span>{formatDate(health?.last_activities.last_automation_run || null)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Validação de Consistência
            </CardTitle>
            <CardDescription>Verificações automáticas do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consistency.map((check, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {check.status === 'OK' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : check.status === 'WARNING' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{check.check_name.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(check.status)}>
                    {check.details}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Métricas</CardTitle>
          <CardDescription>Totais acumulados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{health?.metrics.total_geo_scores || 0}</div>
              <div className="text-sm text-muted-foreground">GEO Scores</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{health?.metrics.total_igo_metrics || 0}</div>
              <div className="text-sm text-muted-foreground">IGO Metrics</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{health?.metrics.total_automations || 0}</div>
              <div className="text-sm text-muted-foreground">Automações Ativas</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{health?.metrics.total_mentions?.toLocaleString() || 0}</div>
              <div className="text-sm text-muted-foreground">Menções LLM</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
