import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Brain, Database, Target, TrendingUp, Activity } from "lucide-react";

export const TechnicalArchitectureSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4">
            <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
            Arquitetura Técnica
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Resumo Técnico da Plataforma
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Solução SaaS baseada em Inteligência Generativa Observacional (IGO) com framework trigeracional 
            e indicadores proprietários para gestão estratégica de presença em IAs generativas
          </p>
        </div>

        <div className="mb-12">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 min-h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.3),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.3),transparent_40%)] animate-pulse" />
            <div className="relative z-10 text-center space-y-6 p-8">
              <div className="flex items-center justify-center gap-6 text-4xl">
                <Database className="w-16 h-16 text-primary animate-bounce" />
                <Brain className="w-16 h-16 text-secondary animate-pulse" />
                <Activity className="w-16 h-16 text-accent animate-bounce" />
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Arquitetura Cloud SaaS
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Infraestrutura distribuída com IA, APIs e analytics em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover-lift transition-all border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Arquitetura Híbrida</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Integra capacidades observacionais, cognitivas e IGO entre múltiplos modelos de IA (multi-LLM), 
              utilizando análise comparativa de respostas em tempo real.
            </p>
          </Card>

          <Card className="p-6 hover-lift transition-all border-l-4 border-l-secondary">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Framework Trigeracional</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Relaciona SEO (indexabilidade técnica), GEO (percepção generativa) e IGO 
              (aprendizado sobre o comportamento de outros modelos).
            </p>
          </Card>

          <Card className="p-6 hover-lift transition-all border-l-4 border-l-accent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Indicadores Proprietários</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transforma dados generativos em métricas estratégicas: GEO Score, Confidence Mapping, 
              Gap GEO/SEO e CPI (Contextual Predictive Index).
            </p>
          </Card>

          <Card className="p-6 hover-lift transition-all border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Operação Modular SaaS</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Núcleo cognitivo distribuído, escalável, com redundância focada em estabilidade, 
              baixo consumo, alta disponibilidade e integração corporativa via API.
            </p>
          </Card>

          <Card className="p-6 hover-lift transition-all border-l-4 border-l-secondary">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Aplicação Estratégica</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Atende projetos piloto em marketing cognitivo, comunicação e governança digital, oferecendo 
              monitoramento 24/7, análises avançadas e insights reputacionais gerados por IA.
            </p>
          </Card>

          <Card className="p-6 hover-lift transition-all border-l-4 border-l-accent bg-gradient-to-br from-accent/5 to-accent/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Maturidade TRL 6</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Plataforma funcional, validada internamente e pronta para pilotos B2B/SaaS. 
              Inaugura a disciplina <strong>IGO (Inteligência Generativa Observacional)</strong>.
            </p>
            <Badge variant="secondary" className="text-xs">
              Validado · Piloto Ready
            </Badge>
          </Card>
        </div>
      </div>
    </section>
  );
};
