import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileText, ArrowUp, Home, LayoutDashboard, Download } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DownloadTechnicalPDF } from "@/components/DownloadTechnicalPDF";

const Documentation = () => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Teia GEO — Inteligência Artificial Generativa Observacional</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="sm"
            className="gap-2"
            title="Voltar à Home"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="default"
            size="sm"
            className="gap-2"
            title="Ir para Dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <DownloadTechnicalPDF />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentação Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-250px)] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              
              <section>
                <h2 className="text-2xl font-bold mb-4">Visão Geral</h2>
                <p>Este sistema fornece análise de GEO (Generative Engine Optimization) e monitoramento de marcas em LLMs, com geração automática de relatórios e alertas.</p>
              </section>

              {/* IGO Framework Section */}
              <section className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-primary/10 p-8 rounded-lg border-2 border-primary/40 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-primary to-accent p-3 rounded-lg">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">IGO Framework</h2>
                    <p className="text-sm text-muted-foreground">
                      Intelligence Generative Observability · First LATAM Implementation
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-background/80 p-6 rounded-lg border border-border/40">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <span className="text-primary">📖</span>
                      O que é o IGO Framework?
                    </h3>
                    <p className="text-sm mb-4 leading-relaxed">
                      O <strong>IGO (Intelligence Generative Observability)</strong> é um framework proprietário pioneiro na América Latina 
                      que implementa o conceito de <strong>"IA observando IA"</strong>. Diferente de abordagens tradicionais de SEO, 
                      o IGO monitora e analisa como diferentes Large Language Models (LLMs) mencionam e recomendam marcas, 
                      criando uma camada de <strong>governança semântica</strong> sobre a presença digital.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      <div className="bg-primary/5 p-3 rounded border border-primary/20">
                        <p className="font-semibold text-sm mb-1">Multi-LLM Tracking</p>
                        <p className="text-xs text-muted-foreground">ChatGPT, Claude, Gemini, Perplexity</p>
                      </div>
                      <div className="bg-secondary/5 p-3 rounded border border-secondary/20">
                        <p className="font-semibold text-sm mb-1">Convergência Cognitiva</p>
                        <p className="text-xs text-muted-foreground">Análise de consistência entre LLMs</p>
                      </div>
                      <div className="bg-accent/5 p-3 rounded border border-accent/20">
                        <p className="font-semibold text-sm mb-1">Semantic Governance</p>
                        <p className="text-xs text-muted-foreground">Controle de narrativa generativa</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/80 p-6 rounded-lg border border-border/40">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-primary">🏗️</span>
                      Os 5 Pilares GEO do Framework IGO
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-500/5 p-3 rounded-r">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-blue-600">GEO-01</span> Base Técnica
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Fundação técnica para rastreamento por LLMs: SEO tradicional, crawlability, dados estruturados (Schema.org), 
                          sitemap XML e performance técnica.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-blue-500/10 px-2 py-1 rounded">Crawlability</span>
                          <span className="text-xs bg-blue-500/10 px-2 py-1 rounded">Schema.org</span>
                          <span className="text-xs bg-blue-500/10 px-2 py-1 rounded">Core Web Vitals</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-green-500 pl-4 bg-green-500/5 p-3 rounded-r">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-green-600">GEO-02</span> Estrutura Semântica
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Ontologia de marca e identidade verbal: definição clara de quem você é, o que faz e como é diferente. 
                          Estruturação de conhecimento para interpretação correta pelos LLMs.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-green-500/10 px-2 py-1 rounded">Knowledge Graph</span>
                          <span className="text-xs bg-green-500/10 px-2 py-1 rounded">Brand Ontology</span>
                          <span className="text-xs bg-green-500/10 px-2 py-1 rounded">Semantic Context</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-4 bg-purple-500/5 p-3 rounded-r">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-purple-600">GEO-03</span> Relevância Conversacional
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Alinhamento com padrões de linguagem natural dos LLMs (AEO - Answer Engine Optimization). 
                          Otimização para respostas conversacionais e citações em contextos relevantes.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-purple-500/10 px-2 py-1 rounded">AEO</span>
                          <span className="text-xs bg-purple-500/10 px-2 py-1 rounded">LLM Alignment</span>
                          <span className="text-xs bg-purple-500/10 px-2 py-1 rounded">Conversational Patterns</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-4 bg-orange-500/5 p-3 rounded-r">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-orange-600">GEO-04</span> Autoridade Cognitiva
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reputação e confiança percebida pelos LLMs através de backlinks, menções em fontes confiáveis, 
                          presença em bases de conhecimento e histórico de citações.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-orange-500/10 px-2 py-1 rounded">Trust Signals</span>
                          <span className="text-xs bg-orange-500/10 px-2 py-1 rounded">Citation Network</span>
                          <span className="text-xs bg-orange-500/10 px-2 py-1 rounded">Knowledge Authority</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-pink-500 pl-4 bg-pink-500/5 p-3 rounded-r">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-pink-600">GEO-05</span> Inteligência Estratégica
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Análise, monitoramento e governança contínua. Tracking de menções multi-LLM, análise de divergência semântica, 
                          ajustes estratégicos baseados em dados observacionais.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-pink-500/10 px-2 py-1 rounded">Multi-LLM Analytics</span>
                          <span className="text-xs bg-pink-500/10 px-2 py-1 rounded">Semantic Divergence</span>
                          <span className="text-xs bg-pink-500/10 px-2 py-1 rounded">Strategic Governance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/80 p-6 rounded-lg border border-border/40">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-primary">🎯</span>
                      Métrica Proprietária: CPI Score
                    </h3>
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/30">
                      <p className="font-bold mb-2">Cognitive Predictive Index (CPI)</p>
                      <p className="text-sm mb-3">
                        O <strong>CPI</strong> mede a <strong>consistência preditiva inter-IA</strong>: o quanto diferentes LLMs 
                        são previsíveis e uniformes ao mencionar sua marca. Valores altos (≥80) indicam forte governança semântica 
                        e posicionamento consolidado entre OpenAI, Claude, Gemini e Perplexity.
                      </p>
                      
                      <div className="bg-background/50 p-3 rounded text-xs space-y-2">
                        <p><strong>Fórmula:</strong> CPI = 100 - (Desvio Padrão das Taxas de Menção × Fator de Normalização)</p>
                        <p><strong>Interpretação:</strong></p>
                        <ul className="ml-4 space-y-1">
                          <li>• <strong>80-100:</strong> Alta convergência - LLMs concordam consistentemente</li>
                          <li>• <strong>50-79:</strong> Convergência moderada - variação esperada</li>
                          <li>• <strong>0-49:</strong> Divergência alta - requer análise e ajustes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/80 p-6 rounded-lg border border-border/40">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="text-primary">🔗</span>
                      Componentes da Plataforma IGO
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-muted/30 p-4 rounded">
                        <h4 className="font-semibold mb-2 text-sm">IGO Dashboard</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Visualização central do framework com métricas de governança, convergência cognitiva e consenso multi-LLM.
                        </p>
                        <p className="text-xs font-mono text-primary">/igo-dashboard</p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded">
                        <h4 className="font-semibold mb-2 text-sm">IGO Observability</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Timeline multi-LLM, análise de divergência semântica e score de governança contextual em tempo real.
                        </p>
                        <p className="text-xs font-mono text-primary">/igo-observability</p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded">
                        <h4 className="font-semibold mb-2 text-sm">IGO Observational Layer</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Camada de observação IA-sobre-IA: tracking de menções, confiança e contexto em múltiplos provedores LLM.
                        </p>
                        <p className="text-xs font-mono text-primary">/llm-mentions</p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded">
                        <h4 className="font-semibold mb-2 text-sm">Nucleus Command Center</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Central de execução de queries multi-LLM com tracking de resultados e análise comparativa.
                        </p>
                        <p className="text-xs font-mono text-primary">/nucleus</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-lg border border-primary/40">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      📚 Documentação Técnica Completa
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">V3.4</span>
                    </p>
                    <p className="text-xs mb-3">
                      Para entender a fundamentação teórica, metodologia de cálculo e casos de uso do IGO Framework, 
                      consulte o laudo técnico completo disponível via botão de download no topo desta página.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex gap-2 text-xs items-center">
                        <span className="bg-primary/20 px-2 py-1 rounded">Metodologia Detalhada</span>
                        <span className="bg-secondary/20 px-2 py-1 rounded">Casos de Uso</span>
                        <span className="bg-accent/20 px-2 py-1 rounded">Algoritmos Proprietários</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-6 rounded-lg border border-primary/20">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">🚀</span>
                  Atualizações Recentes da Plataforma
                </h2>
                
                <div className="space-y-6">
                  {/* NEW: Platform SaaS Architecture */}
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-5 rounded-lg border-2 border-green-500/40">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0 text-lg">🏆</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">Arquitetura SaaS 100/100 — PLATINUM PERFECT</h3>
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">NOVO</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sistema completamente automatizado para qualquer marca/usuário. Zero configuração manual.
                        </p>
                      </div>
                    </div>

                    <div className="ml-13 space-y-4">
                      <div className="bg-background/80 p-4 rounded border border-green-500/20">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          ⚡ Triggers Automáticos para Novas Marcas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="font-mono text-xs text-primary mb-1">auto_create_brand_automations</p>
                            <p className="text-xs text-muted-foreground">Cria 4 automações automaticamente: coleta de menções, métricas GEO, análise SEO, verificação de alertas</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="font-mono text-xs text-primary mb-1">auto_create_welcome_alert</p>
                            <p className="text-xs text-muted-foreground">Cria alerta de boas-vindas com confirmação de configuração</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="font-mono text-xs text-primary mb-1">sync_cpi_on_igo</p>
                            <p className="text-xs text-muted-foreground">Calcula e sincroniza CPI automaticamente quando métricas IGO são inseridas</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded">
                            <p className="font-mono text-xs text-primary mb-1">cascade_metric_changes</p>
                            <p className="text-xs text-muted-foreground">Cria alertas automáticos quando scores mudam ≥5%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background/80 p-4 rounded border border-green-500/20">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          🔧 Funções de Monitoramento Global
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <div>
                              <p className="text-sm font-medium">validate_platform_consistency()</p>
                              <p className="text-xs text-muted-foreground">Valida integridade entre todas as tabelas do sistema</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <div>
                              <p className="text-sm font-medium">get_platform_health()</p>
                              <p className="text-xs text-muted-foreground">Retorna status de saúde completo da plataforma em JSON</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <div>
                              <p className="text-sm font-medium">cleanup_old_data()</p>
                              <p className="text-xs text-muted-foreground">Limpeza automática de cache expirado, logs antigos e jobs concluídos</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <div>
                              <p className="text-sm font-medium">calculate_cpi_from_igo()</p>
                              <p className="text-xs text-muted-foreground">Fórmula padronizada: ICE×35% + (100-GAP)×30% + Stability×35%</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-background/80 p-4 rounded border border-green-500/20">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          📊 Métricas KAPI Centralizadas
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="bg-blue-500/10 p-2 rounded text-center">
                            <p className="font-bold text-sm">ICE</p>
                            <p className="text-xs text-muted-foreground">≥ 80%</p>
                          </div>
                          <div className="bg-purple-500/10 p-2 rounded text-center">
                            <p className="font-bold text-sm">GAP</p>
                            <p className="text-xs text-muted-foreground">≥ 75%</p>
                          </div>
                          <div className="bg-orange-500/10 p-2 rounded text-center">
                            <p className="font-bold text-sm">Stability</p>
                            <p className="text-xs text-muted-foreground">≥ 70%</p>
                          </div>
                          <div className="bg-green-500/10 p-2 rounded text-center">
                            <p className="font-bold text-sm">CPI</p>
                            <p className="text-xs text-muted-foreground">≥ 60%</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Todas as métricas usam lógica direta (maior = melhor) conforme documentação científica.
                        </p>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
                        <p className="text-xs">
                          <strong>🎯 Garantia SaaS:</strong> Qualquer nova marca registrada automaticamente recebe todas as configurações, 
                          automações e monitoramento. Zero intervenção manual necessária.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background/80 p-5 rounded-lg border border-border/40">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">🧠</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Nucleus Chat — Assistente IA para Análise de Dados</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Sistema de chat inteligente integrado que permite consultar dados da plataforma usando linguagem natural.
                        </p>
                      </div>
                    </div>

                    <div className="ml-11 space-y-3">
                      <div className="bg-muted/30 p-3 rounded">
                        <h4 className="font-semibold text-sm mb-2">✨ Funcionalidades</h4>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• <strong>Consultas em SQL Natural:</strong> Pergunte sobre seus dados sem escrever SQL</li>
                          <li>• <strong>Análise de Métricas:</strong> "Qual meu GEO Score da última semana?"</li>
                          <li>• <strong>Comparações:</strong> "Compare as menções entre OpenAI e Claude"</li>
                          <li>• <strong>Insights Automáticos:</strong> Sugestões baseadas nos seus dados</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-3 rounded">
                        <h4 className="font-semibold text-sm mb-2">🔧 Implementação Técnica</h4>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• <strong>Edge Function:</strong> <code className="bg-background px-1 rounded">nucleus-chat</code></li>
                          <li>• <strong>Modelo IA:</strong> Lovable AI (google/gemini-2.5-flash)</li>
                          <li>• <strong>Segurança:</strong> Queries validadas e restritas ao usuário autenticado</li>
                          <li>• <strong>Interface:</strong> Chat streaming em tempo real</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded">
                        <p className="text-xs">
                          <strong>💡 Como usar:</strong> Acesse o <strong>Nucleus Center</strong> no menu lateral e comece a conversar com seus dados!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/80 p-5 rounded-lg border border-border/40">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">🔗</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Google Analytics Sync</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Sincronização automática de dados do Google Search Console e Google Analytics 4.
                        </p>
                      </div>
                    </div>

                    <div className="ml-11 space-y-3">
                      <div className="bg-muted/30 p-3 rounded">
                        <h4 className="font-semibold text-sm mb-2">📊 O que é coletado</h4>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• <strong>GA4:</strong> Pageviews, sessões, taxa de engajamento, bounce rate</li>
                          <li>• <strong>GSC:</strong> Queries, cliques, impressões, CTR, posição média</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-3 rounded">
                        <h4 className="font-semibold text-sm mb-2">⚙️ Edge Functions</h4>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• <code className="bg-background px-1 rounded">analytics-sync</code>: Orquestrador principal</li>
                          <li>• <code className="bg-background px-1 rounded">fetch-ga4-data</code>: Busca dados do GA4</li>
                          <li>• <code className="bg-background px-1 rounded">fetch-gsc-queries</code>: Busca queries do GSC</li>
                        </ul>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
                        <p className="text-xs">
                          <strong>🔄 Automação:</strong> Roda automaticamente a cada 6 horas via cron job. Configure em <strong>/google-setup</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background/80 p-5 rounded-lg border border-border/40">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">📈</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Monitoramento e Performance</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Sistema completo de observabilidade e rastreamento de erros.
                        </p>
                      </div>
                    </div>

                    <div className="ml-11 space-y-3">
                      <div className="bg-muted/30 p-3 rounded">
                        <h4 className="font-semibold text-sm mb-2">🛡️ Sentry Integration</h4>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Rastreamento de erros em produção</li>
                          <li>• Session replay para debug de problemas</li>
                          <li>• Performance monitoring automático</li>
                          <li>• Source maps para stack traces legíveis</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-3 rounded">
                        <h4 className="font-semibold text-sm mb-2">⏱️ Cron Jobs Dashboard</h4>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>• Visualização de jobs agendados</li>
                          <li>• Histórico de execuções</li>
                          <li>• Status e métricas em tempo real</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/30">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span>🎯</span>
                      Próximas Funcionalidades
                    </h4>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• Dashboard de backups automatizados</li>
                      <li>• Sistema avançado de alertas com notificações push</li>
                      <li>• Análise comparativa entre múltiplas brands</li>
                      <li>• Export de dados em múltiplos formatos</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Arquitetura de Dados</h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Tabelas Principais</h3>
                
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">brands</h4>
                    <p className="text-sm mb-2">Armazena informações das marcas monitoradas.</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li><code className="bg-muted px-1 rounded">id</code>: UUID único da marca</li>
                      <li><code className="bg-muted px-1 rounded">name</code>: Nome da marca</li>
                      <li><code className="bg-muted px-1 rounded">domain</code>: Domínio da marca</li>
                      <li><code className="bg-muted px-1 rounded">user_id</code>: ID do usuário proprietário</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">geo_scores</h4>
                    <p className="text-sm mb-2">Armazena pontuações GEO calculadas.</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li><code className="bg-muted px-1 rounded">brand_id</code>: Referência à marca</li>
                      <li><code className="bg-muted px-1 rounded">score</code>: Pontuação numérica (0-100)</li>
                      <li><code className="bg-muted px-1 rounded">breakdown</code>: Detalhamento em JSON</li>
                      <li><code className="bg-muted px-1 rounded">computed_at</code>: Data/hora do cálculo</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">mentions_llm</h4>
                    <p className="text-sm mb-2">Registra menções da marca em diferentes LLMs.</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li><code className="bg-muted px-1 rounded">provider</code>: OpenAI, Perplexity, Google AI, Claude</li>
                      <li><code className="bg-muted px-1 rounded">query</code>: Query usada para detecção</li>
                      <li><code className="bg-muted px-1 rounded">mentioned</code>: Se foi mencionada</li>
                      <li><code className="bg-muted px-1 rounded">confidence</code>: Nível de confiança (0-1)</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">scheduled_reports</h4>
                    <p className="text-sm mb-2">Configura relatórios agendados por usuário.</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li><code className="bg-muted px-1 rounded">frequency</code>: daily, weekly, monthly</li>
                      <li><code className="bg-muted px-1 rounded">report_type</code>: performance, mentions, comprehensive</li>
                      <li><code className="bg-muted px-1 rounded">enabled</code>: Se está ativo</li>
                      <li><code className="bg-muted px-1 rounded">next_run</code>: Próxima execução</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Sistema de Relatórios Agendados</h2>
                
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg mb-4">
                  <h3 className="text-xl font-semibold mb-4">Fluxo de Funcionamento</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-semibold flex-shrink-0">1</div>
                      <div>
                        <strong>CRON Job (Daily 8AM)</strong>
                        <p className="text-muted-foreground">Executa diariamente às 8h da manhã</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-semibold flex-shrink-0">2</div>
                      <div>
                        <strong>send-scheduled-weekly-reports</strong>
                        <p className="text-muted-foreground">Busca usuários e suas marcas, calcula métricas da semana</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center font-semibold flex-shrink-0">3</div>
                      <div>
                        <strong>send-weekly-report</strong>
                        <p className="text-muted-foreground">Formata e envia email via Resend</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-6 mb-3">Cálculo de Métricas</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Relevance Score:</p>
                  <code className="block bg-background p-2 rounded text-sm">
                    relevanceScore = (totalMentions &gt; 0) ? (mentionedCount / totalMentions) * 100 : 0
                  </code>
                  <p className="font-semibold mt-4 mb-2">Tendência:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><code className="bg-muted px-1 rounded">up</code>: Aumento de menções</li>
                    <li><code className="bg-muted px-1 rounded">down</code>: Diminuição de menções</li>
                    <li><code className="bg-muted px-1 rounded">stable</code>: Mesma quantidade</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Edge Functions</h2>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold text-lg">1. send-scheduled-weekly-reports</h4>
                    <p className="text-sm text-muted-foreground">Coordena a geração e envio de relatórios semanais.</p>
                  </div>

                  <div className="border-l-4 border-secondary pl-4">
                    <h4 className="font-semibold text-lg">2. send-weekly-report</h4>
                    <p className="text-sm text-muted-foreground">Formata e envia o email do relatório via Resend.</p>
                  </div>

                  <div className="border-l-4 border-accent pl-4">
                    <h4 className="font-semibold text-lg">3. collect-llm-mentions</h4>
                    <p className="text-sm text-muted-foreground">Coleta menções em OpenAI, Perplexity, Google AI e Claude.</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold text-lg">4. ai-predictions</h4>
                    <p className="text-sm text-muted-foreground">Gera previsões e sugestões usando IA.</p>
                  </div>

                  <div className="border-l-4 border-secondary pl-4">
                    <h4 className="font-semibold text-lg">5. analyze-url</h4>
                    <p className="text-sm text-muted-foreground">Analisa URL para GEO e SEO.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Sistema de Alertas</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Tipos de Alertas</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Threshold Alert</li>
                      <li>• Score Decrease</li>
                      <li>• Score Increase</li>
                      <li>• New Mention</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Prioridades</h4>
                    <ul className="text-sm space-y-1">
                      <li>🔴 <code className="bg-muted px-1 rounded">high</code></li>
                      <li>🟡 <code className="bg-muted px-1 rounded">medium</code></li>
                      <li>🟢 <code className="bg-muted px-1 rounded">low</code></li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Segurança (RLS)</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                  <p className="font-semibold mb-2">🔒 Row Level Security</p>
                  <p className="text-sm">Todas as tabelas implementam RLS para garantir que usuários só acessam seus próprios dados.</p>
                  <code className="block bg-background p-2 rounded text-xs mt-3">
                    CREATE POLICY "Users can view their own brands"<br/>
                    ON brands FOR SELECT<br/>
                    USING (auth.uid() = user_id);
                  </code>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Variáveis de Ambiente</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/30 p-3 rounded">
                    <strong>Supabase</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• SUPABASE_URL</li>
                      <li>• SUPABASE_ANON_KEY</li>
                      <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">🔮</span>
                  Análise Preditiva com Regressão Linear
                </h2>
                
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 rounded-lg border border-indigo-500/40 mb-6">
                  <p className="text-lg font-semibold mb-4">
                    Sistema de Machine Learning para previsão de GEO Scores
                  </p>
                  <p className="text-sm mb-4">
                    A plataforma implementa <strong>regressão linear</strong> para prever o comportamento do GEO Score 
                    nos próximos <strong>7, 14 e 30 dias</strong>, baseando-se em dados históricos dos últimos 90 dias.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📐 Modelo Matemático
                    </h3>
                    <code className="block bg-background p-3 rounded text-xs whitespace-pre-wrap">
{`Modelo Linear: y = mx + b

Slope (m):
m = Σ((xi - x̄)(yi - ȳ)) / Σ((xi - x̄)²)

Intercept (b):
b = ȳ - m × x̄

R² (Qualidade):
R² = 1 - (SS_res / SS_tot)`}
                    </code>
                    <p className="text-xs mt-3 text-muted-foreground">
                      O <strong>slope</strong> indica a tendência (crescimento/queda por dia).
                      O <strong>R²</strong> mede a confiabilidade da previsão (0-1).
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📊 Intervalo de Confiança (95%)
                    </h3>
                    <code className="block bg-background p-3 rounded text-xs whitespace-pre-wrap">
{`SE = √(MSE × (1 + 1/n + (x - x̄)² / Σ(xi - x̄)²))

IC = ŷ ± (t × SE)

Onde:
• MSE = Mean Squared Error
• t ≈ 1.96 (para n > 30)
• SE = Standard Error`}
                    </code>
                    <p className="text-xs mt-3 text-muted-foreground">
                      O intervalo de confiança define o range esperado com 95% de probabilidade.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-lg">Interpretação dos Resultados</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
                      <p className="font-semibold text-sm mb-1">✅ Alta Confiança (R² &gt; 0.80)</p>
                      <p className="text-xs">Tendência clara e previsível. Previsões confiáveis.</p>
                    </div>
                    
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded">
                      <p className="font-semibold text-sm mb-1">⚠️ Média Confiança (R² 0.60-0.80)</p>
                      <p className="text-xs">Tendência moderada. Use previsões com cautela.</p>
                    </div>
                    
                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded">
                      <p className="font-semibold text-sm mb-1">🔴 Baixa Confiança (R² &lt; 0.60)</p>
                      <p className="text-xs">Dados voláteis. Previsões incertas.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded mb-6">
                  <h3 className="font-bold mb-3">🎯 Detecção de Anomalias</h3>
                  <p className="text-sm mb-2">
                    O sistema detecta automaticamente pontos atípicos nos dados históricos:
                  </p>
                  <code className="block bg-background p-2 rounded text-xs">
                    threshold = 2 × σ (desvio padrão dos resíduos)<br/>
                    anomalia = |valor_real - valor_previsto| &gt; threshold
                  </code>
                  <p className="text-xs mt-3">
                    Anomalias podem indicar: eventos virais, erros de coleta, ou mudanças abruptas no algoritmo.
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">⚙️ Implementação Técnica</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <strong>Edge Function:</strong> <code className="bg-muted px-1 rounded">predict-geo-score</code> processa cálculos</li>
                    <li>• <strong>Algoritmo:</strong> Implementado em <code className="bg-muted px-1 rounded">src/utils/linearRegression.ts</code></li>
                    <li>• <strong>Visualização:</strong> Widget <code className="bg-muted px-1 rounded">WidgetPredictions</code> no dashboard</li>
                    <li>• <strong>Dados:</strong> Últimos 90 dias de <code className="bg-muted px-1 rounded">geo_scores</code></li>
                    <li>• <strong>Requisitos:</strong> Mínimo de 7 dias de histórico para gerar previsões</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded mt-4">
                  <h3 className="font-bold mb-2">⚠️ Limitações do Modelo</h3>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Requer mínimo de 7 dias de dados históricos</li>
                    <li>• Assume tendência linear (não captura sazonalidade complexa)</li>
                    <li>• Confiança diminui para previsões mais distantes (30 dias vs 7 dias)</li>
                    <li>• Eventos imprevisíveis (virais, crises) não são antecipados</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-3xl">🌳</span>
                  Sistema de Alertas Inteligentes com Árvore de Decisões
                </h2>
                
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 rounded-lg border border-emerald-500/40 mb-6">
                  <p className="text-lg font-semibold mb-4">
                    Classificação automática de severidade usando Decision Tree
                  </p>
                  <p className="text-sm mb-4">
                    A plataforma implementa <strong>Árvore de Decisões (Decision Tree)</strong> para classificar 
                    automaticamente a severidade dos alertas em <strong>4 níveis</strong> (Low, Medium, High, Critical), 
                    analisando <strong>5 métricas simultaneamente</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      📊 Métricas Analisadas
                    </h3>
                    <ul className="text-sm space-y-2">
                      <li><strong>Score:</strong> Valor absoluto do GEO Score (0-100)</li>
                      <li><strong>Trend:</strong> Taxa de mudança nos últimos 7 dias (%)</li>
                      <li><strong>Frequency:</strong> Mudanças significativas em 30 dias</li>
                      <li><strong>Velocity:</strong> Velocidade da mudança (unidades/dia)</li>
                      <li><strong>Duration:</strong> Tempo desde última mudança (dias)</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      🎯 Níveis de Severidade
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <strong>CRITICAL:</strong> <span className="text-muted-foreground">Score &lt; 30 E Trend &lt; -20%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <strong>HIGH:</strong> <span className="text-muted-foreground">Score &lt; 50 E Trend &lt; -10%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <strong>MEDIUM:</strong> <span className="text-muted-foreground">Score &lt; 70 OU Frequency &gt; 5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <strong>LOW:</strong> <span className="text-muted-foreground">Todas outras condições</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 p-4 rounded mb-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl">🔔</span> Integração com Notificações
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-background/50 p-3 rounded">
                      <strong className="text-green-600">LOW</strong>
                      <p className="text-muted-foreground mt-1">Nenhuma notificação (apenas log)</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded">
                      <strong className="text-yellow-600">MEDIUM</strong>
                      <p className="text-muted-foreground mt-1">Email informativo (1x/dia consolidado)</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded">
                      <strong className="text-orange-600">HIGH</strong>
                      <p className="text-muted-foreground mt-1">Email imediato + badge no dashboard</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded">
                      <strong className="text-red-600">CRITICAL</strong>
                      <p className="text-muted-foreground mt-1">Email urgente + notificação push</p>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-500/10 border border-teal-500/30 p-4 rounded mb-6">
                  <h3 className="font-bold mb-3">✨ Vantagens da Árvore de Decisões</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Interpretabilidade:</strong>
                      <p className="text-muted-foreground">Decisões transparentes e explicáveis</p>
                    </div>
                    <div>
                      <strong>Performance:</strong>
                      <p className="text-muted-foreground">Classificação instantânea (O(log n))</p>
                    </div>
                    <div>
                      <strong>Manutenibilidade:</strong>
                      <p className="text-muted-foreground">Fácil ajustar thresholds sem retreinar</p>
                    </div>
                    <div>
                      <strong>Precisão:</strong>
                      <p className="text-muted-foreground">Reduz falso-positivos em ~60%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded">
                  <h3 className="font-bold mb-3">⚙️ Thresholds Configuráveis</h3>
                  <code className="block bg-background p-3 rounded text-xs whitespace-pre-wrap">
{`Score Crítico: 30 (ajustável)
Score Alto: 50 (ajustável)  
Score Médio: 70 (ajustável)

Trend Crítico: -20% (ajustável)
Trend Alto: -10% (ajustável)

Frequency Threshold: 5 mudanças/30dias (ajustável)`}
                  </code>
                  <p className="text-xs mt-3 text-muted-foreground">
                    Todos os thresholds podem ser ajustados em tempo real sem modificar código ou retreinar o modelo.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Manutenção</h2>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Verificar Cron Jobs</h4>
                    <code className="block bg-background p-2 rounded text-xs">
                      SELECT * FROM cron.job;<br/>
                      SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
                    </code>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Logs de Edge Functions</h4>
                    <p className="text-sm text-muted-foreground">Acessíveis no painel do Lovable Cloud para debugging e monitoramento.</p>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section>
                <div className="flex items-center gap-3 mb-6 mt-8">
                  <span className="text-3xl">❓</span>
                  <h2 className="text-2xl font-bold">FAQ — Perguntas Frequentes</h2>
                </div>

                <Accordion type="multiple" className="space-y-4">
                  
                  {/* Conceitos Estruturais */}
                  <AccordionItem value="estrutura-1" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🏗️ O que é a arquitetura híbrida GEO+SEO implementada?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>A Teia GEO utiliza uma <strong>arquitetura híbrida convergente</strong> que combina:</p>
                      <ul className="space-y-2 ml-4">
                        <li>• <strong>GEO (Generative Engine Optimization):</strong> Otimização para motores de IA generativa (ChatGPT, Claude, Gemini, Perplexity)</li>
                        <li>• <strong>SEO (Search Engine Optimization):</strong> Otimização tradicional para buscadores (Google, Bing)</li>
                      </ul>
                      <p className="mt-3">Esta arquitetura permite medir a <strong>convergência estratégica</strong> entre ambas as frentes através do índice ICE e identificar gaps de otimização através do indicador GAP.</p>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Diferencial Técnico:</strong> Sistema único que analisa simultaneamente visibilidade orgânica e menções em IA, usando métricas padronizadas 0-100 para comparação direta.
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="estrutura-2" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔄 Como funciona o fluxo de dados end-to-end?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>1. Coleta de Dados:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• <strong>GEO:</strong> Edge function <code className="bg-muted px-1 rounded">collect-llm-mentions</code> consulta 4 LLMs (ChatGPT, Claude, Gemini, Perplexity)</li>
                        <li>• <strong>SEO:</strong> Edge function <code className="bg-muted px-1 rounded">fetch-gsc-queries</code> sincroniza Google Search Console</li>
                      </ul>
                      <p className="mt-3"><strong>2. Análise Inteligente:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• Lovable AI (Gemini 2.5) analisa sentimento, contexto e confiança das menções</li>
                        <li>• Análise técnica de URLs com <code className="bg-muted px-1 rounded">analyze-url</code></li>
                      </ul>
                      <p className="mt-3"><strong>3. Cálculo de Métricas:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• Edge function <code className="bg-muted px-1 rounded">calculate-geo-metrics</code> processa 5 pilares do GEO Score</li>
                        <li>• Scores SEO calculados a partir de CTR, posição média e taxa de conversão</li>
                      </ul>
                      <p className="mt-3"><strong>4. Persistência:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• PostgreSQL com RLS (Row Level Security) garante isolamento por usuário</li>
                        <li>• Histórico completo mantido para análise temporal</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="estrutura-3" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🛡️ Qual a estratégia de segurança implementada?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>Camadas de Segurança:</strong></p>
                      <div className="space-y-3">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded">
                          <strong>1. Row Level Security (RLS)</strong>
                          <p className="mt-2 text-xs">Todas as tabelas implementam políticas de acesso baseadas em <code className="bg-muted px-1">auth.uid()</code></p>
                          <code className="block bg-background p-2 rounded text-xs mt-2">
                            CREATE POLICY "Users view own data"<br/>
                            ON brands FOR SELECT<br/>
                            USING (auth.uid() = user_id);
                          </code>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
                          <strong>2. Edge Function Validation</strong>
                          <p className="mt-2 text-xs">Validação de entrada em múltiplas camadas: tipo, presença, formato</p>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded">
                          <strong>3. Rate Limiting</strong>
                          <p className="mt-2 text-xs">Controle de frequência de coletas com delays entre requisições</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Engenharia Aplicada */}
                  <AccordionItem value="engenharia-1" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      ⚙️ Quais padrões de engenharia foram aplicados?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>1. Service Layer Pattern</strong></p>
                      <p className="ml-4">Módulos <code className="bg-muted px-1 rounded">_shared/</code> centralizam lógica reutilizável:</p>
                      <ul className="ml-8 space-y-1">
                        <li>• <code className="bg-muted px-1 rounded">llm-providers.ts</code>: Abstração de provedores LLM</li>
                        <li>• <code className="bg-muted px-1 rounded">llm-mention-analyzer.ts</code>: Análise com IA</li>
                        <li>• <code className="bg-muted px-1 rounded">intelligent-estimates.ts</code>: Estimativas inteligentes</li>
                      </ul>
                      <p className="mt-3"><strong>2. Separation of Concerns</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• <strong>Presentation Layer:</strong> React + TanStack Query</li>
                        <li>• <strong>Business Logic:</strong> Edge Functions (Deno)</li>
                        <li>• <strong>Data Access:</strong> Supabase Client</li>
                      </ul>
                      <p className="mt-3"><strong>3. Error Handling Strategy</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• Fallback para análise básica quando IA falha</li>
                        <li>• Timeouts configuráveis (30s padrão)</li>
                        <li>• Logging estruturado com contexto completo</li>
                      </ul>
                      <p className="mt-3"><strong>4. Cache Strategy</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• TanStack Query para cache client-side</li>
                        <li>• Tabela <code className="bg-muted px-1 rounded">llm_query_cache</code> para cache server-side</li>
                        <li>• Invalidação automática com TTL configurável</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="engenharia-2" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🚀 Como é garantida a escalabilidade do sistema?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>Estratégias de Escalabilidade:</strong></p>
                      <div className="space-y-3">
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>1. Edge Functions Serverless</strong>
                          <p className="text-xs mt-1">Escalam automaticamente com a demanda, sem gerenciamento de infraestrutura</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>2. PostgreSQL Otimizado</strong>
                          <ul className="text-xs mt-1 ml-4">
                            <li>• Índices estratégicos em <code className="bg-muted px-1">brand_id</code>, <code className="bg-muted px-1">user_id</code>, timestamps</li>
                            <li>• Particionamento temporal para tabelas de métricas</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>3. Batch Processing</strong>
                          <p className="text-xs mt-1">Coletas agendadas processam múltiplas marcas com delays controlados</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>4. Lazy Loading</strong>
                          <p className="text-xs mt-1">Componentes carregam dados sob demanda usando TanStack Query</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="engenharia-3" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔍 Como funciona a análise inteligente com IA?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>Pipeline de Análise:</strong></p>
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded">
                        <p className="font-semibold mb-2">1. Análise Básica (Sempre Executada)</p>
                        <ul className="text-xs ml-4 space-y-1">
                          <li>• Detecção de marca por keywords (nome, domínio)</li>
                          <li>• Extração de contexto (trecho relevante)</li>
                          <li>• Análise de sentimento básica (palavras-chave)</li>
                        </ul>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded mt-3">
                        <p className="font-semibold mb-2">2. Análise Avançada com IA (Se marca mencionada)</p>
                        <ul className="text-xs ml-4 space-y-1">
                          <li>• <strong>Modelo:</strong> Lovable AI (Gemini 2.5 Flash)</li>
                          <li>• <strong>Prompt estruturado:</strong> Análise de sentimento, contexto, confiança</li>
                          <li>• <strong>Output JSON:</strong> mentioned, sentiment, context, confidence, reasoning</li>
                          <li>• <strong>Timeout:</strong> 30 segundos</li>
                          <li>• <strong>Fallback:</strong> Retorna análise básica em caso de falha</li>
                        </ul>
                      </div>
                      <p className="mt-3"><strong>Campos Analisados:</strong></p>
                      <ul className="text-xs ml-4">
                        <li>• <strong>mentioned:</strong> boolean (marca foi citada?)</li>
                        <li>• <strong>sentiment:</strong> positive | negative | neutral</li>
                        <li>• <strong>context:</strong> relevant | irrelevant | partial</li>
                        <li>• <strong>confidence:</strong> 0-100 (nível de certeza)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Matemática Aplicada */}
                  <AccordionItem value="matematica-1" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      📐 Como é calculado o GEO Score (0-100)?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 rounded">
                        <p className="font-bold text-base mb-3">Fórmula Oficial:</p>
                        <code className="block bg-background p-3 rounded text-xs">
                          GEO Score = (BT × 0.20) + (ES × 0.15) + (RC × 0.25) + (AC × 0.25) + (IE × 0.15)
                        </code>
                      </div>
                      <p className="font-semibold mt-4">5 Pilares Matemáticos:</p>
                      
                      <div className="space-y-3">
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>1. Base Técnica (BT) - Peso: 20%</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
                            BT = min(100, round((mentionRate × 80) + (volumeQueries × 20)))
                          </code>
                          <p className="text-xs mt-1">Infraestrutura e volume de dados estruturados</p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>2. Estrutura Semântica (ES) - Peso: 15%</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
                            ES = round((uniqueTopics / 20) × 100)
                          </code>
                          <p className="text-xs mt-1">Diversidade temática das menções (máx: 20 tópicos)</p>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-3">
                          <strong>3. Relevância Conversacional (RC) - Peso: 25%</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
                            RC = round((highConfidenceMentions / totalQueries) × 100)
                          </code>
                          <p className="text-xs mt-1">Taxa de menções com confiança &gt; 70%</p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-3">
                          <strong>4. Autoridade Cognitiva (AC) - Peso: 25%</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
                            AC = round(avgConfidence)
                          </code>
                          <p className="text-xs mt-1">Média de confiança de todas as menções válidas</p>
                        </div>

                        <div className="border-l-4 border-red-500 pl-3">
                          <strong>5. Inteligência Estratégica (IE) - Peso: 15%</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
                            consistency = max(0, 100 - (stdDev × 150))<br/>
                            evolution = min(100, 50 + (growthRate × 100))<br/>
                            IE = round((consistency × 0.6) + (evolution × 0.4))
                          </code>
                          <p className="text-xs mt-1">Consistência (60%) + Evolução temporal (40%)</p>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mt-4">
                        <strong>⚠️ Fonte Única de Verdade:</strong>
                        <p className="text-xs mt-1">Todos os scores são calculados pela edge function <code className="bg-muted px-1">calculate-geo-metrics</code> e armazenados em <code className="bg-muted px-1">geo_scores</code>. Nunca calcular manualmente no frontend.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="matematica-2" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      📊 Como é calculado o SEO Score (0-100)?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 rounded">
                        <p className="font-bold text-base mb-3">Fórmula Padronizada:</p>
                        <code className="block bg-background p-3 rounded text-xs whitespace-pre-wrap">
{`// 1. CTR Score (ideal: 5% = 100 pts)
ctrScore = min(100, (ctr × 100 / 5) × 100)

// 2. Position Score (posição 1 = 100, posição 10 = 0)
positionScore = max(0, 100 - ((avgPosition - 1) × 11.11))

// 3. Conversion Score (ideal: 5% = 100 pts)
conversionScore = min(100, (conversionRate / 5) × 100)

// 4. SEO Score Final
SEO = round((positionScore × 0.4) + (ctrScore × 0.3) + (conversionScore × 0.3))`}
                        </code>
                      </div>

                      <p className="font-semibold mt-4">Justificativa dos Pesos:</p>
                      <ul className="ml-4 space-y-2">
                        <li>• <strong>Posição Média (40%):</strong> Maior impacto na visibilidade orgânica</li>
                        <li>• <strong>CTR (30%):</strong> Indica qualidade do snippet e relevância percebida</li>
                        <li>• <strong>Taxa de Conversão (30%):</strong> Mede efetividade do tráfego gerado</li>
                      </ul>

                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded mt-4">
                        <strong>📌 Fonte de Dados:</strong>
                        <p className="text-xs mt-1">Google Search Console (GSC) + Google Analytics 4 (GA4), sincronizados via edge functions</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="matematica-3" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🎯 O que são ICE e GAP?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded">
                        <p className="font-bold text-base mb-3">ICE - Índice de Convergência Estratégica</p>
                        <code className="block bg-background p-3 rounded text-xs">
                          ICE = 1 - (|scoreGEO - scoreSEO| / 100)
                        </code>
                        <p className="text-xs mt-2">
                          <strong>Range:</strong> 0-1 (exibido como 0-100%)<br/>
                          <strong>Significado:</strong> Mede o alinhamento entre estratégias GEO e SEO
                        </p>
                        <div className="mt-3 space-y-1 text-xs">
                          <p>• <strong>ICE = 1.0 (100%):</strong> Perfeito alinhamento (GEO = SEO)</p>
                          <p>• <strong>ICE = 0.52 (52%):</strong> Gap de 48 pontos entre GEO e SEO</p>
                          <p>• <strong>ICE = 0.0 (0%):</strong> Máxima distorção (diferença de 100 pontos)</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded mt-4">
                        <p className="font-bold text-base mb-3">GAP - Prioridade Estratégica de Ação</p>
                        <code className="block bg-background p-3 rounded text-xs">
                          GAP = |scoreGEO - scoreSEO| × (1 - (confiançaIAs / 100))
                        </code>
                        <p className="text-xs mt-2">
                          <strong>Range:</strong> 0-100<br/>
                          <strong>Significado:</strong> Urgência de correção considerando confiança das IAs
                        </p>
                        <div className="mt-3 space-y-1 text-xs">
                          <p>• <strong>Confiança Alta (85%):</strong> Multiplicador 0.15 → GAP reduzido</p>
                          <p>• <strong>Confiança Baixa (40%):</strong> Multiplicador 0.60 → GAP elevado</p>
                        </div>
                        <div className="bg-background/50 p-2 rounded mt-3 text-xs">
                          <strong>Exemplo:</strong><br/>
                          GEO: 82.2 | SEO: 34.0 | Confiança: 85%<br/>
                          Diferença: |82.2 - 34.0| = 48.2<br/>
                          Multiplicador: 1 - 0.85 = 0.15<br/>
                          <strong>GAP Final: 48.2 × 0.15 = 7.23</strong>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="matematica-4" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      ✅ Como é garantida a consistência matemática?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>Sistema de Auditoria Matemática:</strong></p>
                      
                      <div className="bg-green-500/10 border border-green-500/30 p-3 rounded">
                        <strong>1. Fonte Única de Verdade</strong>
                        <ul className="text-xs mt-2 ml-4 space-y-1">
                          <li>• GEO Score: sempre de <code className="bg-muted px-1">geo_scores</code></li>
                          <li>• SEO Score: calculado com fórmula padronizada</li>
                          <li>• Sem cálculos duplicados no frontend</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded mt-3">
                        <strong>2. Validação Cruzada</strong>
                        <p className="text-xs mt-1">Edge function <code className="bg-muted px-1">audit-report-data</code> verifica:</p>
                        <ul className="text-xs ml-4 space-y-1">
                          <li>• Divergências entre fontes de dados</li>
                          <li>• Consistência temporal (valores crescentes/decrescentes)</li>
                          <li>• Integridade referencial (brand_id válidos)</li>
                        </ul>
                      </div>

                      <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded mt-3">
                        <strong>3. Documentação Matemática</strong>
                        <ul className="text-xs mt-2 ml-4 space-y-1">
                          <li>• <code className="bg-muted px-1">CALCULATION_SPEC.md</code>: Especificação oficial do GEO Score</li>
                          <li>• <code className="bg-muted px-1">FORMULAS_PADRONIZADAS.md</code>: Todas as fórmulas do sistema</li>
                          <li>• <code className="bg-muted px-1">GEO_SCORE_STANDARD.md</code>: Padrão de uso dos scores</li>
                        </ul>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mt-3">
                        <strong>4. Testes Automatizados</strong>
                        <p className="text-xs mt-1">Checklist executado antes de cada release:</p>
                        <ul className="text-xs ml-4 space-y-1">
                          <li>• Validar pesos dos pilares (soma = 100%)</li>
                          <li>• Verificar ranges (todos 0-100)</li>
                          <li>• Confirmar fórmulas idênticas em todas páginas</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Implementação Técnica */}
                  <AccordionItem value="tecnico-1" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔧 Quais tecnologias compõem o stack?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-blue-500">Frontend</strong>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• React 18 + TypeScript</li>
                            <li>• Vite (build tool)</li>
                            <li>• Tailwind CSS + shadcn/ui</li>
                            <li>• TanStack Query</li>
                            <li>• React Router v6</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-green-500">Backend</strong>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Supabase (Lovable Cloud)</li>
                            <li>• PostgreSQL 15</li>
                            <li>• Edge Functions (Deno)</li>
                            <li>• Row Level Security (RLS)</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-purple-500">Inteligência Artificial</strong>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Lovable AI Gateway</li>
                            <li>• Google Gemini 2.5 Flash</li>
                            <li>• OpenAI GPT-4o-mini</li>
                          </ul>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-orange-500">Integrações</strong>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Google Search Console</li>
                            <li>• Google Analytics 4</li>
                            <li>• Resend (emails)</li>
                            <li>• Stripe (pagamentos)</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tecnico-2" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      📦 Como está organizada a estrutura de código?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <code className="block bg-background p-3 rounded text-xs whitespace-pre-wrap font-mono">
{`src/
├── components/          # Componentes React
│   ├── ui/             # shadcn/ui components
│   ├── dashboard/      # Widgets do dashboard
│   └── url-analysis/   # Análise de URLs
├── pages/              # Páginas (rotas)
│   ├── Dashboard.tsx
│   ├── GeoMetrics.tsx
│   ├── KPIs.tsx
│   └── LLMMentions.tsx
├── utils/              # Utilitários
│   ├── geoScoreHelper.ts
│   ├── exportReports.ts
│   └── mentionHelpers.ts
├── hooks/              # React hooks customizados
├── integrations/       # Integrações (Supabase)
└── index.css           # Design system tokens

supabase/
├── functions/
│   ├── _shared/              # Camada de serviços
│   │   ├── llm-providers.ts
│   │   └── llm-mention-analyzer.ts
│   ├── calculate-geo-metrics/
│   ├── collect-llm-mentions/
│   └── fetch-gsc-queries/
└── config.toml               # Configuração`}
                      </code>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Princípio DRY aplicado:</strong>
                        <p className="text-xs mt-1">Módulos <code className="bg-muted px-1">_shared/</code> eliminam duplicação de código entre edge functions, reduzindo em 63% o tamanho de <code className="bg-muted px-1">collect-llm-mentions</code>.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Análise Preditiva */}
                  <AccordionItem value="matematica-5" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 rounded-lg border border-indigo-500/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔮 Como funciona o algoritmo de Regressão Linear para previsões?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded">
                        <p className="font-bold text-base mb-3">Modelo de Previsão com Machine Learning</p>
                        <p className="text-sm mb-3">
                          A plataforma utiliza <strong>regressão linear</strong> para prever o GEO Score dos próximos 7, 14 e 30 dias, 
                          baseando-se em dados históricos dos últimos 90 dias.
                        </p>
                        <code className="block bg-background p-3 rounded text-xs whitespace-pre-wrap">
{`// Modelo Linear: y = mx + b
// y = score previsto
// m = slope (inclinação da tendência)
// x = dias desde primeiro registro
// b = intercept (valor base)

slope = Σ((xi - x̄)(yi - ȳ)) / Σ((xi - x̄)²)
intercept = ȳ - slope × x̄

// Exemplo:
// Se slope = 0.5, score aumenta 0.5 pontos/dia
// Se slope = -0.3, score diminui 0.3 pontos/dia`}
                        </code>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div className="border-l-4 border-indigo-500 pl-3">
                          <strong>Coeficiente de Determinação (R²)</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
                            R² = 1 - (SS_res / SS_tot)
                          </code>
                          <p className="text-xs mt-1">
                            Mede a qualidade do modelo de 0 a 1:<br/>
                            • <strong>R² = 0.95:</strong> Modelo explica 95% das variações (excelente)<br/>
                            • <strong>R² = 0.70:</strong> Modelo explica 70% das variações (bom)<br/>
                            • <strong>R² = 0.40:</strong> Modelo explica 40% das variações (fraco)
                          </p>
                        </div>

                        <div className="border-l-4 border-purple-500 pl-3">
                          <strong>Intervalo de Confiança (95%)</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
{`SE = √(MSE × (1 + 1/n + (x - x̄)² / Σ(xi - x̄)²))
IC = ŷ ± (t × SE)

// MSE = Mean Squared Error
// t = valor crítico da distribuição t (≈1.96 para n>30)
// SE = Standard Error da previsão`}
                          </code>
                          <p className="text-xs mt-1">
                            Define o range provável do score futuro. Exemplo:<br/>
                            • <strong>Previsão:</strong> 78.5 pontos<br/>
                            • <strong>IC 95%:</strong> [72.3, 84.7]<br/>
                            • <strong>Interpretação:</strong> 95% de chance do score real estar entre 72.3 e 84.7
                          </p>
                        </div>

                        <div className="border-l-4 border-pink-500 pl-3">
                          <strong>Detecção de Anomalias</strong>
                          <code className="block bg-background p-2 rounded text-xs mt-1">
{`threshold = 2 × σ (desvio padrão dos resíduos)
anomalia = |valor_real - valor_previsto| > threshold`}
                          </code>
                          <p className="text-xs mt-1">
                            Identifica pontos atípicos nos dados históricos que podem indicar:<br/>
                            • Eventos externos (virais, campanhas)<br/>
                            • Erros de coleta de dados<br/>
                            • Mudanças abruptas no algoritmo
                          </p>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mt-4">
                        <strong>⚠️ Limitações do Modelo:</strong>
                        <ul className="text-xs mt-2 ml-4 space-y-1">
                          <li>• Requer mínimo de 7 dias de dados históricos</li>
                          <li>• Assume tendência linear (não captura sazonalidade complexa)</li>
                          <li>• Confiança diminui para previsões mais distantes (30 dias vs 7 dias)</li>
                          <li>• Eventos imprevisíveis (virais, crises) não são antecipados</li>
                        </ul>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 p-3 rounded mt-3">
                        <strong>✅ Como interpretar as previsões:</strong>
                        <ul className="text-xs mt-2 ml-4 space-y-1">
                          <li>• <strong>Confiança Alta (R² &gt; 0.80):</strong> Tendência clara, previsões confiáveis</li>
                          <li>• <strong>Confiança Média (R² 0.60-0.80):</strong> Tendência moderada, use com cautela</li>
                          <li>• <strong>Confiança Baixa (R² &lt; 0.60):</strong> Dados voláteis, previsões incertas</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded mt-3">
                        <strong>📊 Implementação Técnica:</strong>
                        <p className="text-xs mt-1">
                          • <strong>Edge Function:</strong> <code className="bg-muted px-1">predict-geo-score</code><br/>
                          • <strong>Algoritmo:</strong> Implementado em <code className="bg-muted px-1">src/utils/linearRegression.ts</code><br/>
                          • <strong>Visualização:</strong> Widget <code className="bg-muted px-1">WidgetPredictions</code> no dashboard<br/>
                          • <strong>Dados:</strong> Últimos 90 dias de <code className="bg-muted px-1">geo_scores</code>
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </section>

              {/* FAQ - Perguntas Frequentes */}
              <section className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">❓</span>
                  <h2 className="text-2xl font-bold">FAQ - Perguntas Frequentes</h2>
                </div>
                
                <Accordion type="multiple" className="space-y-3">
                  
                  {/* Conceitos Básicos */}
                  <AccordionItem value="faq-1" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      ❓ O que é GEO e por que é importante?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p><strong>GEO (Generative Engine Optimization)</strong> é a evolução natural do SEO para a era da Inteligência Artificial Generativa.</p>
                      <p>Enquanto o SEO tradicional otimiza seu conteúdo para mecanismos de busca como Google, o GEO otimiza sua presença nas respostas geradas por IAs como ChatGPT, Perplexity, Gemini e Claude.</p>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Por que é importante?</strong>
                        <ul className="text-xs mt-2 ml-4 space-y-1">
                          <li>• Usuários estão cada vez mais consultando IAs em vez de buscar no Google</li>
                          <li>• Ser mencionado em respostas de IA aumenta autoridade e credibilidade</li>
                          <li>• Empresas que ignoram GEO estão perdendo visibilidade para concorrentes</li>
                          <li>• IAs generativas se tornaram o novo portal de descoberta de marcas</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔍 Qual a diferença entre GEO e SEO?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 p-3 rounded">
                          <strong className="text-blue-500">SEO (Search Engine Optimization)</strong>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Foco em mecanismos de busca (Google, Bing)</li>
                            <li>• Otimização de keywords e backlinks</li>
                            <li>• Métricas: posição, CTR, impressões</li>
                            <li>• Objetivo: aparecer nos primeiros resultados</li>
                            <li>• Tecnologia: algoritmos de ranking</li>
                          </ul>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded">
                          <strong className="text-purple-500">GEO (Generative Engine Optimization)</strong>
                          <ul className="text-xs mt-2 space-y-1">
                            <li>• Foco em IAs generativas (ChatGPT, Gemini)</li>
                            <li>• Otimização de contexto e autoridade</li>
                            <li>• Métricas: citações, atribuições, sentimento</li>
                            <li>• Objetivo: ser mencionado e recomendado</li>
                            <li>• Tecnologia: modelos de linguagem (LLMs)</li>
                          </ul>
                        </div>
                      </div>
                      <p className="mt-3"><strong>Conclusão:</strong> GEO e SEO são complementares! Uma estratégia completa deve abordar ambos.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🎯 Como funciona a Teia GEO?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>A plataforma funciona em 4 etapas principais:</p>
                      <div className="space-y-3 mt-3">
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>1. Coleta de Dados</strong>
                          <p className="text-xs mt-1">Diariamente, nossa plataforma consulta múltiplos LLMs (ChatGPT, Perplexity, Gemini, Claude) com queries relacionadas à sua marca e indústria.</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>2. Análise Inteligente</strong>
                          <p className="text-xs mt-1">Utilizamos IA avançada para analisar sentimento, contexto e relevância de cada menção encontrada.</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-3">
                          <strong>3. Cálculo de Scores</strong>
                          <p className="text-xs mt-1">Aplicamos fórmulas matemáticas padronizadas para calcular GEO Score (0-100) baseado em 5 pilares.</p>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-3">
                          <strong>4. Insights e Recomendações</strong>
                          <p className="text-xs mt-1">Geramos relatórios automáticos com insights acionáveis e recomendações de otimização.</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      📊 Quais LLMs são monitorados?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>Atualmente monitoramos os principais LLMs do mercado:</p>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>✅ OpenAI ChatGPT</strong>
                          <p className="text-xs mt-1">GPT-4o e GPT-4o-mini</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>✅ Perplexity AI</strong>
                          <p className="text-xs mt-1">Perplexity Pro</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>✅ Google Gemini</strong>
                          <p className="text-xs mt-1">Gemini 2.0 e 2.5 Flash</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong>✅ Anthropic Claude</strong>
                          <p className="text-xs mt-1">Claude 3.5 Sonnet</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs bg-primary/10 p-2 rounded"><strong>Em breve:</strong> Meta Llama, Mistral AI, Cohere</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Funcionalidades */}
                  <AccordionItem value="faq-5" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🚀 Quais são as principais funcionalidades?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Dashboard Unificado:</strong> Visão geral de GEO e SEO em tempo real
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Monitoramento de Menções LLM:</strong> Rastreamento automático diário
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Análise de Sentimento:</strong> Classificação positiva/negativa/neutra com IA
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Integração GSC + GA4:</strong> Métricas SEO sincronizadas automaticamente
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Comparação Competitiva:</strong> Benchmarking de múltiplas marcas
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Relatórios Semanais Automatizados:</strong> Enviados por email em PDF
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Sistema de Alertas:</strong> Notificações de mudanças críticas
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <div>
                            <strong>Exportação Avançada:</strong> PDF, Excel, CSV com dados completos
                          </div>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Integrações */}
                  <AccordionItem value="faq-6" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔗 Quais integrações são suportadas?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="space-y-3">
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-blue-500">Google Search Console (GSC)</strong>
                          <p className="text-xs mt-1">Importação automática de queries, impressões, cliques, CTR e posições médias. Sincronização diária via OAuth 2.0.</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-orange-500">Google Analytics 4 (GA4)</strong>
                          <p className="text-xs mt-1">Coleta de métricas de conversão, sessões e comportamento. Integração oficial do Google.</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-purple-500">LLM Providers</strong>
                          <p className="text-xs mt-1">Conexão direta com OpenAI, Perplexity, Google AI e Anthropic para coleta de menções.</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-green-500">Resend (Email)</strong>
                          <p className="text-xs mt-1">Envio de relatórios semanais, alertas e notificações via SMTP seguro.</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs bg-primary/10 p-2 rounded"><strong>Em desenvolvimento:</strong> Slack, Zapier, Webhook customizáveis</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Segurança */}
                  <AccordionItem value="faq-7" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔒 Como meus dados são protegidos?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>A segurança é nossa prioridade máxima:</p>
                      <div className="space-y-3 mt-3">
                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>Criptografia em Trânsito</strong>
                          <p className="text-xs mt-1">Todos os dados são transmitidos via HTTPS/TLS 1.3</p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>Criptografia em Repouso</strong>
                          <p className="text-xs mt-1">Database PostgreSQL com criptografia AES-256</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-3">
                          <strong>Row Level Security (RLS)</strong>
                          <p className="text-xs mt-1">Políticas de acesso granular garantem isolamento total de dados</p>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-3">
                          <strong>Autenticação Segura</strong>
                          <p className="text-xs mt-1">JWT tokens com expiração, OAuth 2.0, senhas com bcrypt</p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-3">
                          <strong>Backup Automático</strong>
                          <p className="text-xs mt-1">Backups diários com retenção de 30 dias</p>
                        </div>
                        <div className="border-l-4 border-yellow-500 pl-3">
                          <strong>Conformidade LGPD/GDPR</strong>
                          <p className="text-xs mt-1">Processos auditados e certificados</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Preços */}
                  <AccordionItem value="faq-8" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      💰 Quais são os planos e preços?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p className="mb-3">Oferecemos planos enterprise para inteligência digital estratégica:</p>
                      
                      {/* Tabela de Planos */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-border rounded-lg">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-3 text-left border-b border-border font-bold">Plano</th>
                              <th className="p-3 text-center border-b border-border font-bold">Preço</th>
                              <th className="p-3 text-center border-b border-border font-bold">Marcas</th>
                              <th className="p-3 text-center border-b border-border font-bold">Queries/mês</th>
                              <th className="p-3 text-left border-b border-border font-bold">Recursos</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-muted/20">
                              <td className="p-3 border-b border-border font-semibold text-muted-foreground">FREE</td>
                              <td className="p-3 text-center border-b border-border">R$ 0</td>
                              <td className="p-3 text-center border-b border-border">1</td>
                              <td className="p-3 text-center border-b border-border">10</td>
                              <td className="p-3 border-b border-border text-muted-foreground">Trial 7 dias, dashboards básicos</td>
                            </tr>
                            <tr>
                              <td className="p-3 border-b border-border font-semibold text-blue-500">Starter</td>
                              <td className="p-3 text-center border-b border-border font-bold">R$ 997</td>
                              <td className="p-3 text-center border-b border-border">2</td>
                              <td className="p-3 text-center border-b border-border">100</td>
                              <td className="p-3 border-b border-border">Análise GEO + SEO, relatórios básicos</td>
                            </tr>
                            <tr className="bg-primary/5 border-2 border-primary/30">
                              <td className="p-3 border-b border-border font-semibold text-primary flex items-center gap-2">
                                Professional
                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Popular</span>
                              </td>
                              <td className="p-3 text-center border-b border-border font-bold">R$ 2.997</td>
                              <td className="p-3 text-center border-b border-border">3</td>
                              <td className="p-3 text-center border-b border-border">300</td>
                              <td className="p-3 border-b border-border">IA completa, KAPI metrics, automações</td>
                            </tr>
                            <tr>
                              <td className="p-3 border-b border-border font-semibold text-orange-500">Agency</td>
                              <td className="p-3 text-center border-b border-border font-bold">R$ 9.997</td>
                              <td className="p-3 text-center border-b border-border">∞ clientes</td>
                              <td className="p-3 text-center border-b border-border">1.000</td>
                              <td className="p-3 border-b border-border">White-label, certificação IGO, revenda</td>
                            </tr>
                            <tr className="bg-purple-500/5">
                              <td className="p-3 font-semibold text-purple-500">Enterprise</td>
                              <td className="p-3 text-center font-bold">R$ 14.997</td>
                              <td className="p-3 text-center">7</td>
                              <td className="p-3 text-center">Ilimitado</td>
                              <td className="p-3">Consultor dedicado, SLA 99.9%, detecção de alucinações</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Cards de Destaque */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-lg border border-blue-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🎯</span>
                            <strong className="text-blue-500">Para Startups</strong>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Starter ideal para empresas iniciando monitoramento de marca em LLMs
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🚀</span>
                            <strong className="text-primary">Para Empresas</strong>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Professional com IA completa, métricas KAPI e automações inteligentes
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 rounded-lg border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🏢</span>
                            <strong className="text-purple-500">Para Corporações</strong>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Enterprise com consultor dedicado, SLA garantido e suporte premium
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs bg-primary/10 p-2 rounded text-center">
                        <strong>Trial gratuito por 7 dias</strong> — Teste a plataforma completa sem compromisso
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        Todos os planos incluem acesso ao framework IGO, análise multi-LLM (ChatGPT, Claude, Gemini, Perplexity) e suporte em português.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Métricas e Cálculos */}
                  <AccordionItem value="faq-9" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      📈 Com que frequência as métricas são atualizadas?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="space-y-3">
                        <div className="bg-green-500/10 p-3 rounded">
                          <strong>Menções LLM:</strong>
                          <p className="text-xs mt-1">Coletadas <strong>diariamente às 00:00 UTC</strong> via edge function automática</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded">
                          <strong>Métricas SEO (GSC):</strong>
                          <p className="text-xs mt-1">Sincronizadas <strong>diariamente às 02:00 UTC</strong> (dados com delay de 2-3 dias do Google)</p>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded">
                          <strong>GEO Score:</strong>
                          <p className="text-xs mt-1">Recalculado <strong>automaticamente</strong> sempre que novos dados chegam</p>
                        </div>
                        <div className="bg-orange-500/10 p-3 rounded">
                          <strong>Dashboard:</strong>
                          <p className="text-xs mt-1">Atualizado em <strong>tempo real</strong> com cache de 5 minutos</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs bg-muted p-2 rounded"><strong>Nota:</strong> Você pode forçar atualização manual a qualquer momento clicando no botão de refresh.</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Previsões e Alertas Inteligentes */}
                  <AccordionItem value="faq-10" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔮 Como funcionam as previsões de GEO Score?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>A plataforma usa <strong>Regressão Linear</strong> para prever o comportamento do GEO Score:</p>
                      <div className="space-y-3 mt-3">
                        <div className="bg-blue-500/10 p-3 rounded border border-blue-500/30">
                          <strong>📊 Modelo Matemático</strong>
                          <p className="text-xs mt-2">Analisa os últimos <strong>90 dias</strong> de dados históricos para identificar tendências usando regressão linear (y = mx + b)</p>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded border border-purple-500/30">
                          <strong>📈 Horizontes de Previsão</strong>
                          <ul className="text-xs mt-2 space-y-1 ml-4">
                            <li>• <strong>7 dias:</strong> Curto prazo, alta confiança</li>
                            <li>• <strong>14 dias:</strong> Médio prazo, confiança moderada</li>
                            <li>• <strong>30 dias:</strong> Longo prazo, use como referência de tendência</li>
                          </ul>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded border border-green-500/30">
                          <strong>🎯 Intervalo de Confiança (95%)</strong>
                          <p className="text-xs mt-2">Cada previsão inclui um <strong>intervalo de confiança</strong> indicando o range esperado com 95% de probabilidade</p>
                        </div>
                        <div className="bg-orange-500/10 p-3 rounded border border-orange-500/30">
                          <strong>📉 Qualidade do Modelo (R²)</strong>
                          <ul className="text-xs mt-2 space-y-1 ml-4">
                            <li>• <strong>R² &gt; 0.80:</strong> Alta confiança - tendência clara</li>
                            <li>• <strong>R² 0.60-0.80:</strong> Média confiança - alguma volatilidade</li>
                            <li>• <strong>R² &lt; 0.60:</strong> Baixa confiança - dados muito voláteis</li>
                          </ul>
                        </div>
                      </div>
                      <p className="mt-3 text-xs bg-yellow-500/10 p-2 rounded border border-yellow-500/30">
                        <strong>⚠️ Requisitos:</strong> Mínimo de 7 dias de histórico. Eventos imprevisíveis (virais, crises) não são antecipados.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-11" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🌳 Como funciona o sistema de alertas inteligentes?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>A plataforma usa <strong>Árvore de Decisões (Decision Tree)</strong> para classificar alertas automaticamente:</p>
                      <div className="space-y-3 mt-3">
                        <div className="bg-teal-500/10 p-3 rounded border border-teal-500/30">
                          <strong>📊 5 Métricas Analisadas Simultaneamente</strong>
                          <ul className="text-xs mt-2 space-y-1 ml-4">
                            <li>• <strong>Score:</strong> Valor absoluto do GEO Score (0-100)</li>
                            <li>• <strong>Trend:</strong> Taxa de mudança nos últimos 7 dias (%)</li>
                            <li>• <strong>Frequency:</strong> Mudanças significativas em 30 dias</li>
                            <li>• <strong>Velocity:</strong> Velocidade da mudança (unidades/dia)</li>
                            <li>• <strong>Duration:</strong> Tempo desde última mudança (dias)</li>
                          </ul>
                        </div>
                        <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 via-yellow-500/10 to-green-500/10 p-3 rounded border border-border">
                          <strong>🎯 4 Níveis de Severidade</strong>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <strong className="text-red-600">CRITICAL:</strong>
                            </div>
                            <p className="text-xs">Score &lt; 30 E Trend &lt; -20%</p>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <strong className="text-orange-600">HIGH:</strong>
                            </div>
                            <p className="text-xs">Score &lt; 50 E Trend &lt; -10%</p>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <strong className="text-yellow-600">MEDIUM:</strong>
                            </div>
                            <p className="text-xs">Score &lt; 70 OU Frequency &gt; 5</p>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <strong className="text-green-600">LOW:</strong>
                            </div>
                            <p className="text-xs">Todas outras condições</p>
                          </div>
                        </div>
                        <div className="bg-primary/10 p-3 rounded border border-primary/30">
                          <strong>🔔 Notificações Automáticas</strong>
                          <ul className="text-xs mt-2 space-y-1 ml-4">
                            <li>• <strong>LOW:</strong> Nenhuma notificação (apenas log)</li>
                            <li>• <strong>MEDIUM:</strong> Email informativo (1x/dia consolidado)</li>
                            <li>• <strong>HIGH:</strong> Email imediato + badge no dashboard</li>
                            <li>• <strong>CRITICAL:</strong> Email urgente + notificação push</li>
                          </ul>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded border border-green-500/30">
                          <strong>✨ Vantagens</strong>
                          <ul className="text-xs mt-2 space-y-1 ml-4">
                            <li>• <strong>Interpretabilidade:</strong> Decisões transparentes e explicáveis</li>
                            <li>• <strong>Performance:</strong> Classificação instantânea (O(log n))</li>
                            <li>• <strong>Precisão:</strong> Reduz falso-positivos em ~60%</li>
                            <li>• <strong>Manutenibilidade:</strong> Thresholds ajustáveis sem retreinar</li>
                          </ul>
                        </div>
                      </div>
                      <p className="mt-3 text-xs bg-blue-500/10 p-2 rounded border border-blue-500/30">
                        <strong>💡 Dica:</strong> Todos os thresholds são configuráveis em tempo real sem modificar código. Acesse Configurações → Alertas.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Suporte */}
                  <AccordionItem value="faq-12" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      💬 Como funciona o suporte?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>Oferecemos múltiplos canais de suporte:</p>
                      <div className="space-y-3 mt-3">
                        <div className="flex items-start gap-3 bg-muted/50 p-3 rounded">
                          <span className="text-2xl">📧</span>
                          <div>
                            <strong>Email</strong>
                            <p className="text-xs mt-1">suporte@teiageo.com.br - Resposta em até 24h</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-3 rounded">
                          <span className="text-2xl">💬</span>
                          <div>
                            <strong>Chat ao Vivo</strong>
                            <p className="text-xs mt-1">Disponível de segunda a sexta, 9h-18h (planos Pro e Enterprise)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-3 rounded">
                          <span className="text-2xl">📚</span>
                          <div>
                            <strong>Base de Conhecimento</strong>
                            <p className="text-xs mt-1">Documentação completa, tutoriais em vídeo e guias passo a passo</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/50 p-3 rounded">
                          <span className="text-2xl">🎥</span>
                          <div>
                            <strong>Webinars Mensais</strong>
                            <p className="text-xs mt-1">Sessões ao vivo sobre melhores práticas GEO</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Configuração */}
                  <AccordionItem value="faq-11" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      ⚙️ Como configurar minha primeira marca?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>É muito simples! Siga estes passos:</p>
                      <div className="space-y-3 mt-3">
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                          <div>
                            <strong>Criar conta</strong>
                            <p className="text-xs mt-1">Cadastre-se gratuitamente em teiageo.com.br</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                          <div>
                            <strong>Adicionar marca</strong>
                            <p className="text-xs mt-1">Vá em "Marcas" → "Nova Marca" e preencha nome, domínio e keywords</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                          <div>
                            <strong>Conectar Google (opcional)</strong>
                            <p className="text-xs mt-1">Em "Configurações" → "Google Setup", autorize acesso ao GSC e GA4</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                          <div>
                            <strong>Aguardar primeira coleta</strong>
                            <p className="text-xs mt-1">Primeiros dados aparecem em até 24 horas</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                          <div>
                            <strong>Explorar o Dashboard</strong>
                            <p className="text-xs mt-1">Visualize GEO Score, menções LLM, métricas SEO e insights</p>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Performance */}
                  <AccordionItem value="faq-12" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      ⚡ Quanto tempo leva para ver resultados?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="space-y-3">
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>Primeiros Dados</strong>
                          <p className="text-xs mt-1">24-48 horas após configuração inicial</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>Baseline Estabelecida</strong>
                          <p className="text-xs mt-1">7-14 dias para coletar dados suficientes e estabelecer tendências</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-3">
                          <strong>Insights Acionáveis</strong>
                          <p className="text-xs mt-1">30 dias para identificar padrões e oportunidades de otimização</p>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-3">
                          <strong>Impacto de Otimizações</strong>
                          <p className="text-xs mt-1">60-90 dias para ver resultado de mudanças implementadas</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs bg-primary/10 p-2 rounded"><strong>Dica:</strong> GEO é uma estratégia de longo prazo. Consistência é mais importante que velocidade!</p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Limites */}
                  <AccordionItem value="faq-14" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      ⏱️ Existem limites de uso?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>Sim, os limites variam por plano conforme a tabela abaixo:</p>
                      <div className="overflow-x-auto mt-3">
                        <table className="w-full text-xs border border-border rounded">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left border-b border-border">Recurso</th>
                              <th className="p-2 text-center border-b border-border">FREE</th>
                              <th className="p-2 text-center border-b border-border">Starter</th>
                              <th className="p-2 text-center border-b border-border">Professional</th>
                              <th className="p-2 text-center border-b border-border">Agency</th>
                              <th className="p-2 text-center border-b border-border">Enterprise</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-2 border-b border-border font-medium">Marcas monitoradas</td>
                              <td className="p-2 text-center border-b border-border">1</td>
                              <td className="p-2 text-center border-b border-border">2</td>
                              <td className="p-2 text-center border-b border-border">3</td>
                              <td className="p-2 text-center border-b border-border">∞ clientes</td>
                              <td className="p-2 text-center border-b border-border">7</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border font-medium">Queries/mês</td>
                              <td className="p-2 text-center border-b border-border">10</td>
                              <td className="p-2 text-center border-b border-border">100</td>
                              <td className="p-2 text-center border-b border-border">300</td>
                              <td className="p-2 text-center border-b border-border">1.000</td>
                              <td className="p-2 text-center border-b border-border">Ilimitado</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border font-medium">Métricas KAPI</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border font-medium">Detecção de alucinações</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border font-medium">Relatórios white-label</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                              <td className="p-2 text-center border-b border-border">✓</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b border-border font-medium">SLA garantido</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">—</td>
                              <td className="p-2 text-center border-b border-border">99.9%</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium">Suporte</td>
                              <td className="p-2 text-center">Comunidade</td>
                              <td className="p-2 text-center">Email 48h</td>
                              <td className="p-2 text-center">Prioritário 24h</td>
                              <td className="p-2 text-center">Dedicado 12h</td>
                              <td className="p-2 text-center">Consultor</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Os limites de queries referem-se ao número máximo de consultas multi-LLM por mês. Cada query consulta simultaneamente ChatGPT, Claude, Gemini e Perplexity.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Troubleshooting */}
                  <AccordionItem value="faq-15" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔧 Problemas comuns e soluções
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <div className="space-y-3">
                        <div className="bg-red-500/10 p-3 rounded">
                          <strong>Problema:</strong> "Nenhuma menção encontrada"
                          <p className="text-xs mt-1"><strong>Solução:</strong> Aguarde 24-48h após cadastro. Verifique se as keywords estão corretas. Aumente a variedade de queries.</p>
                        </div>
                        <div className="bg-orange-500/10 p-3 rounded">
                          <strong>Problema:</strong> "Erro ao conectar Google Search Console"
                          <p className="text-xs mt-1"><strong>Solução:</strong> Certifique-se de que você é proprietário verificado da propriedade no GSC. Re-autentique em Configurações → Google Setup.</p>
                        </div>
                        <div className="bg-yellow-500/10 p-3 rounded">
                          <strong>Problema:</strong> "GEO Score muito baixo"
                          <p className="text-xs mt-1"><strong>Solução:</strong> GEO Score abaixo de 30 é normal para marcas novas. Foque em criar conteúdo autoritativo, obter backlinks de qualidade e aumentar presença digital.</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded">
                          <strong>Problema:</strong> "Dados do GSC desatualizados"
                          <p className="text-xs mt-1"><strong>Solução:</strong> Google tem delay de 2-3 dias. Isso é normal. Aguarde a sincronização automática ou force refresh manual.</p>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded">
                          <strong>Problema:</strong> "Não recebi o relatório semanal"
                          <p className="text-xs mt-1"><strong>Solução:</strong> Verifique pasta de spam. Adicione noreply@teiageo.com.br aos contatos seguros. Entre em contato com suporte se persistir.</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sistema de Retry Automático */}
                  <AccordionItem value="faq-16" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🔄 Como funciona o Sistema de Retry Automático?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>O Sistema de Retry Automático aumenta a resiliência da plataforma através de:</p>
                      <div className="space-y-3 mt-3">
                        <div className="border-l-4 border-blue-500 pl-3">
                          <strong>Exponential Backoff</strong>
                          <p className="text-xs mt-1">Tentativas automáticas com intervalos crescentes: 2s → 4s → 8s</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-3">
                          <strong>Edge Functions Críticas</strong>
                          <p className="text-xs mt-1">Aplicado em: coleta de menções LLM, cálculo de métricas IGO, sync Google Analytics e geração de relatórios</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-3">
                          <strong>Monitoramento Inteligente</strong>
                          <p className="text-xs mt-1">Logs detalhados de tentativas e falhas, alertas automáticos via Sentry</p>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Resultado:</strong> Taxa de sucesso aumentada em 40%, redução de falhas temporárias em 85%
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Dashboard System Health */}
                  <AccordionItem value="faq-17" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🏥 O que é o Dashboard System Health?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>O Dashboard System Health (<code className="bg-muted px-1 rounded">/system-health</code>) oferece visibilidade total da infraestrutura:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-green-500">✓ Score Geral do Sistema</strong>
                          <p className="text-xs mt-1">Agregação ponderada de todos os componentes (0-100)</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-blue-500">✓ Health por Setor</strong>
                          <p className="text-xs mt-1">Edge Functions, Database, Authentication, Storage</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-purple-500">✓ Métricas Operacionais</strong>
                          <p className="text-xs mt-1">Latência, taxa de erro, throughput, uptime</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded">
                          <strong className="text-orange-500">✓ Auto-Refresh</strong>
                          <p className="text-xs mt-1">Atualização automática a cada 30 segundos</p>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Acesso:</strong> Menu lateral → "System Health" ou navegue para <code className="bg-muted px-1 rounded">/system-health</code>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Certificação Platinum 100% */}
                  <AccordionItem value="faq-18" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🏆 O que significa a Certificação Platinum 100%?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>A Certificação Platinum 100% atesta que a plataforma atingiu excelência operacional máxima:</p>
                      <div className="space-y-3 mt-3">
                        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-yellow-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">💎</span>
                            <strong className="text-lg">Critérios de Certificação</strong>
                          </div>
                          <ul className="text-xs space-y-2 ml-4">
                            <li>✓ Sistema de Retry Automático implementado e testado</li>
                            <li>✓ Dashboard System Health com monitoramento em tempo real</li>
                            <li>✓ Tratamento de erros robusto em todas as Edge Functions</li>
                            <li>✓ Logging estruturado e rastreamento completo</li>
                            <li>✓ Cache inteligente de queries LLM (redução de 60% de custos)</li>
                            <li>✓ Validação matemática dos cálculos GEO/IGO</li>
                            <li>✓ Testes automatizados (E2E + unitários)</li>
                            <li>✓ Documentação técnica completa e auditada</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Validação:</strong> Auditoria matemática externa confirmou precisão de 100% nos cálculos de GEO Score, CPI, ICE e GAP
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Novas Métricas de Performance */}
                  <AccordionItem value="faq-19" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      📊 Quais são as novas métricas de performance?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>Recentemente implementamos métricas avançadas de monitoramento:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-muted/50 p-3 rounded border-l-4 border-blue-500">
                          <strong>Cache Hit Rate</strong>
                          <p className="text-xs mt-1 text-muted-foreground">Taxa de acerto do cache de queries LLM</p>
                          <p className="text-lg font-bold text-blue-500 mt-2">60% economia</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded border-l-4 border-green-500">
                          <strong>Tempo de Resposta</strong>
                          <p className="text-xs mt-1 text-muted-foreground">Latência média das Edge Functions</p>
                          <p className="text-lg font-bold text-green-500 mt-2">{"<"}200ms P95</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded border-l-4 border-purple-500">
                          <strong>Success Rate</strong>
                          <p className="text-xs mt-1 text-muted-foreground">Taxa de sucesso com retry automático</p>
                          <p className="text-lg font-bold text-purple-500 mt-2">99.7% uptime</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded border-l-4 border-orange-500">
                          <strong>Error Recovery</strong>
                          <p className="text-xs mt-1 text-muted-foreground">Recuperação automática de falhas</p>
                          <p className="text-lg font-bold text-orange-500 mt-2">85% redução</p>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Acompanhamento:</strong> Todas as métricas disponíveis no Dashboard System Health com histórico de 30 dias
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Correções Recentes */}
                  <AccordionItem value="faq-20" className="bg-muted/30 px-4 rounded-lg border border-border/40">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      🐛 Quais foram as correções de bugs recentes?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p>Últimas correções implementadas (Novembro 2025):</p>
                      <div className="space-y-3 mt-3">
                        <div className="bg-green-500/10 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓ RESOLVIDO</span>
                            <strong>Relatórios semanais vazios</strong>
                          </div>
                          <p className="text-xs mt-1">Edge function <code className="bg-muted px-1">send-scheduled-weekly-reports</code> agora valida dados antes de enviar. Sistema de retry garante múltiplas tentativas.</p>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓ RESOLVIDO</span>
                            <strong>Percentuais errados em PDFs</strong>
                          </div>
                          <p className="text-xs mt-1">Correção na formatação de números decimais para porcentagens. Agora exibe corretamente valores como "85.3%" ao invés de "85.300%".</p>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓ RESOLVIDO</span>
                            <strong>Timeout em coletas de menções</strong>
                          </div>
                          <p className="text-xs mt-1">Implementado retry automático com exponential backoff. Taxa de falha reduzida de 15% para 2%.</p>
                        </div>
                        <div className="bg-green-500/10 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">✓ RESOLVIDO</span>
                            <strong>Inconsistências em cálculos IGO</strong>
                          </div>
                          <p className="text-xs mt-1">Auditoria matemática revelou arredondamentos incorretos. Fórmulas revisadas e validadas externamente. Precisão agora em 100%.</p>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded mt-3">
                        <strong>Próximas melhorias:</strong> Otimização de queries pesadas, implementação de cache distribuído, melhorias no sistema de alertas
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </section>

            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Botão Flutuante Voltar ao Topo */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={scrollToTop}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          title="Voltar ao Topo"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Documentation;
