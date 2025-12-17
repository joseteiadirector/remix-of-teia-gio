import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, Circle, AlertCircle, TrendingUp, 
  Shield, Zap, Database, Code, Users, BarChart3,
  Rocket, Target, AlertTriangle, Clock
} from "lucide-react";

export const MaturityAnalysisSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Análise de Maturidade TRL 6 → 100%
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Caminho para 100% de Maturidade
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Status atual, gaps identificados e roadmap completo para atingir excelência total
          </p>
        </div>

        {/* Status Atual Global */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Status Atual: TRL 6</h3>
              <p className="text-muted-foreground">
                Plataforma validada tecnicamente, pronta para pilotos B2B
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">80%</div>
              <div className="text-sm text-muted-foreground">Prontidão Global</div>
            </div>
          </div>
          <Progress value={80} className="h-4" />
        </Card>

        {/* Breakdown por Categoria */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <CategoryCard
            icon={<Code />}
            title="Funcionalidade"
            score={98}
            status="excellent"
            items={[
              { name: "Core Features", done: true },
              { name: "Integrações", done: true },
              { name: "Edge Functions", done: true },
              { name: "Automação", done: true },
            ]}
          />
          
          <CategoryCard
            icon={<Zap />}
            title="Performance"
            score={95}
            status="excellent"
            items={[
              { name: "Otimização Backend", done: true },
              { name: "Cache Inteligente", done: true },
              { name: "Sync Paralela", done: true },
              { name: "CDN", done: false },
            ]}
          />
          
          <CategoryCard
            icon={<Shield />}
            title="Segurança"
            score={85}
            status="good"
            items={[
              { name: "RLS Policies", done: true },
              { name: "Auth System", done: true },
              { name: "Leaked Password", done: false },
              { name: "Cache Público", done: false },
            ]}
          />
          
          <CategoryCard
            icon={<BarChart3 />}
            title="Monitoramento"
            score={80}
            status="good"
            items={[
              { name: "Error Tracking", done: true },
              { name: "Performance Monitor", done: true },
              { name: "Sentry DSN Prod", done: false },
              { name: "Uptime Alerts", done: false },
            ]}
          />
          
          <CategoryCard
            icon={<Database />}
            title="Backup & Recovery"
            score={40}
            status="critical"
            items={[
              { name: "Versioning Lovable", done: true },
              { name: "Auto Backup DB", done: false },
              { name: "GitHub Backup", done: false },
              { name: "Disaster Recovery", done: false },
            ]}
          />
          
          <CategoryCard
            icon={<Users />}
            title="Documentação"
            score={100}
            status="excellent"
            items={[
              { name: "Docs Técnicas", done: true },
              { name: "API Docs", done: true },
              { name: "Guias Operacionais", done: true },
              { name: "Tutoriais", done: true },
            ]}
          />
        </div>

        {/* Processos e Fases Completos */}
        <Card className="p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Processos e Fluxos Operacionais
          </h3>
          
          <div className="space-y-8">
            {/* Coleta de Dados */}
            <ProcessFlow
              phase="1. COLETA DE DADOS"
              status="operational"
              components={[
                { name: "Coleta LLM Mentions", edge: "collect-llm-mentions", status: "✅" },
                { name: "Coleta GSC Queries", edge: "fetch-gsc-queries", status: "✅" },
                { name: "Coleta GA4 Data", edge: "fetch-ga4-data", status: "✅" },
                { name: "Cache Inteligente", system: "llm_query_cache", status: "✅" },
              ]}
            />

            {/* Processamento */}
            <ProcessFlow
              phase="2. PROCESSAMENTO & ANÁLISE"
              status="operational"
              components={[
                { name: "Cálculo GEO Score", edge: "calculate-geo-metrics", status: "✅" },
                { name: "Análise de URLs", edge: "analyze-url", status: "✅" },
                { name: "Predições IA", edge: "ai-predictions", status: "✅" },
                { name: "Analytics IA", edge: "ai-analytics", status: "✅" },
              ]}
            />

            {/* Automação */}
            <ProcessFlow
              phase="3. AUTOMAÇÃO & ORQUESTRAÇÃO"
              status="operational"
              components={[
                { name: "Orchestrator", edge: "automation-orchestrator", status: "✅" },
                { name: "Cron Jobs", system: "pg_cron", status: "✅" },
                { name: "Scheduled Reports", edge: "send-scheduled-weekly-reports", status: "✅" },
                { name: "URL Monitoring", edge: "run-scheduled-analyses", status: "✅" },
              ]}
            />

            {/* Notificações */}
            <ProcessFlow
              phase="4. NOTIFICAÇÕES & ALERTAS"
              status="operational"
              components={[
                { name: "Sistema de Alertas", table: "alerts_history", status: "✅" },
                { name: "Email Reports", edge: "send-weekly-report", status: "✅" },
                { name: "Limit Warnings", edge: "send-limit-warning", status: "✅" },
                { name: "Welcome Emails", edge: "send-welcome-email", status: "✅" },
              ]}
            />

            {/* Integrações Externas */}
            <ProcessFlow
              phase="5. INTEGRAÇÕES EXTERNAS"
              status="operational"
              components={[
                { name: "Google Search Console", system: "GSC", status: "✅" },
                { name: "Google Analytics 4", system: "GA4", status: "✅" },
                { name: "Multi-LLM (ChatGPT, Claude, Gemini, Perplexity)", system: "LLM", status: "✅" },
                { name: "Email Notifications (Resend)", system: "email", status: "✅" },
              ]}
            />
          </div>
        </Card>

        {/* Scores e Métricas */}
        <Card className="p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Scores, Métricas e Indicadores
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <ScoreCategory
              title="GEO Score (0-100)"
              description="Framework proprietário de 5 pilares"
              metrics={[
                "Base Técnica (20%) - GEO-01",
                "Estrutura Semântica (20%) - GEO-02",
                "Relevância Conversacional (20%) - GEO-03",
                "Autoridade Cognitiva (20%) - GEO-04",
                "Inteligência Estratégica (20%) - GEO-05",
              ]}
              status="✅ Implementado"
            />
            
            <ScoreCategory
              title="Métricas SEO"
              description="Integração completa com Google"
              metrics={[
                "Organic Traffic (GA4)",
                "Clicks & Impressions (GSC)",
                "CTR & Position (GSC)",
                "Conversion Rate (GA4)",
                "Gap Analysis (GEO vs SEO)",
              ]}
              status="✅ Implementado"
            />
            
            <ScoreCategory
              title="Análise de URLs"
              description="Scores técnicos detalhados"
              metrics={[
                "Overall Score (0-100)",
                "Performance Score",
                "Accessibility Score",
                "Technical Issues Detection",
                "Competitor Analysis",
              ]}
              status="✅ Implementado"
            />
            
            <ScoreCategory
              title="Predições & IA"
              description="Análise preditiva e insights"
              metrics={[
                "Regressão Linear (R² confidence)",
                "Anomaly Detection (2σ)",
                "Trend Analysis",
                "Smart Suggestions",
                "Tool Calling Structured Output",
              ]}
              status="✅ Implementado"
            />
          </div>
        </Card>

        {/* O que falta para 100% */}
        <Card className="p-8 mb-12 border-2 border-primary/50">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            Roadmap para 100% (20% restantes)
          </h3>
          
          <div className="space-y-6">
            {/* Crítico */}
            <ImprovementCategory
              priority="critical"
              title="CRÍTICO (Bloqueante) - 10%"
              items={[
                {
                  name: "Configurar Backup Automático do Banco",
                  impact: "🔴 ALTO",
                  effort: "15 min",
                  description: "Daily backups + point-in-time recovery no Supabase"
                },
                {
                  name: "Conectar ao GitHub",
                  impact: "🔴 ALTO",
                  effort: "5 min",
                  description: "Backup do código + controle de versão + CI/CD futuro"
                },
              ]}
            />

            {/* Alta Prioridade */}
            <ImprovementCategory
              priority="high"
              title="ALTA PRIORIDADE (Recomendado) - 6%"
              items={[
                {
                  name: "Habilitar Leaked Password Protection",
                  impact: "🟡 MÉDIO",
                  effort: "2 min",
                  description: "Proteção contra senhas vazadas via UI"
                },
                {
                  name: "Configurar Sentry DSN para Produção",
                  impact: "🟡 MÉDIO",
                  effort: "5 min",
                  description: "Monitoramento robusto de erros em produção"
                },
                {
                  name: "Restringir Cache Público (llm_query_cache)",
                  impact: "🟡 MÉDIO",
                  effort: "10 min",
                  description: "Limitar acesso apenas para authenticated users"
                },
              ]}
            />

            {/* Média Prioridade */}
            <ImprovementCategory
              priority="medium"
              title="MÉDIA PRIORIDADE (Nice to Have) - 3%"
              items={[
                {
                  name: "Configurar CDN para Assets",
                  impact: "🟢 BAIXO",
                  effort: "30 min",
                  description: "Melhorar performance de carregamento de imagens"
                },
                {
                  name: "Revisar Service Role Permissions",
                  impact: "🟢 BAIXO",
                  effort: "20 min",
                  description: "Princípio do menor privilégio"
                },
                {
                  name: "Alertas de Uptime",
                  impact: "🟢 BAIXO",
                  effort: "15 min",
                  description: "Monitorar disponibilidade 24/7"
                },
              ]}
            />

            {/* Futuro */}
            <ImprovementCategory
              priority="low"
              title="FUTURO (Evolutivo) - 1%"
              items={[
                {
                  name: "CI/CD Pipeline",
                  impact: "🔵 MUITO BAIXO",
                  effort: "2-4 horas",
                  description: "Deploy automático + testes automatizados"
                },
                {
                  name: "Staging Environment",
                  impact: "🔵 MUITO BAIXO",
                  effort: "1 hora",
                  description: "Ambiente de homologação separado"
                },
                {
                  name: "A/B Testing Framework",
                  impact: "🔵 MUITO BAIXO",
                  effort: "4-8 horas",
                  description: "Testar features com subconjuntos de usuários"
                },
              ]}
            />
          </div>
        </Card>

        {/* Timeline de Implementação */}
        <Card className="p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Timeline Sugerida
          </h3>
          
          <div className="space-y-6">
            <TimelinePhase
              phase="Imediato (Hoje)"
              duration="~20 minutos"
              tasks={[
                "Configurar backup automático do banco",
                "Conectar ao GitHub",
                "Testar restore de backup",
              ]}
              outcome="✅ Sistema em 90% de prontidão"
            />
            
            <TimelinePhase
              phase="Primeiras 24h"
              duration="~20 minutos"
              tasks={[
                "Habilitar leaked password protection",
                "Configurar Sentry DSN",
                "Restringir cache público",
                "Monitorar logs ativamente",
              ]}
              outcome="✅ Sistema em 96% de prontidão"
            />
            
            <TimelinePhase
              phase="Primeira Semana"
              duration="~2 horas"
              tasks={[
                "Validar todas funcionalidades em produção",
                "Revisar service role permissions",
                "Configurar CDN para assets",
                "Setup alertas de uptime",
              ]}
              outcome="✅ Sistema em 99% de prontidão"
            />
            
            <TimelinePhase
              phase="Primeiro Mês"
              duration="Evolutivo"
              tasks={[
                "Implementar CI/CD pipeline",
                "Criar staging environment",
                "A/B testing framework",
                "Refinamentos baseados em feedback real",
              ]}
              outcome="🎯 Sistema em 100% - TRL 7 Alcançado"
            />
          </div>
        </Card>

        {/* Conclusão */}
        <Card className="p-8 mt-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <div className="text-center">
            <Badge className="mb-4" variant="default">
              Análise Concluída
            </Badge>
            <h3 className="text-2xl font-bold mb-4">
              Plataforma Teia GEO está em 80% de maturidade
            </h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              Com apenas <strong>40 minutos de trabalho</strong> nas melhorias críticas e alta prioridade,
              a plataforma alcançará <strong>96% de prontidão</strong> e estará pronta para produção em escala.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Funcionalidade</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Performance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">85%</div>
                <div className="text-sm text-muted-foreground">Segurança</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">40%</div>
                <div className="text-sm text-muted-foreground">Backup</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

// Helper Components

const CategoryCard = ({ 
  icon, 
  title, 
  score, 
  status, 
  items 
}: { 
  icon: React.ReactNode; 
  title: string; 
  score: number; 
  status: 'excellent' | 'good' | 'critical';
  items: { name: string; done: boolean }[];
}) => {
  const statusColors = {
    excellent: 'text-green-500 bg-green-500/10',
    good: 'text-yellow-500 bg-yellow-500/10',
    critical: 'text-red-500 bg-red-500/10',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${statusColors[status]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <div className="text-2xl font-bold text-primary">{score}%</div>
        </div>
      </div>
      <Progress value={score} className="mb-4 h-2" />
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={item.done ? '' : 'text-muted-foreground'}>{item.name}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const ProcessFlow = ({ 
  phase, 
  status, 
  components 
}: { 
  phase: string; 
  status: 'operational' | 'partial' | 'planned';
  components: Array<{ name: string; edge?: string; table?: string; system?: string; status: string }>;
}) => {
  return (
    <div className="border-l-4 border-primary pl-6">
      <div className="flex items-center gap-3 mb-3">
        <h4 className="text-lg font-bold">{phase}</h4>
        <Badge variant={status === 'operational' ? 'default' : 'outline'}>
          {status === 'operational' ? '✅ Operacional' : '⏳ Em Desenvolvimento'}
        </Badge>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {components.map((comp, i) => (
          <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
            <span className="text-lg">{comp.status}</span>
            <div className="flex-1">
              <div className="font-medium">{comp.name}</div>
              {comp.edge && <div className="text-xs text-muted-foreground">Edge: {comp.edge}</div>}
              {comp.table && <div className="text-xs text-muted-foreground">Table: {comp.table}</div>}
              {comp.system && <div className="text-xs text-muted-foreground">System: {comp.system}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoreCategory = ({ 
  title, 
  description, 
  metrics, 
  status 
}: { 
  title: string; 
  description: string; 
  metrics: string[]; 
  status: string;
}) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">{status}</Badge>
      </div>
      <ul className="space-y-1.5">
        {metrics.map((metric, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>{metric}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ImprovementCategory = ({ 
  priority, 
  title, 
  items 
}: { 
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  items: Array<{ name: string; impact: string; effort: string; description: string }>;
}) => {
  const colors = {
    critical: 'border-red-500 bg-red-500/5',
    high: 'border-yellow-500 bg-yellow-500/5',
    medium: 'border-blue-500 bg-blue-500/5',
    low: 'border-gray-500 bg-gray-500/5',
  };

  const icons = {
    critical: <AlertTriangle className="w-5 h-5 text-red-500" />,
    high: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    medium: <TrendingUp className="w-5 h-5 text-blue-500" />,
    low: <Circle className="w-5 h-5 text-gray-500" />,
  };

  return (
    <div className={`border-l-4 pl-6 py-4 ${colors[priority]}`}>
      <div className="flex items-center gap-2 mb-4">
        {icons[priority]}
        <h4 className="font-bold text-lg">{title}</h4>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-background border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h5 className="font-semibold flex-1">{item.name}</h5>
              <div className="flex gap-2">
                <Badge variant="outline">{item.impact}</Badge>
                <Badge variant="secondary">{item.effort}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelinePhase = ({ 
  phase, 
  duration, 
  tasks, 
  outcome 
}: { 
  phase: string; 
  duration: string; 
  tasks: string[]; 
  outcome: string;
}) => {
  return (
    <div className="relative pl-8 pb-6 border-l-2 border-primary/30 last:border-0">
      <div className="absolute left-0 top-0 -ml-[9px] w-4 h-4 rounded-full bg-primary border-4 border-background" />
      <div className="mb-2">
        <h4 className="font-bold text-lg">{phase}</h4>
        <Badge variant="outline" className="mt-1">{duration}</Badge>
      </div>
      <ul className="space-y-1 mb-3">
        {tasks.map((task, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            {task}
          </li>
        ))}
      </ul>
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm font-medium">{outcome}</p>
      </div>
    </div>
  );
};
