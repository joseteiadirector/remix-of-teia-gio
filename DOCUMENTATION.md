# Documentação Oficial do Sistema Teia GEO IGO

## 📋 DADOS CADASTRAIS E REGISTROS OFICIAIS

### Titular e Autor Intelectual
**JOSE ENRIQUE VASQUEZ VALENZUELA**  
CPF: 900.448.378-01  
Founder & Chief Data & AI Officer (CDAO)

### Empresa Detentora
**TEIA STUDIO TECNOLOGIA EMPRESARIAL COM INTELIGÊNCIA ARTIFICIAL LTDA**  
CNPJ: 63.049.583/0001-65  
Endereço: Rua Teodoro Sampaio, 1482 - São Paulo/SP - CEP: 05406-100

### Registros Oficiais
- **Processo INPI (Marca)**: 941859479 - "Teia GEO" (Classe NCL 42)
- **Protocolo MCTI/CTI**: 267175.0023774/2025 (Registro de Software)
- **Data de Solicitação**: 08/11/2025
- **Status**: Em andamento junto ao Instituto Nacional da Propriedade Industrial

### Contatos
- Email: contato@teiastudio.com / jose.vev26@gmail.com
- Website: www.teiaestudio.com

---

## 🎓 FUNDAMENTAÇÃO CIENTÍFICA

### Observabilidade Cognitiva Generativa

O framework Teia GEO IGO (Intelligence Generative Observability) representa uma **inovação brasileira pioneira** que propõe uma nova disciplina aplicada: a **Observabilidade Cognitiva Generativa**.

#### Definição Formal
A Observabilidade Cognitiva Generativa é uma disciplina científica aplicada que articula:
- **Estatística multivariada**: Análise quantitativa de padrões multi-LLM
- **Semântica computacional**: Análise vetorial e similaridade semântica
- **Epistemologia da linguagem**: Compreensão do comportamento simbólico
- **Meta-IA**: Inteligências artificiais que analisam outras IAs

#### Diferencial Único
Teia GEO é a **primeira plataforma científica e técnica do mundo** para mensuração empírica da cognição algorítmica com foco em marcas, conceitos e entidades de relevância pública.

### Por Que Não Existe "AEO" (Answer Engine Optimization)?

**Contextualização Importante**: O termo "AEO" foi amplamente propagado no mercado de SEO internacional, mas **não representa uma disciplina científica ou metodologia validada**. Trata-se de uma nomenclatura de marketing sem fundamentação acadêmica ou técnica consistente.

#### GEO vs AEO: A Diferença Científica

| Aspecto | AEO | GEO (Teia GEO IGO) |
|---------|-----|-------------------|
| **Fundamentação** | Marketing | Ciência Aplicada |
| **Métricas** | Não formalizadas | KAPIs matematicamente formalizadas |
| **Metodologia** | Empírica | Estatística clássica validada |
| **Observabilidade** | Inexistente | Meta-IA e governança completa |
| **Auditabilidade** | Não rastreável | Versionamento completo |
| **Bibliografia** | Ausente | 30+ referências acadêmicas |

**Conclusão**: AEO é marketing; GEO (Teia GEO IGO) é ciência aplicada.

### Fundamentação Teórica Completa

#### 1. Epistemologia da Observabilidade Computacional
O conceito de observabilidade originou-se na **engenharia de controle** (Kalman, 1960), definindo a capacidade de inferir o estado interno de um sistema a partir de suas saídas.

A **Observabilidade Cognitiva**, proposta por José Enrique Vásquez Valenzuela, eleva esse conceito para a mensuração do comportamento semântico e simbólico dos LLMs.

**Base Teórica**:
- **Kalman (1960)**: Teoria de controle e observabilidade
- **Barham et al. (2020)**: Observabilidade em sistemas computacionais
- **Minsky (1986)**: Arquiteturas reflexivas em IA

#### 2. Meta-IA: Inteligência que Observa Inteligência
A Meta-IA consiste em criar sistemas capazes de **monitorar, interpretar e prever** o comportamento de outros sistemas de IA.

No contexto do Teia GEO IGO, a Meta-IA:
- Captura respostas de múltiplos LLMs simultaneamente
- Compara e mede divergências cognitivas
- Prediz comportamento futuro via regressão linear
- Detecta alucinações e inconsistências semânticas

#### 3. KAPIs: Key Algorithmic Predictive Indicators

As **KAPIs** são métricas cognitivas formalizadas matematicamente para quantificar o comportamento algorítmico:

1. **ICE** (Index of Cognitive Efficiency): Eficiência de menções corretas
2. **GAP** (Governance Alignment Precision): Consenso entre LLMs
3. **CPI** (Cognitive Predictive Index): Previsibilidade cognitiva composta
4. **Cognitive Stability**: Estabilidade temporal das respostas

### Metodologia Científica

#### Coleta de Dados
- **Período**: 30 dias de observação contínua
- **Provedores**: GPT (OpenAI), Claude (Anthropic), Gemini (Google), Perplexity
- **Queries**: Bateria de perguntas padronizadas por setor
- **Frequência**: Coleta diária automatizada

#### Análise Estatística
- Regressão linear para previsões
- Análise multivariada (ANOVA)
- Testes de hipótese (t-Student)
- Matriz de correlação semântica
- Detecção de outliers e anomalias

#### Auditabilidade
Todos os processos são:
- ✅ Rastreáveis via logs estruturados
- ✅ Versionados no sistema de controle
- ✅ Cientificamente replicáveis
- ✅ Auditáveis por terceiros

### Estudos de Caso Validados
Metodologia quantitativa e experimental aplicada em:
- **Setor educacional**: Instituições de ensino
- **Saúde digital**: Telemedicina e healthtech
- **Comércio eletrônico**: E-commerce e varejo

