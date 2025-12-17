import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Target } from "lucide-react";

export const AlgorithmsSection = () => {
  const algorithms = [
    {
      icon: AlertTriangle,
      name: "Decision Tree",
      title: "Árvore de Decisões Inteligente",
      description: "Classificação automática de severidade de alertas baseada em múltiplas métricas",
      metrics: ["Score", "Trend", "Frequency", "Velocity", "Duration"],
      complexity: "O(log n)",
      accuracy: "~60% redução de falso-positivos",
      badge: "Classificação"
    },
    {
      icon: TrendingUp,
      name: "Linear Regression",
      title: "Regressão Linear Preditiva",
      description: "Previsão de tendências e detecção de anomalias em séries temporais",
      metrics: ["R²", "Correlação", "Intervalo de Confiança", "Anomalias"],
      complexity: "O(n)",
      accuracy: "95% de confiança estatística",
      badge: "Predição"
    },
    {
      icon: Brain,
      name: "Sentiment Analysis",
      title: "Análise de Sentimento Multi-LLM",
      description: "Avaliação do tom e contexto das menções através de múltiplos modelos de IA",
      metrics: ["Positivo", "Neutro", "Negativo", "Contexto"],
      complexity: "Distribuído",
      accuracy: "Consenso entre 4 LLMs",
      badge: "IA Generativa"
    },
    {
      icon: Target,
      name: "GEO Score Calculator",
      title: "Calculadora de Score GEO Proprietária",
      description: "Algoritmo híbrido que combina métricas de visibilidade, relevância e sentimento",
      metrics: ["Visibilidade", "Relevância", "Sentimento", "Posição"],
      complexity: "O(n)",
      accuracy: "Score normalizado 0-100",
      badge: "Métrica Core"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            Algoritmos Proprietários
          </Badge>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Inteligência Algorítmica Avançada
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nossa plataforma utiliza algoritmos especializados para análise, previsão e classificação de dados em tempo real
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {algorithms.map((algo, index) => {
            const Icon = algo.icon;
            return (
              <Card 
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur-sm group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {algo.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {algo.badge}
                      </Badge>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono">
                      {algo.name}
                    </code>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {algo.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-foreground/70 mb-2">Métricas Analisadas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {algo.metrics.map((metric, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Complexidade</p>
                      <code className="text-sm font-mono text-primary">{algo.complexity}</code>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Precisão</p>
                      <p className="text-sm font-medium text-foreground">{algo.accuracy}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Card className="inline-block p-6 bg-primary/5 border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Tecnologia Validada</span> — TRL 6
            </p>
            <p className="text-xs text-muted-foreground">
              Algoritmos testados e validados em ambiente B2B real
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
