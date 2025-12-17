import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AuditButtonProps {
  onClick: () => void;
  isAuditing: boolean;
  disabled?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

/**
 * Botão reutilizável de auditoria
 * Componente padronizado para trigger de auditorias em toda a plataforma
 */
export function AuditButton({ 
  onClick, 
  isAuditing, 
  disabled = false,
  variant = "secondary",
  size = "sm",
  className = ""
}: AuditButtonProps) {
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isAuditing || disabled}
      className={className}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isAuditing ? 'animate-spin' : ''}`} />
      {isAuditing ? 'Auditando...' : 'Auditar Métricas'}
    </Button>
  );
}
