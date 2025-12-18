import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-16 text-center bg-gradient-to-br from-primary/5 via-card to-secondary/5 border-border/50">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-8" />
          <h2 className="font-display text-4xl sm:text-5xl text-foreground mb-6">
            Pronto para ser encontrado pelas IAs?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Comece hoje mesmo a otimizar sua presença em motores generativos. 
            Cadastre-se gratuitamente e veja o impacto do GEO no seu negócio.
          </p>
          <a 
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
          >
            <Button size="lg" className="h-14 px-10 text-base font-medium">
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </Card>
      </div>
    </section>
  );
};
