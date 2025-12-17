import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, TrendingUp, HelpCircle, LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  dataSource: 'real' | 'estimate';
  tooltip: {
    title: string;
    description: string;
    whyMatters: string;
  };
  colorClass?: string;
}

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  dataSource,
  tooltip,
  colorClass = 'from-primary/5 to-primary/10 border-primary/20'
}: KPICardProps) {
  return (
    <Card className={`p-6 hover-lift glass-card bg-gradient-to-br ${colorClass} shadow-lg hover:shadow-xl transition-all duration-300 border-2`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Icon className="w-5 h-5 text-primary drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]" />
            <h3 className="font-semibold text-sm">{title}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted transition-colors">
                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-2 p-4" side="right">
                  <div>
                    <p className="font-semibold text-sm mb-1">{tooltip.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tooltip.description}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="font-semibold text-xs mb-1">Por que importa?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tooltip.whyMatters}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge 
            variant="outline" 
            className={`gap-1 ${
              dataSource === 'real' 
                ? 'bg-primary/10 text-primary border-primary/30' 
                : 'bg-accent/10 text-accent border-accent/30'
            }`}
          >
            {dataSource === 'real' ? (
              <Database className="w-3 h-3" />
            ) : (
              <>
                <TrendingUp className="w-3 h-3" />
                Estimativa
              </>
            )}
          </Badge>
        </div>

        <div>
          <div className="text-3xl font-bold mb-1 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className={`text-xs font-medium ${
              trend.value >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.value >= 0 ? '↗' : '↘'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