**Resultados Demonstrados**:
- Identificação de inconsistências simbólicas
- Detecção de divergências cognitivas
- Oportunidades de intervenção semântica
- Padrões de alucinação algorítmica

---

## 🐛 Bugs Corrigidos e Melhorias (14/11/2025)

### ✅ Relatórios Semanais Vazios (06/11/2025)

**Problema:** Emails de relatórios chegavam sem dados.

**Causa Raiz:** 3 bugs críticos na edge function `send-scheduled-weekly-reports`:
1. ❌ Tabela errada: `llm_mentions` → ✅ `mentions_llm`
2. ❌ Coluna errada: `created_at` → ✅ `collected_at`  
3. ❌ Campo inexistente: `relevance_score` → ✅ `confidence`

**Status:** ✅ CORRIGIDO

### ✅ Formatação de Percentuais em PDFs (14/11/2025)

**Problema:** Valores percentuais com muitas casas decimais nos PDFs (ex: "36.37549999999995%")

**Solução:** Implementado arredondamento automático em `exportReports.ts` para:
- Presença Positiva
- Tópicos GEO
- Confiança das IAs

**Status:** ✅ CORRIGIDO

### 🚀 Sistema de Retry Automático (14/11/2025)

**Implementação:**
- Retry automático com exponential backoff (até 3 tentativas)
- Implementado em `automation-orchestrator` e `calculate-geo-metrics`
- Delay: 1s, 2s, 4s (progressivo)
- Logs estruturados para troubleshooting

**Status:** ✅ IMPLEMENTADO

### 📊 Dashboard System Health (14/11/2025)

**Nova Funcionalidade:** `/system-health`

Monitoramento em tempo real:
- **Certificação Platinum**: Score geral do sistema (0-100%)
- **Breakdown por Setor**: Database, Edge Functions, Cron Jobs, Coleta de Dados, Integrações
- **Execuções Recentes**: Últimos 10 jobs de automação
- **Status Operacional**: Healthy/Degraded/Unhealthy

**Status:** ✅ IMPLEMENTADO

**Como Verificar:**
```sql
-- Ver dados incluídos no relatório
SELECT 
  b.name as marca,
  COUNT(*) as mencoes_7d,
  AVG(m.confidence) * 100 as score_medio
FROM brands b
LEFT JOIN mentions_llm m ON m.brand_id = b.id
WHERE m.collected_at >= CURRENT_DATE - INTERVAL '7 days'
  AND m.mentioned = true
GROUP BY b.name;
```

---

## Visão Geral

Este sistema fornece análise avançada de GEO (Generative Engine Optimization) e IGO (Intelligence Governance Observability), monitoramento de marcas em múltiplos LLMs, com métricas cognitivas inteligentes, convergência multi-LLM, geração automática de relatórios e alertas baseados em IA.

### Funcionalidades Principais

#### 🎯 GEO Analytics
- **GEO Score**: Pontuação de otimização para motores generativos (0-100)
- **SEO Integration**: Integração com métricas de SEO tradicionais
- **URL Analysis**: Análise técnica de URLs para GEO e SEO
- **Historical Tracking**: Acompanhamento histórico de performance

#### 🧠 IGO Framework (Intelligence Governance Observability)
- **CPI Score**: Cognitive Predictive Index - Índice de previsibilidade cognitiva
- **ICE Metric**: Index of Cognitive Efficiency - Eficiência cognitiva
- **GAP Metric**: Governance Alignment Precision - Precisão de alinhamento
- **Cognitive Stability**: Estabilidade das respostas ao longo do tempo
- **Multi-LLM Convergence**: Consenso e divergência entre múltiplos LLMs
- **Intelligent Recommendations**: Recomendações baseadas em análise matemática com botões de ação rápida

#### 🔄 Multi-LLM Monitoring
- **Provider Coverage**: OpenAI, Perplexity, Google AI, Claude
- **Consensus Analysis**: Análise de concordância entre provedores
- **Semantic Coherence**: Matriz de coerência semântica
- **Divergence Detection**: Detecção de divergências significativas

#### 📊 Advanced Analytics
- **AI-Powered Insights**: Insights gerados por IA
- **Predictive Analysis**: Previsões de tendências
- **Automated Reports**: Relatórios automáticos diários/semanais
- **Real-time Alerts**: Alertas em tempo real configuráveis
- **Quick Actions**: Botões de ação rápida nas recomendações para navegação direta às funcionalidades relevantes

## Arquitetura de Dados

### Tabelas Principais

#### `brands`
Armazena informações das marcas monitoradas.
- `id`: UUID único da marca
- `name`: Nome da marca
- `domain`: Domínio da marca
- `user_id`: ID do usuário proprietário
- `created_at`: Data de criação

#### `geo_scores`
Armazena pontuações GEO calculadas para cada marca.
- `id`: ID da pontuação
- `brand_id`: Referência à marca
- `score`: Pontuação numérica (0-100)
- `breakdown`: Detalhamento em JSON
- `computed_at`: Data/hora do cálculo

#### `mentions_llm`
Registra menções da marca em diferentes LLMs.
- `id`: ID da menção
- `brand_id`: Referência à marca
- `provider`: Provedor LLM (OpenAI, Perplexity, Google AI, Claude)
- `query`: Query usada para detecção
- `mentioned`: Booleano indicando se foi mencionada
- `confidence`: Nível de confiança (0-1)
- `answer_excerpt`: Trecho da resposta
- `collected_at`: Data/hora da coleta

#### `scheduled_reports`
Configura relatórios agendados por usuário.
- `id`: UUID do agendamento
- `user_id`: ID do usuário
- `frequency`: Frequência (daily, weekly, monthly)
- `report_type`: Tipo (performance, mentions, comprehensive)
- `enabled`: Se está ativo
- `last_run`: Última execução
- `next_run`: Próxima execução agendada

