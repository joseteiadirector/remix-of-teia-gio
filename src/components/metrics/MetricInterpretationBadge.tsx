import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface MetricInterpretationBadgeProps {
  metricType: 'ice' | 'gap' | 'cpi' | 'stability';
  value: number;
  showTooltip?: boolean;
}

interface MetricInterpretation {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: string;
  description: string;
  color: string;
}

/**
 * Obtém a interpretação da métrica CONFORME kapiMetrics.ts
 * 
 * LÓGICAS:
 * - ICE: DIRETA (maior = melhor) - ≥90 Excelente, ≥75 Bom, ≥60 Regular, <60 Crítico
 * - GAP: INVERSA (menor = melhor) - ≤10 Excelente, ≤25 Bom, ≤40 Atenção, >40 Crítico
 * - CPI: DIRETA (maior = melhor) - ≥80 Excelente, ≥65 Bom, ≥50 Regular, <50 Crítico
 * - Stability: DIRETA (maior = melhor) - ≥85 Excelente, ≥70 Bom, ≥55 Regular, <55 Crítico
 */
const getInterpretation = (
  metricType: 'ice' | 'gap' | 'cpi' | 'stability',
  value: number
): MetricInterpretation => {
  switch (metricType) {
    case 'ice': // ICE - lógica DIRETA (maior = melhor)
      if (value >= 90) return {
        label: 'Excelente',
        variant: 'default',
        icon: '🟢',
        description: 'Convergência estratégica perfeita entre GEO e SEO. Suas estratégias estão totalmente alinhadas.',
        color: 'text-green-600'
      };
      if (value >= 75) return {
        label: 'Bom',
        variant: 'secondary',
        icon: '🟡',
        description: 'Boa convergência entre GEO e SEO. Há oportunidades menores de otimização.',
        color: 'text-yellow-600'
      };
      if (value >= 60) return {
        label: 'Regular',
        variant: 'outline',
        icon: '🟠',
        description: 'Convergência moderada. Existe divergência entre suas estratégias GEO e SEO que precisa de atenção.',
        color: 'text-orange-600'
      };
      return {
        label: 'Crítico',
        variant: 'destructive',
        icon: '🔴',
        description: 'Baixa convergência. Suas estratégias GEO e SEO estão desalinhadas - ação urgente necessária.',
        color: 'text-red-600'
      };

    case 'gap': // GAP - lógica INVERSA (menor = melhor)
      if (value <= 10) return {
        label: 'Excelente',
        variant: 'default',
        icon: '🟢',
        description: 'Divergência mínima entre GEO e SEO. Suas estratégias estão altamente alinhadas.',
        color: 'text-green-600'
      };
      if (value <= 25) return {
        label: 'Bom',
        variant: 'secondary',
        icon: '🟡',
        description: 'Baixa divergência. Pequenos ajustes podem melhorar ainda mais o alinhamento.',
        color: 'text-yellow-600'
      };
      if (value <= 40) return {
        label: 'Atenção',
        variant: 'outline',
        icon: '🟠',
        description: 'Divergência moderada. Requer ações estratégicas para corrigir o desalinhamento.',
        color: 'text-orange-600'
      };
      return {
        label: 'Crítico',
        variant: 'destructive',
        icon: '🔴',
        description: 'Alta divergência entre GEO e SEO. Prioridade máxima de ação - suas estratégias estão conflitantes.',
        color: 'text-red-600'
      };

    case 'cpi': // CPI - lógica DIRETA (maior = melhor)
      if (value >= 80) return {
        label: 'Excelente',
        variant: 'default',
        icon: '🟢',
        description: 'Alta previsibilidade cognitiva. As respostas dos LLMs sobre sua marca são consistentes e confiáveis.',
        color: 'text-green-600'
      };
      if (value >= 65) return {
        label: 'Bom',
        variant: 'secondary',
        icon: '🟡',
        description: 'Boa previsibilidade. Respostas dos LLMs são geralmente consistentes com pequenas variações.',
        color: 'text-yellow-600'
      };
      if (value >= 50) return {
        label: 'Regular',
        variant: 'outline',
        icon: '🟠',
        description: 'Previsibilidade moderada. Há inconsistências nas respostas dos LLMs que precisam ser trabalhadas.',
        color: 'text-orange-600'
      };
      return {
        label: 'Crítico',
        variant: 'destructive',
        icon: '🔴',
        description: 'Baixa previsibilidade. Respostas dos LLMs são inconsistentes - risco de informações conflitantes.',
        color: 'text-red-600'
      };

    case 'stability': // Stability - lógica DIRETA (maior = melhor)
      if (value >= 85) return {
        label: 'Excelente',
        variant: 'default',
        icon: '🟢',
        description: 'Estabilidade cognitiva superior. Sua marca é mencionada de forma consistente ao longo do tempo.',
        color: 'text-green-600'
      };
      if (value >= 70) return {
        label: 'Bom',
        variant: 'secondary',
        icon: '🟡',
        description: 'Boa estabilidade. Menções mantêm-se relativamente consistentes com pequenas flutuações.',
        color: 'text-yellow-600'
      };
      if (value >= 55) return {
        label: 'Regular',
        variant: 'outline',
        icon: '🟠',
        description: 'Estabilidade moderada. Há variações nas menções que podem indicar inconsistência da presença digital.',
        color: 'text-orange-600'
      };
      return {
        label: 'Crítico',
        variant: 'destructive',
        icon: '🔴',
        description: 'Baixa estabilidade. Grandes variações nas menções indicam presença digital inconsistente.',
        color: 'text-red-600'
      };
  }
};

export function MetricInterpretationBadge({
  metricType,
  value,
  showTooltip = true
}: MetricInterpretationBadgeProps) {
  const interpretation = getInterpretation(metricType, value);

  if (!showTooltip) {
    return (
      <Badge variant={interpretation.variant} className="gap-1">
        <span>{interpretation.icon}</span>
        <span>{interpretation.label}</span>
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            <Badge variant={interpretation.variant} className="gap-1">
              <span>{interpretation.icon}</span>
              <span>{interpretation.label}</span>
            </Badge>
            <HelpCircle className="w-3 h-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{interpretation.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
