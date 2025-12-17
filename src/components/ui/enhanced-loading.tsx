import { Loader2, Brain, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedLoadingProps {
  variant?: 'default' | 'ai' | 'data' | 'processing';
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EnhancedLoading({ 
  variant = 'default', 
  message,
  submessage,
  size = 'md',
  className 
}: EnhancedLoadingProps) {
  const icons = {
    default: Loader2,
    ai: Brain,
    data: Zap,
    processing: Sparkles,
  };

  const Icon = icons[variant];

  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const colors = {
    default: 'text-primary',
    ai: 'text-purple-600',
    data: 'text-blue-600',
    processing: 'text-yellow-600',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4 p-8", className)}>
      {/* Spinner with pulse effect */}
      <div className="relative">
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-20",
          colors[variant]
        )} />
        <Icon className={cn(
          sizes[size],
          colors[variant],
          variant === 'default' ? 'animate-spin' : 'animate-pulse'
        )} />
      </div>

      {/* Messages */}
      {message && (
        <div className="text-center space-y-2">
          <p className={cn(
            "font-medium",
            colors[variant],
            textSizes[size]
          )}>
            {message}
          </p>
          {submessage && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {submessage}
            </p>
          )}
        </div>
      )}

      {/* Progress dots */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full animate-bounce",
              colors[variant]
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
}