#### `generated_reports`
Armazena relatórios gerados.
- `id`: UUID do relatório
- `user_id`: ID do usuário
- `report_type`: Tipo do relatório
- `content`: Conteúdo em JSON
- `generated_at`: Data/hora de geração
- `email_sent`: Se foi enviado por email

#### `alert_configs`
Configurações de alertas por usuário.
- `id`: UUID da configuração
- `user_id`: ID do usuário
- `email`: Email para alertas
- `threshold_alert`: Se alerta por threshold está ativo
- `threshold_value`: Valor do threshold
- `score_decrease`: Alerta em queda de score
- `score_increase`: Alerta em aumento de score
- `weekly_report`: Receber relatório semanal
- `new_mention`: Alerta em nova menção

#### `alerts_history`
Histórico de alertas enviados.
- `id`: UUID do alerta
- `user_id`: ID do usuário
- `brand_id`: Referência à marca (opcional)
- `alert_type`: Tipo do alerta
- `title`: Título do alerta
- `message`: Mensagem
- `priority`: Prioridade (low, medium, high)
- `read`: Se foi lido
- `metadata`: Dados adicionais em JSON

#### `igo_metrics_history`
Armazena histórico de métricas IGO calculadas.
- `id`: UUID do registro
- `brand_id`: Referência à marca
- `user_id`: ID do usuário proprietário
- `ice`: Index of Cognitive Efficiency (0-100)
- `gap`: Governance Alignment Precision (0-100)
- `cpi`: Cognitive Predictive Index (0-100)
- `cognitive_stability`: Estabilidade cognitiva (0-100)
- `calculated_at`: Data/hora do cálculo
- `metadata`: Dados adicionais em JSON (consensus, divergence, etc.)

#### `ai_insights`
Armazena insights e previsões gerados por IA.
- `id`: UUID do insight
- `user_id`: ID do usuário
- `brand_id`: Referência à marca (opcional)
- `insight_type`: Tipo do insight (prediction, recommendation, analysis)
- `content`: Conteúdo do insight em JSON
- `confidence`: Nível de confiança (0-1)
- `generated_at`: Data/hora de geração
- `metadata`: Dados adicionais

## IGO Framework (Intelligence Governance Observability)

### Visão Geral

O IGO Framework é um sistema avançado de métricas cognitivas que avalia a governança e previsibilidade de marcas em múltiplos LLMs. Diferente do GEO Score tradicional, o IGO foca em aspectos cognitivos e de consenso entre diferentes modelos de IA.

### 🔄 Fluxo de Dados: Da Coleta ao Score Final

#### Entendendo os Componentes e Suas Funções

O sistema possui **TRÊS componentes principais** que trabalham juntos mas têm funções distintas:

##### 1️⃣ Nucleus Command Center (Coleta Granular)
**Localização**: `/nucleus-command-center`

**Função**: Coletar menções detalhadas de múltiplos LLMs

**O que faz**:
- Envia queries para até 4 LLMs (OpenAI, Perplexity, Google AI, Claude)
- Registra CADA resposta individual na tabela `mentions_llm`
- Salva informações granulares:
  - Query específica
  - Provider (qual LLM respondeu)
  - Se mencionou a marca (`mentioned: true/false`)
  - Confiança da menção (`confidence: 0-1`)
  - Trecho da resposta (`answer_excerpt`)
  - Data/hora da coleta (`collected_at`)

**Resultado**: Dados brutos de menções na tabela `mentions_llm`

**⚠️ IMPORTANTE**: O Nucleus NÃO calcula scores! Ele só coleta e armazena dados brutos.

##### 2️⃣ Calculate GEO Metrics (Consolidação GEO + CPI)
**Função**: `calculate-geo-metrics`  
**Trigger**: Botão "Atualizar Dados" na página `/geo-scores`

**O que faz**:
1. **Lê** todos os dados da tabela `mentions_llm` (coletados pelo Nucleus)
2. **Calcula** o GEO Score (0-100) baseado nos 5 pilares:
   - Base Técnica
   - Estrutura Semântica
   - Relevância Conversacional
   - Autoridade Cognitiva
   - Inteligência Estratégica
3. **Calcula** o CPI Score (0-100) baseado na consistência das menções:
   - Analisa variação de confiança entre providers
   - Quanto menor a variação, maior o CPI
   - CPI alto = respostas consistentes entre LLMs
4. **Salva** ambos os scores na tabela `geo_scores`:
   - `score` (GEO Score)
   - `cpi` (CPI Score)
   - `breakdown` (detalhamento dos 5 pilares)
   - `computed_at` (timestamp do cálculo)

**Resultado**: Score único e consolidado por marca na tabela `geo_scores`

**Exibido em**: 
- Página `/scores` (Widget "CPI Score /100")
- Página `/geo-scores` (GEO Score detalhado)

##### 3️⃣ Calculate IGO Metrics (Métricas Avançadas)
**Função**: `calculate-igo-metrics`  
**Trigger**: Automático após coleta no Nucleus (página `/algorithmic-governance`)

**O que faz**:
1. **Lê** dados da tabela `mentions_llm`
2. **Calcula** métricas IGO avançadas:
   - **ICE** (Index of Cognitive Efficiency): eficiência de menções corretas
   - **GAP** (Governance Alignment Precision): consenso entre LLMs
   - **CPI IGO**: versão IGO do CPI com análise de convergência
   - **Cognitive Stability**: estabilidade temporal das respostas
3. **Salva** na tabela `igo_metrics_history`

**Resultado**: Métricas avançadas de governança cognitiva

**Exibido em**: Página `/algorithmic-governance` (Dashboard IGO)

#### 📊 Fluxo Visual Completo

