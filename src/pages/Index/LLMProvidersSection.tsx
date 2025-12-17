import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";

export const LLMProvidersSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="mb-4">
            <Brain className="w-4 h-4 mr-2" aria-hidden="true" />
            LLMs Monitoradas
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Monitoramento Multi-LLM em Tempo Real
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Acompanhamos sua marca nas principais IAs generativas do mercado com análise comparativa e insights precisos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* ChatGPT */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.2819 9.8211C23.1056 8.45852 23.0932 6.74615 22.2489 5.39372C21.4046 4.04129 19.8703 3.24949 18.2426 3.30697C17.6733 2.00501 16.5316 1.04935 15.1643 0.733701C13.797 0.418052 12.3589 0.775091 11.2988 1.69067C10.2387 0.775091 8.80058 0.418052 7.43325 0.733701C6.06592 1.04935 4.92425 2.00501 4.35492 3.30697C2.72725 3.24949 1.19292 4.04129 0.348625 5.39372C-0.495667 6.74615 -0.508 8.45852 0.315667 9.8211C-0.508 11.1837 -0.495667 12.8961 0.348625 14.2485C1.19292 15.6009 2.72725 16.3927 4.35492 16.3352C4.92425 17.6372 6.06592 18.5929 7.43325 18.9085C8.80058 19.2242 10.2387 18.8671 11.2988 17.9515C12.3589 18.8671 13.797 19.2242 15.1643 18.9085C16.5316 18.5929 17.6733 17.6372 18.2426 16.3352C19.8703 16.3927 21.4046 15.6009 22.2489 14.2485C23.0932 12.8961 23.1056 11.1837 22.2819 9.8211Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">ChatGPT</h3>
            <p className="text-sm text-muted-foreground mb-4">OpenAI GPT-5</p>
            <Badge variant="secondary" className="text-xs">Monitorado 24/7</Badge>
          </Card>

          {/* Google Gemini */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4285F4"/>
                <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#EA4335"/>
                <path d="M2 12L12 17L22 12" stroke="#FBBC04" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Google Gemini</h3>
            <p className="text-sm text-muted-foreground mb-4">Gemini 2.5 Flash</p>
            <Badge variant="secondary" className="text-xs">Monitorado 24/7</Badge>
          </Card>

          {/* Claude */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/>
                <path d="M8 8H16M8 12H16M8 16H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Claude</h3>
            <p className="text-sm text-muted-foreground mb-4">Anthropic Claude</p>
            <Badge variant="secondary" className="text-xs">Monitorado 24/7</Badge>
          </Card>

          {/* Perplexity */}
          <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12 text-cyan-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" fill="currentColor"/>
                <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Perplexity</h3>
            <p className="text-sm text-muted-foreground mb-4">Perplexity AI</p>
            <Badge variant="secondary" className="text-xs">Monitorado 24/7</Badge>
          </Card>
        </div>

        {/* Recursos de Análise */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h4 className="font-bold mb-2 text-primary">Análise Comparativa</h4>
            <p className="text-sm text-muted-foreground">
              Compare como cada LLM menciona e recomenda sua marca
            </p>
          </Card>
          
          <Card className="p-6 bg-secondary/5 border-secondary/20">
            <h4 className="font-bold mb-2 text-secondary">Detecção de Padrões</h4>
            <p className="text-sm text-muted-foreground">
              Identifique tendências e comportamentos em diferentes modelos
            </p>
          </Card>
          
          <Card className="p-6 bg-accent/5 border-accent/20">
            <h4 className="font-bold mb-2 text-accent">Otimização Adaptativa</h4>
            <p className="text-sm text-muted-foreground">
              Ajuste sua estratégia baseado em dados reais de cada LLM
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
