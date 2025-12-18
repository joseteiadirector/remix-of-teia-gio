import { Card } from "@/components/ui/card";
import { CheckCircle2, Brain, ArrowRight } from "lucide-react";

export const DocumentationSection = () => {
  const steps = [
    {
      num: "01",
      title: "Auditoria Inicial",
      description: "Registre sua marca e receba uma auditoria completa de visibilidade em IAs generativas.",
      items: ["Análise de presença digital", "Identificação de gaps", "Score GEO inicial"]
    },
    {
      num: "02",
      title: "Implementação",
      description: "Receba recomendações personalizadas seguindo nosso framework de 5 pilares.",
      items: ["Guias passo a passo", "Templates práticos", "Checklist de implementação"]
    },
    {
      num: "03",
      title: "Monitoramento",
      description: "Acompanhe em tempo real como IAs mencionam sua marca.",
      items: ["Dashboard em tempo real", "Alertas configuráveis", "Histórico de menções"]
    },
    {
      num: "04",
      title: "Otimização Contínua",
      description: "Use insights de IA para refinar continuamente sua estratégia GEO.",
      items: ["Recomendações automáticas", "A/B testing", "Relatórios de performance"]
    }
  ];

  return (
    <section id="docs" className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Documentação</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Como Começar
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Guia completo para implementar GEO e maximizar sua visibilidade em IAs
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {steps.map((step, index) => (
            <Card key={index} className="p-8 border-border/50 hover:border-primary/30 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-display text-primary">{step.num}</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-heading font-semibold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  <ul className="space-y-2">
                    {step.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Help Card */}
        <Card className="p-12 bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-border/50 text-center">
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">Precisa de Ajuda?</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Nossa equipe está disponível para ajudar você a implementar GEO de forma efetiva. 
            Oferecemos consultoria, treinamento e suporte técnico.
          </p>
          <button
            onClick={() => {
              const element = document.getElementById('framework');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium transition-colors"
          >
            <Brain className="w-5 h-5 mr-2" />
            Ver Framework Completo
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Card>
      </div>
    </section>
  );
};
