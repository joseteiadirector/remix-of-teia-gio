# Teia GEO - Visão Técnica Completa
## Plataforma de Inteligência Generativa Observacional (IGO)

---

## 1. CONCEITO FUNDAMENTAL

### 1.1 Definição
**Teia GEO** é uma plataforma SaaS pioneira de **IA de Segunda Ordem** (Meta-IA) que observa, analisa e quantifica o comportamento de múltiplas Large Language Models (LLMs) em relação a marcas e empresas.

### 1.2 Inovação Principal
- **Não usa apenas IA** - estuda o comportamento de IAs
- **Análise comparativa multi-LLM** em tempo real
- **Primeira plataforma IGO** (Inteligência Generativa Observacional) do mercado
- **Framework trigeracional** único: SEO + GEO + IA Reflexiva

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Stack Tecnológico

#### Frontend
```
- React 18.3.1 (TypeScript)
- Vite (Build tool)
- Tailwind CSS + shadcn/ui (Design System)
- TanStack Query (State Management)
- React Router DOM (Routing)
- Recharts (Data Visualization)
- Framer Motion (Animations)
```

#### Backend (Lovable Cloud / Supabase)
```
- PostgreSQL (Database)
- Supabase Auth (Authentication)
- Edge Functions (Deno runtime)
- Row Level Security (RLS)
- Realtime subscriptions
```

#### APIs Externas
```
- Lovable AI Gateway (Gemini 2.5 Flash, GPT-5)
- OpenAI API (ChatGPT)
- Perplexity API
- Anthropic API (Claude)
- Google AI API (Gemini)
- Resend API (Email)
```

### 2.2 Estrutura de Dados

#### Tabelas Principais

**brands**
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- name: TEXT
- domain: TEXT
- description: TEXT
- context: TEXT
- created_at: TIMESTAMP
```

**mentions_llm**
```sql
- id: BIGINT (PK)
- brand_id: UUID (FK)
- provider: TEXT (chatgpt, gemini, claude, perplexity)
- query: TEXT
- mentioned: BOOLEAN
- confidence: NUMERIC(0-1)
- answer_excerpt: TEXT
- collected_at: TIMESTAMP
```

**geo_scores**
```sql
- id: BIGINT (PK)
- brand_id: UUID (FK)
- score: NUMERIC (0-100)
- breakdown: JSONB (pilares)
- computed_at: TIMESTAMP
```

**geo_pillars_monthly**
```sql
- id: UUID (PK)
- brand_id: UUID (FK)
- month_year: DATE
- geo_score_final: NUMERIC
- base_tecnica: NUMERIC
- estrutura_semantica: NUMERIC
- relevancia_conversacional: NUMERIC
- autoridade_cognitiva: NUMERIC
- inteligencia_estrategica: NUMERIC
- total_queries: INTEGER
- total_mentions: INTEGER
```

**seo_metrics_daily**
```sql
- id: UUID (PK)
- brand_id: UUID (FK)
- date: DATE
- organic_traffic: INTEGER
- total_clicks: INTEGER
- total_impressions: INTEGER
- avg_position: NUMERIC
- ctr: NUMERIC
- conversion_rate: NUMERIC
```

**gsc_queries**
```sql
- id: UUID (PK)
- brand_id: UUID (FK)
- query: TEXT
- clicks: INTEGER
- impressions: INTEGER
- ctr: NUMERIC
- position: NUMERIC
- collected_at: TIMESTAMP
```

**url_analysis_history**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- url: TEXT
- overall_score: NUMERIC
- geo_score: NUMERIC
- seo_score: NUMERIC
- analysis_data: JSONB
- summary: TEXT
- created_at: TIMESTAMP
```

**url_optimization_tasks**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- analysis_id: UUID (FK)
- url: TEXT
- title: TEXT
- description: TEXT
- category: ENUM (geo, seo, technical, content, performance)
- priority: ENUM (low, medium, high)
- status: ENUM (pending, in_progress, completed)
- estimated_impact: NUMERIC
- completed_at: TIMESTAMP
```

**ai_insights**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- brand_id: UUID (FK)
- type: TEXT
- title: TEXT
- content: JSONB
- created_at: TIMESTAMP
```

