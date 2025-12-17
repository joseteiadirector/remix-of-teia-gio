import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  color: string;
}

interface DashboardQuickActionsProps {
  actions: QuickAction[];
}

const colorVariants: Record<string, { bg: string; glow: string; text: string }> = {
  'bg-blue-500': { 
    bg: 'from-blue-500/20 to-blue-600/5', 
    glow: 'group-hover:shadow-blue-500/25',
    text: 'text-blue-400'
  },
  'bg-green-500': { 
    bg: 'from-green-500/20 to-green-600/5', 
    glow: 'group-hover:shadow-green-500/25',
    text: 'text-green-400'
  },
  'bg-purple-500': { 
    bg: 'from-purple-500/20 to-purple-600/5', 
    glow: 'group-hover:shadow-purple-500/25',
    text: 'text-purple-400'
  },
  'bg-orange-500': { 
    bg: 'from-orange-500/20 to-orange-600/5', 
    glow: 'group-hover:shadow-orange-500/25',
    text: 'text-orange-400'
  },
  'bg-emerald-500': { 
    bg: 'from-emerald-500/20 to-emerald-600/5', 
    glow: 'group-hover:shadow-emerald-500/25',
    text: 'text-emerald-400'
  },
};

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
      style={{ animationDelay: '200ms' }}
    >
      {actions.map((action, index) => {
        const variant = colorVariants[action.color] || colorVariants['bg-blue-500'];
        
        return (
          <Card
            key={index}
            className={cn(
              "group relative overflow-hidden cursor-pointer",
              "bg-card/50 backdrop-blur-sm border-border/50",
              "hover:border-primary/30 hover:shadow-lg",
              variant.glow,
              "transition-all duration-300 hover:-translate-y-1",
              "p-4 sm:p-5"
            )}
            onClick={action.onClick}
            role="button"
            tabIndex={0}
            aria-label={`${action.title}: ${action.description}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                action.onClick();
              }
            }}
            style={{ 
              animationDelay: `${200 + index * 50}ms`,
              animation: 'fade-in 0.5s ease-out forwards',
              opacity: 0
            }}
          >
            {/* Gradient background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              variant.bg
            )} />
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col items-start space-y-3">
              <div className={cn(
                "p-2.5 rounded-xl text-white shadow-lg",
                "group-hover:scale-110 group-hover:rotate-3 transition-all duration-300",
                action.color
              )}>
                <action.icon className="h-5 w-5 sm:h-5 sm:w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className={cn(
                  "font-semibold text-sm sm:text-base transition-colors",
                  "text-foreground group-hover:text-primary"
                )}>
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {action.description}
                </p>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <svg className={cn("w-4 h-4", variant.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        );
      })}
    </div>
  );
}