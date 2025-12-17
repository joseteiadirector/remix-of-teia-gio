import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface Widget {
  id: string;
  type: 'aiAnalytics' | 'unified' | 'weekly' | 'score' | 'mentions' | 'alerts' | 'brands' | 'trends';
  position: { x: number; y: number };
  size: { w: number; h: number };
  enabled: boolean;
}

const defaultWidgets: Widget[] = [
  { id: 'aiAnalytics-1', type: 'aiAnalytics', position: { x: 0, y: 0 }, size: { w: 6, h: 4 }, enabled: true },
  { id: 'unified-1', type: 'unified', position: { x: 6, y: 0 }, size: { w: 6, h: 4 }, enabled: true },
  { id: 'weekly-1', type: 'weekly', position: { x: 0, y: 4 }, size: { w: 4, h: 2 }, enabled: true },
  { id: 'score-1', type: 'score', position: { x: 4, y: 4 }, size: { w: 4, h: 2 }, enabled: true },
  { id: 'mentions-1', type: 'mentions', position: { x: 8, y: 4 }, size: { w: 4, h: 2 }, enabled: true },
  { id: 'alerts-1', type: 'alerts', position: { x: 0, y: 6 }, size: { w: 6, h: 2 }, enabled: true },
  { id: 'brands-1', type: 'brands', position: { x: 6, y: 6 }, size: { w: 6, h: 2 }, enabled: true },
  { id: 'trends-1', type: 'trends', position: { x: 0, y: 8 }, size: { w: 12, h: 2 }, enabled: true },
];

export function useDashboardConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConfig();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Use user.id to prevent unnecessary re-runs

  const loadConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('widgets')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.widgets && Array.isArray(data.widgets)) {
        setWidgets(data.widgets as unknown as Widget[]);
      } else {
        // Initialize with default widgets without triggering toast
        setWidgets(defaultWidgets);
        // Save in background without toast
        supabase
          .from('dashboard_configs')
          .upsert({ user_id: user.id, widgets: defaultWidgets as any })
          .then(() => logger.info('Dashboard config initialized'));
      }
    } catch (error) {
      logger.error('Erro ao carregar configuração do dashboard', { error, userId: user?.id });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newWidgets: Widget[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('dashboard_configs')
        .upsert({
          user_id: user.id,
          widgets: newWidgets as any,
        });

      if (error) throw error;

      setWidgets(newWidgets);
      toast({
        title: "Dashboard atualizado",
        description: "Suas preferências foram salvas",
      });
    } catch (error) {
      logger.error('Erro ao salvar configuração do dashboard', { error, userId: user?.id });
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    }
  };

  const toggleWidget = (widgetId: string) => {
    const newWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    );
    saveConfig(newWidgets);
  };

  const moveWidget = (widgetId: string, position: { x: number; y: number }) => {
    const newWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, position } : w
    );
    saveConfig(newWidgets);
  };

  const resetToDefault = () => {
    saveConfig(defaultWidgets);
  };

  return {
    widgets,
    loading,
    toggleWidget,
    moveWidget,
    resetToDefault,
    saveConfig,
  };
}
