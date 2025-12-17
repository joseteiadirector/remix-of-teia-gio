import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface MonitoringScheduleProps {
  url: string;
}

export function MonitoringSchedule({ url }: MonitoringScheduleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [alertThreshold, setAlertThreshold] = useState(10);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['monitoring-schedules', user?.id, url],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_monitoring_schedules')
        .select('*')
        .eq('user_id', user?.id)
        .eq('url', url);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!url,
  });

  const createSchedule = useMutation({
    mutationFn: async () => {
      const nextRun = new Date();
      if (newFrequency === 'daily') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else {
        nextRun.setDate(nextRun.getDate() + 7);
      }

      const { error } = await supabase
        .from('url_monitoring_schedules')
        .insert({
          user_id: user?.id,
          url,
          frequency: newFrequency,
          alert_threshold: alertThreshold,
          next_run: nextRun.toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-schedules'] });
      toast({
        title: 'Agendamento Criado',
        description: `Análises ${newFrequency === 'daily' ? 'diárias' : 'semanais'} configuradas com sucesso!`,
      });
      setShowNew(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleSchedule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('url_monitoring_schedules')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-schedules'] });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('url_monitoring_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-schedules'] });
      toast({
        title: 'Agendamento Removido',
        description: 'O monitoramento foi cancelado.',
      });
    },
  });

  if (!url) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Monitoramento Automático
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Agende análises periódicas e receba alertas
          </p>
        </div>
        {!showNew && (
          <Button onClick={() => setShowNew(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        )}
      </div>

      {showNew && (
        <Card className="p-4 mb-4 bg-primary/5">
          <div className="space-y-4">
            <div>
              <Label>Frequência</Label>
              <Select value={newFrequency} onValueChange={(v: any) => setNewFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Alerta se score cair mais de (%)</Label>
              <Input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => createSchedule.mutate()} disabled={createSchedule.isPending}>
                Criar Agendamento
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : !schedules || schedules.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum agendamento configurado</p>
          <p className="text-sm mt-2">Crie um agendamento para monitorar esta URL automaticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {schedule.frequency === 'daily' ? 'Diariamente' : 'Semanalmente'}
                    </span>
                    {schedule.alert_on_drop && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Alerta: {schedule.alert_threshold}%
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {schedule.last_run && (
                      <span>Última: {format(new Date(schedule.last_run), 'dd/MM/yyyy HH:mm')}</span>
                    )}
                    {schedule.next_run && (
                      <span className="ml-3">Próxima: {format(new Date(schedule.next_run), 'dd/MM/yyyy HH:mm')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={(checked) =>
                      toggleSchedule.mutate({ id: schedule.id, enabled: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSchedule.mutate(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
