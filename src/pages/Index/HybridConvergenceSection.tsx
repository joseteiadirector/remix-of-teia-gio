import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Database, Activity } from "lucide-react";

export const HybridConvergenceSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4">
            <Brain className="w-4 h-4 mr-2" aria-hidden="true" />
            Convergência Híbrida
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            SEO + GEO + IA: A União Trigeracional
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Nossa plataforma integra três camadas evolutivas da inteligência digital estratégica em uma arquitetura 
            híbrida única, criando sinergia entre indexabilidade tradicional, percepção generativa e 
            inteligência observacional (IGO)
          </p>
        </div>

        <div className="mb-12">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 min-h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.3),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.3),transparent_50%)] animate-pulse" />
            <div className="relative z-10 text-center space-y-4 p-8">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                SEO + GEO + IA
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Três camadas tecnológicas convergindo em uma arquitetura híbrida única
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* SEO Layer */}
          <Card className="p-6 border-t-4 border-t-primary hover-lift transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Camada SEO</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Indexabilidade Técnica:</strong> Performance, Core Web Vitals, sitemap, robots.txt, 
              estrutura de URLs, Schema.org básico
            </p>
            <Badge variant="outline" className="text-xs">
              Base Tradicional
            </Badge>
          </Card>

          {/* GEO Layer */}
          <Card className="p-6 border-t-4 border-t-secondary hover-lift transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Camada GEO</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Percepção Generativa:</strong> Otimização para crawlers de IA (GPTBot, Google-Extended), 
              estrutura semântica avançada, narrativas de expertise, ontologia de marca
            </p>
            <Badge variant="outline" className="text-xs">
              Expansão Generativa
            </Badge>
          </Card>

          {/* IGO Layer */}
          <Card className="p-6 border-t-4 border-t-accent hover-lift transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">Camada IGO</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Aprendizado sobre LLMs:</strong> Análise comparativa multi-modelo (ChatGPT, Gemini, Claude, Perplexity), 
              detecção de padrões, gap analysis, otimização adaptativa
            </p>
            <Badge variant="outline" className="text-xs">
              Inteligência Observacional
            </Badge>
          </Card>
        </div>

        {/* Convergence Explanation */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20">
          <h3 className="text-2xl font-bold mb-6 text-center">Como Funciona a Convergência</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-bold">SEO como Base</h4>
              <p className="text-sm text-muted-foreground">
                Implementamos todos os fundamentos técnicos de SEO (performance, estrutura, indexação) 
                como alicerce obrigatório
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-bold">GEO como Expansão</h4>
              <p className="text-sm text-muted-foreground">
                Sobre a base SEO, adicionamos otimizações específicas para IAs generativas 
                (semântica avançada, narrativas, expertise demonstrável)
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-bold">IGO como Evolução</h4>
              <p className="text-sm text-muted-foreground">
                Uma terceira camada analisa como diferentes LLMs interpretam e recomendam sua marca, 
                permitindo otimização adaptativa
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
