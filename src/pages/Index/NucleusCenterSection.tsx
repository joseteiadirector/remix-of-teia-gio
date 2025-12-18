import { Card } from "@/components/ui/card";
import { Brain, Network, Zap, Shield, Database, LineChart, ArrowRight } from "lucide-react";

export const NucleusCenterSection = () => {
  const capabilities = [
    { icon: Network, title: "Orquestração Multi-LLM", description: "Coordena consultas a 4+ modelos de IA" },
    { icon: Zap, title: "Processamento Real-time", description: "Análise instantânea com latência sub-segundo" },
    { icon: Shield, title: "Validação de Consenso", description: "Votação ponderada para eliminar alucinações" },
    { icon: Database, title: "Cache Inteligente", description: "Otimização de custos ~60%" },
    { icon: LineChart, title: "Motor Preditivo", description: "Previsões baseadas em regressão linear" }
  ];

  const metrics = [
    { value: "4+ LLMs", label: "Modelos Orquestrados" },
    { value: "<2s", label: "Tempo de Resposta" },
    { value: ">92%", label: "Taxa de Consenso" },
    { value: "~60%", label: "Redução de Custo" }
  ];

  const steps = ["Coleta de Queries", "Orquestração Multi-LLM", "Consenso & Validação", "Entrega de Insights"];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">IA Central do Sistema</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Nucleus Command Center
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            A inteligência central que orquestra toda a plataforma GEO/IGO com precisão excepcional
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-12 mb-12 bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-border/50">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary mb-6 shadow-lg shadow-primary/20">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-foreground mb-3">Como o Nucleus Funciona?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma IA orquestradora que gerencia coleta, análise e processamento de dados em tempo real
            </p>
          </div>

          {/* Capabilities */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <div key={index} className="p-4 rounded-xl bg-background/60 border border-border/50 text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-foreground mb-1">{cap.title}</h4>
                  <p className="text-xs text-muted-foreground">{cap.description}</p>
                </div>
              );
            })}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-border/30">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-display text-primary mb-1">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Flow */}
        <Card className="p-8 bg-muted/30 border-border/50">
          <h3 className="text-lg font-heading font-semibold text-foreground text-center mb-8">Fluxo de Processamento</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-foreground">{step}</span>
                </div>
                {index < 3 && (
                  <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Tecnologia Proprietária</span> — Nucleus v2.5
          </p>
        </div>
      </div>
    </section>
  );
};
