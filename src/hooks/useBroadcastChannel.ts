import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface UseBroadcastChannelProps {
  channelName: string;
  onMessage?: (event: string, payload: any) => void;
  enabled?: boolean;
}

export const useBroadcastChannel = ({
  channelName,
  onMessage,
  enabled = true,
}: UseBroadcastChannelProps) => {
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;

    const setupChannel = async () => {
      logger.info('Broadcast channel configurado', { channel: channelName });

      channel = supabase.channel(channelName, {
        config: {
          broadcast: {
            self: true,
            ack: false,
          },
        },
      });

      // Listen to all broadcast events
      if (onMessage) {
        channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
          logger.debug('Mensagem broadcast recebida', { channel: channelName, event });
          onMessage(event, payload);
        });
      }

      // Subscribe to channel
      channel.subscribe((status) => {
        logger.debug('Broadcast channel status', { channel: channelName, status });
      });
    };

    setupChannel();

    return () => {
      if (channel) {
        logger.info('Broadcast channel removido', { channel: channelName });
        supabase.removeChannel(channel);
      }
    };
  }, [channelName, enabled, onMessage]);

  const sendMessage = useCallback(
    (event: string, payload: any) => {
      const channel = supabase.channel(channelName);
      
      logger.debug('Enviando mensagem broadcast', { channel: channelName, event });
      
      channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    },
    [channelName]
  );

  return { sendMessage };
};
