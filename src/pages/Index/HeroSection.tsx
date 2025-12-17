import { LoginCard } from "@/components/LoginCard";
import { Zap, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const HeroSection = () => {
  const { t } = useTranslation();
  
  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20" 
      aria-labelledby="hero-heading"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/30 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/3 right-1/3 w-[700px] h-[700px] bg-secondary/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-accent/25 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* Left: Content */}
          <div className="space-y-8 lg:pt-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:shadow-md transition-all hover-lift">
              <Zap className="w-4 h-4 text-primary animate-pulse" aria-hidden="true" />
              <span className="text-sm font-medium">Generative Engine Optimization</span>
            </div>

            <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight animate-slide-up">
              Visibilidade Inteligente em{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                Motores de IA
              </span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Primeira plataforma brasileira de <strong>GEO</strong> (Generative Engine Optimization) e <strong>IGO</strong> (Intelligence Governance Optimization). 
              Análise científica de visibilidade em LLMs, métricas avançadas (ICE, GAP, CPI), detecção de alucinações e monitoramento em tempo real.
            </p>

            <div className="flex flex-wrap gap-4 pt-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Visibilidade em IAs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Monitoramento 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Analytics Avançado</span>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="lg:sticky lg:top-24 animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  );
};
