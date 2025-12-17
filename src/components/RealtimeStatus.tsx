import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RealtimeStatusProps {
  isConnected: boolean;
  presenceCount?: number;
  className?: string;
  showPresence?: boolean;
}

function RealtimeStatusComponent({
  isConnected,
  presenceCount = 0,
  className,
  showPresence = false,
}: RealtimeStatusProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className={cn(
                'flex items-center gap-1.5 transition-all',
                isConnected
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 animate-pulse" />
                  <span className="text-xs font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="text-xs font-medium">Offline</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {isConnected
                ? 'Conectado ao servidor Real-Time'
                : 'Desconectado do servidor Real-Time'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showPresence && presenceCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
              >
                <Users className="w-3 h-3" />
                <span className="text-xs font-medium">{presenceCount}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {presenceCount === 1
                  ? 'Você está online'
                  : `${presenceCount} usuários online`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isConnected && (
        <div className="flex gap-0.5">
          <div
            className="w-1 h-1 rounded-full bg-green-500 animate-pulse"
            style={{ animationDelay: '0ms', animationDuration: '2000ms' }}
          />
          <div
            className="w-1 h-1 rounded-full bg-green-500 animate-pulse"
            style={{ animationDelay: '400ms', animationDuration: '2000ms' }}
          />
          <div
            className="w-1 h-1 rounded-full bg-green-500 animate-pulse"
            style={{ animationDelay: '800ms', animationDuration: '2000ms' }}
          />
        </div>
      )}
    </div>
  );
}

export const RealtimeStatus = memo(RealtimeStatusComponent);
