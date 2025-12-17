import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Shield } from "lucide-react";
import { AuditSystem } from "@/utils/auditSystem";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AuditBadgeProps {
  status: 'consistent' | 'warning' | 'critical' | 'unknown';
  maxDivergence?: number;
  inconsistencies?: number;
  className?: string;
}

/**
 * Badge de Certificação Matemática
 * Mostra visualmente o status da auditoria das métricas
 */
export function AuditBadge({ 
  status, 
  maxDivergence = 0, 
  inconsistencies = 0,
  className = "" 
}: AuditBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case 'consistent':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3" />;
      case 'critical':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'consistent':
        return 'Certificado';
      case 'warning':
        return 'Atenção';
      case 'critical':
        return 'Crítico';
      default:
        return 'Não Auditado';
    }
  };

  const getTooltipContent = () => {
    if (status === 'unknown') {
      return 'Execute uma auditoria para verificar a consistência matemática das métricas';
    }
    
    return (
      <div className="space-y-1">
        <p className="font-semibold">{getLabel()}</p>
        <p className="text-xs">Divergência máxima: {AuditSystem.formatDivergence(maxDivergence)}</p>
        <p className="text-xs">Inconsistências: {inconsistencies}</p>
        {status === 'consistent' && (
          <p className="text-xs text-green-400 mt-2">✓ Todas as métricas estão matematicamente consistentes</p>
        )}
      </div>
    );
  };

  const colorClass = AuditSystem.getStatusColor(status);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${colorClass} ${className} gap-1.5 font-medium`}
          >
            {getIcon()}
            {getLabel()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
