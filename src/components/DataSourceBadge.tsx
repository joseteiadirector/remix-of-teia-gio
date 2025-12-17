import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Sparkles, Info } from 'lucide-react';

interface DataSourceBadgeProps {
  type: 'real' | 'technical';
  showIcon?: boolean;
  className?: string;
}

export const DataSourceBadge = ({ type, showIcon = true, className = '' }: DataSourceBadgeProps) => {
  if (type === 'real') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="default" 
              className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
            >
              {showIcon && <Database className="w-3 h-3 mr-1" />}
              Dados Reais
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Métricas coletadas do seu Google Analytics 4 e Search Console.
              Incluem: tráfego orgânico, CTR, conversões e posições reais.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`bg-purple-600 hover:bg-purple-700 text-white ${className}`}
          >
            {showIcon && <Sparkles className="w-3 h-3 mr-1" />}
            Análise Técnica
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            Análise baseada em scraping público da página. Incluem: SEO técnico, 
            estrutura, meta tags, otimização GEO. Não requer acesso ao GA4/GSC.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const DataSourceExplanation = () => {
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">Entenda os Tipos de Dados:</h4>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Database className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-green-600">Dados Reais:</span> Disponíveis apenas para domínios 
                conectados ao seu Google Analytics 4 e Search Console. Incluem métricas como tráfego orgânico real, 
                taxa de conversão, CTR e posições médias das palavras-chave.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-purple-600">Análise Técnica:</span> Disponível para qualquer URL pública. 
                Analisa SEO técnico, estrutura HTML, meta tags, performance e otimização GEO através de scraping público. 
                Não requer acesso às ferramentas do Google.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
