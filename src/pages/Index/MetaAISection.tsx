import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Brain, Eye, TrendingUp, Sparkles } from "lucide-react";

export const MetaAISection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4 border-primary/50 bg-primary/10">
            <Sparkles className="w-4 h-4 mr-2 text-primary" aria-hidden="true" />
            Tecnologia Pioneira
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            IA de Segunda Ordem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A primeira plataforma que não apenas <strong>usa</strong> IA, mas <strong>observa e analisa</strong> o 
            comportamento de múltiplas IAs generativas — criando inteligência sobre inteligência
          </p>
        </div>

        {/* Diagrama Visual */}
        <div className="mb-16">
          <Card className="p-8 bg-card/80 backdrop-blur-sm border-2 border-primary/20">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Camada 1: IA Tradicional */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-border">
                  <Brain className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">Camada 1</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>IA Tradicional</strong>
                  <br />
                  Ferramentas que usam LLMs para tarefas específicas
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>

              {/* Camada 2: LLMs Observadas */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary/20 flex items-center justify-center border-2 border-secondary">
                  <Brain className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="font-bold text-lg">Camada 2</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>LLMs Observadas</strong>
                  <br />
                  ChatGPT, Gemini, Claude, Perplexity
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center md:col-start-2">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>

              {/* Camada 3: Meta-IA */}
              <div className="text-center space-y-4 md:col-start-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-2 border-primary shadow-lg shadow-primary/50 animate-pulse">
                  <Eye className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg text-primary">Camada 3 (Nossa)</h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-primary">Meta-IA (IGO)</strong>
                  <br />
                  Analisa comportamento e padrões das LLMs
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Por que é pioneiro */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-xl transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Observação Multi-LLM</h3>
                <p className="text-muted-foreground">
                  Monitora e compara simultaneamente como 4 LLMs diferentes (ChatGPT, Gemini, Claude, Perplexity) 
                  percebem e recomendam marcas — algo inédito no mercado
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-xl transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Inteligência IGO</h3>
                <p className="text-muted-foreground">
                  Não apenas coleta dados — cria <strong>inteligência sobre inteligência</strong>, 
                  identificando padrões, gaps e oportunidades no comportamento generativo
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 hover:shadow-xl transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Análise Comparativa</h3>
                <p className="text-muted-foreground">
                  Detecta como cada modelo de IA interpreta sua marca de forma diferente, 
                  permitindo otimização específica para cada LLM
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 hover:shadow-xl transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Disciplina IGO</h3>
                <p className="text-muted-foreground">
                  Inaugura uma nova categoria: <strong>Inteligência Generativa Observacional</strong> — 
                  a ciência de medir, analisar e otimizar presença em IAs generativas
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Destaque Final */}
        <div className="mt-12 text-center">
          <Card className="inline-block p-6 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border-2 border-primary/30">
            <p className="text-lg font-medium">
              <Sparkles className="w-5 h-5 inline-block mr-2 text-primary" />
              Enquanto outras plataformas <strong>usam</strong> IA, a Teia GEO <strong>estuda</strong> IA
              <Sparkles className="w-5 h-5 inline-block ml-2 text-secondary" />
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
