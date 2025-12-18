import frameworkIgoBg from "@/assets/framework-igo-bg.png";

const metrics = [
  {
    code: "ICE",
    name: "Index of Cognitive Efficiency",
    description: "Consenso entre LLMs",
    value: "91.5"
  },
  {
    code: "GAP",
    name: "Governance Alignment Precision",
    description: "Alinhamento contextual",
    value: "88.2"
  },
  {
    code: "CPI",
    name: "Cognitive Predictive Index",
    description: "Consistência preditiva",
    value: "Real-time"
  }
];

const pillars = [
  { code: "GEO-01", name: "Base Técnica", modules: "SEO + IA Crawler" },
  { code: "GEO-02", name: "Estrutura Semântica", modules: "Ontologia + Identidade" },
  { code: "GEO-03", name: "Relevância Conversacional", modules: "AEO + E-E-A-T" },
  { code: "GEO-04", name: "Autoridade Cognitiva", modules: "Reputação + Knowledge" },
  { code: "GEO-05", name: "Inteligência Estratégica", modules: "Analytics + Governança" }
];

export const MetricsSection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={frameworkIgoBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 animate-fade-in">
            <p className="text-sm text-muted-foreground tracking-widest uppercase mb-4">
              Framework IGO
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-normal tracking-tight mb-6">
              Métricas Científicas
              <br />
              <span className="text-primary">Proprietárias</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              Primeiro sistema no Brasil e LATAM com governança semântica quantificável
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {metrics.map((metric, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-background border border-border/50 text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="font-mono text-sm text-primary/70 tracking-wider mb-2">
                  {metric.code}
                </div>
                <div className="font-serif text-4xl text-primary mb-2">
                  {metric.value}
                </div>
                <div className="text-sm font-medium mb-1">{metric.name}</div>
                <div className="text-xs text-muted-foreground">{metric.description}</div>
              </div>
            ))}
          </div>

          {/* Framework Pillars - Compact */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl text-center mb-8">Framework de 5 Pilares</h3>
            <div className="grid md:grid-cols-5 gap-4">
              {pillars.map((pillar, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl bg-background border border-border/50 text-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="font-mono text-xs text-primary/70 mb-2">{pillar.code}</div>
                  <div className="text-sm font-medium mb-1">{pillar.name}</div>
                  <div className="text-xs text-muted-foreground">{pillar.modules}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {["Primeiro no Brasil", "Primeiro na LATAM", "Registrado INPI + MCTI"].map((badge, index) => (
              <span 
                key={index}
                className="px-4 py-2 rounded-full text-xs border border-primary/20 text-primary/80"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
