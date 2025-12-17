import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface RealCollectionButtonProps {
  brandId: string;
  brandName: string;
  onComplete?: () => void;
}

interface CollectionStats {
  totalQueries: number;
  mentions: number;
  avgConfidence: number;
  executionTimeMs: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export const RealCollectionButton = ({ brandId, brandName, onComplete }: RealCollectionButtonProps) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const { toast } = useToast();

  const handleCollect = async () => {
    setIsCollecting(true);
    setProgress(10);
    setStats(null);

    try {
      toast({
        title: "🤖 Iniciando Coleta Real",
        description: `Consultando ChatGPT, Gemini, Claude e Perplexity sobre ${brandName}...`,
      });

      setProgress(30);

      const { data, error } = await supabase.functions.invoke('collect-llm-mentions', {
        body: { brandId }
      });

      setProgress(80);

      if (error) throw error;

      setProgress(100);

      if (data.success) {
        // ✅ CORREÇÃO: Usar mesma lógica de fallback da página LLMMentions
        const collectedMentions = data.collected || data.statistics?.totalMentions || data.mentions || 0;
        const totalQueries = data.totalQueries || data.statistics?.totalQueries || 0;
        
        const statsData = {
          totalQueries,
          mentions: collectedMentions,
          avgConfidence: parseFloat(data.stats?.avgConfidence || 0),
          executionTimeMs: data.executionTimeMs || 0,
          sentimentBreakdown: data.stats?.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 }
        };

        setStats(statsData);

        toast({
          title: "✅ Coleta Concluída!",
          description: `${collectedMentions} menções coletadas em ${totalQueries} consultas`,
        });

        if (onComplete) onComplete();
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error('Erro na coleta:', error);
      toast({
        title: "❌ Erro na Coleta",
        description: error instanceof Error ? error.message : 'Erro ao coletar menções',
        variant: "destructive"
      });
    } finally {
      setIsCollecting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button
          onClick={handleCollect}
          disabled={isCollecting}
          variant="default"
          size="lg"
          className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
        >
          {isCollecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Coletando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Coletar Menções REAIS
            </>
          )}
        </Button>
        
        {!isCollecting && !stats && (
          <span className="text-sm text-muted-foreground">
            Consulta 4 LLMs com dados verdadeiros
          </span>
        )}
      </div>

      {isCollecting && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progress < 30 && "Iniciando consulta aos LLMs..."}
            {progress >= 30 && progress < 80 && "Analisando respostas com IA..."}
            {progress >= 80 && "Salvando resultados..."}
          </p>
        </div>
      )}

      {stats && (
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Resultados da Coleta Real</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Queries:</span>
                <p className="font-bold text-lg">{stats.totalQueries}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Menções:</span>
                <p className="font-bold text-lg text-primary">{stats.mentions}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Confiança Média:</span>
                <p className="font-bold text-lg">{stats.avgConfidence}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tempo:</span>
                <p className="font-bold text-lg">{(stats.executionTimeMs / 1000).toFixed(1)}s</p>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Sentimento:</span>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  ✓ {stats.sentimentBreakdown.positive} positivo
                </span>
                <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  ○ {stats.sentimentBreakdown.neutral} neutro
                </span>
                <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                  ✗ {stats.sentimentBreakdown.negative} negativo
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <AlertCircle className="inline h-3 w-3 mr-1" />
              Dados reais coletados de ChatGPT, Gemini, Claude e Perplexity
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
