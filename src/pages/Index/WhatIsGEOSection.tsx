import { Card } from "@/components/ui/card";
import { Brain, TrendingUp, Target, Sparkles } from "lucide-react";

export const WhatIsGEOSection = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary">O que é GEO?</p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground">
            Inteligência Generativa
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            GEO (Generative Engine Optimization) otimiza como sua marca é mencionada por LLMs. 
            A Teia GEO implementa o framework IGO — "IA observando IA" — com métricas científicas proprietárias.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Visual */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10 rounded-3xl blur-2xl" />
              
              {/* Main card */}
              <Card className="relative h-full flex flex-col items-center justify-center p-12 bg-card/80 backdrop-blur-sm border-border/50">
                <Brain className="w-24 h-24 text-primary mb-8 opacity-80" />
                <h3 className="font-display text-3xl text-foreground mb-4">GEO + SEO + IA</h3>
                <p className="text-muted-foreground text-center font-light">
                  Observational Generative Intelligence (IGO)
                </p>
              </Card>
            </div>
          </div>

          {/* Right: Content Cards */}
          <div className="space-y-6">
            <Card className="p-8 border-border/50 hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-3">Por que Monitorar LLMs?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Bilhões de pessoas usam ChatGPT, Claude, Gemini e Perplexity para descobrir produtos e tomar decisões. 
                    A Teia GEO monitora <span className="text-foreground">como e quando sua marca é mencionada</span>, 
                    detecta alucinações e analisa a consistência entre LLMs.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border/50 hover:border-secondary/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                  <Target className="w-6 h-6 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-3">Métricas Científicas Proprietárias</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Métricas avançadas como <span className="text-foreground font-medium">ICE</span> (Índice de Consistência Estratégica), 
                    <span className="text-foreground font-medium"> GAP</span> (Grau de Alinhamento Perceptivo) e 
                    <span className="text-foreground font-medium"> CPI</span> (Coeficiente de Presença Inteligente), 
                    além do framework IGO para governança algorítmica.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
