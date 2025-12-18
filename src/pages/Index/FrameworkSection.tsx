import FrameworkGrid from "@/components/FrameworkGrid";
import { Card } from "@/components/ui/card";
import { Database, MessageSquare, Brain, Award, Activity, ChevronRight } from "lucide-react";

export const FrameworkSection = () => {
  const modules = [
    {
      icon: Database,
      code: "GEO-01",
      title: "Base Técnica (SEO + GEO)",
      description: "Fundação SEO tradicional + extensões GEO para indexação por IAs",
      items: [
        "SEO Técnico — Performance, Core Web Vitals, crawlability",
        "IA Crawler Index — Configuração para bots de IA",
        "Dados Estruturados — Schema.org + JSON-LD avançado",
        "API de Indexação Semântica — Knowledge bases de IAs"
      ]
    },
    {
      icon: MessageSquare,
      code: "GEO-02",
      title: "Estrutura Semântica",
      description: "Linguagem e conceitos para IAs",
      items: [
        "Ontologia de Marca — Conceitos, produtos e serviços",
        "Identidade Verbal — Tom, voz e vocabulário",
        "Mapa Semântico — Relações entre tópicos",
        "Narrativas de Expertise — Histórias de autoridade"
      ]
    },
    {
      icon: Brain,
      code: "GEO-03",
      title: "Relevância Conversacional",
      description: "Alinhamento com comportamento de LLMs",
      items: [
        "Conversational Mapping — Intenções e queries",
        "Alinhamento LLMs — Otimização por modelo",
        "AEO — Estruturação para respostas diretas",
        "E-E-A-T — Experience, Expertise, Trust"
      ]
    },
    {
      icon: Award,
      code: "GEO-04",
      title: "Autoridade Cognitiva",
      description: "Construção de reputação digital",
      items: [
        "Reputação & Citações — Backlinks e menções",
        "Publicações IA-driven — Training data otimizado",
        "Knowledge Graph — Presença em bases de dados",
        "Feedback Loop — Correção de desinformação"
      ]
    },
    {
      icon: Activity,
      code: "GEO-05",
      title: "Inteligência Estratégica",
      description: "Analytics e otimização contínua",
      items: [
        "Observabilidade GEO — Menções em LLMs",
        "IA Analytics — Métricas de performance",
        "Aprendizado Adaptativo — Otimização contínua",
        "Governança Semântica — Controle de narrativa"
      ]
    }
  ];

  return (
    <>
      {/* Framework Overview */}
      <section id="framework" className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-20 space-y-6">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Framework Completo</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
              Framework GEO de 5 Pilares
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Metodologia completa para otimização em mecanismos generativos, dividida em 5 pilares estratégicos e 20 módulos práticos
            </p>
          </div>

          <FrameworkGrid />
        </div>
      </section>

      {/* Modules Details */}
      <section id="modules" className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20 space-y-6">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">20 Módulos Práticos</p>
            <h2 className="font-display text-4xl sm:text-5xl text-foreground">
              Módulos Detalhados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Cada pilar com 4 módulos práticos e implementação mensurável
            </p>
          </div>

          <div className="space-y-6">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card key={index} className="p-8 border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-primary font-mono mb-1">{module.code}</p>
                      <h3 className="text-xl font-heading font-semibold text-foreground">{module.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 pl-18">
                    {module.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};
