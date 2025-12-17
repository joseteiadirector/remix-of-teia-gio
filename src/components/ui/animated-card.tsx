import { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
  delay?: number;
}

export function AnimatedCard({
  children,
  hover = true,
  glow = false,
  delay = 0,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-out",
        "animate-fade-in",
        hover && "hover:scale-[1.02] hover:shadow-lg hover:-translate-y-1",
        glow && "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards'
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