**alerts_history**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- brand_id: UUID (FK)
- alert_type: TEXT
- title: TEXT
- message: TEXT
- priority: ENUM (low, medium, high)
- read: BOOLEAN
- metadata: JSONB
- created_at: TIMESTAMP
```

**automation_configs & automation_jobs**
```sql
- Configurações de automações agendadas
- Histórico de execução de jobs
- Suporte para coleta automática de dados
```

---

## 3. FUNCIONALIDADES IMPLEMENTADAS

### 3.1 Core Features

#### A. Monitoramento Multi-LLM
**Coleta de Menções**
- Edge Function: `collect-llm-mentions`
- Monitora 4 LLMs: ChatGPT, Gemini, Claude, Perplexity
- Gera queries contextuais automaticamente
- Analisa confiança e sentimento com IA
- Armazena histórico completo de menções
- Cache de queries para otimização

**Análise Comparativa**
- Compara comportamento entre diferentes LLMs
- Identifica discrepâncias e padrões
- Métricas de menção por provedor
- Trending e variações temporais

#### B. Cálculo de GEO Score (0-100)
**Framework de 5 Pilares**

1. **Base Técnica (20%)** - GEO-01
   - SEO técnico tradicional
   - Indexação por crawlers de IA
   - Dados estruturados avançados
   - APIs de indexação semântica

2. **Estrutura Semântica (20%)** - GEO-02
   - Ontologia de marca
   - Identidade verbal consistente
   - Mapeamento semântico
   - Narrativas de expertise

3. **Relevância Conversacional (20%)** - GEO-03
   - Conversational mapping
   - Alinhamento com padrões LLM
   - Answer Engine Optimization (AEO)
   - E-E-A-T (Experience, Expertise, Authority, Trust)

4. **Autoridade Cognitiva (20%)** - GEO-04
   - Reputação digital e citações
   - Publicações IA-driven
   - Knowledge Graphs
   - Feedback loops

5. **Inteligência Estratégica (20%)** - GEO-05
   - Observabilidade GEO
   - Analytics avançado
   - Aprendizado adaptativo
   - Governança semântica

**Edge Function:** `calculate-geo-metrics`
- Calcula score agregado
- Breakdown por pilar
- Armazenamento mensal de evolução
- Integração com métricas SEO

#### C. Métricas SEO Integradas
**Coleta Google Search Console**
- Edge Function: `fetch-gsc-queries`
- Integração via Service Account
- Queries, cliques, impressões, CTR, posição
- Auditoria de operações
- Limpeza automática de dados antigos (90 dias)

**Coleta Google Analytics 4**
- Edge Function: `fetch-ga4-data`
- Tráfego orgânico
- Conversões
- Métricas de engajamento

**Métricas Diárias**
- Histórico de performance SEO
- Comparação GEO vs SEO (Gap Analysis)
- Correlação entre visibilidade tradicional e generativa

#### D. Análise de URLs
**Edge Function:** `analyze-url`
- Análise técnica completa
- Score GEO e SEO unificado
- Recomendações por categoria
- Detecção de problemas técnicos
- Análise de competidores
- Geração automática de tarefas

**Geração de Tarefas**
- Categorização: GEO, SEO, técnico, conteúdo, performance
- Priorização: baixa, média, alta
- Estimativa de impacto
- Tracking de conclusão

**Monitoramento Agendado**
- Frequência configurável (diária, semanal, mensal)
- Alertas em mudanças significativas
- Histórico de análises

#### E. Previsões com IA
**Edge Function:** `ai-predictions`

**Algoritmo de Regressão Linear**
```javascript
// Predição de GEO Score futuro
y = mx + b
onde:
- y = GEO Score previsto
- m = tendência (slope)
- x = dias no futuro
- b = intercepto
```

**Cálculo de Confiança**
```javascript
R² (Coeficiente de Determinação)
- R² > 0.7: Alta confiança
- 0.4 < R² ≤ 0.7: Média confiança  
- R² ≤ 0.4: Baixa confiança
```

**Detecção de Anomalias**
- Baseado em desvio padrão (2σ)
- Identificação de spikes e drops
- Alertas automáticos

**Sugestões Inteligentes**
- Análise de gaps entre pilares
- Recomendações priorizadas por impacto
- Baseado em dados históricos

#### F. Insights com IA
**Edge Function:** `ai-analytics`
- Análise de tendências
- Identificação de oportunidades
- Comparação com benchmarks
- Sugestões de otimização

**Tool Calling para Estruturação**
```javascript
tools: [{
  type: "function",
  function: {
    name: "suggest_tasks",
    parameters: {
      suggestions: [{
        title: string,
        priority: "low"|"medium"|"high",
        category: string
      }]
    }
  }
}]
```

#### G. Sistema de Alertas
**Tipos de Alerta**
1. **Threshold Alert** - Score abaixo do limite
2. **Score Decrease** - Queda significativa
3. **Score Increase** - Aumento relevante
4. **New Mention** - Nova menção detectada

**Configurações**
- Por usuário
- Threshold personalizável
- Prioridades (baixa, média, alta)
- Email opcional

**Histórico**
- Todas as notificações registradas
- Status de leitura
- Metadados customizados

#### H. Relatórios Automatizados
**Edge Functions:**
- `send-weekly-report`
- `send-scheduled-weekly-reports`
- `weekly-reset-notification`

**Conteúdo dos Relatórios**
- GEO Score atual e tendência
- Menções por LLM
- Comparativo semanal
- Métricas SEO integradas
- Insights e recomendações

**Entrega**
- Via Resend API
- HTML formatado
- Agendamento configurável
- Logs de envio

#### I. Auditoria de Relatórios
**Edge Function:** `audit-report-data`

**Validações**
- Consistência matemática de scores
- Divergências entre fontes
- Completude de dados
- Anomalias detectadas

**Métricas de Qualidade**
- % de divergência máxima
- Número de inconsistências
- Status de validação
- PDF gerado com resultados

#### J. API Pública
**Edge Function:** `public-api`

**Endpoints**
```
GET /scores?brand_id={id}
- Retorna GEO scores históricos