```mermaid
graph TD
    A[Nucleus: Coleta LLMs] -->|Salva| B[mentions_llm]
    B -->|Lê dados| C[calculate-geo-metrics]
    B -->|Lê dados| D[calculate-igo-metrics]
    C -->|Salva| E[geo_scores]
    D -->|Salva| F[igo_metrics_history]
    E -->|Exibe| G[/scores - Widget CPI]
    E -->|Exibe| H[/geo-scores - GEO Score]
    F -->|Exibe| I[/algorithmic-governance - IGO]
```

#### 🎯 Por Que Existem Dois CPIs?

**CPI na tabela `geo_scores`**:
- Score único e simples (0-100)
- Focado em consistência de menções
- Usado no dashboard principal (`/scores`)
- Cálculo mais direto baseado em variância

**CPI IGO na tabela `igo_metrics_history`**:
- Métrica avançada com contexto (0-100)
- Inclui análise de convergência multi-LLM
- Usado no dashboard de Governança (`/algorithmic-governance`)
- Cálculo composto: `(0.4 × ICE) + (0.3 × GAP) + (0.3 × Stability)`

Ambos medem previsibilidade, mas com níveis diferentes de complexidade e aplicação.

#### ❓ Por Que o CPI Mostrava Zero (PROBLEMA RESOLVIDO)?

**Problema Antigo**: Após rodar o Nucleus, o Widget CPI mostrava `0.0 / 100`

**Causa**: 
1. Nucleus coletou dados → tabela `mentions_llm` ✅
2. MAS `calculate-geo-metrics` NÃO era executado automaticamente ❌
3. Logo, a tabela `geo_scores` não tinha o campo `cpi` preenchido (era `null`)
4. O Widget lê de `geo_scores.cpi` e exibe `0.0` se `null`/`undefined`

**✅ Solução Implementada (21/11/2025)**:
- Sistema agora executa **automaticamente** `calculate-geo-metrics` após o Nucleus
- Não precisa mais ir em `/geo-scores` e clicar "Atualizar Dados"
- CPI é calculado e salvo imediatamente após a coleta
- Widget CPI sempre mostra o valor correto e atualizado

**Fluxo Antigo (Manual)**:
```
Nucleus → mentions_llm → [USUÁRIO clica "Atualizar Dados"] → calculate-geo-metrics → geo_scores → Widget
```

**Fluxo Novo (Automático)**:
```
Nucleus → mentions_llm → calculate-geo-metrics (auto) → geo_scores → Widget ✅
```


#### 🔄 Fluxo Automatizado Completo

```
1. Coleta de Dados (Nucleus)
   └─> /nucleus-command-center OU /algorithmic-governance
   └─> Selecionar marca + LLMs + queries
   └─> Executar coleta
   └─> Dados salvos em mentions_llm ✅

2. Cálculo Automático (Sem intervenção!)
   └─> Sistema automaticamente executa:
       ├─> calculate-geo-metrics → Calcula GEO + CPI
       └─> calculate-igo-metrics → Calcula IGO
   └─> Scores salvos em geo_scores + igo_metrics_history ✅

3. Visualização (Imediata)
   └─> /scores → Ver CPI consolidado atualizado
   └─> /geo-scores → Ver GEO detalhado atualizado
   └─> /algorithmic-governance → Ver métricas IGO atualizadas
```

**🎯 Automação Implementada (21/11/2025)**:
- ✅ Após Nucleus terminar → `calculate-geo-metrics` roda automaticamente
- ✅ Após Nucleus terminar → `calculate-igo-metrics` roda automaticamente
- ✅ Usuário não precisa clicar em "Atualizar Dados" manualmente
- ✅ Todos os scores ficam sincronizados instantaneamente

---

#### 📌 Pontos-Chave para Entender

1. **Nucleus = Coleta, e agora também automatiza cálculos**
   - Ele popula `mentions_llm` com dados brutos
   - **NOVO**: Automaticamente chama `calculate-geo-metrics` e `calculate-igo-metrics`

2. **calculate-geo-metrics = Consolidação automática**
   - Transforma dados brutos em scores únicos
   - **AGORA roda automaticamente após o Nucleus**

3. **geo_scores = Fonte única de verdade para `/scores`**
   - Widget CPI lê EXCLUSIVAMENTE desta tabela
   - Se `cpi` for `null`, exibe `0.0`
   - **Agora sempre atualizado automaticamente**

4. **Dois sistemas, duas finalidades**:
   - `geo_scores.cpi` → Dashboard principal, score simples
   - `igo_metrics_history.cpi` → Governança avançada, análise profunda

5. **✅ Automação completa implementada**:
   - Nucleus → Manual (usuário clica "Executar")
   - calculate-geo-metrics → **Automático após Nucleus**
   - calculate-igo-metrics → **Automático após Nucleus**
   - **Não precisa mais clicar "Atualizar Dados"!**

---

### Métricas IGO

#### 1. ICE (Index of Cognitive Efficiency)
**Definição**: Mede a eficiência com que a marca é mencionada corretamente pelos LLMs.

**Cálculo**:
```javascript
ICE = (menções_corretas / total_menções) × 100
```

**Interpretação**:
- **90-100**: Excelente - Alta eficiência cognitiva
- **70-89**: Bom - Eficiência adequada
- **50-69**: Regular - Necessita melhorias
- **0-49**: Crítico - Baixa eficiência

**Fatores que influenciam**:
- Qualidade das menções
- Contexto correto da marca
- Precisão das respostas dos LLMs

#### 2. GAP (Governance Alignment Precision)
**Definição**: Avalia o alinhamento entre diferentes provedores LLM ao mencionar a marca.

**Cálculo**:
```javascript
GAP = (provedores_alinhados / total_provedores) × 100 × fator_consenso
```

