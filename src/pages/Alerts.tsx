import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  Mail, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  Home,
  History,
  Filter,
  Check,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

interface AlertHistory {
  id: string;
  alert_type: string;
  priority: AlertPriority;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-blue-500', textColor: 'text-blue-500', variant: 'secondary' as const },
  medium: { label: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-500', variant: 'default' as const },
  high: { label: 'Alta', color: 'bg-orange-500', textColor: 'text-orange-500', variant: 'default' as const },
  critical: { label: 'Crítica', color: 'bg-destructive', textColor: 'text-destructive', variant: 'destructive' as const },
};

const Alerts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({
    scoreDecrease: true,
    scoreIncrease: true,
    weeklyReport: true,
    newMention: false,
    thresholdAlert: true,
  });
  const [threshold, setThreshold] = useState("15");
  const [priority, setPriority] = useState<AlertPriority>("medium");
  const [email, setEmail] = useState("");
  const [alertsHistory, setAlertsHistory] = useState<AlertHistory[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadConfig();
      loadHistory();
    }
  }, [user]);

  const loadConfig = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('alert_configs')
        .select('score_decrease, score_increase, weekly_report, new_mention, threshold_alert, threshold_value, priority, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAlerts({
          scoreDecrease: data.score_decrease,
          scoreIncrease: data.score_increase,
          weeklyReport: data.weekly_report,
          newMention: data.new_mention,
          thresholdAlert: data.threshold_alert,
        });
        setThreshold(data.threshold_value?.toString() || "15");
        setPriority(data.priority || "medium");
        setEmail(data.email || "");
      }
    } catch (error) {
      logger.error('Erro ao carregar configurações de alertas', { error });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alerts_history')
        .select('id, alert_type, priority, title, message, read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlertsHistory(data || []);
    } catch (error) {
      logger.error('Erro ao carregar histórico de alertas', { error });
    }
  };

  const toggleAlert = async (key: keyof typeof alerts) => {
    if (!user) return;

    const newValue = !alerts[key];
    setAlerts(prev => ({ ...prev, [key]: newValue }));

    try {
      const { error } = await supabase
        .from('alert_configs')
        .upsert({
          user_id: user.id,
          email: email || user.email || '',
          [key === 'scoreDecrease' ? 'score_decrease' : 
           key === 'scoreIncrease' ? 'score_increase' :
           key === 'weeklyReport' ? 'weekly_report' :
           key === 'newMention' ? 'new_mention' : 'threshold_alert']: newValue,
          threshold_value: parseFloat(threshold),
          priority: priority,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configuração atualizada",
        description: `Alerta ${newValue ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      logger.error('Erro ao atualizar alerta', { error, key });
      setAlerts(prev => ({ ...prev, [key]: !newValue }));
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração",
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('alert_configs')
        .upsert({
          user_id: user.id,
          email: email || user.email || '',
          threshold_value: parseFloat(threshold),
          priority: priority,
          score_decrease: alerts.scoreDecrease,
          score_increase: alerts.scoreIncrease,
          weekly_report: alerts.weeklyReport,
          new_mention: alerts.newMention,
          threshold_alert: alerts.thresholdAlert,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: `Prioridade: ${priorityConfig[priority].label}, Limite: ${threshold}`,
      });
    } catch (error) {
      logger.error('Erro ao salvar configurações de alertas', { error, priority, threshold });
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts_history')
        .update({ read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlertsHistory(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );
    } catch (error) {
      logger.error('Erro ao marcar alerta como lido', { error, alertId });
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts_history')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      setAlertsHistory(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: "Alerta removido",
        description: "O alerta foi removido do histórico",
      });
    } catch (error) {
      logger.error('Erro ao deletar alerta', { error, alertId });
    }
  };

  const filteredHistory = filterPriority === "all" 
    ? alertsHistory 
    : alertsHistory.filter(alert => alert.priority === filterPriority);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Alertas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Alertas e Notificações
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure notificações com sistema de prioridades
          </p>
        </div>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6 mt-6">

            {/* Priority and Email Configuration */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Configurações Gerais</h2>
                  <p className="text-sm text-muted-foreground">
                    E-mail e prioridade padrão dos alertas
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail para notificações</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade Padrão</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as AlertPriority)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Defina a prioridade padrão para novos alertas
                  </p>
                </div>
              </div>
            </Card>

        {/* Alert Types */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Tipos de Alertas</h2>
              <p className="text-sm text-muted-foreground">
                Escolha quais notificações receber
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <div>
                  <Label htmlFor="scoreDecrease" className="text-base font-medium">
                    Queda no Score
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alerta quando o score diminuir
                  </p>
                </div>
              </div>
              <Switch 
                id="scoreDecrease"
                checked={alerts.scoreDecrease}
                onCheckedChange={() => toggleAlert('scoreDecrease')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <Label htmlFor="scoreIncrease" className="text-base font-medium">
                    Aumento no Score
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alerta quando o score aumentar
                  </p>
                </div>
              </div>
              <Switch 
                id="scoreIncrease"
                checked={alerts.scoreIncrease}
                onCheckedChange={() => toggleAlert('scoreIncrease')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <Label htmlFor="weeklyReport" className="text-base font-medium">
                    Relatório Semanal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo semanal das métricas
                  </p>
                </div>
              </div>
              <Switch 
                id="weeklyReport"
                checked={alerts.weeklyReport}
                onCheckedChange={() => toggleAlert('weeklyReport')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-accent" />
                <div>
                  <Label htmlFor="newMention" className="text-base font-medium">
                    Nova Menção
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alerta quando sua marca for mencionada nos LLMs
                  </p>
                </div>
              </div>
              <Switch 
                id="newMention"
                checked={alerts.newMention}
                onCheckedChange={() => toggleAlert('newMention')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <Label htmlFor="thresholdAlert" className="text-base font-medium">
                    Alerta de Limite
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alerta quando o score cair abaixo do limite definido
                  </p>
                </div>
              </div>
              <Switch 
                id="thresholdAlert"
                checked={alerts.thresholdAlert}
                onCheckedChange={() => toggleAlert('thresholdAlert')}
              />
            </div>
          </div>
        </Card>

            {/* Threshold Configuration */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Configurar Limite</h2>
                  <p className="text-sm text-muted-foreground">
                    Defina o score mínimo para receber alertas
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="threshold">Score Mínimo</Label>
                  <Input 
                    id="threshold"
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button onClick={saveConfig}>Salvar Todas as Configurações</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            {/* History Filters */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Filter className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold">Histórico de Alertas</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredHistory.length} alertas {filterPriority !== "all" && `com prioridade ${priorityConfig[filterPriority as AlertPriority]?.label.toLowerCase()}`}
                    </p>
                  </div>
                </div>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* History List */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum alerta no histórico</p>
                    <p className="text-sm mt-2">
                      {filterPriority !== "all" 
                        ? "Tente selecionar uma prioridade diferente" 
                        : "Os alertas aparecerão aqui quando forem gerados"}
                    </p>
                  </div>
                </Card>
              ) : (
                filteredHistory.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className={`p-6 transition-all ${!alert.read ? 'border-l-4 border-l-primary' : 'opacity-75'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={priorityConfig[alert.priority].variant}>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${priorityConfig[alert.priority].color}`} />
                              {priorityConfig[alert.priority].label}
                            </div>
                          </Badge>
                          {!alert.read && (
                            <Badge variant="outline" className="text-xs">
                              Novo
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold">{alert.title}</h3>
                        <p className="text-muted-foreground">{alert.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                          <span>{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                          <span>•</span>
                          <span className="capitalize">{alert.alert_type.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!alert.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(alert.id)}
                            title="Marcar como lido"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAlert(alert.id)}
                          title="Remover alerta"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Alerts;
