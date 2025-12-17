import { memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { RealtimeStatus } from '@/components/RealtimeStatus';
import { Card } from '@/components/ui/card';

interface RealtimeIndicatorProps {
  className?: string;
}

function RealtimeIndicatorComponent({ className }: RealtimeIndicatorProps) {
  const { user } = useAuth();

  const { isConnected, presenceCount } = useRealtimeSync({
    channelName: 'dashboard-presence',
    presenceKey: user?.id,
    enabled: !!user,
  });

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">Status da Conexão</h3>
            <p className="text-xs text-muted-foreground">
              Sincronização em tempo real
            </p>
          </div>
          <RealtimeStatus
            isConnected={isConnected}
            presenceCount={presenceCount}
            showPresence={true}
          />
        </div>
      </div>
    </Card>
  );
}

export const RealtimeIndicator = memo(RealtimeIndicatorComponent);
