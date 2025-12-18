import Header from "@/components/Header";
import { HeroSection } from "./Index/HeroSection";
import { TechnologySection } from "./Index/TechnologySection";
import { LLMsSection } from "./Index/LLMsSection";
import { MetricsSection } from "./Index/MetricsSection";
import { FeaturesSection } from "./Index/FeaturesSection";
import { CTASection } from "./Index/CTASection";
import { FooterSection } from "./Index/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo principal
      </a>
      
      <Header />
      
      <main id="main-content" role="main">
        <HeroSection />
        <TechnologySection />
        <LLMsSection />
        <MetricsSection />
        <FeaturesSection />
        <CTASection />
        <FooterSection />
      </main>
    </div>
  );
};

export default Index;
