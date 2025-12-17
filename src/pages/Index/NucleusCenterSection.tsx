import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Network, Zap, Shield, Database, LineChart } from "lucide-react";

export const NucleusCenterSection = () => {
  const capabilities = [
    {
      icon: Network,
      title: "Orquestração Multi-LLM",
      description: "Coordena consultas simultâneas a 4+ modelos de IA (GPT-5, Gemini, Claude, Perplexity)",
      color: "text-blue-500"
    },
    {
      icon: Zap,
      title: "Processamento em Tempo Real",
      description: "Análise instantânea de menções, sentimentos e métricas com latência sub-segundo",
      color: "text-yellow-500"
    },
    {
      icon: Shield,
      title: "Validação de Consenso",
      description: "Sistema de votação ponderada para garantir precisão e eliminar alucinações",
      color: "text-green-500"
    },
    {
      icon: Database,
      title: "Gestão Inteligente de Cache",
      description: "Otimização de custos através de cache inteligente e deduplicação de queries",
      color: "text-purple-500"
    },
    {
      icon: LineChart,
      title: "Motor Preditivo",
      description: "Previsões baseadas em regressão linear e análise de tendências históricas",
      color: "text-orange-500"
    }
  ];

  const metrics = [
    { label: "Modelos Orquestrados", value: "4+ LLMs", badge: "Multi-IA" },
    { label: "Tempo de Resposta", value: "<2s", badge: "Real-time" },
    { label: "Taxa de Consenso", value: ">92%", badge: "Alta Precisão" },
    { label: "Redução de Custo", value: "~60%", badge: "Cache Inteligente" }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background/90 via-primary/5 to-background/95 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary bg-primary/10">
            <Brain className="w-3 h-3 mr-1 inline" />
            IA Mãe do Sistema
          </Badge>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Nucleus Command Center
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            A inteligência central que orquestra toda a plataforma GEO/IGO
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Sistema de IA avançado que coordena análises multi-modelo, valida consenso entre LLMs, 
            otimiza custos e entrega insights em tempo real com precisão excepcional
          </p>
        </div>

        {/* Main Visual Card */}
        <div className="max-w-5xl mx-auto mb-12">
          <Card className="p-8 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/30 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Brain className="w-16 h-16" />
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-3 text-foreground">
                  Como o Nucleus Funciona?
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  O Nucleus é o cérebro da operação — uma IA orquestradora que gerencia todos os aspectos 
                  da coleta, análise e processamento de dados em tempo real
                </p>
              </div>

              {/* Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {capabilities.map((capability, index) => {
                  const Icon = capability.icon;
                  return (
                    <Card 
                      key={index}
                      className="p-4 bg-background/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-background ${capability.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1 text-foreground">
                            {capability.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {capability.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-border/30">
                {metrics.map((metric, index) => (
                  <div key={index} className="text-center">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {metric.badge}
                    </Badge>
                    <p className="text-2xl font-bold text-primary mb-1">
                      {metric.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Architecture Flow */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-lg font-semibold mb-4 text-center text-foreground">
              Fluxo de Processamento do Nucleus
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-2 font-bold">
                  1
                </div>
                <p className="text-sm font-medium text-foreground">Coleta de Queries</p>
                <p className="text-xs text-muted-foreground">Recebe consultas de múltiplas fontes</p>
              </div>
              
              <div className="hidden md:block text-2xl text-muted-foreground">→</div>
              
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center mx-auto mb-2 font-bold">
                  2
                </div>
                <p className="text-sm font-medium text-foreground">Orquestração Multi-LLM</p>
                <p className="text-xs text-muted-foreground">Distribui para 4+ modelos de IA</p>
              </div>
              
              <div className="hidden md:block text-2xl text-muted-foreground">→</div>
              
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-2 font-bold">
                  3
                </div>
                <p className="text-sm font-medium text-foreground">Consenso & Validação</p>
                <p className="text-xs text-muted-foreground">Valida respostas por votação</p>
              </div>
              
              <div className="hidden md:block text-2xl text-muted-foreground">→</div>
              
              <div className="flex-1">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center mx-auto mb-2 font-bold">
                  4
                </div>
                <p className="text-sm font-medium text-foreground">Entrega de Insights</p>
                <p className="text-xs text-muted-foreground">Gera métricas e alertas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <Card className="inline-block p-6 bg-accent/10 border-accent/30">
            <p className="text-sm text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">Tecnologia Proprietária</span> — Nucleus v2.5
            </p>
            <p className="text-xs text-muted-foreground">
              Sistema patenteado de orquestração multi-IA com validação de consenso em tempo real
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
