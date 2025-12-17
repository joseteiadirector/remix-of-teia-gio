import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Target } from "lucide-react";

export const WhatIsGEOSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4">
            <Brain className="w-4 h-4 mr-2" aria-hidden="true" />
            O que é GEO?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Otimização e Observabilidade para IAs Generativas
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            <strong>GEO (Generative Engine Optimization)</strong> é o processo de otimizar como sua marca é mencionada 
            e recomendada por LLMs como ChatGPT, Claude, Gemini e Perplexity. A Teia GEO vai além: implementa o framework 
            <strong> IGO (Intelligence Governance Optimization)</strong> — "IA observando IA" — com métricas científicas proprietárias 
            (ICE, GAP, CPI), detecção de alucinações e análise comparativa de múltiplas LLMs em tempo real.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-gradient-to-br from-primary/30 via-secondary/30 to-accent/30 min-h-[400px] flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.4),transparent_70%)] animate-pulse" />
              <div className="relative z-10 text-center space-y-4 p-8">
                <Brain className="w-24 h-24 mx-auto text-primary animate-pulse" />
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Inteligência Generativa
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                GEO + SEO + IA
              </h3>
              <p className="text-lg text-muted-foreground font-medium">
                Observational Generative Intelligence (IGO)
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-l-4 border-l-primary">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
                Por que Monitorar LLMs?
              </h3>
              <p className="text-muted-foreground">
                Bilhões de pessoas usam ChatGPT, Claude, Gemini e Perplexity para descobrir produtos, 
                serviços e tomar decisões. A Teia GEO monitora <strong>como e quando sua marca é mencionada</strong> 
                nessas respostas, detecta alucinações (informações incorretas) e analisa a consistência 
                das menções entre diferentes LLMs.
              </p>
            </Card>

            <Card className="p-6 border-l-4 border-l-secondary">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" aria-hidden="true" />
                Métricas Científicas Proprietárias
              </h3>
              <p className="text-muted-foreground">
                A plataforma calcula métricas avançadas como <strong>ICE</strong> (Índice de Consistência Estratégica), 
                <strong> GAP</strong> (Grau de Alinhamento Perceptivo) e <strong>CPI</strong> (Coeficiente de Presença Inteligente). 
                Além disso, implementa o framework <strong>IGO</strong> para governança algorítmica e observabilidade de 
                inteligências artificiais.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
