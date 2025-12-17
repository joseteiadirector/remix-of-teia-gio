import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Plus, 
  X, 
  TrendingUp, 
  Target,
  Zap,
  Trophy,
  AlertTriangle
} from 'lucide-react';

interface CompetitorAnalysisProps {
  mainUrl: string;
}

interface UrlAnalysis {
  url: string;
  score: number;
  geoScore: number;
  seoScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export function CompetitorAnalysis({ mainUrl }: CompetitorAnalysisProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [comparisonName, setComparisonName] = useState('');
  const [results, setResults] = useState<UrlAnalysis[]>([]);

  const analyzeCompetitors = useMutation({
    mutationFn: async () => {
      const validUrls = [mainUrl, ...competitorUrls.filter(url => url.trim())];
      
      if (validUrls.length < 2) {
        throw new Error('Adicione pelo menos um concorrente para comparar');
      }

      const analyses: UrlAnalysis[] = [];

      // Analisar cada URL
      for (const url of validUrls) {
        try {
          const { data, error } = await supabase.functions.invoke('analyze-url', {
            body: { url }
          });

          if (error) throw error;

          analyses.push({
            url,
            score: data.score,
            geoScore: data.geoOptimization.score,
            seoScore: data.seoOptimization.score,
            summary: data.summary,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
          });
        } catch (error) {
          logger.error('Erro na análise de concorrente', { url, error });
          analyses.push({
            url,
            score: 0,
            geoScore: 0,
            seoScore: 0,
            summary: 'Erro na análise',
            strengths: [],
            weaknesses: ['Não foi possível analisar esta URL'],
          });
        }
      }

      return analyses;
    },
    onSuccess: async (data) => {
      setResults(data);
      
      toast({
        title: 'Análise Concluída',
        description: `${data.length} URLs analisadas com sucesso!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na Análise',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addCompetitorField = () => {
    if (competitorUrls.length < 5) {
      setCompetitorUrls([...competitorUrls, '']);
    }
  };

  const removeCompetitorField = (index: number) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankPosition = (score: number, allScores: number[]) => {
    const sorted = [...allScores].sort((a, b) => b - a);
    return sorted.indexOf(score) + 1;
  };

  if (!mainUrl) return null;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
          <Users className="w-5 h-5" />
          Análise Competitiva
        </h3>
        <p className="text-sm text-muted-foreground">
          Compare sua URL com até 5 concorrentes
        </p>
      </div>

      {results.length === 0 ? (
        <div className="space-y-4">
          <div>
            <Label>Nome da Comparação (opcional)</Label>
            <Input
              value={comparisonName}
              onChange={(e) => setComparisonName(e.target.value)}
              placeholder="Ex: Análise Março 2025"
            />
          </div>

          <div>
            <Label>Sua URL Principal</Label>
            <Input value={mainUrl} disabled className="bg-primary/5" />
          </div>

          <div className="space-y-3">
            <Label>URLs dos Concorrentes</Label>
            {competitorUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateCompetitorUrl(index, e.target.value)}
                  placeholder={`https://concorrente${index + 1}.com`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitorField(index)}
                  disabled={competitorUrls.length === 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {competitorUrls.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addCompetitorField}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Concorrente
              </Button>
            )}
          </div>

          <Button
            onClick={() => analyzeCompetitors.mutate()}
            disabled={analyzeCompetitors.isPending}
            className="w-full"
            size="lg"
          >
            {analyzeCompetitors.isPending ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-foreground rounded-full" />
                Analisando {competitorUrls.filter(u => u.trim()).length + 1} URLs...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Comparar Concorrentes
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Resultados da Comparação</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResults([]);
                setComparisonName('');
              }}
            >
              Nova Comparação
            </Button>
          </div>

          {/* Ranking Geral */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <h5 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Ranking Geral
            </h5>
            <div className="space-y-2">
              {[...results]
                .sort((a, b) => b.score - a.score)
                .map((result, index) => (
                  <div
                    key={result.url}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.url === mainUrl ? 'bg-primary/20' : 'bg-background/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm truncate max-w-[200px]">
                          {result.url === mainUrl ? '🎯 Sua URL' : result.url}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score: {result.score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index === 0 ? '👑 Líder' : `${(result.score / results[0].score * 100).toFixed(0)}%`}
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>

          {/* Comparação Detalhada */}
          <div className="grid gap-4">
            {results.map((result) => (
              <Card
                key={result.url}
                className={`p-4 ${result.url === mainUrl ? 'border-primary border-2' : ''}`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold truncate max-w-[300px]">
                          {result.url === mainUrl ? '🎯 Sua URL' : result.url}
                        </h5>
                        {result.url === mainUrl && (
                          <Badge variant="default">Você</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{result.summary}</p>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">GEO Score</span>
                      </div>
                      <Progress value={result.geoScore} className="h-2" />
                      <div className="text-right text-sm mt-1">{result.geoScore}/100</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">SEO Score</span>
                      </div>
                      <Progress value={result.seoScore} className="h-2" />
                      <div className="text-right text-sm mt-1">{result.seoScore}/100</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Insights Competitivos */}
          <Card className="p-4 bg-primary/5">
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Insights Competitivos
            </h5>
            <div className="space-y-2 text-sm">
              {(() => {
                const mainResult = results.find(r => r.url === mainUrl);
                const competitors = results.filter(r => r.url !== mainUrl);
                const avgCompetitorScore = competitors.reduce((acc, c) => acc + c.score, 0) / competitors.length;
                const bestCompetitor = competitors.sort((a, b) => b.score - a.score)[0];

                if (!mainResult) return null;

                return (
                  <>
                    {mainResult.score > avgCompetitorScore ? (
                      <div className="flex items-start gap-2 text-green-700">
                        <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                          Você está <strong>{(mainResult.score - avgCompetitorScore).toFixed(1)} pontos acima</strong> da média dos concorrentes.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-red-700">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                          Você está <strong>{(avgCompetitorScore - mainResult.score).toFixed(1)} pontos abaixo</strong> da média dos concorrentes.
                        </p>
                      </div>
                    )}

                    {bestCompetitor && bestCompetitor.score > mainResult.score && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                        <p>
                          O líder ({bestCompetitor.url}) está <strong>{(bestCompetitor.score - mainResult.score).toFixed(1)} pontos à frente</strong>. 
                          Foco em melhorias pode reduzir esta diferença.
                        </p>
                      </div>
                    )}

                    {mainResult.geoScore < Math.max(...competitors.map(c => c.geoScore)) && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                        <p>
                          <strong>Oportunidade GEO:</strong> Concorrentes têm GEO Score superior. Foque em otimização para IAs.
                        </p>
                      </div>
                    )}

                    {mainResult.seoScore < Math.max(...competitors.map(c => c.seoScore)) && (
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                        <p>
                          <strong>Oportunidade SEO:</strong> Concorrentes têm SEO Score superior. Revise estrutura técnica.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
