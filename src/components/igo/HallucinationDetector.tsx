import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HallucinationScore {
  llm: string;
  hallucinationRisk: number;
  divergenceScore: number;
  factualInconsistencies: string[];
  consensusAlignment: number;
}

interface HallucinationDetectorProps {
  scores: HallucinationScore[];
  critical: HallucinationScore[];
  consensusAnalysis: Record<string, number>;
}

export default function HallucinationDetector({ scores, critical, consensusAnalysis }: HallucinationDetectorProps) {
  const getRiskColor = (risk: number) => {
    if (risk < 30) return "text-green-600";
    if (risk < 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBadge = (risk: number) => {
    if (risk < 30) return { label: "Baixo Risco", variant: "default" as const };
    if (risk < 70) return { label: "Risco Moderado", variant: "secondary" as const };
    return { label: "Risco Alto", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Alertas Críticos */}
      {critical.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{critical.length} alucinação(ões) crítica(s) detectada(s)</strong>
            {critical.map(c => ` - ${c.llm}`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Score Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Alucinações - Meta-IA</CardTitle>
          <CardDescription>
            Detecção baseada em divergência multi-LLM, consenso e consistência factual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {scores.map((score) => {
              const badge = getRiskBadge(score.hallucinationRisk);
              return (
                <Card key={score.llm} className="border-l-4" style={{
                  borderLeftColor: score.hallucinationRisk > 70 ? 'hsl(var(--destructive))' : 
                                   score.hallucinationRisk > 30 ? 'hsl(var(--warning))' : 
                                   'hsl(var(--success))'
                }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{score.llm}</CardTitle>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <span className={`text-2xl font-bold ${getRiskColor(score.hallucinationRisk)}`}>
                        {Math.round(score.hallucinationRisk)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bars */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Risco de Alucinação</span>
                          <span className="font-medium">{Math.round(score.hallucinationRisk)}%</span>
                        </div>
                        <Progress value={score.hallucinationRisk} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Divergência</span>
                          <span className="font-medium">{Math.round(score.divergenceScore)}%</span>
                        </div>
                        <Progress value={score.divergenceScore} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Alinhamento de Consenso</span>
                          <span className="font-medium">{Math.round(score.consensusAlignment)}%</span>
                        </div>
                        <Progress value={score.consensusAlignment} className="h-2" />
                      </div>
                    </div>

                    {/* Inconsistências */}
                    {score.factualInconsistencies.length > 0 && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium">Inconsistências Detectadas:</span>
                        </div>
                        <ul className="text-sm space-y-1 ml-6">
                          {score.factualInconsistencies.map((inc, idx) => (
                            <li key={idx} className="text-muted-foreground">• {inc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {score.factualInconsistencies.length === 0 && score.hallucinationRisk < 30 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Resposta verificada e consistente com outros LLMs</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Consenso Multi-LLM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Matriz de Consenso Multi-LLM</CardTitle>
          <CardDescription>
            Percentual de alinhamento de cada LLM com o consenso geral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(consensusAnalysis).map(([llm, consensus]) => (
              <div key={llm} className="flex items-center justify-between">
                <span className="font-medium">{llm}</span>
                <div className="flex items-center gap-3 flex-1 max-w-md ml-4">
                  <Progress value={consensus} className="h-2" />
                  <span className="text-sm font-medium min-w-[3rem] text-right">
                    {Math.round(consensus)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
