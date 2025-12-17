import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardWidgetProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
  lastUpdated?: number;
}

export function DashboardWidget({ 
  title, 
  icon, 
  children, 
  onRemove,
  className = '',
  lastUpdated
}: DashboardWidgetProps) {
  return (
    <Card className={`p-6 ${className} animate-fade-in`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
          {icon}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">{title}</h3>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <div className="mt-4">
        {children}
      </div>
    </Card>
  );
}