**Interpretação**:
- **85-100**: Excelente - Alto consenso entre LLMs
- **65-84**: Bom - Consenso satisfatório
- **45-64**: Regular - Divergências moderadas
- **0-44**: Crítico - Alta divergência

**Fatores que influenciam**:
- Consenso entre provedores
- Coerência semântica
- Uniformidade de respostas

#### 3. CPI (Cognitive Predictive Index)
**Definição**: Índice composto que prediz a governança cognitiva da marca.

**Cálculo**:
```javascript
CPI = (0.4 × ICE) + (0.3 × GAP) + (0.3 × Cognitive_Stability)
```

**Interpretação**:
- **80-100**: Excelente - Alta previsibilidade
- **60-79**: Bom - Previsibilidade adequada
- **40-59**: Regular - Previsibilidade moderada
- **0-39**: Crítico - Baixa previsibilidade

**Uso estratégico**:
- Principal indicador de governança cognitiva
- Base para previsões de performance
- Guia para estratégias de otimização

#### 4. Cognitive Stability
**Definição**: Mede a estabilidade das respostas dos LLMs ao longo do tempo.

**Cálculo**:
```javascript
Stability = 100 - (variação_temporal × 100)
```

**Interpretação**:
- **90-100**: Excelente - Respostas muito estáveis
- **75-89**: Bom - Estabilidade adequada
- **50-74**: Regular - Variações moderadas
- **0-49**: Crítico - Alta volatilidade

### Multi-LLM Convergence System

#### Análise de Consenso

O sistema analisa a convergência entre múltiplos provedores LLM para identificar:

1. **Consenso Total**: Todos os LLMs mencionam a marca de forma similar
2. **Consenso Parcial**: Maioria dos LLMs concorda, com divergências menores
3. **Divergência Moderada**: Respostas variadas entre provedores
4. **Divergência Crítica**: Respostas conflitantes ou inconsistentes

### Sistema de Recomendações Inteligentes com Quick Actions

#### Visão Geral

A página de Governança Algorítmica oferece recomendações inteligentes baseadas em análise matemática das métricas IGO atuais. Cada recomendação inclui **botões de ação rápida** que permitem navegar diretamente para a funcionalidade necessária para resolver o problema identificado.

#### Tipos de Quick Actions

| Recomendação | Botão de Ação | Destino | Quando Aparece |
|--------------|---------------|---------|----------------|
| CPI Crítico / Contexto da Marca | **✏️ Editar Contexto da Marca** | `/brands` | Quando o CPI está baixo ou há menção de contexto inadequado |
| Estabilidade Cognitiva / GAP | **👁️ Ver IGO Observability** | `/igo-observability?brandId={id}` | Para análises detalhadas de estabilidade e governança com marca pré-selecionada |
| Divergência Multi-LLM | **🔍 Detectar Alucinações** | `/igo-observability?brandId={id}` | Quando há divergências críticas entre LLMs com marca pré-selecionada |
| Análise Multi-LLM | **🔗 Ver Menções LLM** | `/llm-mentions?brandId={id}` | Para visualizar menções específicas de cada LLM com marca pré-selecionada |

**IMPORTANTE**: Os botões que navegam para IGO Observability e LLM Mentions passam automaticamente o ID da marca selecionada via URL, de modo que ao abrir essas páginas, a marca já está pré-selecionada, mantendo o contexto da análise.

#### Como Usar

1. **Selecione uma marca** na página de Governança Algorítmica
2. **Navegue até a aba "Recomendações"**
3. **Revise as recomendações** apresentadas com suas prioridades (CRÍTICO, ALTO, MÉDIO, INFO)
4. **Clique no botão de ação apropriado** para ir direto à funcionalidade que resolve o problema
5. **Execute as ações recomendadas** na página de destino

#### Exemplo de Fluxo

```
1. Sistema detecta CPI baixo (45%)
   ↓
2. Gera recomendação: "CPI Crítico: Alta Divergência entre LLMs"
   ↓
3. Usuário clica em "✏️ Editar Contexto da Marca"
   ↓
4. Sistema navega para /brands
   ↓
5. Usuário edita e melhora o contexto da marca
   ↓
6. Próximo cálculo de IGO reflete a melhoria
```

#### Benefícios

- ✅ **Ação Imediata**: Navegação direta sem precisar procurar manualmente
- ✅ **Contexto Preservado**: Sabe exatamente qual problema está resolvendo
- ✅ **Eficiência**: Reduz tempo de diagnóstico → ação
- ✅ **Guiado**: Sistema indica exatamente onde agir

#### Matriz de Coerência Semântica

Avalia a coerência semântica entre diferentes respostas:

```
              OpenAI  Perplexity  Google AI  Claude
OpenAI          100%       85%        92%      88%
Perplexity       85%      100%        78%      82%
Google AI        92%       78%       100%      90%
Claude           88%       82%        90%     100%
```

#### Detecção de Divergências

**Tipos de divergências monitoradas**:
- **Semântica**: Significados diferentes
- **Contextual**: Contextos distintos
- **Factual**: Informações conflitantes
- **Ausência**: Menção vs. não-menção

### Edge Function: calculate-igo-metrics

**Propósito**: Calcula todas as métricas IGO para uma marca.

**Entrada**:
```typescript
{
  brandId?: string,  // Opcional - calcula para todas as marcas se omitido
  period?: number    // Dias a considerar (padrão: 30)
}
```

**Processo**:
1. Busca menções dos últimos N dias
2. Calcula ICE baseado em qualidade das menções
3. Calcula GAP baseado em consenso entre provedores
4. Calcula Cognitive Stability baseado em variação temporal
5. Calcula CPI como índice composto
6. Salva resultados em `igo_metrics_history`

