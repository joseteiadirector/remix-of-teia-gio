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
  BellRing, 
  Send, 
  TrendingDown, 
  TrendingUp, 
  ShieldAlert,
  Cog,
  Home,
  Clock,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  Sparkles,
  Crown,
  Gem,
  MessageSquare,
  Target,
  Zap
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
  low: { label: 'Baixa', color: 'bg-blue-500', textColor: 'text-blue-400', variant: 'secondary' as const, gradient: 'from-blue-500/20 to-cyan-500/20' },
  medium: { label: 'Média', color: 'bg-amber-500', textColor: 'text-amber-400', variant: 'default' as const, gradient: 'from-amber-500/20 to-yellow-500/20' },
  high: { label: 'Alta', color: 'bg-orange-500', textColor: 'text-orange-400', variant: 'default' as const, gradient: 'from-orange-500/20 to-red-500/20' },
  critical: { label: 'Crítica', color: 'bg-rose-500', textColor: 'text-rose-400', variant: 'destructive' as const, gradient: 'from-rose-500/20 to-pink-500/20' },
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
      <div className="min-h-screen bg-background p-8 flex items-center justify-center relative overflow-hidden">
        {/* Premium animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <BellRing className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-ping" />
          </div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/8 to-purple-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/8 to-orange-500/4 rounded-full blur-3xl" />
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
                <BellRing className="h-4 w-4" />
                Alertas
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-amber-500/10 rounded-3xl blur-xl" />
          <Card className="relative p-8 bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-2xl" />
            
            <div className="relative flex items-start gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-amber-500/20 flex items-center justify-center border border-violet-500/30">
                  <BellRing className="w-10 h-10 text-violet-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
                    Alertas e Notificações
                  </h1>
                  <Badge className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30">
                    <Gem className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  Configure notificações inteligentes com sistema de prioridades avançado
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/40 backdrop-blur-sm border border-border/50 p-1 h-14 rounded-xl">
            <TabsTrigger 
              value="config" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-violet-300 data-[state=active]:border data-[state=active]:border-violet-500/30 rounded-lg h-10 transition-all"
            >
              <Cog className="w-4 h-4" />
              <span className="font-medium">Configurações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-300 data-[state=active]:border data-[state=active]:border-amber-500/30 rounded-lg h-10 transition-all"
            >
              <Clock className="w-4 h-4" />
              <span className="font-medium">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6 mt-6">

            {/* General Configuration Card */}
            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-violet-500/30 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-500 rounded-l-lg" />
              
              <div className="p-6 relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/30">
                    <Send className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      Configurações Gerais
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      E-mail e prioridade padrão dos alertas
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">E-mail para notificações</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@email.com" 
                      className="mt-2 bg-background/50 border-border/50 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground">Prioridade Padrão</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as AlertPriority)}>
                      <SelectTrigger className="mt-2 bg-background/50 border-border/50 focus:border-violet-500/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50">
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${config.color}`} />
                              <span className={config.textColor}>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Defina a prioridade padrão para novos alertas
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Alert Types Card */}
            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-amber-500/30 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500 rounded-l-lg" />
              
              <div className="p-6 relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                    <BellRing className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      Tipos de Alertas
                      <Zap className="w-4 h-4 text-amber-400" />
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Escolha quais notificações receber
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Score Decrease */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 hover:border-rose-500/40 transition-all group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <Label htmlFor="scoreDecrease" className="text-base font-medium text-foreground cursor-pointer">
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
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-rose-500 data-[state=checked]:to-pink-500"
                    />
                  </div>

                  {/* Score Increase */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <Label htmlFor="scoreIncrease" className="text-base font-medium text-foreground cursor-pointer">
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
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500"
                    />
                  </div>

                  {/* Weekly Report */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-transparent border border-violet-500/20 hover:border-violet-500/40 transition-all group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <Send className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <Label htmlFor="weeklyReport" className="text-base font-medium text-foreground cursor-pointer">
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
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-purple-500"
                    />
                  </div>

                  {/* New Mention */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/40 transition-all group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <Label htmlFor="newMention" className="text-base font-medium text-foreground cursor-pointer">
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
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-500"
                    />
                  </div>

                  {/* Threshold Alert */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all group/item">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <Label htmlFor="thresholdAlert" className="text-base font-medium text-foreground cursor-pointer">
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
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Threshold Configuration Card */}
            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-cyan-500/30 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 rounded-l-lg" />
              
              <div className="p-6 relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      Configurar Limite
                      <Gem className="w-4 h-4 text-cyan-400" />
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Defina o score mínimo para receber alertas
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="threshold" className="text-sm font-medium text-muted-foreground">Score Mínimo</Label>
                    <Input 
                      id="threshold"
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="mt-2 bg-background/50 border-border/50 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  <Button 
                    onClick={saveConfig}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Salvar Todas as Configurações
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            {/* History Filters */}
            <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-amber-500/30 transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500 rounded-l-lg" />
              
              <div className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                      <SlidersHorizontal className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        Histórico de Alertas
                        <Clock className="w-4 h-4 text-amber-400" />
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {filteredHistory.length} alertas {filterPriority !== "all" && `com prioridade ${priorityConfig[filterPriority as AlertPriority]?.label.toLowerCase()}`}
                      </p>
                    </div>
                  </div>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-52 bg-background/50 border-border/50 focus:border-amber-500/50">
                      <SelectValue placeholder="Filtrar por prioridade" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-primary" />
                          Todas as Prioridades
                        </div>
                      </SelectItem>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            <span className={config.textColor}>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* History List */}
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5" />
                  <div className="p-12 relative">
                    <div className="text-center text-muted-foreground">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                        <Clock className="w-10 h-10 text-amber-400" />
                      </div>
                      <p className="text-lg font-medium text-foreground">Nenhum alerta no histórico</p>
                      <p className="text-sm mt-2">
                        {filterPriority !== "all" 
                          ? "Tente selecionar uma prioridade diferente" 
                          : "Os alertas aparecerão aqui quando forem gerados"}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                filteredHistory.map((alert) => {
                  const config = priorityConfig[alert.priority];
                  return (
                    <Card 
                      key={alert.id} 
                      className={`relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-${alert.priority === 'critical' ? 'rose' : alert.priority === 'high' ? 'orange' : alert.priority === 'medium' ? 'amber' : 'blue'}-500/30 transition-all duration-300 group ${!alert.read ? 'ring-1 ring-primary/30' : 'opacity-80'}`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      {!alert.read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary-glow rounded-l-lg" />
                      )}
                      
                      <div className="p-6 relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge 
                                variant={config.variant}
                                className={`bg-gradient-to-r ${config.gradient} border ${config.textColor} border-current/30`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                  {config.label}
                                </div>
                              </Badge>
                              {!alert.read && (
                                <Badge className="bg-gradient-to-r from-primary/20 to-primary-glow/20 text-primary border-primary/30">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Novo
                                </Badge>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-foreground">{alert.title}</h3>
                            <p className="text-muted-foreground">{alert.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(alert.created_at).toLocaleString('pt-BR')}
                              </span>
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
                                className="hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAlert(alert.id)}
                              title="Remover alerta"
                              className="hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Alerts;
