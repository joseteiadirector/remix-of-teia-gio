import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ctaSectionBg from "@/assets/cta-section-bg.png";

export const CTASection = () => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={ctaSectionBg} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h2 className="font-serif text-4xl lg:text-5xl font-normal tracking-tight mb-6">
            Pronto para ser encontrado
            <br />
            <span className="text-primary">pelas IAs?</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12 font-light">
            Comece hoje mesmo a otimizar sua presença em motores generativos.
          </p>

          <Link to="/auth">
            <Button size="lg" className="px-8 gap-2 group">
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
