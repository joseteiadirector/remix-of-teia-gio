/**
 * Indicador Visual de Consistência Matemática
 * 
 * Exibe status de validação em tempo real com tooltip detalhado
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertTriangle, Loader2, Info } from "lucide-react";
import { useConsistencyValidation } from "@/hooks/useConsistencyValidation";
import { Button } from "@/components/ui/button";
import { formatValidationResult } from "@/utils/consistencyValidator";

interface ConsistencyIndicatorProps {
  brandId?: string;
  brandName?: string;
  autoValidate?: boolean;
  showDetails?: boolean;
}

export function ConsistencyIndicator({
  brandId,
  brandName,
  autoValidate = false,
  showDetails = true,
}: ConsistencyIndicatorProps) {
  const {
    validationResult,
    isValidating,
    lastValidation,
    validateBrand,
    validateAll,
    isConsistent,
    divergenceCount,
  } = useConsistencyValidation({
    brandId,
    brandName,
    autoValidate,
    showToasts: false,
  });

  const handleValidate = () => {
    if (brandId && brandName) {
      validateBrand();
    } else {
      validateAll();
    }
  };

  if (!validationResult && !lastValidation) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleValidate}
              disabled={isValidating}
              className="gap-2"
            >
              <Info className="h-4 w-4" />
              {isValidating ? 'Validando...' : 'Validar Consistência'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clique para validar consistência matemática dos scores</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2">
            <Badge
              variant={isConsistent ? "outline" : "destructive"}
              className="gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleValidate}
            >
              {isValidating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isConsistent ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {isValidating ? (
                'Validando...'
              ) : isConsistent ? (
                '✅ Consistente'
              ) : (
                `⚠️ ${divergenceCount} Divergência(s)`
              )}
            </Badge>
            
            {lastValidation && (
              <span className="text-xs text-muted-foreground">
                Última: {new Date(lastValidation).toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          {validationResult ? (
            <div className="space-y-2">
              <p className="font-semibold">
                {isConsistent ? '✅ Sistema Consistente' : '⚠️ Inconsistências Detectadas'}
              </p>
              {showDetails && validationResult.divergences.length > 0 && (
                <div className="text-xs space-y-1">
                  <p className="font-medium">Divergências:</p>
                  {validationResult.divergences.map((d, i) => (
                    <p key={i} className="text-muted-foreground">
                      • {d.metric} em {d.source}:<br />
                      Esperado: {d.expected.toFixed(1)} | Atual: {d.actual.toFixed(1)}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Clique para revalidar
              </p>
            </div>
          ) : (
            <p>Clique para executar validação de consistência matemática</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
