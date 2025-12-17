import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn("p-12", className)}>
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Animated icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative bg-primary/10 p-6 rounded-full">
            <Icon className="h-12 w-12 text-primary opacity-70" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Action */}
        {action && (
          <Button
            onClick={action.onClick}
            size="lg"
            className="mt-4 shadow-lg hover:shadow-xl transition-all"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