GET /mentions?brand_id={id}
- Lista menções em LLMs

GET /metrics?brand_id={id}
- Métricas agregadas
```

**Autenticação**
- API Keys gerenciadas
- Rate limiting (100 req/min padrão)
- Logs de requisições
- Controle por usuário

#### K. Dashboard Customizável
**Widgets Disponíveis**
1. **WidgetUnifiedScore** - Score principal
2. **WidgetWeeklyVariation** - Variação semanal
3. **WidgetScoreCard** - Cards de métricas
4. **WidgetMentionsChart** - Gráfico de menções
5. **WidgetTrendsChart** - Tendências temporais
6. **WidgetAlertsCard** - Alertas recentes
7. **WidgetBrandsOverview** - Overview de marcas
8. **WidgetAIAnalytics** - Insights de IA
9. **WidgetPredictions** - Previsões futuras

**Configuração**
- Layout drag-and-drop (preparado)
- Salvamento de preferências
- Personalização por usuário

### 3.2 Automação

**Cron Jobs (via pg_cron)**
```sql
-- Coleta diária de métricas (8h)
send-scheduled-weekly-reports

-- Reset semanal de notificações
weekly-reset-notification

-- Análises agendadas
run-scheduled-analyses
```

**Orchestrator**
- Edge Function: `automation-orchestrator`
- Gerenciamento centralizado de jobs
- Retry automático em falhas
- Logs detalhados

### 3.3 Integrações

#### Google Search Console
- OAuth2 via Service Account
- Coleta de queries orgânicas
- Métricas de performance
- Validação de segurança implementada

#### Google Analytics 4
- Property ID configurável
- Coleta de tráfego e conversões
- Integração com métricas GEO

#### Resend (Email)
- Relatórios semanais
- Alertas
- Notificações de limites
- Emails transacionais

#### Lovable AI
- Modelo padrão: google/gemini-2.5-flash
- Alternativas: GPT-5, Gemini Pro
- Streaming e não-streaming
- Tool calling para estruturação

---

## 4. SEGURANÇA

### 4.1 Row Level Security (RLS)
**Todas as tabelas implementam RLS**
```sql
-- Exemplo: brands
CREATE POLICY "Users can view their own brands"
ON brands FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands"
ON brands FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4.2 Validação GSC
- Verificação de credenciais
- Validação de domain ownership
- Rate limiting em coletas
- Logs de auditoria

### 4.3 Secrets Management
**Variáveis de Ambiente (Supabase Secrets)**
```
- LOVABLE_API_KEY (auto-provisionado)
- RESEND_API_KEY
- OPENAI_API_KEY
- PERPLEXITY_API_KEY
- ANTHROPIC_API_KEY
- GOOGLE_AI_API_KEY
- GSC_CREDENTIALS_JSON
- GA4_PROPERTY_ID
```