**Saída**:
```typescript
{
  ice: number,
  gap: number,
  cpi: number,
  cognitive_stability: number,
  metadata: {
    consensus_rate: number,
    divergence_count: number,
    providers_analyzed: string[],
    calculation_date: string
  }
}
```

### Relatórios IGO

O sistema gera relatórios específicos IGO que incluem:

1. **Dashboard IGO**: Visualização em tempo real das métricas
2. **Comparação entre Marcas**: Benchmarking de métricas IGO
3. **Evolução Temporal**: Gráficos de tendência das métricas
4. **Análise de Convergência**: Matriz de consenso entre LLMs
5. **Insights Preditivos**: Previsões baseadas em padrões históricos

### Exportação de Relatórios IGO

**Formato PDF**: Inclui:
- Resumo executivo das métricas IGO
- Tabela comparativa entre marcas
- Análise interpretativa automática
- Gráficos de evolução temporal
- Matriz de coerência semântica
- Recomendações estratégicas

**Geração**:
```typescript
import { exportIGOReport } from '@/utils/exportIGOReport';

await exportIGOReport({
  brandsMetrics: [...],
  period: 'monthly',
  generatedAt: new Date()
});
```

## Sistema de Relatórios Agendados

### Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────┐
│                    CRON Job (Daily 8AM)                  │
│          send-scheduled-reports-daily                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│        Edge Function: send-scheduled-weekly-reports      │
│                                                           │
│  1. Busca todos os usuários                              │
│  2. Para cada usuário:                                   │
│     - Busca suas marcas                                  │
│     - Busca menções da última semana                     │
│     - Busca menções da semana anterior                   │
│     - Calcula métricas (score, tendência)                │
│  3. Chama send-weekly-report para enviar email           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Edge Function: send-weekly-report               │
│                                                           │
│  1. Recebe dados do relatório                            │
│  2. Formata HTML do email                                │
│  3. Envia via Resend API                                 │
│  4. Retorna status do envio                              │
└─────────────────────────────────────────────────────────┘
```

### Cálculo de Métricas

#### Relevance Score
```javascript
relevanceScore = (totalMentions > 0) 
  ? (mentionedCount / totalMentions) * 100 
  : 0
