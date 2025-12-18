import { LoginCard } from "@/components/LoginCard";
import { ArrowRight } from "lucide-react";
import heroBrainBg from "@/assets/hero-brain-bg.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={heroBrainBg} 
          alt="" 
          className="absolute inset-0 w-full h-[120%] object-cover object-[center_15%] opacity-60"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/30" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">
          {/* Left: Content */}
          <div className="space-y-12 animate-fade-in">
            {/* Minimal badge */}
            <div className="inline-flex items-center gap-3 text-sm text-muted-foreground tracking-widest uppercase">
              <span className="w-8 h-px bg-primary/50" />
              Generative Engine Optimization
            </div>

            {/* Main Headline - Ultra clean */}
            <div className="space-y-8">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.05]">
                Visibilidade em
                <br />
                <span className="text-primary">Motores de IA</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg font-light">
                Primeira plataforma brasileira de GEO e IGO. 
                Monitore como ChatGPT, Gemini, Claude e Perplexity 
                mencionam sua marca.
              </p>
            </div>

            {/* Minimal CTA */}
            <a 
              href="#platform" 
              className="inline-flex items-center gap-3 text-sm font-medium text-primary hover:gap-4 transition-all duration-300 group"
            >
              Conhecer a tecnologia
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right: Login Card */}
          <div className="lg:pl-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  );
};
