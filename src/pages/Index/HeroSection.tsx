import { LoginCard } from "@/components/LoginCard";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const HeroSection = () => {
  const { t } = useTranslation();
  
  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24" 
      aria-labelledby="hero-heading"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/3 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px]" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left: Content */}
          <div className="space-y-10 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium tracking-wide text-primary">Generative Engine Optimization</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 id="hero-heading" className="font-display text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.1]">
                <span className="text-foreground">Visibilidade Inteligente em</span>
                <br />
                <span className="text-primary">Motores de IA</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl font-light">
                Primeira plataforma brasileira de <span className="text-foreground font-medium">GEO</span> e{" "}
                <span className="text-foreground font-medium">IGO</span>. Análise científica de visibilidade em LLMs, 
                métricas avançadas e monitoramento em tempo real.
              </p>
            </div>

            {/* Features List */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                "Visibilidade em IAs",
                "Monitoramento 24/7",
                "Analytics Avançado"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="w-3 h-3 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="lg:pl-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  );
};
