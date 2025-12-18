import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  FileText, ArrowUp, Home, LayoutDashboard, Brain, BookOpen, Building2, 
  Target, Link2, Library, Rocket, Trophy, Zap, Wrench, BarChart3, Sparkles, 
  RefreshCw, TrendingUp, Shield, Calculator, GitBranch, Bell, HelpCircle, 
  CheckCircle2, AlertTriangle, CircleAlert, Lightbulb, Search, DollarSign, 
  Lock, MessageSquare, Mail, Video, Settings, Clock, Check, Database, 
  Globe, Code2, Cpu, Server, Activity, Eye, Users, Calendar, Award
} from "lucide-react";
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
    <div className="container mx-auto p-6 space-y-6 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border border-primary/20 p-6 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl border border-primary/30">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Teia GEO — Inteligência Artificial Generativa Observacional
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="gap-2 border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
              title="Voltar à Home"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="default"
              size="sm"
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
              title="Ir para Dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <DownloadTechnicalPDF />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background via-muted/20 to-background backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <CardHeader className="relative">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Documentação Técnica
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-250px)] pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              
              <section>
                <h2 className="text-2xl font-bold mb-4">Visão Geral</h2>
                <p className="text-muted-foreground">Este sistema fornece análise de GEO (Generative Engine Optimization) e monitoramento de marcas em LLMs, com geração automática de relatórios e alertas.</p>
              </section>

              {/* IGO Framework Section */}
              <section className="relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-primary/10 p-8 rounded-xl border border-primary/30 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="relative flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-50 animate-pulse" />
                    <div className="relative p-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl border border-primary/40 backdrop-blur-sm">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                      IGO Framework
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Intelligence Generative Observability · First LATAM Implementation
                    </p>
                  </div>
                </div>

                <div className="relative space-y-6">
                  {/* O que é IGO */}
                  <div className="bg-background/80 p-6 rounded-lg border border-border/40 backdrop-blur-sm hover:border-primary/30 transition-all">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      O que é o IGO Framework?
                    </h3>
                    <p className="text-sm mb-4 leading-relaxed text-muted-foreground">
                      O <strong className="text-foreground">IGO (Intelligence Generative Observability)</strong> é um framework proprietário pioneiro na América Latina 
                      que implementa o conceito de <strong className="text-foreground">"IA observando IA"</strong>. Diferente de abordagens tradicionais de SEO, 
                      o IGO monitora e analisa como diferentes Large Language Models (LLMs) mencionam e recomendam marcas, 
                      criando uma camada de <strong className="text-foreground">governança semântica</strong> sobre a presença digital.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all group">
                        <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">Multi-LLM Tracking</p>
                        <p className="text-xs text-muted-foreground">ChatGPT, Claude, Gemini, Perplexity</p>
                      </div>
                      <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20 hover:border-secondary/40 transition-all group">
                        <p className="font-semibold text-sm mb-1 group-hover:text-secondary transition-colors">Convergência Cognitiva</p>
                        <p className="text-xs text-muted-foreground">Análise de consistência entre LLMs</p>
                      </div>
                      <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-4 rounded-lg border border-accent/20 hover:border-accent/40 transition-all group">
                        <p className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">Semantic Governance</p>
                        <p className="text-xs text-muted-foreground">Controle de narrativa generativa</p>
                      </div>
                    </div>
                  </div>

                  {/* 5 Pilares */}
                  <div className="bg-background/80 p-6 rounded-lg border border-border/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      Os 5 Pilares GEO do Framework IGO
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-500/5 p-4 rounded-r-lg hover:bg-blue-500/10 transition-all">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-blue-500 font-mono">GEO-01</span> Base Técnica
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Fundação técnica para rastreamento por LLMs: SEO tradicional, crawlability, dados estruturados (Schema.org), 
                          sitemap XML e performance técnica.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">Crawlability</span>
                          <span className="text-xs bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">Schema.org</span>
                          <span className="text-xs bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">Core Web Vitals</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-green-500 pl-4 bg-green-500/5 p-4 rounded-r-lg hover:bg-green-500/10 transition-all">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-green-500 font-mono">GEO-02</span> Estrutura Semântica
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Ontologia de marca e identidade verbal: definição clara de quem você é, o que faz e como é diferente. 
                          Estruturação de conhecimento para interpretação correta pelos LLMs.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">Knowledge Graph</span>
                          <span className="text-xs bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">Brand Ontology</span>
                          <span className="text-xs bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">Semantic Context</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-4 bg-purple-500/5 p-4 rounded-r-lg hover:bg-purple-500/10 transition-all">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-purple-500 font-mono">GEO-03</span> Relevância Conversacional
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Alinhamento com padrões de linguagem natural dos LLMs (AEO - Answer Engine Optimization). 
                          Otimização para respostas conversacionais e citações em contextos relevantes.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">AEO</span>
                          <span className="text-xs bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">LLM Alignment</span>
                          <span className="text-xs bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">Conversational Patterns</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-4 bg-orange-500/5 p-4 rounded-r-lg hover:bg-orange-500/10 transition-all">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-orange-500 font-mono">GEO-04</span> Autoridade Cognitiva
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reputação e confiança percebida pelos LLMs através de backlinks, menções em fontes confiáveis, 
                          presença em bases de conhecimento e histórico de citações.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">Trust Signals</span>
                          <span className="text-xs bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">Citation Network</span>
                          <span className="text-xs bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">Knowledge Authority</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-pink-500 pl-4 bg-pink-500/5 p-4 rounded-r-lg hover:bg-pink-500/10 transition-all">
                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                          <span className="text-pink-500 font-mono">GEO-05</span> Inteligência Estratégica
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Análise, monitoramento e governança contínua. Tracking de menções multi-LLM, análise de divergência semântica, 
                          ajustes estratégicos baseados em dados observacionais.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">Multi-LLM Analytics</span>
                          <span className="text-xs bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">Semantic Divergence</span>
                          <span className="text-xs bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">Strategic Governance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CPI Score */}
                  <div className="bg-background/80 p-6 rounded-lg border border-border/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      Métrica Proprietária: CPI Score
                    </h3>
                    
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5 rounded-lg border border-purple-500/30">
                      <p className="font-bold mb-2 text-lg">Cognitive Predictive Index (CPI)</p>
                      <p className="text-sm mb-3 text-muted-foreground">
                        O <strong className="text-foreground">CPI</strong> mede a <strong className="text-foreground">consistência preditiva inter-IA</strong>: o quanto diferentes LLMs 
                        são previsíveis e uniformes ao mencionar sua marca. Valores altos (≥80) indicam forte governança semântica 
                        e posicionamento consolidado entre OpenAI, Claude, Gemini e Perplexity.
                      </p>
                      
                      <div className="bg-background/60 p-4 rounded-lg text-xs space-y-2 border border-border/30">
                        <p><strong>Fórmula:</strong> CPI = 100 - (Desvio Padrão das Taxas de Menção × Fator de Normalização)</p>
                        <p><strong>Interpretação:</strong></p>
                        <ul className="ml-4 space-y-1 text-muted-foreground">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> <strong className="text-foreground">80-100:</strong> Alta convergência - LLMs concordam consistentemente</li>
                          <li className="flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-yellow-500" /> <strong className="text-foreground">50-79:</strong> Convergência moderada - variação esperada</li>
                          <li className="flex items-center gap-2"><CircleAlert className="h-3 w-3 text-red-500" /> <strong className="text-foreground">0-49:</strong> Divergência alta - requer análise e ajustes</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Componentes */}
                  <div className="bg-background/80 p-6 rounded-lg border border-border/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Link2 className="h-5 w-5 text-primary" />
                      </div>
                      Componentes da Plataforma IGO
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-lg border border-border/40 hover:border-primary/30 transition-all group">
                        <h4 className="font-semibold mb-2 text-sm group-hover:text-primary transition-colors">IGO Dashboard</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Visualização central do framework com métricas de governança, convergência cognitiva e consenso multi-LLM.
                        </p>
                        <p className="text-xs font-mono text-primary">/igo-dashboard</p>
                      </div>

                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-lg border border-border/40 hover:border-primary/30 transition-all group">
                        <h4 className="font-semibold mb-2 text-sm group-hover:text-primary transition-colors">IGO Observability</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Timeline multi-LLM, análise de divergência semântica e score de governança contextual em tempo real.
                        </p>
                        <p className="text-xs font-mono text-primary">/igo-observability</p>
                      </div>

                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-lg border border-border/40 hover:border-primary/30 transition-all group">
                        <h4 className="font-semibold mb-2 text-sm group-hover:text-primary transition-colors">IGO Observational Layer</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Camada de observação IA-sobre-IA: tracking de menções, confiança e contexto em múltiplos provedores LLM.
                        </p>
                        <p className="text-xs font-mono text-primary">/llm-mentions</p>
                      </div>

                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-lg border border-border/40 hover:border-primary/30 transition-all group">
                        <h4 className="font-semibold mb-2 text-sm group-hover:text-primary transition-colors">Nucleus Command Center</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Central de execução de queries multi-LLM com tracking de resultados e análise comparativa.
                        </p>
                        <p className="text-xs font-mono text-primary">/nucleus</p>
                      </div>
                    </div>
                  </div>

                  {/* Documentação */}
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-5 rounded-lg border border-primary/40">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-3">
                      <Library className="h-5 w-5 text-primary" />
                      Documentação Técnica Completa
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">V3.4</span>
                    </p>
                    <p className="text-xs mb-3 text-muted-foreground">
                      Para entender a fundamentação teórica, metodologia de cálculo e casos de uso do IGO Framework, 
                      consulte o laudo técnico completo disponível via botão de download no topo desta página.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-primary/20 px-3 py-1 rounded-full text-xs border border-primary/30">Metodologia Detalhada</span>
                      <span className="bg-secondary/20 px-3 py-1 rounded-full text-xs border border-secondary/30">Casos de Uso</span>
                      <span className="bg-accent/20 px-3 py-1 rounded-full text-xs border border-accent/30">Algoritmos Proprietários</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Atualizações Recentes */}
              <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-6 rounded-xl border border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent" />
                <h2 className="relative text-2xl font-bold mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Atualizações Recentes da Plataforma
                  </span>
                </h2>
                
                <div className="relative space-y-6">
                  {/* PLATINUM Architecture */}
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-5 rounded-xl border-2 border-green-500/40 hover:border-green-500/60 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/30 rounded-full blur-lg animate-pulse" />
                        <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                          <Trophy className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            Arquitetura SaaS 100/100 — PLATINUM PERFECT
                          </h3>
                          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">NOVO</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sistema completamente automatizado para qualquer marca/usuário. Zero configuração manual.
                        </p>
                      </div>
                    </div>

                    <div className="ml-16 space-y-4">
                      {/* Triggers */}
                      <div className="bg-background/80 p-4 rounded-lg border border-green-500/20 backdrop-blur-sm">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Triggers Automáticos para Novas Marcas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
                            <p className="font-mono text-xs text-primary mb-1">auto_create_brand_automations</p>
                            <p className="text-xs text-muted-foreground">Cria 4 automações automaticamente: coleta de menções, métricas GEO, análise SEO, verificação de alertas</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
                            <p className="font-mono text-xs text-primary mb-1">auto_create_welcome_alert</p>
                            <p className="text-xs text-muted-foreground">Cria alerta de boas-vindas com confirmação de configuração</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
                            <p className="font-mono text-xs text-primary mb-1">sync_cpi_on_igo</p>
                            <p className="text-xs text-muted-foreground">Calcula e sincroniza CPI automaticamente quando métricas IGO são inseridas</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
                            <p className="font-mono text-xs text-primary mb-1">cascade_metric_changes</p>
                            <p className="text-xs text-muted-foreground">Cria alertas automáticos quando scores mudam ≥5%</p>
                          </div>
                        </div>
                      </div>

                      {/* Funções */}
                      <div className="bg-background/80 p-4 rounded-lg border border-green-500/20 backdrop-blur-sm">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-blue-500" />
                          Funções de Monitoramento Global
                        </h4>
                        <div className="space-y-2">
                          {[
                            { name: 'validate_platform_consistency()', desc: 'Valida integridade entre todas as tabelas do sistema' },
                            { name: 'get_platform_health()', desc: 'Retorna status de saúde completo da plataforma em JSON' },
                            { name: 'cleanup_old_data()', desc: 'Limpeza automática de cache expirado, logs antigos e jobs concluídos' },
                            { name: 'calculate_cpi_from_igo()', desc: 'Fórmula padronizada: ICE×35% + (100-GAP)×30% + Stability×35%' }
                          ].map((fn, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{fn.name}</p>
                                <p className="text-xs text-muted-foreground">{fn.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* KAPI Metrics */}
                      <div className="bg-background/80 p-4 rounded-lg border border-green-500/20 backdrop-blur-sm">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-purple-500" />
                          Métricas KAPI Centralizadas
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { name: 'ICE', value: '≥ 80%', color: 'blue' },
                            { name: 'GAP', value: '≥ 75%', color: 'purple' },
                            { name: 'Stability', value: '≥ 70%', color: 'orange' },
                            { name: 'CPI', value: '≥ 60%', color: 'green' }
                          ].map((metric, i) => (
                            <div key={i} className={`bg-${metric.color}-500/10 p-3 rounded-lg text-center border border-${metric.color}-500/20`}>
                              <p className="font-bold text-sm">{metric.name}</p>
                              <p className="text-xs text-muted-foreground">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Todas as métricas usam lógica direta (maior = melhor) conforme documentação científica.
                        </p>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                        <p className="text-xs flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <strong>Garantia SaaS:</strong> Qualquer nova marca registrada automaticamente recebe todas as configurações, 
                          automações e monitoramento. Zero intervenção manual necessária.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nucleus Chat */}
                  <div className="bg-background/80 p-5 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Nucleus Chat — Assistente IA para Análise de Dados</h3>
                        <p className="text-sm text-muted-foreground">
                          Sistema de chat inteligente integrado que permite consultar dados da plataforma usando linguagem natural.
                        </p>
                      </div>
                    </div>

                    <div className="ml-14 space-y-3">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          Funcionalidades
                        </h4>
                        <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
                          <li>• <strong className="text-foreground">Consultas em SQL Natural:</strong> Pergunte sobre seus dados sem escrever SQL</li>
                          <li>• <strong className="text-foreground">Análise de Métricas:</strong> "Qual meu GEO Score da última semana?"</li>
                          <li>• <strong className="text-foreground">Comparações:</strong> "Compare as menções entre OpenAI e Claude"</li>
                          <li>• <strong className="text-foreground">Insights Automáticos:</strong> Sugestões baseadas nos seus dados</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-blue-500" />
                          Implementação Técnica
                        </h4>
                        <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
                          <li>• <strong className="text-foreground">Edge Function:</strong> <code className="bg-background px-1 rounded">nucleus-chat</code></li>
                          <li>• <strong className="text-foreground">Modelo IA:</strong> Lovable AI (google/gemini-2.5-flash)</li>
                          <li>• <strong className="text-foreground">Segurança:</strong> Queries validadas e restritas ao usuário autenticado</li>
                          <li>• <strong className="text-foreground">Interface:</strong> Chat streaming em tempo real</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                        <p className="text-xs flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500" />
                          <strong>Como usar:</strong> Acesse o <strong>Nucleus Center</strong> no menu lateral e comece a conversar com seus dados!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Google Analytics Sync */}
                  <div className="bg-background/80 p-5 rounded-xl border border-border/40 hover:border-secondary/30 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-gradient-to-br from-secondary to-accent text-secondary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Google Analytics Sync</h3>
                        <p className="text-sm text-muted-foreground">
                          Sincronização automática de dados do Google Search Console e Google Analytics 4.
                        </p>
                      </div>
                    </div>

                    <div className="ml-14 space-y-3">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-green-500" />
                          O que é coletado
                        </h4>
                        <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
                          <li>• <strong className="text-foreground">GA4:</strong> Pageviews, sessões, taxa de engajamento, bounce rate</li>
                          <li>• <strong className="text-foreground">GSC:</strong> Queries, cliques, impressões, CTR, posição média</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Server className="h-4 w-4 text-purple-500" />
                          Edge Functions
                        </h4>
                        <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
                          <li>• <code className="bg-background px-1 rounded">analytics-sync</code>: Orquestrador principal</li>
                          <li>• <code className="bg-background px-1 rounded">fetch-ga4-data</code>: Busca dados do GA4</li>
                          <li>• <code className="bg-background px-1 rounded">fetch-gsc-queries</code>: Busca queries do GSC</li>
                        </ul>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                        <p className="text-xs flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-green-500" />
                          <strong>Automação:</strong> Roda automaticamente a cada 6 horas via cron job. Configure em <strong>/google-setup</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Monitoramento */}
                  <div className="bg-background/80 p-5 rounded-xl border border-border/40 hover:border-accent/30 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-gradient-to-br from-accent to-primary text-accent-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Monitoramento e Performance</h3>
                        <p className="text-sm text-muted-foreground">
                          Sistema completo de observabilidade e rastreamento de erros.
                        </p>
                      </div>
                    </div>

                    <div className="ml-14 space-y-3">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          Sentry Integration
                        </h4>
                        <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
                          <li>• Rastreamento de erros em produção</li>
                          <li>• Session replay para debug de problemas</li>
                          <li>• Performance monitoring automático</li>
                          <li>• Source maps para stack traces legíveis</li>
                        </ul>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          Cron Jobs Dashboard
                        </h4>
                        <ul className="text-xs space-y-1 ml-4 text-muted-foreground">
                          <li>• Visualização de jobs agendados</li>
                          <li>• Histórico de execuções</li>
                          <li>• Status e métricas em tempo real</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Próximas Features */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5 rounded-xl border border-purple-500/30">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      Próximas Funcionalidades
                    </h4>
                    <ul className="text-xs space-y-2 ml-4 text-muted-foreground">
                      <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-purple-500" /> Dashboard de backups automatizados</li>
                      <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-purple-500" /> Sistema avançado de alertas com notificações push</li>
                      <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-purple-500" /> Análise comparativa entre múltiplas brands</li>
                      <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-purple-500" /> Export de dados em múltiplos formatos</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Arquitetura de Dados */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Database className="h-6 w-6 text-primary" />
                  Arquitetura de Dados
                </h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Tabelas Principais</h3>
                
                <div className="space-y-4">
                  {[
                    { name: 'brands', desc: 'Armazena informações das marcas monitoradas.', fields: ['id: UUID único da marca', 'name: Nome da marca', 'domain: Domínio da marca', 'user_id: ID do usuário proprietário'] },
                    { name: 'geo_scores', desc: 'Armazena pontuações GEO calculadas.', fields: ['brand_id: Referência à marca', 'score: Pontuação numérica (0-100)', 'breakdown: Detalhamento em JSON', 'computed_at: Data/hora do cálculo'] },
                    { name: 'mentions_llm', desc: 'Registra menções da marca em diferentes LLMs.', fields: ['provider: OpenAI, Perplexity, Google AI, Claude', 'query: Query usada para detecção', 'mentioned: Se foi mencionada', 'confidence: Nível de confiança (0-1)'] },
                    { name: 'scheduled_reports', desc: 'Configura relatórios agendados por usuário.', fields: ['frequency: daily, weekly, monthly', 'report_type: performance, mentions, comprehensive', 'enabled: Se está ativo', 'next_run: Próxima execução'] }
                  ].map((table, i) => (
                    <div key={i} className="bg-muted/30 p-5 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                      <h4 className="font-semibold text-lg mb-2 text-primary">{table.name}</h4>
                      <p className="text-sm mb-3 text-muted-foreground">{table.desc}</p>
                      <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
                        {table.fields.map((field, j) => (
                          <li key={j}><code className="bg-muted px-2 py-0.5 rounded text-xs">{field.split(':')[0]}</code>: {field.split(':')[1]}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Análise Preditiva */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30">
                    <Sparkles className="h-6 w-6 text-indigo-500" />
                  </div>
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Análise Preditiva com Regressão Linear
                  </span>
                </h2>
                
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-6 rounded-xl border border-indigo-500/40 mb-6">
                  <p className="text-lg font-semibold mb-4">
                    Sistema de Machine Learning para previsão de GEO Scores
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A plataforma implementa <strong className="text-foreground">regressão linear</strong> para prever o comportamento do GEO Score 
                    nos próximos <strong className="text-foreground">7, 14 e 30 dias</strong>, baseando-se em dados históricos dos últimos 90 dias.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/30 p-5 rounded-xl border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-500" />
                      Modelo Matemático
                    </h3>
                    <code className="block bg-background p-4 rounded-lg text-xs whitespace-pre-wrap font-mono">
{`Modelo Linear: y = mx + b

Slope (m):
m = Σ((xi - x̄)(yi - ȳ)) / Σ((xi - x̄)²)

Intercept (b):
b = ȳ - m × x̄

R² (Qualidade):
R² = 1 - (SS_res / SS_tot)`}
                    </code>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-xl border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      Intervalo de Confiança (95%)
                    </h3>
                    <code className="block bg-background p-4 rounded-lg text-xs whitespace-pre-wrap font-mono">
{`SE = √(MSE × (1 + 1/n + (x - x̄)² / Σ(xi - x̄)²))

IC = ŷ ± (t × SE)

Onde:
• MSE = Mean Squared Error
• t ≈ 1.96 (para n > 30)
• SE = Standard Error`}
                    </code>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="font-bold text-lg">Interpretação dos Resultados</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                      <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Alta Confiança (R² &gt; 0.80)
                      </p>
                      <p className="text-xs text-muted-foreground">Tendência clara e previsível. Previsões confiáveis.</p>
                    </div>
                    
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                      <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Média Confiança (R² 0.60-0.80)
                      </p>
                      <p className="text-xs text-muted-foreground">Tendência moderada. Use previsões com cautela.</p>
                    </div>
                    
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                      <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                        <CircleAlert className="h-4 w-4 text-red-500" />
                        Baixa Confiança (R² &lt; 0.60)
                      </p>
                      <p className="text-xs text-muted-foreground">Dados voláteis. Previsões incertas.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sistema de Alertas */}
              <section>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg border border-emerald-500/30">
                    <GitBranch className="h-6 w-6 text-emerald-500" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    Sistema de Alertas Inteligentes com Árvore de Decisões
                  </span>
                </h2>
                
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 rounded-xl border border-emerald-500/40 mb-6">
                  <p className="text-lg font-semibold mb-4">
                    Classificação automática de severidade usando Decision Tree
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A plataforma implementa <strong className="text-foreground">Árvore de Decisões (Decision Tree)</strong> para classificar 
                    automaticamente a severidade dos alertas em <strong className="text-foreground">4 níveis</strong> (Low, Medium, High, Critical), 
                    analisando <strong className="text-foreground">5 métricas simultaneamente</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/30 p-5 rounded-xl border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-teal-500" />
                      Métricas Analisadas
                    </h3>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">Score:</strong> Valor absoluto do GEO Score (0-100)</li>
                      <li><strong className="text-foreground">Trend:</strong> Taxa de mudança nos últimos 7 dias (%)</li>
                      <li><strong className="text-foreground">Frequency:</strong> Mudanças significativas em 30 dias</li>
                      <li><strong className="text-foreground">Velocity:</strong> Velocidade da mudança (unidades/dia)</li>
                      <li><strong className="text-foreground">Duration:</strong> Tempo desde última mudança (dias)</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-xl border border-border/40">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-500" />
                      Níveis de Severidade
                    </h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { level: 'CRITICAL', color: 'red', rule: 'Score < 30 E Trend < -20%' },
                        { level: 'HIGH', color: 'orange', rule: 'Score < 50 E Trend < -10%' },
                        { level: 'MEDIUM', color: 'yellow', rule: 'Score < 70 OU Frequency > 5' },
                        { level: 'LOW', color: 'green', rule: 'Todas outras condições' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${item.color}-500`}></div>
                          <strong className={`text-${item.color}-600`}>{item.level}:</strong>
                          <span className="text-muted-foreground text-xs">{item.rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 p-5 rounded-xl mb-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Integração com Notificações
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-background/50 p-3 rounded-lg">
                      <strong className="text-green-600">LOW</strong>
                      <p className="text-muted-foreground mt-1">Nenhuma notificação (apenas log)</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <strong className="text-yellow-600">MEDIUM</strong>
                      <p className="text-muted-foreground mt-1">Email informativo (1x/dia consolidado)</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <strong className="text-orange-600">HIGH</strong>
                      <p className="text-muted-foreground mt-1">Email imediato + badge no dashboard</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <strong className="text-red-600">CRITICAL</strong>
                      <p className="text-muted-foreground mt-1">Email urgente + notificação push</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section>
                <div className="flex items-center gap-3 mb-6 mt-8">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/30">
                    <HelpCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    FAQ — Perguntas Frequentes
                  </h2>
                </div>

                <Accordion type="multiple" className="space-y-4">
                  
                  <AccordionItem value="estrutura-1" className="bg-muted/30 px-4 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        O que é a arquitetura híbrida GEO+SEO implementada?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p className="text-muted-foreground">A Teia GEO utiliza uma <strong className="text-foreground">arquitetura híbrida convergente</strong> que combina:</p>
                      <ul className="space-y-2 ml-4 text-muted-foreground">
                        <li>• <strong className="text-foreground">GEO (Generative Engine Optimization):</strong> Otimização para motores de IA generativa (ChatGPT, Claude, Gemini, Perplexity)</li>
                        <li>• <strong className="text-foreground">SEO (Search Engine Optimization):</strong> Otimização tradicional para buscadores (Google, Bing)</li>
                      </ul>
                      <div className="bg-primary/10 p-4 rounded-lg mt-3 border border-primary/20">
                        <strong>Diferencial Técnico:</strong>
                        <p className="text-xs mt-1 text-muted-foreground">Sistema único que analisa simultaneamente visibilidade orgânica e menções em IA, usando métricas padronizadas 0-100 para comparação direta.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-geo" className="bg-muted/30 px-4 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-purple-500" />
                        O que é GEO e por que é importante?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p className="text-muted-foreground"><strong className="text-foreground">GEO (Generative Engine Optimization)</strong> é a evolução natural do SEO para a era da Inteligência Artificial Generativa.</p>
                      <div className="bg-primary/10 p-4 rounded-lg mt-3 border border-primary/20">
                        <strong>Por que é importante?</strong>
                        <ul className="text-xs mt-2 ml-4 space-y-1 text-muted-foreground">
                          <li>• Usuários estão cada vez mais consultando IAs em vez de buscar no Google</li>
                          <li>• Ser mencionado em respostas de IA aumenta autoridade e credibilidade</li>
                          <li>• Empresas que ignoram GEO estão perdendo visibilidade para concorrentes</li>
                          <li>• IAs generativas se tornaram o novo portal de descoberta de marcas</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-llms" className="bg-muted/30 px-4 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-green-500" />
                        Quais LLMs são monitorados?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p className="text-muted-foreground">Atualmente monitoramos os principais LLMs do mercado:</p>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {[
                          { name: 'OpenAI ChatGPT', desc: 'GPT-4o e GPT-4o-mini' },
                          { name: 'Perplexity AI', desc: 'Perplexity Pro' },
                          { name: 'Google Gemini', desc: 'Gemini 2.0 e 2.5 Flash' },
                          { name: 'Anthropic Claude', desc: 'Claude 3.5 Sonnet' }
                        ].map((llm, i) => (
                          <div key={i} className="bg-muted/50 p-3 rounded-lg border border-border/30">
                            <strong className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              {llm.name}
                            </strong>
                            <p className="text-xs mt-1 text-muted-foreground">{llm.desc}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-security" className="bg-muted/30 px-4 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-500" />
                        Como meus dados são protegidos?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p className="text-muted-foreground">A segurança é nossa prioridade máxima:</p>
                      <div className="space-y-3 mt-3">
                        {[
                          { icon: Shield, color: 'green', title: 'Criptografia em Trânsito', desc: 'Todos os dados são transmitidos via HTTPS/TLS 1.3' },
                          { icon: Database, color: 'blue', title: 'Criptografia em Repouso', desc: 'Database PostgreSQL com criptografia AES-256' },
                          { icon: Lock, color: 'purple', title: 'Row Level Security (RLS)', desc: 'Políticas de acesso granular garantem isolamento total de dados' },
                          { icon: Users, color: 'orange', title: 'Autenticação Segura', desc: 'JWT tokens com expiração, OAuth 2.0, senhas com bcrypt' }
                        ].map((item, i) => (
                          <div key={i} className={`border-l-4 border-${item.color}-500 pl-4`}>
                            <strong className="flex items-center gap-2">
                              <item.icon className={`h-4 w-4 text-${item.color}-500`} />
                              {item.title}
                            </strong>
                            <p className="text-xs mt-1 text-muted-foreground">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-support" className="bg-muted/30 px-4 rounded-xl border border-border/40 hover:border-primary/30 transition-all">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-cyan-500" />
                        Como funciona o suporte?
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pt-2">
                      <p className="text-muted-foreground">Oferecemos múltiplos canais de suporte:</p>
                      <div className="space-y-3 mt-3">
                        {[
                          { icon: Mail, title: 'Email', desc: 'suporte@teiageo.com.br - Resposta em até 24h' },
                          { icon: MessageSquare, title: 'Chat ao Vivo', desc: 'Disponível de segunda a sexta, 9h-18h (planos Pro e Enterprise)' },
                          { icon: Library, title: 'Base de Conhecimento', desc: 'Documentação completa, tutoriais em vídeo e guias passo a passo' },
                          { icon: Video, title: 'Webinars Mensais', desc: 'Sessões ao vivo sobre melhores práticas GEO' }
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg border border-border/30">
                            <item.icon className="h-5 w-5 text-primary" />
                            <div>
                              <strong>{item.title}</strong>
                              <p className="text-xs mt-1 text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </section>

              {/* Segurança */}
              <section className="mt-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Lock className="h-6 w-6 text-primary" />
                  Segurança e RLS
                </h2>
                <div className="bg-muted/30 p-5 rounded-xl border border-border/40">
                  <p className="text-sm text-muted-foreground mb-4">Exemplo de política RLS:</p>
                  <code className="block bg-background p-4 rounded-lg text-xs font-mono">
                    CREATE POLICY "Users can view their own brands"<br/>
                    ON brands FOR SELECT<br/>
                    USING (auth.uid() = user_id);
                  </code>
                </div>
              </section>

              {/* Variáveis de Ambiente */}
              <section className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Variáveis de Ambiente</h2>
                <div className="bg-muted/30 p-5 rounded-xl border border-border/40">
                  <p className="font-semibold mb-3">Supabase</p>
                  <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                    <li>• SUPABASE_URL</li>
                    <li>• SUPABASE_ANON_KEY</li>
                    <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                  </ul>
                </div>
              </section>

            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all z-50"
        size="icon"
        title="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default Documentation;
