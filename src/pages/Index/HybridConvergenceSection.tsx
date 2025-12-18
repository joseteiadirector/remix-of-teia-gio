import { Card } from "@/components/ui/card";
import { Database, Brain, Activity, ArrowRight } from "lucide-react";

export const HybridConvergenceSection = () => {
  const layers = [
    {
      icon: Database,
      title: "Camada SEO",
      subtitle: "Base Tradicional",
      description: "Indexabilidade Técnica: Performance, Core Web Vitals, sitemap, robots.txt, estrutura de URLs, Schema.org básico",
      color: "primary"
    },
    {
      icon: Brain,
      title: "Camada GEO",
      subtitle: "Expansão Generativa",
      description: "Percepção Generativa: Otimização para crawlers de IA, estrutura semântica avançada, narrativas de expertise",
      color: "secondary"
    },
    {
      icon: Activity,
      title: "Camada IGO",
      subtitle: "Inteligência Observacional",
      description: "Aprendizado sobre LLMs: Análise comparativa multi-modelo, detecção de padrões, gap analysis, otimização adaptativa",
      color: "accent"
    }
  ];

  const steps = [
    { num: "01", title: "SEO como Base", description: "Fundamentos técnicos de SEO como alicerce obrigatório" },
    { num: "02", title: "GEO como Expansão", description: "Otimizações específicas para IAs generativas" },
    { num: "03", title: "IGO como Evolução", description: "Análise de como LLMs interpretam sua marca" }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Convergência Híbrida</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            SEO + GEO + IA
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Três camadas tecnológicas convergindo em uma arquitetura híbrida única
          </p>
        </div>

        {/* Three Layers */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            const colorClasses = {
              primary: "bg-primary/10 text-primary border-primary/20 hover:border-primary/40",
              secondary: "bg-secondary/10 text-secondary border-secondary/20 hover:border-secondary/40",
              accent: "bg-accent/10 text-accent border-accent/20 hover:border-accent/40"
            };
            
            return (
              <Card key={index} className={`p-8 border transition-all duration-300 ${colorClasses[layer.color as keyof typeof colorClasses].split(' ').slice(2).join(' ')}`}>
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[layer.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold text-foreground">{layer.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{layer.subtitle}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Convergence Steps */}
        <Card className="p-12 bg-card/50 border-border/50">
          <h3 className="text-2xl font-heading font-semibold text-foreground text-center mb-12">Como Funciona a Convergência</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary font-display text-2xl mb-6">
                  {step.num}
                </div>
                <h4 className="text-lg font-heading font-semibold text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};
