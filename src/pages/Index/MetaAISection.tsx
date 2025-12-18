import { Card } from "@/components/ui/card";
import { Brain, Eye, TrendingUp, Sparkles, Layers } from "lucide-react";

export const MetaAISection = () => {
  const features = [
    {
      icon: Eye,
      title: "Observação Multi-LLM",
      description: "Monitora e compara simultaneamente como 4 LLMs diferentes percebem e recomendam marcas"
    },
    {
      icon: Brain,
      title: "Inteligência IGO",
      description: "Cria inteligência sobre inteligência, identificando padrões, gaps e oportunidades"
    },
    {
      icon: TrendingUp,
      title: "Análise Comparativa",
      description: "Detecta como cada modelo de IA interpreta sua marca de forma diferente"
    },
    {
      icon: Sparkles,
      title: "Disciplina IGO",
      description: "Inaugura a Inteligência Generativa Observacional — a ciência de otimizar presença em IAs"
    }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Tecnologia Pioneira</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            IA de Segunda Ordem
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            A primeira plataforma que não apenas <span className="text-foreground">usa</span> IA, mas{" "}
            <span className="text-foreground">observa e analisa</span> o comportamento de múltiplas IAs generativas
          </p>
        </div>

        {/* Layers Diagram */}
        <Card className="p-12 mb-16 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                <Brain className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Camada 1</p>
                <h3 className="font-heading font-semibold text-foreground">IA Tradicional</h3>
                <p className="text-xs text-muted-foreground mt-2">Ferramentas que usam LLMs para tarefas específicas</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <Layers className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Camada 2</p>
                <h3 className="font-heading font-semibold text-foreground">LLMs Observadas</h3>
                <p className="text-xs text-muted-foreground mt-2">ChatGPT, Gemini, Claude, Perplexity</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Eye className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary mb-1">Camada 3 (Nossa)</p>
                <h3 className="font-heading font-semibold text-primary">Meta-IA (IGO)</h3>
                <p className="text-xs text-muted-foreground mt-2">Analisa comportamento e padrões das LLMs</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-8 border-border/50 hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground italic">
            "Enquanto outras plataformas <span className="text-foreground">usam</span> IA, a Teia GEO <span className="text-primary font-medium">estuda</span> IA"
          </p>
        </div>
      </div>
    </section>
  );
};
