import { EnhancedLoading } from "@/components/ui/enhanced-loading";

interface LoadingStateProps {
  message?: string;
  variant?: 'default' | 'ai' | 'data' | 'processing';
  submessage?: string;
}

export function LoadingState({ 
  message = "Carregando...",
  variant = 'default',
  submessage
}: LoadingStateProps) {
  return (
    <EnhancedLoading 
      variant={variant}
      message={message}
      submessage={submessage}
      size="md"
    />
  );
}
