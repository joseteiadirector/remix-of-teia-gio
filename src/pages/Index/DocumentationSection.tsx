import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, Brain } from "lucide-react";

export const DocumentationSection = () => {
  return (
    <section id="docs" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4">
            <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
            Documentação
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Como Começar com GEO
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Guia completo para implementar GEO e maximizar sua visibilidade em IAs generativas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Auditoria Inicial</h3>
            <p className="text-muted-foreground mb-6">
              Comece registrando sua marca na plataforma. Realizamos uma auditoria completa 
              para identificar seu estado atual de visibilidade em IAs generativas.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Análise de presença digital atual</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Identificação de gaps de otimização</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Score GEO inicial</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold text-secondary">2</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Implementação</h3>
            <p className="text-muted-foreground mb-6">
              Receba recomendações personalizadas e implemente melhorias seguindo nosso 
              framework de 5 pilares e 20 módulos.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Guias passo a passo para cada módulo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Templates e exemplos práticos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Checklist de implementação</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold text-accent">3</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Monitoramento</h3>
            <p className="text-muted-foreground mb-6">
              Acompanhe em tempo real como IAs estão mencionando sua marca e 
              receba alertas sobre mudanças importantes.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Dashboard com métricas em tempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Alertas configuráveis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Histórico de menções</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-2xl font-bold text-primary">4</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Otimização Contínua</h3>
            <p className="text-muted-foreground mb-6">
              Use insights baseados em IA para refinar continuamente sua estratégia GEO 
              e maximizar resultados.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Recomendações automáticas de IA</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">A/B testing de estratégias</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">Relatórios de performance</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h3 className="text-2xl font-bold mb-4">Precisa de Ajuda?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Nossa equipe está disponível para ajudar você a implementar GEO de forma efetiva. 
              Oferecemos consultoria, treinamento e suporte técnico.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const element = document.getElementById('framework');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center h-10 px-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
                aria-label="Ver framework completo do GEO"
              >
                <Brain className="w-4 h-4 mr-2" aria-hidden="true" />
                Ver Framework Completo
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
