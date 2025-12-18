import { 
  Activity, 
  BarChart3, 
  Bell, 
  FileText, 
  LayoutDashboard, 
  Sparkles 
} from "lucide-react";
import featuresSectionBg from "@/assets/features-section-bg.png";

const features = [
  { icon: Activity, title: "Monitoramento de Menções", description: "Tempo real em 4+ LLMs" },
  { icon: BarChart3, title: "Score GEO", description: "Métrica proprietária 0-100" },
  { icon: Sparkles, title: "Insights com IA", description: "Recomendações automáticas" },
  { icon: Bell, title: "Alertas Inteligentes", description: "Notificações configuráveis" },
  { icon: LayoutDashboard, title: "Dashboard Completo", description: "Painel customizável" },
  { icon: FileText, title: "Relatórios", description: "Exportação automatizada" }
];

export const FeaturesSection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={featuresSectionBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-sm text-muted-foreground tracking-widest uppercase mb-4">
              Funcionalidades
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-normal tracking-tight">
              Recursos da Plataforma
            </h2>
          </div>

          {/* Features Grid - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl border border-border/50 bg-background hover:border-primary/20 transition-all duration-500 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <feature.icon className="w-5 h-5 text-primary mb-4" />
                <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
