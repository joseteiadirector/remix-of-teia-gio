import { Card } from "@/components/ui/card";
import { Cloud, Layers, BarChart3, Server, Target, Award } from "lucide-react";

export const TechnicalArchitectureSection = () => {
  const features = [
    {
      icon: Layers,
      title: "Arquitetura Híbrida",
      description: "Integra capacidades observacionais, cognitivas e IGO entre múltiplos modelos de IA, utilizando análise comparativa em tempo real."
    },
    {
      icon: BarChart3,
      title: "Framework Trigeracional",
      description: "Relaciona SEO (indexabilidade técnica), GEO (percepção generativa) e IGO (aprendizado sobre comportamento de modelos)."
    },
    {
      icon: Target,
      title: "Indicadores Proprietários",
      description: "GEO Score, Confidence Mapping, Gap GEO/SEO e CPI (Contextual Predictive Index) para métricas estratégicas."
    },
    {
      icon: Server,
      title: "Operação Modular SaaS",
      description: "Núcleo cognitivo distribuído e escalável com alta disponibilidade e integração corporativa via API."
    },
    {
      icon: Cloud,
      title: "Aplicação Estratégica",
      description: "Marketing cognitivo, comunicação e governança digital com monitoramento 24/7 e insights por IA."
    },
    {
      icon: Award,
      title: "Maturidade TRL 6",
      description: "Plataforma validada e pronta para pilotos B2B/SaaS. Inaugura a disciplina IGO.",
      highlight: true
    }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Arquitetura Técnica</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Arquitetura Cloud SaaS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Infraestrutura distribuída com IA, APIs e analytics em tempo real
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className={`p-8 border-border/50 hover:border-primary/30 transition-all duration-300 group ${
                  feature.highlight ? 'bg-primary/5 border-primary/20' : 'bg-card/50'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  {feature.highlight && (
                    <div className="pt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        Validado · Piloto Ready
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
