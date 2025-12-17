import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { generateBlurDataURL } from "@/utils/imageOptimization";
import heroImage from "@/assets/geo-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Otimização para Mecanismos Generativos
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Framework{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                GEO Completo
              </span>
              <br />
              para a Era da IA
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Sistema integrado de 5 pilares para otimizar sua presença digital em mecanismos de busca generativos e plataformas de IA.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
              <a href="/auth">
                <Button size="lg" className="group shadow-lg hover:shadow-xl transition-all">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="#framework">
                <Button size="lg" variant="outline" className="shadow-sm hover:shadow-md transition-all">
                  Ver Framework
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Pilares</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">20</div>
                <div className="text-sm text-muted-foreground">Módulos</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">IA-Driven</div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 hover:scale-105 transition-transform duration-500">
              <OptimizedImage
                src={heroImage}
                alt="Framework GEO - Otimização para Mecanismos Generativos com IA"
                width={1200}
                height={900}
                priority
                quality={90}
                sizes="(max-width: 1024px) 100vw, 50vw"
                blurDataURL={generateBlurDataURL(20, 15)}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
