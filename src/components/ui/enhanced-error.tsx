import { AlertTriangle, RefreshCw, Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EnhancedErrorProps {
  title?: string;
  message: string;
  errorCode?: string;
  variant?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  details?: string;
}

export function EnhancedError({
  title = "Algo deu errado",
  message,
  errorCode,
  variant = 'error',
  onRetry,
  onGoHome,
  className,
  details
}: EnhancedErrorProps) {
  const variants = {
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      subtext: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-900',
      subtext: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      subtext: 'text-blue-700',
    },
  };

  const style = variants[variant];

  return (
    <Card className={cn(
      "p-8",
      style.bg,
      "border-2",
      className
    )}>
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="relative">
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-20",
            style.icon
          )} />
          {variant === 'info' ? (
            <FileQuestion className={cn("h-16 w-16", style.icon)} />
          ) : (
            <AlertTriangle className={cn("h-16 w-16", style.icon)} />
          )}
        </div>

        {/* Title */}
        <h3 className={cn("text-2xl font-bold", style.text)}>
          {title}
        </h3>

        {/* Message */}
        <p className={cn("text-base max-w-md", style.subtext)}>
          {message}
        </p>

        {/* Error Code */}
        {errorCode && (
          <code className={cn(
            "text-xs px-3 py-1 rounded-full font-mono",
            "bg-black/10"
          )}>
            Código: {errorCode}
          </code>
        )}

        {/* Details (collapsible) */}
        {details && (
          <details className="w-full max-w-md text-left">
            <summary className={cn(
              "text-sm cursor-pointer hover:underline",
              style.subtext
            )}>
              Ver detalhes técnicos
            </summary>
            <pre className={cn(
              "text-xs mt-2 p-3 rounded-lg overflow-auto",
              "bg-black/5",
              style.subtext
            )}>
              {details}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          {onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
