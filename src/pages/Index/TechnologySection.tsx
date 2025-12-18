import { Brain, Layers, LineChart, Shield } from "lucide-react";
import techSectionBg from "@/assets/tech-section-bg.png";

const capabilities = [
  {
    icon: Brain,
    title: "IA Observando IA",
    description: "Sistema de metacognição que monitora e analisa o comportamento de múltiplas LLMs simultaneamente"
  },
  {
    icon: Layers,
    title: "Framework Trigeracional",
    description: "Convergência de SEO, GEO e IGO em uma arquitetura híbrida única"
  },
  {
    icon: LineChart,
    title: "Métricas Proprietárias",
    description: "ICE, GAP e CPI — indicadores científicos de presença em IAs generativas"
  },
  {
    icon: Shield,
    title: "Detecção de Alucinações",
    description: "Validação de consenso entre LLMs para garantir precisão das informações"
  }
];

const metrics = [
  { value: "4+", label: "LLMs Monitoradas" },
  { value: "<2s", label: "Tempo de Resposta" },
  { value: "92%", label: "Taxa de Consenso" },
  { value: "24/7", label: "Monitoramento" }
];

export const TechnologySection = () => {
  return (
    <section id="platform" className="relative py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={techSectionBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 animate-fade-in">
            <p className="text-sm text-muted-foreground tracking-widest uppercase mb-4">
              Tecnologia Pioneira
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-normal tracking-tight mb-6">
              Inteligência Generativa
              <br />
              <span className="text-primary">Observacional</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              A primeira plataforma que não apenas usa IA, mas observa e analisa 
              o comportamento de múltiplas IAs generativas — criando inteligência sobre inteligência.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {capabilities.map((item, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all duration-500 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-normal mb-2">{item.title}</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-background border border-border/50">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="font-serif text-3xl lg:text-4xl text-primary mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
