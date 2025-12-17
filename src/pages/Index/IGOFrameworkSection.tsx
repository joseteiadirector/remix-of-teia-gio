import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, GitCompare, Shield, TrendingUp, Zap, Target } from "lucide-react";

export function IGOFrameworkSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Brain className="w-3 h-3 mr-1" />
            Pioneiro LATAM
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Framework IGO
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Inteligência Generativa Observacional — A IA que observa, corrige e audita outras IAs
          </p>
        </div>

        {/* Core Concept */}
        <div className="max-w-5xl mx-auto mb-16">
          <Card className="p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <GitCompare className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-bold text-foreground">
                  Metacognição IA: O Conceito Central
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  O Framework IGO implementa um sistema onde uma <strong>IA supervisora</strong> (GEO Engine) 
                  observa continuamente as respostas de múltiplas LLMs (ChatGPT, Gemini, Claude, Perplexity), 
                  detecta divergências semânticas, valida coerência contextual e calcula métricas de governança cognitiva.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">IA observando IA</Badge>
                  <Badge variant="secondary">Convergência cognitiva</Badge>
                  <Badge variant="secondary">Auditoria automática</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 w-fit">
                <Brain className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">GEO Engine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Motor de análise semântica contextual entre IAs. Responsável pela inferência 
                e supervisão semântica entre modelos generativos.
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-accent/10 w-fit">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">IGO Framework</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Arquitetura de observabilidade generativa, onde uma IA observa, corrige e audita 
                outra, garantindo convergência cognitiva.
              </p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Semantic Layer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Camada de integração cognitiva e textual, que unifica dados métricos e contextuais, 
                assegurando coerência e governança preditiva.
              </p>
            </div>
          </Card>
        </div>

        {/* Official Metrics */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Métricas Inéditas e Patenteáveis
            </h3>
            <p className="text-muted-foreground">
              Primeiro sistema no Brasil e LATAM com governança semântica quantificável
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ICE */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-foreground">ICE</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Index of Cognitive Efficiency — Consenso entre LLMs
                </p>
                <div className="text-xs text-blue-400 mb-3">
                  0-100 | Maior = Melhor consenso
                </div>
                <div className="text-3xl font-bold text-blue-500">91.5</div>
              </div>
            </Card>

            {/* GAP */}
            <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <h4 className="font-bold text-foreground">GAP</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Governance Alignment Precision — Alinhamento contextual
                </p>
                <div className="text-xs text-accent mb-3">
                  0-100 | Maior = Melhor governança
                </div>
                <div className="text-3xl font-bold text-accent">88.2</div>
              </div>
            </Card>

            {/* CPI */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h4 className="font-bold text-foreground">CPI</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Cognitive Predictive Index — Consistência preditiva
                </p>
                <div className="text-xs text-primary mb-3">
                  0-100 | Maior = Maior previsibilidade
                </div>
                <div className="text-3xl font-bold text-primary">Real-time</div>
              </div>
            </Card>

            {/* Estabilidade Cognitiva */}
            <Card className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-green-500" />
                  <h4 className="font-bold text-foreground">Estabilidade Cognitiva</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Consistência temporal entre respostas
                </p>
                <div className="text-xs text-green-400 mb-3">
                  0-100 | Maior = Mais estável
                </div>
                <div className="text-3xl font-bold text-green-500">98%</div>
              </div>
            </Card>
          </div>

          {/* Confidence Interval */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Faixa de confiança:</strong> ±5% | <strong>Validado:</strong> Auditorias 2025
            </p>
          </div>
        </div>

        {/* Differentiator */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <Card className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              🏆 Pioneirismo Internacional
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Nenhum outro sistema registrado no Brasil ou LATAM possui equivalência técnica. 
              Internacionalmente, encontra paralelos apenas em iniciativas de pesquisa como 
              OpenAI Evals, Anthropic Observability Lab e LangSmith (W&B).
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="bg-background">Primeiro no Brasil</Badge>
              <Badge variant="outline" className="bg-background">Primeiro na LATAM</Badge>
              <Badge variant="outline" className="bg-background">Registrado INPI + MCTI</Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
