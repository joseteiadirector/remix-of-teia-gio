import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AutomationConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationConfigDialog({ open, onOpenChange }: AutomationConfigDialogProps) {
  const queryClient = useQueryClient();
  const [automationType, setAutomationType] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('daily');
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');

  // Buscar marcas do usuário
  const { data: brands } = useQuery({
    queryKey: ['brands-for-automation'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Criar configuração
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Calcular próxima execução
      const now = new Date();
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const nextRun = new Date();
      nextRun.setHours(hours, minutes, 0, 0);

      if (frequency === 'daily' && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (frequency === 'weekly' && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }

      const { error } = await supabase
        .from('automation_configs')
        .insert({
          user_id: user.id,
          brand_id: brandId || null,
          automation_type: automationType,
          frequency,
          schedule_time: scheduleTime,
          next_run: nextRun.toISOString(),
          enabled: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-configs'] });
      toast.success('Automação criada com sucesso');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar automação', {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setAutomationType('');
    setBrandId('');
    setFrequency('daily');
    setScheduleTime('09:00');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!automationType) {
      toast.error('Selecione um tipo de automação');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Automação</DialogTitle>
          <DialogDescription>
            Configure uma nova tarefa automatizada para sua plataforma
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="automation-type">Tipo de Automação</Label>
            <Select value={automationType} onValueChange={setAutomationType}>
              <SelectTrigger id="automation-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentions_collection">Coleta de Menções LLM</SelectItem>
                <SelectItem value="seo_analysis">Análise SEO</SelectItem>
                <SelectItem value="geo_metrics">Cálculo de Métricas GEO</SelectItem>
                <SelectItem value="weekly_report">Relatório Semanal</SelectItem>
                <SelectItem value="alerts_check">Verificação de Alertas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {automationType !== 'weekly_report' && (
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">A cada hora</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency !== 'hourly' && (
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Horário</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Automação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}