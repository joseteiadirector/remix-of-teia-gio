import { Card } from "@/components/ui/card";
import { Brain, GitCompare, Shield, TrendingUp, Zap, Target, Award } from "lucide-react";

export function IGOFrameworkSection() {
  const pillars = [
    { icon: Brain, title: "GEO Engine", description: "Motor de análise semântica contextual entre IAs para inferência e supervisão." },
    { icon: Shield, title: "IGO Framework", description: "Arquitetura de observabilidade onde uma IA observa, corrige e audita outra." },
    { icon: Zap, title: "Semantic Layer", description: "Camada de integração cognitiva que unifica dados métricos e contextuais." }
  ];

  const metrics = [
    { key: "ICE", name: "Index of Cognitive Efficiency", desc: "Consenso entre LLMs", value: "91.5", color: "primary" },
    { key: "GAP", name: "Governance Alignment Precision", desc: "Alinhamento contextual", value: "88.2", color: "secondary" },
    { key: "CPI", name: "Cognitive Predictive Index", desc: "Consistência preditiva", value: "Real-time", color: "accent" },
    { key: "Stability", name: "Estabilidade Cognitiva", desc: "Consistência temporal", value: "98%", color: "emerald" }
  ];

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">Pioneiro LATAM</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Framework IGO
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Inteligência Generativa Observacional — A IA que observa, corrige e audita outras IAs
          </p>
        </div>

        {/* Core Concept */}
        <Card className="p-12 mb-16 bg-card/80 border-border/50">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <GitCompare className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-heading font-semibold text-foreground">Metacognição IA: O Conceito Central</h3>
              <p className="text-muted-foreground leading-relaxed">
                O Framework IGO implementa um sistema onde uma <span className="text-foreground font-medium">IA supervisora</span> (GEO Engine) 
                observa continuamente as respostas de múltiplas LLMs, detecta divergências semânticas, 
                valida coerência contextual e calcula métricas de governança cognitiva.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["IA observando IA", "Convergência cognitiva", "Auditoria automática"].map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <Card key={index} className="p-8 border-border/50 hover:border-primary/30 transition-all">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Metrics */}
        <div className="mb-16">
          <h3 className="text-2xl font-heading font-semibold text-foreground text-center mb-8">
            Métricas Inéditas e Patenteáveis
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index} className="p-6 bg-card/50 border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-heading font-semibold text-foreground">{metric.key}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{metric.name}</p>
                <p className="text-3xl font-display text-primary">{metric.value}</p>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Faixa de confiança: ±5% | Validado: Auditorias 2025
          </p>
        </div>

        {/* Differentiator */}
        <Card className="p-12 bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-border/50 text-center">
          <Award className="w-12 h-12 text-primary mx-auto mb-6" />
          <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">Pioneirismo Internacional</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Nenhum outro sistema registrado no Brasil ou LATAM possui equivalência técnica. 
            Paralelos apenas em iniciativas como OpenAI Evals e Anthropic Observability Lab.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Primeiro no Brasil", "Primeiro na LATAM", "Registrado INPI + MCTI"].map((badge, i) => (
              <span key={i} className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
