import { Database, MessageSquare, Brain, Award, Activity } from "lucide-react";
import PillarCard from "./PillarCard";

const frameworkData = [
  {
    icon: Database,
    code: "GEO-01-BASE",
    title: "Base Técnica",
    color: "primary" as const,
    modules: [
      { code: "GEO-01.1", name: "SEO Técnico" },
      { code: "GEO-01.2", name: "IA Crawler Index" },
      { code: "GEO-01.3", name: "Dados Estruturados" },
      { code: "GEO-01.4", name: "API de Indexação Semântica" },
    ],
  },
  {
    icon: MessageSquare,
    code: "GEO-02-SEM",
    title: "Estrutura Semântica",
    color: "secondary" as const,
    modules: [
      { code: "GEO-02.1", name: "Ontologia de Marca" },
      { code: "GEO-02.2", name: "Identidade Verbal" },
      { code: "GEO-02.3", name: "Mapa Semântico" },
      { code: "GEO-02.4", name: "Narrativas de Expertise" },
    ],
  },
  {
    icon: Brain,
    code: "GEO-03-CONV",
    title: "Relevância Conversacional",
    color: "accent" as const,
    modules: [
      { code: "GEO-03.1", name: "Conversational Mapping" },
      { code: "GEO-03.2", name: "Alinhamento LLMs" },
      { code: "GEO-03.3", name: "AEO" },
      { code: "GEO-03.4", name: "E-E-A-T" },
    ],
  },
  {
    icon: Award,
    code: "GEO-04-AUTH",
    title: "Autoridade Cognitiva",
    color: "primary" as const,
    modules: [
      { code: "GEO-04.1", name: "Reputação & Citações" },
      { code: "GEO-04.2", name: "Publicações IA-driven" },
      { code: "GEO-04.3", name: "Knowledge Graph & APIs" },
      { code: "GEO-04.4", name: "Feedback Loop" },
    ],
  },
  {
    icon: Activity,
    code: "GEO-05-INTEL",
    title: "Inteligência Estratégica",
    color: "secondary" as const,
    modules: [
      { code: "GEO-05.1", name: "Observabilidade GEO" },
      { code: "GEO-05.2", name: "IA Analytics" },
      { code: "GEO-05.3", name: "Aprendizado Adaptativo" },
      { code: "GEO-05.4", name: "Governança Semântica" },
    ],
  },
];

const FrameworkGrid = () => {
  return (
    <section id="framework" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Os 5 Pilares do Framework GEO
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sistema integrado para otimização em mecanismos generativos e plataformas de IA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworkData.map((pillar) => (
            <PillarCard key={pillar.code} {...pillar} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FrameworkGrid;
