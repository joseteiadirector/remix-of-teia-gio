import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-32 bg-muted/30">
      <div className="container mx-auto px-6 lg:px-8">
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
