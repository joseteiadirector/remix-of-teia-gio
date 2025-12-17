import Header from "@/components/Header";
import { HeroSection } from "./Index/HeroSection";
import { TechnicalArchitectureSection } from "./Index/TechnicalArchitectureSection";
import { WhatIsGEOSection } from "./Index/WhatIsGEOSection";
import { HybridConvergenceSection } from "./Index/HybridConvergenceSection";
import { LLMProvidersSection } from "./Index/LLMProvidersSection";
import { MetaAISection } from "./Index/MetaAISection";
import { NucleusCenterSection } from "./Index/NucleusCenterSection";
import { IGOFrameworkSection } from "./Index/IGOFrameworkSection";
import { FrameworkSection } from "./Index/FrameworkSection";
import { FeaturesSection } from "./Index/FeaturesSection";
import { AlgorithmsSection } from "./Index/AlgorithmsSection";
import { DocumentationSection } from "./Index/DocumentationSection";
import { CTASection } from "./Index/CTASection";
import { FooterSection } from "./Index/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo principal
      </a>
      
      <Header />
      
      <main id="main-content" role="main">
        <HeroSection />
        <TechnicalArchitectureSection />
        <WhatIsGEOSection />
        <HybridConvergenceSection />
        <LLMProvidersSection />
        <MetaAISection />
        <NucleusCenterSection />
        <IGOFrameworkSection />
        <FrameworkSection />
        <FeaturesSection />
        <AlgorithmsSection />
        <DocumentationSection />
        <CTASection />
        <FooterSection />
      </main>
    </div>
  );
};

export default Index;
