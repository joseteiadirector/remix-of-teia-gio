import { Card } from "@/components/ui/card";
import { 
  Target, 
  TrendingUp, 
  Brain, 
  Activity, 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Code2
} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    { icon: Target, title: "Monitoramento de Menções", description: "Acompanhe em tempo real quando e como sua marca é mencionada por IAs" },
    { icon: TrendingUp, title: "Score GEO", description: "Métrica proprietária que avalia sua visibilidade em motores generativos" },
    { icon: Brain, title: "Insights com IA", description: "Recomendações automáticas baseadas em análise de comportamento de LLMs" },
    { icon: Activity, title: "Alertas Inteligentes", description: "Notificações sobre mudanças significativas na visibilidade" },
    { icon: LayoutDashboard, title: "Dashboard Completo", description: "Todas as métricas em um painel intuitivo e customizável" },
    { icon: MessageSquare, title: "Análise Competitiva", description: "Compare seu desempenho GEO com concorrentes" },
    { icon: FileText, title: "Relatórios Automatizados", description: "Relatórios semanais ou mensais com métricas e insights" },
    { icon: Code2, title: "API Completa", description: "Integre dados GEO em suas ferramentas existentes" }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Recursos da Plataforma</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Funcionalidades
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Tudo que você precisa para dominar sua presença em IAs generativas
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 border-border/50 hover:border-primary/30 transition-all group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
