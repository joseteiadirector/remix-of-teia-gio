import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
  lastUpdated?: number;
  variant?: 'default' | 'highlight' | 'glass';
}

export function DashboardWidget({ 
  title, 
  icon, 
  children, 
  onRemove,
  className = '',
  lastUpdated,
  variant = 'default'
}: DashboardWidgetProps) {
  const variantStyles = {
    default: 'bg-card border-border/50 hover:border-primary/30',
    highlight: 'bg-gradient-to-br from-card to-muted/30 border-primary/20 hover:border-primary/40',
    glass: 'glass-card backdrop-blur-xl bg-card/80 border-white/10 hover:border-primary/30'
  };

  return (
    <Card 
      className={cn(
        'group relative p-6 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-elegant',
        variantStyles[variant],
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Glow effect on hover */}
      <div className="absolute -inset-px rounded-lg bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                {icon}
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {title}
                </h3>
                {lastUpdated && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </Card>
  );
}