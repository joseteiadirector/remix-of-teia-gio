import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface UseRealtimeKPIsProps {
  brandId: string | null;
  onDataChange: () => void;
  enabled?: boolean;
}

export const useRealtimeKPIs = ({ brandId, onDataChange, enabled = true }: UseRealtimeKPIsProps) => {
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!brandId || !enabled) return;

    logger.info('Realtime KPIs iniciado', { brandId, channels: ['geo', 'seo', 'mentions'] });
    const activeChannels: RealtimeChannel[] = [];

    // Channel para GEO Scores com status tracking
    const geoChannel = supabase
      .channel(`geo-scores-${brandId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'geo_scores',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          logger.debug('Score GEO atualizado', { event: payload.eventType, brandId });
          toast.success('Novo Score GEO disponível!', {
            description: 'Os dados foram atualizados automaticamente',
            duration: 3000,
          });
          onDataChange();
        }
      )
      .subscribe((status) => {
        logger.debug('GEO Channel status', { status, brandId });
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          activeChannels.push(geoChannel);
        }
      });

    // Channel para SEO Metrics com broadcast
    const seoChannel = supabase
      .channel(`seo-metrics-${brandId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seo_metrics_daily',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          logger.debug('Métricas SEO atualizadas', { event: payload.eventType, brandId });
          toast.success('Novas Métricas SEO disponíveis!', {
            description: 'Os dados foram atualizados automaticamente',
            duration: 3000,
          });
          onDataChange();
        }
      )
      .on('broadcast', { event: 'metrics-update' }, ({ payload }) => {
        logger.debug('Broadcast SEO recebido', { brandId });
        onDataChange();
      })
      .subscribe((status) => {
        logger.debug('SEO Channel status', { status, brandId });
        if (status === 'SUBSCRIBED') {
          activeChannels.push(seoChannel);
        }
      });

    // Channel para Mentions com notificações em tempo real
    const mentionsChannel = supabase
      .channel(`mentions-${brandId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentions_llm',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          logger.debug('Nova menção LLM detectada', { provider: payload.new?.provider, brandId });
          const mention = payload.new as any;
          toast.info('Nova menção em IA detectada!', {
            description: `${mention.provider}: ${mention.mentioned ? '✅ Mencionado' : '❌ Não mencionado'}`,
            duration: 4000,
          });
          onDataChange();
        }
      )
      .on('broadcast', { event: 'mention-added' }, ({ payload }) => {
        logger.debug('Broadcast de menção recebido', { brandId });
        onDataChange();
      })
      .subscribe((status) => {
        logger.debug('Mentions Channel status', { status, brandId });
        if (status === 'SUBSCRIBED') {
          activeChannels.push(mentionsChannel);
        }
      });

    // Channel para IGO Metrics
    const igoChannel = supabase
      .channel(`igo-metrics-${brandId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'igo_metrics_history',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          logger.debug('Métricas IGO atualizadas', { event: payload.eventType, brandId });
          toast.success('Métricas IGO atualizadas!', {
            description: 'ICE, GAP e CPI recalculados',
            duration: 3000,
          });
          onDataChange();
        }
      )
      .subscribe((status) => {
        logger.debug('IGO Channel status', { status, brandId });
        if (status === 'SUBSCRIBED') {
          activeChannels.push(igoChannel);
        }
      });

    // Channel para Alerts
    const alertsChannel = supabase
      .channel(`alerts-${brandId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts_history',
          filter: `brand_id=eq.${brandId}`
        },
        (payload) => {
          logger.debug('Novo alerta detectado', { priority: payload.new?.priority, brandId });
          const alert = payload.new as any;
          toast.warning(alert.title, {
            description: alert.message,
            duration: 6000,
          });
          onDataChange();
        }
      )
      .subscribe((status) => {
        logger.debug('Alerts Channel status', { status, brandId });
        if (status === 'SUBSCRIBED') {
          activeChannels.push(alertsChannel);
        }
      });

    setChannels(activeChannels);

    return () => {
      logger.info('Realtime KPIs encerrado', { brandId, channels: activeChannels.length });
      setIsConnected(false);
      activeChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [brandId, onDataChange, enabled]);

  return { isConnected, channelCount: channels.length };
};