```

#### Tendência
Compara menções da semana atual vs. semana anterior:
- `up`: Aumento de menções
- `down`: Diminuição de menções
- `stable`: Mesma quantidade

### Configuração do Cron Job - RELATÓRIOS DIÁRIOS

✅ **CONFIGURADO:** Relatórios rodam automaticamente TODOS OS DIAS às 8:00 AM

**Configuração Atual:**

```sql
-- Relatórios DIÁRIOS às 8:00 AM
SELECT cron.schedule(
  'daily-geo-reports',
  '0 8 * * *',  -- Todos os dias às 8:00 AM
  $$
  SELECT net.http_post(
    url := 'https://llzonwqocqzqpezcsbjh.supabase.co/functions/v1/send-scheduled-weekly-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsem9ud3FvY3F6cXBlemNzYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODMzNjgsImV4cCI6MjA3NzM1OTM2OH0.z_8tiINK0X_hFSvsyWAt7Kf-O3ANQTqCNNpgo3_fJ5I'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**Verificar status do cron:**

```sql
-- Ver cron jobs ativos
SELECT * FROM cron.job WHERE jobname = 'daily-geo-reports';

-- Ver últimas execuções
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-geo-reports')
ORDER BY start_time DESC 
LIMIT 10;
```

**Conteúdo do Relatório Diário:**
- 📊 Dados das **últimas 24 horas**
- 📈 Comparação com **dia anterior** (24-48h atrás)
- 🎯 Scores, tendências e número de menções por marca
- 📧 Enviado para: **jose.vev26@gmail.com**

## Edge Functions

### 1. `send-scheduled-weekly-reports`
**Propósito**: Coordena a geração e envio de relatórios semanais.

**Processo**:
1. Busca todos os usuários autenticados
2. Para cada usuário:
   - Busca marcas associadas
   - Coleta menções da última semana
   - Coleta menções da semana anterior
   - Calcula scores e tendências
   - Invoca `send-weekly-report`

**Dados Calculados**:
```typescript
{
  brands: [
    {
      name: string,
      currentRelevance: number,
      previousRelevance: number,
      mentionCount: number,
      trend: 'up' | 'down' | 'stable'
    }
  ]
}
```

### 2. `send-weekly-report`
**Propósito**: Formata e envia o email do relatório.

**Entrada**:
```typescript
{
  email: string,
  userName: string,
  brands: BrandData[]
}
```

**Saída**:
- Email HTML formatado
- Status do envio via Resend

**Template do Email**:
- Header com logo e título
- Seção de resumo executivo
- Lista de marcas com métricas
- Indicadores visuais de tendência
- Footer com links

### 3. `collect-llm-mentions`
**Propósito**: Coleta menções de marcas em diferentes LLMs.

**Providers Suportados**:
- OpenAI (GPT-4)
- Perplexity
- Google AI (Gemini)
- Claude (via Lovable AI)

**Processo**:
1. Busca dados da marca
2. Gera queries de teste
3. Consulta cada provider
4. Analisa respostas para detectar menções
5. Salva resultados em `mentions_llm`

**Queries de Teste**:
```javascript
[
  "What are the best {category} companies?",
  "Compare top {category} solutions",
  "Who are the leaders in {category}?",
  // ... mais queries
]
```

### 4. `ai-predictions`
**Propósito**: Gera previsões e sugestões usando IA.

**Entrada**:
```typescript
{
  userId: string,
  brandId?: string
}
```

**Processo**:
1. Busca dados históricos (scores, menções)
2. Envia para Lovable AI
3. Recebe previsões e sugestões
4. Salva em `ai_insights`

### 5. `analyze-url`
**Propósito**: Analisa URL para GEO e SEO.

**Saída**:
```typescript
{
  geo_score: number,
  seo_score: number,
  overall_score: number,
  analysis: {
    geo: { ... },
    seo: { ... }
  },
  recommendations: string[],
  tasks: Task[]
}
```

### 6. `calculate-igo-metrics`
**Propósito**: Calcula métricas IGO (ICE, GAP, CPI, Cognitive Stability) para marcas.

**Entrada**:
```typescript
{
  brandId?: string,  // Opcional - calcula para todas se omitido
  period?: number    // Dias a considerar (padrão: 30)
}
```

**Processo**:
1. Autentica usuário via Bearer token
2. Busca menções da marca dos últimos N dias
3. Calcula ICE baseado em qualidade das menções
4. Calcula GAP baseado em consenso entre provedores
5. Calcula Cognitive Stability baseado em variação temporal
6. Calcula CPI como índice composto
7. Salva em `igo_metrics_history` se brandId fornecido

**Saída**:
```typescript
{
  ice: number,              // 0-100
  gap: number,              // 0-100
  cpi: number,              // 0-100
  cognitive_stability: number, // 0-100
  metadata: {
    consensus_rate: number,
    divergence_count: number,
    providers_analyzed: string[],
    total_mentions: number
  }
}
```

### 7. `ai-report-generator`
**Propósito**: Gera relatórios GEO e IGO usando IA.

**Entrada**:
```typescript
{
  userId: string,
  reportType: 'geo' | 'igo' | 'comprehensive',
  brandIds?: string[],
  period: 'weekly' | 'monthly' | 'quarterly'
}
```

**Processo**:
1. Busca dados das marcas (scores, menções, alertas)
2. Prepara resumo de dados para IA
3. Constrói prompt detalhado baseado no tipo de relatório
4. Envia para Lovable AI (gemini-2.5-pro)
5. Processa resposta JSON da IA
6. Salva em `ai_insights`
7. Retorna relatório formatado

**Tipos de Relatório**:
- **GEO**: Foca em scores GEO, SEO e performance
- **IGO**: Foca em métricas cognitivas (CPI, ICE, GAP)
- **Comprehensive**: Combina ambos os aspectos

**Saída**:
```typescript
{
  summary: string,
  metrics: {
    current: { ... },
    trend: string,
    comparison: string
  },
  insights: string[],
  recommendations: string[],
  predictions: {
    next_period: { ... },
    confidence: number
  }
}
```

## Sistema de Alertas

### Tipos de Alertas

1. **Threshold Alert**: Score cruza um valor definido
2. **Score Decrease**: Pontuação diminui
3. **Score Increase**: Pontuação aumenta
4. **New Mention**: Nova menção detectada

### Fluxo de Alertas

```
Evento (mudança em score/menção)
    ↓
Verifica alert_configs do usuário
    ↓
Se configurado, cria em alerts_history
    ↓
Envia email (opcional)
    ↓
Exibe no painel de alertas
```

## APIs Externas

### Lovable AI
- **URL**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Modelos**: 
  - `google/gemini-2.5-flash` (padrão)
  - `google/gemini-2.5-pro`
  - `openai/gpt-5`
- **Uso**: Análise de dados, previsões, geração de relatórios

### Resend
- **URL**: `https://api.resend.com/emails`
- **Uso**: Envio de emails (relatórios, alertas)
- **Requer**: `RESEND_API_KEY`

### LLM Providers
- **OpenAI**: API para GPT-4
- **Perplexity**: API de busca com IA
- **Google AI**: Gemini API
- **Claude**: Via Lovable AI Gateway

## Segurança (RLS)

Todas as tabelas implementam Row Level Security (RLS):

```sql
-- Exemplo: brands
CREATE POLICY "Users can view their own brands"
ON brands FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brands"
ON brands FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Similar para UPDATE e DELETE
```

**Princípio**: Usuários só acessam seus próprios dados.

## Variáveis de Ambiente

### Supabase
- `SUPABASE_URL`: URL do projeto
- `SUPABASE_ANON_KEY`: Chave pública
- `SUPABASE_SERVICE_ROLE_KEY`: Chave admin (edge functions)

### APIs Externas
- `LOVABLE_API_KEY`: Lovable AI Gateway
- `RESEND_API_KEY`: Envio de emails
- `OPENAI_API_KEY`: OpenAI API
- `PERPLEXITY_API_KEY`: Perplexity API
- `GOOGLE_AI_API_KEY`: Google AI API

## Manutenção e Monitoramento

### Logs
Edge functions geram logs acessíveis no painel do Supabase:
- Erros de API
- Envios de email
- Execuções de cron
- Processamento de dados

### Verificação do Cron
```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Testes Manuais

#### Testar envio de relatório:
```bash
curl -X POST \
  https://llzonwqocqzqpezcsbjh.supabase.co/functions/v1/send-weekly-report \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userName": "Test User",
    "brands": [...]
  }'
```

#### Testar coleta de menções:
```bash
curl -X POST \
  https://llzonwqocqzqpezcsbjh.supabase.co/functions/v1/collect-llm-mentions \
  -H "Content-Type: application/json" \
  -d '{"brandId": "uuid-here"}'
```

## Próximos Passos / Melhorias

### ✅ Implementado
1. **Dashboard IGO**: Visualização em tempo real de métricas cognitivas
2. **CPI Score**: Índice de previsibilidade cognitiva implementado
3. **Multi-LLM Convergence**: Sistema de análise de consenso entre provedores
4. **Relatórios IGO**: Exportação de relatórios IGO em PDF
5. **Relatórios CPI**: Exportação de relatórios CPI Dashboard em PDF
6. **AI-Powered Insights**: Insights gerados por Lovable AI
7. **Cognitive Stability**: Métricas de estabilidade temporal
8. **Semantic Coherence Matrix**: Análise de coerência semântica

### 🚧 Em Desenvolvimento
1. **Webhooks**: Notificar sistemas externos de mudanças
2. **Cache Avançado**: Reduzir chamadas a APIs externas com cache inteligente
3. **Testes Automatizados E2E**: Cobertura completa de testes
4. **Rate Limiting Dinâmico**: Proteção adaptativa contra abuso
5. **API Pública**: Endpoints para integração externa

### 📋 Planejado
1. **Machine Learning Predictions**: Modelos ML para previsões mais precisas
2. **Real-time Streaming**: Atualização de métricas em tempo real
3. **Custom Dashboards**: Dashboards personalizáveis por usuário
4. **Advanced Analytics**: Análise de sentimento e contexto
5. **Multi-tenant Support**: Suporte para múltiplas organizações

## Exportação de Relatórios

### Relatório CPI Dashboard (PDF)

**Arquivo**: `src/utils/exportCPIDashboardReport.ts`

**Funcionalidade**:
- Exporta dashboard completo de CPI em formato PDF
- Inclui resumo executivo de métricas CPI
- Tabelas de KPIs detalhadas
- Dados de consenso multi-LLM
- Insights gerados automaticamente
- Gráficos capturados (charts)

**Uso**:
```typescript
import { exportCPIDashboardReport } from '@/utils/exportCPIDashboardReport';

await exportCPIDashboardReport({
  cpiMetrics: {
    currentCPI: 85.5,
    previousCPI: 82.3,
    trend: 'up',
    ice: 88.2,
    gap: 84.1,
    stability: 91.5
  },
  kpis: [...],
  consensus: [...],
  period: 'monthly'
});
```

**Seções do PDF**:
1. **Header**: Título, período e data de geração
2. **CPI Score Summary**: Score atual, anterior e tendência
3. **Métricas IGO**: ICE, GAP, Cognitive Stability
4. **Tabela de KPIs**: Detalhamento de todos os KPIs
5. **Consenso LLM**: Dados de convergência entre provedores
6. **Insights Gerados**: Análise interpretativa automática
7. **Gráficos**: Charts capturados do dashboard
8. **Footer**: Paginação e informações da empresa

### Relatório IGO (PDF)

**Arquivo**: `src/utils/exportIGOReport.ts`

**Funcionalidade**:
- Exporta análise completa IGO em PDF
- Comparação entre múltiplas marcas
- Evolução temporal das métricas
- Matriz de coerência semântica
- Análise de divergência entre LLMs

**Uso**:
```typescript
import { exportIGOReport } from '@/utils/exportIGOReport';

await exportIGOReport({
  brandsMetrics: [
    {
      brand: { id: '...', name: 'Marca A' },
      metrics: {
        ice: 88.5,
        gap: 85.2,
        cpi: 87.1,
        cognitive_stability: 92.3
      }
    }
  ],
  period: 'monthly',
  generatedAt: new Date()
});
```

**Seções do PDF**:
1. **Header e Descrição**: Contexto do framework IGO
2. **Tabela Comparativa**: Métricas de todas as marcas
3. **Análise Interpretativa**: Insights automáticos
4. **Gráfico de Evolução**: Tendências temporais
5. **Timeline de Eventos**: Marcos importantes
6. **Divergência Semântica**: Análise de discrepâncias
7. **Comparação de Provedores**: Performance por LLM
8. **Recomendações**: Ações sugeridas

### Relatório Técnico Completo (PDF)

**Arquivo**: `src/utils/generateTechnicalPDF.ts`

**Funcionalidade**:
- Documentação técnica completa do sistema
- Arquitetura e componentes
- Métricas e fórmulas
- Fluxos de dados
- Especificações de APIs

**Componente**:
```typescript
import { DownloadTechnicalPDF } from '@/components/DownloadTechnicalPDF';

<DownloadTechnicalPDF />
```

## Fórmulas e Cálculos

### GEO Score
```javascript
GEO_Score = (
  0.30 × Visibility_Score +      // Visibilidade em LLMs
  0.25 × Relevance_Score +       // Relevância contextual
  0.20 × Citation_Quality +      // Qualidade das citações
  0.15 × Provider_Coverage +     // Cobertura de provedores
  0.10 × Temporal_Consistency    // Consistência temporal
) × 100
```

### CPI (Cognitive Predictive Index)
```javascript
CPI = (
  0.40 × ICE +                   // Eficiência cognitiva
  0.30 × GAP +                   // Precisão de alinhamento
  0.30 × Cognitive_Stability     // Estabilidade
)
```

### ICE (Index of Cognitive Efficiency)
```javascript
ICE = (mentions_correct / mentions_total) × 100

// Onde:
// mentions_correct = menções com contexto correto
// mentions_total = total de menções analisadas
```

### GAP (Governance Alignment Precision)
```javascript
GAP = (providers_aligned / providers_total) × 100 × consensus_factor

// Onde:
// providers_aligned = provedores com respostas alinhadas
// providers_total = total de provedores consultados
// consensus_factor = fator de qualidade do consenso (0.8-1.0)
```

### Cognitive Stability
```javascript
Stability = 100 - (temporal_variance × 100)

// Onde:
// temporal_variance = variação das respostas ao longo do tempo
// Calculado como desvio padrão normalizado
```

### Consenso Multi-LLM
```javascript
Consensus_Rate = (
  Σ(similarity_scores) / total_comparisons
) × 100

// Onde:
// similarity_scores = scores de similaridade entre pares de LLMs
// total_comparisons = número de comparações realizadas
```

## Suporte

Para questões ou problemas:
1. Verificar logs no painel do Lovable Cloud
2. Testar edge functions individualmente
3. Verificar configurações de alertas e agendamentos
4. Validar variáveis de ambiente
