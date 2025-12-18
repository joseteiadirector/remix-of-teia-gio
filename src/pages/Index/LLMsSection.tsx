const llms = [
  { name: "ChatGPT", provider: "OpenAI", model: "GPT-5" },
  { name: "Gemini", provider: "Google", model: "2.5 Flash" },
  { name: "Claude", provider: "Anthropic", model: "Claude 3" },
  { name: "Perplexity", provider: "Perplexity AI", model: "Pro" }
];

export const LLMsSection = () => {
  return (
    <section className="py-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-sm text-muted-foreground tracking-widest uppercase mb-4">
              Monitoramento Contínuo
            </p>
            <h2 className="font-serif text-4xl lg:text-5xl font-normal tracking-tight">
              LLMs Monitoradas
            </h2>
          </div>

          {/* LLMs Grid - Minimal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {llms.map((llm, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl border border-border/50 bg-background hover:border-primary/30 transition-all duration-500 text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="font-serif text-xl mb-1">{llm.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{llm.provider}</p>
                <div className="inline-flex items-center gap-2 text-xs text-primary/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {llm.model}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <p className="text-center text-sm text-muted-foreground mt-12 font-light">
            Análise comparativa em tempo real · Detecção de padrões · Otimização adaptativa
          </p>
        </div>
      </div>
    </section>
  );
};
