import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, AlertTriangle, Target } from "lucide-react";

export const AlgorithmsSection = () => {
  const algorithms = [
    {
      icon: AlertTriangle,
      name: "Decision Tree",
      title: "Árvore de Decisões",
      description: "Classificação automática de severidade de alertas",
      metrics: ["Score", "Trend", "Frequency", "Velocity"],
      complexity: "O(log n)",
      accuracy: "~60% redução falso-positivos"
    },
    {
      icon: TrendingUp,
      name: "Linear Regression",
      title: "Regressão Linear Preditiva",
      description: "Previsão de tendências e detecção de anomalias",
      metrics: ["R²", "Correlação", "Confiança", "Anomalias"],
      complexity: "O(n)",
      accuracy: "95% confiança estatística"
    },
    {
      icon: Brain,
      name: "Sentiment Analysis",
      title: "Análise de Sentimento Multi-LLM",
      description: "Avaliação de tom e contexto das menções",
      metrics: ["Positivo", "Neutro", "Negativo", "Contexto"],
      complexity: "Distribuído",
      accuracy: "Consenso 4 LLMs"
    },
    {
      icon: Target,
      name: "GEO Score Calculator",
      title: "Calculadora de Score GEO",
      description: "Algoritmo híbrido de visibilidade e relevância",
      metrics: ["Visibilidade", "Relevância", "Sentimento", "Posição"],
      complexity: "O(n)",
      accuracy: "Score normalizado 0-100"
    }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Algoritmos Proprietários</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Inteligência Algorítmica
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Algoritmos especializados para análise, previsão e classificação em tempo real
          </p>
        </div>

        {/* Algorithms Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {algorithms.map((algo, index) => {
            const Icon = algo.icon;
            return (
              <Card key={index} className="p-8 border-border/50 hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-foreground">{algo.title}</h3>
                    <code className="text-xs text-muted-foreground font-mono">{algo.name}</code>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">{algo.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {algo.metrics.map((metric, i) => (
                    <span key={i} className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {metric}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground">Complexidade</p>
                    <code className="text-sm font-mono text-primary">{algo.complexity}</code>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Precisão</p>
                    <p className="text-sm font-medium text-foreground">{algo.accuracy}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Tecnologia Validada</span> — TRL 6 · Ambiente B2B real
          </p>
        </div>
      </div>
    </section>
  );
};
