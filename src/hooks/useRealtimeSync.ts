import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface PresenceState {
  user_id: string;
  online_at: string;
  page?: string;
}

interface UseRealtimeSyncProps {
  channelName: string;
  presenceKey?: string;
  onPresenceSync?: (presences: Record<string, PresenceState[]>) => void;
  onBroadcast?: (payload: any) => void;
  enabled?: boolean;
}

export const useRealtimeSync = ({
  channelName,
  presenceKey,
  onPresenceSync,
  onBroadcast,
  enabled = true
}: UseRealtimeSyncProps) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceCount, setPresenceCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    logger.info('Realtime sync iniciado', { channel: channelName, hasPresence: !!presenceKey });

    const realtimeChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: presenceKey || '' },
      },
    });

    // Presence tracking
    if (presenceKey) {
      realtimeChannel
        .on('presence', { event: 'sync' }, () => {
          const state = realtimeChannel.presenceState<PresenceState>();
          const count = Object.keys(state).length;
          setPresenceCount(count);
          logger.debug('Presença sincronizada', { channel: channelName, count });
          onPresenceSync?.(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          logger.debug('Usuário entrou', { channel: channelName, key });
          toast.info('Novo usuário conectado', {
            description: 'Dados serão sincronizados automaticamente',
          });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          logger.debug('Usuário saiu', { channel: channelName, key });
        });
    }

    // Broadcast messages
    if (onBroadcast) {
      realtimeChannel.on('broadcast', { event: 'data-change' }, (payload) => {
        logger.debug('Broadcast recebido', { channel: channelName });
        onBroadcast(payload.payload);
      });
    }

    // Subscribe to channel
    realtimeChannel.subscribe((status) => {
      logger.debug('Channel status atualizado', { channel: channelName, status });
      
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setChannel(realtimeChannel);
        
        // Track presence if enabled
        if (presenceKey) {
          const presenceData: PresenceState = {
            user_id: presenceKey,
            online_at: new Date().toISOString(),
            page: window.location.pathname,
          };
          realtimeChannel.track(presenceData);
        }

        toast.success('Conectado ao Real-Time', {
          description: 'Atualizações instantâneas ativadas',
        });
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        logger.warn('Erro de conexão realtime', { channel: channelName });
        toast.error('Erro de conexão Real-Time', {
          description: 'Tentando reconectar...',
        });
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        logger.warn('Timeout de conexão realtime', { channel: channelName });
        toast.warning('Conexão Real-Time expirou', {
          description: 'Reconectando automaticamente...',
        });
      }
    });

    return () => {
      logger.info('Realtime sync encerrado', { channel: channelName });
      setIsConnected(false);
      supabase.removeChannel(realtimeChannel);
    };
  }, [channelName, presenceKey, enabled, onPresenceSync, onBroadcast]);

  const broadcast = useCallback((event: string, payload: any) => {
    if (!channel || !isConnected) {
      logger.warn('Broadcast impossível - canal desconectado', { channel: channelName });
      return;
    }

    logger.debug('Enviando broadcast', { channel: channelName, event });
    channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }, [channel, isConnected, channelName]);

  const updatePresence = useCallback((data: Partial<PresenceState>) => {
    if (!channel || !isConnected || !presenceKey) {
      logger.warn('Presença não disponível', { channel: channelName, hasPresence: !!presenceKey });
      return;
    }

    const presenceData: PresenceState = {
      user_id: presenceKey,
      online_at: new Date().toISOString(),
      ...data,
    };

    logger.debug('Atualizando presença', { channel: channelName });
    channel.track(presenceData);
  }, [channel, isConnected, presenceKey, channelName]);

  return {
    isConnected,
    presenceCount,
    broadcast,
    updatePresence,
    channel,
  };
};
