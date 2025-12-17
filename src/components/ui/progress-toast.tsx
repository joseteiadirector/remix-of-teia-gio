import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

interface ProgressToastProps {
  steps: ProgressStep[];
  title?: string;
  className?: string;
}

export function ProgressToast({ steps, title = "Processando", className }: ProgressToastProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(s => s.status === 'success' || s.status === 'error').length;
    const totalSteps = steps.length;
    setProgress((completedSteps / totalSteps) * 100);
  }, [steps]);

  return (
    <div className={cn("space-y-3 min-w-[320px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{title}</h4>
        <span className="text-xs text-muted-foreground">
          {steps.filter(s => s.status === 'success').length}/{steps.length}
        </span>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Steps */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-3 p-2 rounded-lg transition-all",
              step.status === 'loading' && "bg-blue-50 animate-pulse",
              step.status === 'success' && "bg-green-50",
              step.status === 'error' && "bg-red-50"
            )}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              {step.status === 'loading' && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
              {step.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              {step.status === 'error' && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                step.status === 'pending' && "text-muted-foreground",
                step.status === 'loading' && "text-blue-900",
                step.status === 'success' && "text-green-900",
                step.status === 'error' && "text-red-900"
              )}>
                {step.label}
              </p>
              {step.error && (
                <p className="text-xs text-red-700 mt-1">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
