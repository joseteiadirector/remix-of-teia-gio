import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Target, 
  TrendingUp, 
  Brain, 
  Activity, 
  MessageSquare, 
  Award, 
  Shield 
} from "lucide-react";

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4">
            <Database className="w-4 h-4 mr-2" aria-hidden="true" />
            Recursos da Plataforma
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            O que você consegue com nossa plataforma
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Monitoramento de Menções</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhe em tempo real quando e como sua marca é mencionada por ChatGPT, Gemini, Claude, Perplexity e outras IAs
                </p>
                <div className="flex gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50" title="ChatGPT">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.2819 9.8211C23.1056 8.45852 23.0932 6.74615 22.2489 5.39372C21.4046 4.04129 19.8703 3.24949 18.2426 3.30697C17.6733 2.00501 16.5316 1.04935 15.1643 0.733701C13.797 0.418052 12.3589 0.775091 11.2988 1.69067C10.2387 0.775091 8.80058 0.418052 7.43325 0.733701C6.06592 1.04935 4.92425 2.00501 4.35492 3.30697C2.72725 3.24949 1.19292 4.04129 0.348625 5.39372C-0.495667 6.74615 -0.508 8.45852 0.315667 9.8211C-0.508 11.1837 -0.495667 12.8961 0.348625 14.2485C1.19292 15.6009 2.72725 16.3927 4.35492 16.3352C4.92425 17.6372 6.06592 18.5929 7.43325 18.9085C8.80058 19.2242 10.2387 18.8671 11.2988 17.9515C12.3589 18.8671 13.797 19.2242 15.1643 18.9085C16.5316 18.5929 17.6733 17.6372 18.2426 16.3352C19.8703 16.3927 21.4046 15.6009 22.2489 14.2485C23.0932 12.8961 23.1056 11.1837 22.2819 9.8211Z" fill="currentColor" className="text-emerald-500"/>
                    </svg>
                    <span className="text-xs font-medium">ChatGPT</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50" title="Google Gemini">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-blue-500"/>
                      <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="currentColor" className="text-red-500"/>
                    </svg>
                    <span className="text-xs font-medium">Gemini</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50" title="Claude AI">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" className="text-orange-500"/>
                    </svg>
                    <span className="text-xs font-medium">Claude</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/50" title="Perplexity AI">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="9" fill="currentColor" className="text-cyan-500"/>
                      <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs font-medium">Perplexity</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Score GEO</h3>
                <p className="text-sm text-muted-foreground">
                  Métrica proprietária que avalia sua visibilidade e relevância em motores generativos
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Insights com IA</h3>
                <p className="text-sm text-muted-foreground">
                  Recomendações automáticas de otimização baseadas em análise de comportamento de LLMs
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Alertas Inteligentes</h3>
                <p className="text-sm text-muted-foreground">
                  Notificações quando há mudanças significativas na sua visibilidade ou novas menções
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Dashboard Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize todas as métricas importantes em um painel intuitivo e customizável
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Análise Competitiva</h3>
                <p className="text-sm text-muted-foreground">
                  Compare seu desempenho GEO com concorrentes e identifique oportunidades
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Relatórios Automatizados</h3>
                <p className="text-sm text-muted-foreground">
                  Receba relatórios semanais ou mensais com todas as métricas e insights importantes
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold mb-1">API Completa</h3>
                <p className="text-sm text-muted-foreground">
                  Integre dados GEO em suas ferramentas e workflows existentes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
