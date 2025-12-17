import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-2">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para ser encontrado pelas IAs?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comece hoje mesmo a otimizar sua presença em motores generativos. 
            Cadastre-se gratuitamente e veja o impacto do GEO no seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
              aria-label="Começar gratuitamente com Teia GEO"
            >
              <Button size="lg" className="min-w-[200px]">
                Começar Gratuitamente
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </section>
  );
};
