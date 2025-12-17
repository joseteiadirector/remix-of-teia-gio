import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

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

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {actions.map((action, index) => (
        <Card
          key={index}
          className="group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 p-4 sm:p-6 bg-card"
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
        >
          <div className="relative z-10 flex flex-col items-start space-y-3">
            <div className={`${action.color} p-2.5 rounded-lg text-white shadow-md group-hover:scale-110 transition-transform`}>
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {action.description}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
        </Card>
      ))}
    </div>
  );
}