---

## 5. PERFORMANCE

### 5.1 Otimizações Implementadas

**Cache**
- LLM Query Cache (7 dias)
- Hit count tracking
- Redução de custos de API

**Query Optimization**
- Indexes em foreign keys
- Pagination em listas grandes
- Lazy loading de componentes

**Rate Limiting**
- API pública: 100 req/min
- Proteção contra abuse
- Throttling adaptativo

### 5.2 Monitoramento
- Sentry integrado (error tracking)
- Console logs estruturados
- Network request monitoring
- Performance metrics

---

## 6. METODOLOGIA GEO

### 6.1 Framework Proprietário
**20 Módulos Práticos**
- 4 módulos por pilar
- Checklist de implementação
- Métricas de avaliação
- Benchmarks da indústria

### 6.2 Métricas Proprietárias

**GEO Score (0-100)**
```
Score = Σ(Pilar_i × Peso_i)
onde: cada pilar tem peso 20%
```

**ICE Score**
```
ICE = (Impact × Confidence × Ease) / 3
- Impact: 0-10
- Confidence: 0-10  
- Ease: 0-10
```

**GAP Analysis**
```
GAP = |GEO_Score - SEO_Score|
- Identifica discrepâncias
- Prioriza otimizações
```

**CPI (Contextual Predictive Index)**
```
CPI = (Menções Positivas / Total de Queries) × 100
- Mede relevância conversacional
```

---

## 7. ANÁLISE COMPETITIVA

### 7.1 Diferenciação

**Vs. Ferramentas SEO Tradicionais**
- Não apenas ranqueamento
- Foca em recomendações generativas
- Multi-LLM analysis

**Vs. Monitoring Tools**
- Não apenas tracking
- Framework estruturado de otimização
- Previsões com IA

**Vs. AI Analytics**
- Não apenas insights
- Métricas proprietárias acionáveis
- Metodologia científica (IGO)

### 7.2 Pioneirismo
✅ Primeira plataforma IGO do mercado
✅ IA de Segunda Ordem (Meta-IA)
✅ Framework trigeracional único
✅ Análise comparativa multi-LLM
✅ Disciplina própria estabelecida

---

## 8. ROADMAP TÉCNICO

### 8.1 Já Implementado ✅
- [x] Monitoramento multi-LLM (4 providers)
- [x] Cálculo de GEO Score
- [x] Integração GSC/GA4
- [x] Análise de URLs
- [x] Previsões com regressão linear
- [x] Sistema de alertas
- [x] Relatórios automatizados
- [x] API pública
- [x] Dashboard customizável
- [x] Auditoria de dados
- [x] Automações

### 8.2 Potenciais Expansões 🔮
- [ ] Mais LLMs (Meta LLama, Mistral, Cohere)
- [ ] Análise de imagens (como IAs veem visualmente)
- [ ] Integração com CMS (WordPress, Webflow)
- [ ] A/B testing de estratégias GEO
- [ ] Benchmarking setorial
- [ ] API para agências/white-label
- [ ] Mobile app (iOS/Android)
- [ ] Chrome extension
- [ ] Slack/Teams integration

---

## 9. DOCUMENTAÇÃO PARA USUÁRIOS

### 9.1 Página de Documentação
**src/pages/Documentation.tsx**

**Seções**
1. Visão Geral
2. Arquitetura de Dados
3. Sistema de Relatórios
4. Edge Functions
5. Sistema de Alertas
6. APIs Externas
7. Segurança (RLS)
8. Variáveis de Ambiente
9. Manutenção
10. **Análise Preditiva** (Regressão Linear)
11. FAQ Técnica
12. FAQ Usuário Final

