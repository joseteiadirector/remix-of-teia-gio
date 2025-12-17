import FrameworkGrid from "@/components/FrameworkGrid";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, MessageSquare, Brain, Award, Activity } from "lucide-react";

export const FrameworkSection = () => {
  return (
    <>
      {/* Framework Overview */}
      <section id="framework" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              <Database className="w-4 h-4 mr-2" aria-hidden="true" />
              Framework Completo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Framework GEO de 5 Pilares
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Metodologia completa e estruturada para otimização em mecanismos generativos, 
              dividida em 5 pilares estratégicos e 20 módulos práticos
            </p>
          </div>

          <FrameworkGrid />
        </div>
      </section>

      {/* Modules Details */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
              20 Módulos Práticos
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Módulos Detalhados do Framework
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Cada pilar é dividido em 4 módulos práticos com implementação clara e mensurável
            </p>
          </div>

          <div className="space-y-8">
            {/* Pilar 1 Modules */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">GEO-01: Base Técnica (SEO + GEO)</h3>
                  <p className="text-sm text-muted-foreground">Fundação SEO tradicional + extensões GEO para indexação por IAs</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-01.1 - SEO Técnico (Base)</div>
                  <p className="text-sm text-muted-foreground">Performance, Core Web Vitals, sitemap, robots.txt, crawlability tradicional</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-01.2 - IA Crawler Index (Extensão)</div>
                  <p className="text-sm text-muted-foreground">Configuração específica para bots de IA (GPTBot, Google-Extended, ClaudeBot)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-01.3 - Dados Estruturados (SEO + GEO)</div>
                  <p className="text-sm text-muted-foreground">Schema.org básico (SEO) + JSON-LD avançado e markup semântico (GEO)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-01.4 - API de Indexação Semântica</div>
                  <p className="text-sm text-muted-foreground">Endpoints para alimentar knowledge bases de IAs generativas</p>
                </div>
              </div>
            </Card>

            {/* Pilar 2 Modules */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">GEO-02: Estrutura Semântica</h3>
                  <p className="text-sm text-muted-foreground">Linguagem e conceitos para IAs</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-02.1 - Ontologia de Marca</div>
                  <p className="text-sm text-muted-foreground">Definição clara de conceitos, produtos e serviços</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-02.2 - Identidade Verbal</div>
                  <p className="text-sm text-muted-foreground">Tom, voz e vocabulário consistente para IAs</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-02.3 - Mapa Semântico</div>
                  <p className="text-sm text-muted-foreground">Relações entre tópicos e entidades do seu domínio</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-02.4 - Narrativas de Expertise</div>
                  <p className="text-sm text-muted-foreground">Histórias e casos que demonstram autoridade</p>
                </div>
              </div>
            </Card>

            {/* Pilar 3 Modules */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">GEO-03: Relevância Conversacional</h3>
                  <p className="text-sm text-muted-foreground">Alinhamento com comportamento de LLMs</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-03.1 - Conversational Mapping</div>
                  <p className="text-sm text-muted-foreground">Mapeamento de intenções e queries conversacionais</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-03.2 - Alinhamento LLMs</div>
                  <p className="text-sm text-muted-foreground">Otimização para padrões de cada modelo de IA</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-03.3 - AEO (Answer Engine Optimization)</div>
                  <p className="text-sm text-muted-foreground">Estruturação de conteúdo para respostas diretas</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-03.4 - E-E-A-T</div>
                  <p className="text-sm text-muted-foreground">Experience, Expertise, Authoritativeness, Trust</p>
                </div>
              </div>
            </Card>

            {/* Pilar 4 Modules */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">GEO-04: Autoridade Cognitiva</h3>
                  <p className="text-sm text-muted-foreground">Construção de reputação digital</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-04.1 - Reputação & Citações</div>
                  <p className="text-sm text-muted-foreground">Estratégia de backlinks e menções em fontes confiáveis</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-04.2 - Publicações IA-driven</div>
                  <p className="text-sm text-muted-foreground">Conteúdo otimizado para training data de IAs</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-04.3 - Knowledge Graph & APIs</div>
                  <p className="text-sm text-muted-foreground">Presença em grafos de conhecimento e bases de dados</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-04.4 - Feedback Loop</div>
                  <p className="text-sm text-muted-foreground">Monitoramento e correção de desinformação</p>
                </div>
              </div>
            </Card>

            {/* Pilar 5 Modules */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">GEO-05: Inteligência Estratégica</h3>
                  <p className="text-sm text-muted-foreground">Analytics e otimização contínua</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-05.1 - Observabilidade GEO</div>
                  <p className="text-sm text-muted-foreground">Monitoramento de menções em múltiplos LLMs</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-05.2 - IA Analytics</div>
                  <p className="text-sm text-muted-foreground">Métricas de performance e visibilidade</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-05.3 - Aprendizado Adaptativo</div>
                  <p className="text-sm text-muted-foreground">Otimização baseada em resultados reais</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-semibold mb-2">GEO-05.4 - Governança Semântica</div>
                  <p className="text-sm text-muted-foreground">Controle de narrativa e consistência</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};
