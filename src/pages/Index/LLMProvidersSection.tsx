import { Card } from "@/components/ui/card";
import { MessageSquare, Bot, Sparkles, Zap } from "lucide-react";

export const LLMProvidersSection = () => {
  const providers = [
    { name: "ChatGPT", model: "OpenAI GPT-5", color: "emerald" },
    { name: "Google Gemini", model: "Gemini 2.5 Flash", color: "blue" },
    { name: "Claude", model: "Anthropic Claude", color: "orange" },
    { name: "Perplexity", model: "Perplexity AI", color: "cyan" }
  ];

  const features = [
    { title: "Análise Comparativa", description: "Compare como cada LLM menciona e recomenda sua marca", icon: MessageSquare },
    { title: "Detecção de Padrões", description: "Identifique tendências e comportamentos em diferentes modelos", icon: Sparkles },
    { title: "Otimização Adaptativa", description: "Ajuste sua estratégia baseado em dados reais de cada LLM", icon: Zap }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">LLMs Monitoradas</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Monitoramento Multi-LLM
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Acompanhamos sua marca nas principais IAs generativas do mercado
          </p>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {providers.map((provider, index) => (
            <Card key={index} className="p-8 text-center border-border/50 hover:border-primary/30 transition-all group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Bot className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-1">{provider.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{provider.model}</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Monitorado 24/7
              </span>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 bg-muted/30 border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