### 9.2 Landing Page
**src/pages/Index/**

**Seções**
1. **Hero** - Proposta de valor
2. **Arquitetura Técnica** - Cloud SaaS
3. **O que é GEO** - Educação
4. **Convergência Híbrida** - SEO+GEO+IA
5. **LLMs Monitoradas** - 4 providers
6. **IA de Segunda Ordem** - Diferencial
7. **Framework** - 5 pilares, 20 módulos
8. **Recursos** - Funcionalidades
9. **Como Começar** - Onboarding
10. **CTA** - Conversão
11. **Footer** - Links e contato

---

## 10. MATURIDADE DO PRODUTO

### TRL 6 (Technology Readiness Level)
**Sistema validado em ambiente relevante**

✅ Arquitetura completa implementada
✅ Funcionalidades core operacionais
✅ Integrações externas funcionais
✅ Segurança implementada
✅ Testes internos realizados
✅ Documentação técnica completa
🟡 Aguardando pilotos B2B/clientes reais
🟡 Validação de mercado pendente

---

## 11. MODELO DE NEGÓCIO

### 11.1 Monetização
**Freemium SaaS**
- Tier gratuito (limitado)
- Pro ($$/mês) - múltiplas marcas
- Business ($$$$/mês) - API, white-label
- Enterprise (custom) - on-premise, SLA

### 11.2 Limites Sugeridos
```
Free:
- 1 marca
- 100 queries/mês
- Relatórios semanais
- Sem API

Pro:
- 5 marcas
- 1000 queries/mês
- Relatórios diários
- API básica (100 req/min)

Business:
- Ilimitado
- Queries ilimitadas
- Relatórios customizados
- API completa (1000 req/min)
- Suporte prioritário
```

---

## 12. CUSTOS OPERACIONAIS ESTIMADOS

### APIs Externas (por 1000 requisições)
```
- Lovable AI: ~$0.01-0.05
- OpenAI GPT-5: ~$0.50
- Claude: ~$0.40
- Perplexity: ~$0.02
- Gemini: ~$0.01

Estimativa mensal (100 marcas ativas):
~$50-200/mês em APIs
```

### Infraestrutura (Supabase)
```
- Database: Free tier até 500MB
- Edge Functions: Free tier 500K invocations
- Storage: Free tier 1GB

Scale esperado:
- Pro: ~$25/mês
- Team: ~$599/mês (múltiplas workspaces)
```

---

## 13. PRÓXIMOS PASSOS TÉCNICOS

### 13.1 Refinamentos Imediatos
1. Testes de carga (stress testing)
2. Otimização de queries lentas
3. Implementação de cache Redis (opcional)
4. Monitoring com Datadog/New Relic
5. CI/CD pipeline automatizado

### 13.2 Features de Validação
1. Onboarding wizard interativo
2. Tutorial em vídeo na plataforma
3. Comparativo competidor (até 3 marcas)
4. Exportação de dados (CSV, PDF)
5. Integrações Zapier/Make

---

## 14. CONSIDERAÇÕES FINAIS

### 14.1 Pontos Fortes
✅ Conceito verdadeiramente inovador (IGO)
✅ Arquitetura robusta e escalável
✅ Framework metodológico estruturado
✅ Stack moderno e bem documentado
✅ Funcionalidades completas do core
✅ Diferenciação clara no mercado

### 14.2 Desafios
⚠️ Mercado emergente (educação necessária)
⚠️ Custo de APIs pode escalar rápido
⚠️ Dependência de múltiplas APIs externas
⚠️ Validação de produto-mercado pendente
⚠️ Competição futura previsível

### 14.3 Oportunidades
🚀 First-mover advantage (IGO)
🚀 Mercado de GEO em rápido crescimento
🚀 Demanda clara de agências/empresas
🚀 Expansão para consultoria/treinamento
🚀 White-label para software houses

---

## 15. CONCLUSÃO TÉCNICA

**Teia GEO é uma plataforma tecnicamente sólida, arquiteturalmente bem projetada e conceitualmente pioneira.**

A combinação de:
- **IA de Segunda Ordem** (Meta-IA observando IAs)
- **Framework proprietário** (20 módulos estruturados)  
- **Análise multi-LLM** (4 providers simultâneos)
- **Métricas inovadoras** (GEO Score, CPI, GAP)
- **Stack moderno** (React, Supabase, Edge Functions)

Cria uma **proposta de valor única** no mercado de marketing digital e inteligência artificial.

O produto está em **TRL 6** (validado tecnicamente, pronto para pilotos) e tem potencial para inaugurar uma **nova disciplina** no mercado: **Inteligência Generativa Observacional (IGO)**.

---

**Documento Gerado:** 2025-01-10  
**Versão:** 1.0  
**Autor:** Análise técnica da plataforma Teia GEO  
**Confidencial:** Uso interno / investidores / parceiros estratégicos
