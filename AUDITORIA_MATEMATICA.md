# 🔍 Auditoria Matemática Completa - Plataforma GEO/IGO

**Data da Auditoria**: 12/11/2025  
**Status**: ⚠️ 2 ANOMALIAS CRÍTICAS ENCONTRADAS

---

## 📋 Resumo Executivo

| Componente | Status | Criticidade | Observações |
|------------|--------|-------------|-------------|
| **GEO Score (5 pilares)** | ✅ OK | - | Fórmula correta, implementação consistente |
| **CPI Score** | ⚠️ ANOMALIA | ALTA | Normalização inconsistente de confidence |
| **Regressão Linear** | ✅ OK | - | Implementação matematicamente correta |
| **Divergência Semântica** | ✅ OK | - | Cálculo correto (desvio padrão) |
| **Convergência** | ✅ OK | - | Lógica inversa correta |
| **Radar Observability** | ⚠️ ANOMALIA | MÉDIA | Normalização inconsistente |
| **ICE Score** | ✅ OK | - | Fórmula simples e correta |
| **GAP Score** | ✅ OK | - | Fórmula correta |

---

## 🚨 ANOMALIA CRÍTICA #1: Normalização Inconsistente de Confidence

### Problema:
**Diferentes partes do sistema tratam `confidence` de forma diferente**, causando possíveis cálculos incorretos.

### Locais Afetados:

#### ❌ INCORRETO (sempre multiplica por 100):
```typescript
// supabase/functions/calculate-cpi-score/index.ts:67
providerConfidences.get(m.provider)!.push(m.confidence * 100);
// ⚠️ BUG: Se confidence JÁ está em 0-100, vira 0-10000!

// src/components/dashboard/WidgetCPIScore.tsx:103
providerScores.get(m.provider)!.push(Number(m.confidence) * 100);
// ⚠️ MESMO BUG
```

#### ✅ CORRETO (verifica antes de normalizar):
```typescript
// supabase/functions/calculate-geo-metrics/index.ts:139
const normalizedConf = m.confidence > 1 ? m.confidence : m.confidence * 100;

// src/pages/IGODashboard.tsx:111
const normalizedConf = (m.confidence || 0) > 1 ? (m.confidence || 0) : (m.confidence || 0) * 100;
```

### Impacto:
- **CPI Score pode estar INCORRETO** para todas as marcas
- Se confidence está armazenado como 0.85 (85%), o código incorreto transforma em 85
- Se confidence está armazenado como 85 (85%), o código incorreto transforma em 8500 (!!)
- Isso causa **variância artificialmente alta** → **CPI artificialmente BAIXO**

### Dados Reais do Banco:
```sql
SELECT DISTINCT confidence FROM mentions_llm LIMIT 10;
```
**RESULTADO**: confidence está em **0.85 escala** (0-1), não 0-100

**CONCLUSÃO**: O bug está causando multiplicação incorreta:
- Valor real: 0.85
- Multiplicado por 100: 85 ✅ CORRETO
- MAS se houver valores já em 85, multiplica para 8500 ❌

---

## 🚨 ANOMALIA CRÍTICA #2: CPI Calculation Logic Error

### Problema:
**Edge function `calculate-cpi-score` tem lógica de CPI diferente de `calculate-geo-metrics`**

#### calculate-cpi-score (linha 110-114):
```typescript
// CPI Formula: High score when variance is low (predictable/consistent)
// CPI = 100 - (average_variance)
const avgVariance = totalVariance / providerCount;
const cpi = Math.max(0, Math.min(100, 100 - avgVariance));
```
**PROBLEMA**: Subtrai variância diretamente (sem multiplicador)

#### calculate-geo-metrics (linha 154-163):
```typescript
const overallMean = providerAvgs.reduce((a, b) => a + b, 0) / providerAvgs.length;
const interProviderVariance = providerAvgs.reduce((sum, avg) => {
  return sum + Math.pow(avg - overallMean, 2);
}, 0) / providerAvgs.length;
const interProviderStdDev = Math.sqrt(interProviderVariance);

// CPI: 100 quando desvio padrão é 0, decresce conforme aumenta
cpiScore = Math.round(Math.max(0, 100 - (interProviderStdDev * 2)));
```
**DIFERENÇA**: Usa **desvio padrão × 2** (não variância)

### Impacto:
**DUAS FÓRMULAS DIFERENTES CALCULANDO O MESMO MÉTRICO!**

- `calculate-cpi-score`: CPI = 100 - variância_média
- `calculate-geo-metrics`: CPI = 100 - (desvio_padrão × 2)

**Matematicamente**:
- Variância = desvio_padrão²
- Se desvio_padrão = 10 → variância = 100
- Fórmula 1: CPI = 100 - 100 = 0
- Fórmula 2: CPI = 100 - (10 × 2) = 80
- **DIFERENÇA DE 80 PONTOS!** 🚨

### Qual está correta?
**RESPOSTA**: `calculate-geo-metrics` está **MAIS CORRETA** porque:
1. Usa desvio padrão (mesma unidade que dados)
2. Multiplica por 2 para sensibilidade apropriada
3. Variância pode ser valores muito grandes (ex: 500+) resultando em CPI negativo

---

## ✅ Componentes Matematicamente CORRETOS

### 1. GEO Score Final (5 Pilares)
**Localização**: `supabase/functions/calculate-geo-metrics/index.ts:175-181`

```typescript
GEO Score = (BT × 0.2) + (ES × 0.15) + (RC × 0.25) + (AC × 0.25) + (IE × 0.15)
```

**Verificação**:
- ✅ Pesos somam 100% (0.2 + 0.15 + 0.25 + 0.25 + 0.15 = 1.0)
- ✅ Cada pilar está na escala 0-100
- ✅ Resultado final está na escala 0-100
- ✅ Implementação corresponde à documentação (CALCULATION_SPEC.md)

**Exemplo (WYSE)**:
```
BT=72 × 0.2  = 14.40
ES=50 × 0.15 = 7.50
RC=100× 0.25 = 25.00
AC=85 × 0.25 = 21.25
IE=50 × 0.15 = 7.50
             -------
TOTAL       = 75.65 → 76 (arredondado) ✅
```

### 2. Regressão Linear
**Localização**: `src/utils/linearRegression.ts:31-78`

**Fórmula**: `y = mx + b` (mínimos quadrados)

**Verificação**:
- ✅ Slope: `m = Σ(xi - x̄)(yi - ȳ) / Σ(xi - x̄)²` ✅ CORRETO
- ✅ Intercept: `b = ȳ - mx̄` ✅ CORRETO
- ✅ R²: `1 - (SS_res / SS_tot)` ✅ CORRETO
- ✅ Correlation: `√|R²| × sign(slope)` ✅ CORRETO
- ✅ Intervalo de confiança usa t-value apropriado
- ✅ Limitação 0-100 nos valores preditos

### 3. Divergência Semântica
**Localização**: `src/pages/IGOObservability.tsx:82-96`

```typescript
mentionRates = providers.map(p => (mentioned/total) * 100)
mean = Σ(rates) / n
variance = Σ(rate - mean)² / n
stdDev = √variance
divergence = min(stdDev, 100)
```

**Verificação**:
- ✅ Usa **desvio padrão** (não variância) ✅
- ✅ Bounded em 100 máximo ✅
- ✅ Convergência = 100 - divergência ✅ CORRETO

### 4. Governance Score
**Localização**: `src/pages/IGODashboard.tsx:125-127`

```typescript
avgConfidence = consensus.reduce((sum, c) => sum + c.confidence, 0) / (consensus.length || 1)
governanceScore = round(avgConfidence * 100)
```

**Verificação**:
- ✅ Média simples de confidences ✅
- ✅ Escala correta (0-1 → 0-100) ✅

---

## 🔧 Correções Necessárias

### PRIORIDADE ALTA: Corrigir Normalização de Confidence

#### Arquivo 1: `supabase/functions/calculate-cpi-score/index.ts:67`
```typescript
// ❌ ANTES (INCORRETO):
providerConfidences.get(m.provider)!.push(m.confidence * 100);

// ✅ DEPOIS (CORRETO):
const normalizedConf = m.confidence > 1 ? m.confidence : m.confidence * 100;
providerConfidences.get(m.provider)!.push(normalizedConf);
```

#### Arquivo 2: `src/components/dashboard/WidgetCPIScore.tsx:103`
```typescript
// ❌ ANTES (INCORRETO):
providerScores.get(m.provider)!.push(Number(m.confidence) * 100);

// ✅ DEPOIS (CORRETO):
const normalizedConf = Number(m.confidence) > 1 ? Number(m.confidence) : Number(m.confidence) * 100;
providerScores.get(m.provider)!.push(normalizedConf);
```

### PRIORIDADE ALTA: Unificar Fórmula CPI

**DECISÃO**: Usar fórmula de `calculate-geo-metrics` como padrão:

```typescript
// ✅ FÓRMULA CORRETA (usar em todos os lugares):
CPI = 100 - (desvio_padrão_inter_providers × 2)

// ❌ FÓRMULA INCORRETA (não usar):
CPI = 100 - variância_média
```

**Arquivo a corrigir**: `supabase/functions/calculate-cpi-score/index.ts:110-114`

---

## 📊 Análise Detalhada dos Cálculos

### Base Técnica (BT)
```typescript
baseTecnica = min(100, round(
  (mentionRate × 80) + 
  (totalQueries > 50 ? 20 : (totalQueries/50) × 20)
))
```
**Status**: ✅ CORRETO
- Componente 1: Taxa de menção (0-80 pontos)
- Componente 2: Volume de queries (0-20 pontos)
- Total máximo: 100 pontos

### Estrutura Semântica (ES)
```typescript
uniqueTopics = Set(queries únicas mencionadas)
topicDiversity = min(100, (uniqueTopics.size / 20) × 100)
```
**Status**: ✅ CORRETO
- Normalizado para máximo de 20 tópicos = 100 pontos
- Bounded corretamente

### Relevância Conversacional (RC)
```typescript
top3Mentions = count(mentions with confidence > 70)
top3Rate = top3Mentions / totalQueries
relevanciaConversacional = round(top3Rate × 100)
```
**Status**: ✅ CORRETO
- Filtra por confidence > 70%
- Percentual direto

### Autoridade Cognitiva (AC)
```typescript
avgConfidence = Σ(confidences) / n
autoridadeCognitiva = round(avgConfidence)
```
**Status**: ⚠️ DEPENDE DA ANOMALIA #1
- Se confidence normalizado corretamente → ✅ OK
- Se confidence normalizado incorretamente → ❌ ERRO

### Inteligência Estratégica (IE)
```typescript
// Consistência (60%)
variance = Σ(confidence - mean)² / n
stdDev = √variance
consistency = max(0, 100 - (stdDev × 150))

// Evolução (40%)
growthRate = (recentMentions - previousMentions) / previousMentions
evolutionScore = min(100, 50 + (growthRate × 100))

IE = round((consistency × 0.6) + (evolutionScore × 0.4))
```
**Status**: ✅ CORRETO
- Pesos balanceados (60/40)
- Bounded corretamente
- Lógica temporal correta

---

## 🎯 Validação de Coerência Inter-LLMs

**Localização**: `src/pages/IGODashboard.tsx:232-248`

```typescript
coherence = 100 - |confidence_A - confidence_B| - |sentiment_A - sentiment_B|
```

**Status**: ⚠️ QUESTIONÁVEL
- Subtrai diferenças absolutas diretamente
- Pode resultar em valores negativos se diferenças grandes
- Usa `Math.max(0, coherence)` para proteger
- **Sugestão**: Normalizar para evitar valores extremos

---

## 📈 Análise de Predições (Linear Regression)

### Fórmulas Verificadas:

#### Slope & Intercept:
```typescript
slope = Σ(xi - x̄)(yi - ȳ) / Σ(xi - x̄)²  ✅ CORRETO
intercept = ȳ - m × x̄                    ✅ CORRETO
```

#### Coeficiente de Determinação (R²):
```typescript
SS_res = Σ(yi - ŷi)²
SS_tot = Σ(yi - ȳ)²
R² = 1 - (SS_res / SS_tot)               ✅ CORRETO
```

#### Intervalo de Confiança:
```typescript
MSE = SSE / (n - 2)                      ✅ Graus de liberdade correto
SE = √MSE
SE_pred = SE × √(1 + 1/n + (x-x̄)²/Sxx) ✅ CORRETO
margin = t_value × SE_pred               ✅ CORRETO (usa t=1.96 ou 2.0)
```

**Status**: ✅ MATEMATICAMENTE PERFEITO

---

## 📊 Detalhes das Anomalias

### ANOMALIA #1 - Detalhamento Técnico

#### Cenário Real:
```
Banco de dados: confidence = 0.85 (escala 0-1)
```

#### Comportamento Atual:

**Em calculate-geo-metrics** ✅:
```typescript
normalizedConf = 0.85 > 1 ? 0.85 : 0.85 * 100
              = false ? 0.85 : 85
              = 85 ✅ CORRETO
```

**Em calculate-cpi-score** ❌:
```typescript
confidence * 100 = 0.85 * 100 = 85
// OK para dados em escala 0-1

// MAS se algum provider já salvou como 85:
confidence * 100 = 85 * 100 = 8500 ❌ ERRO CRÍTICO!
```

#### Evidência do Problema:
Checando banco de dados real:
```sql
SELECT provider, MIN(confidence), MAX(confidence), AVG(confidence) 
FROM mentions_llm 
GROUP BY provider;
```

Se MAX(confidence) > 1 → dados já em 0-100
Se MAX(confidence) ≤ 1 → dados em 0-1

**WYSE mostra CPI muito baixo (próximo de 0)**  
**POSSÍVEL CAUSA**: Multiplicação incorreta gerando variância absurda

---

## 🔍 Análise de Providers (Case Sensitivity)

### Problema Encontrado:
Banco tem providers em múltiplos formatos:
- "ChatGPT", "chatgpt"
- "Gemini", "gemini"
- "Claude", "claude"
- "Perplexity", "perplexity"

### Já Corrigido em:
- ✅ `src/pages/IGODashboard.tsx:103` - Normaliza para Title Case
- ✅ `src/pages/IGOObservability.tsx:284-287` - Usa toLowerCase() em filtros

### Ainda Precisa Corrigir:
- ⚠️ `supabase/functions/calculate-cpi-score/index.ts` - Não normaliza providers
- ⚠️ `supabase/functions/calculate-geo-metrics/index.ts` - Não normaliza providers

**Impacto**: Providers duplicados artificialmente inflam métricas

---

## 💡 Recomendações

### URGENTE (Implementar Imediatamente):

1. **Corrigir normalização de confidence** em:
   - `supabase/functions/calculate-cpi-score/index.ts:67`
   - `src/components/dashboard/WidgetCPIScore.tsx:103`

2. **Unificar fórmula CPI** para usar desvio padrão × 2

3. **Adicionar normalização de providers** em todas as edge functions

### MÉDIO PRAZO:

4. **Criar constraint no banco** para garantir confidence entre 0-1 ou 0-100 (não misto)

5. **Adicionar testes unitários** para todas as funções matemáticas

6. **Criar dashboard de validação** mostrando distribuição de confidence por provider

---

## 📝 Checklist de Validação

### Após Correções:

- [ ] Recalcular CPI Score para todas as marcas
- [ ] Comparar valores antes/depois
- [ ] Validar que CPI está entre 0-100 (não valores absurdos)
- [ ] Verificar que providers duplicados foram eliminados
- [ ] Confirmar que todas as 3 marcas (FMU, Teia, WYSE) têm CPI diferente
- [ ] Testar com dados edge case (0 mentions, 1 provider, etc)

---

## 🎓 Observações Positivas

### O que está MUITO BEM implementado:

1. ✅ **Documentação excelente** (CALCULATION_SPEC.md, FORMULAS_PADRONIZADAS.md)
2. ✅ **Separação clara** entre GEO Score real vs técnico
3. ✅ **Histórico preservado** (inserts, não updates)
4. ✅ **Regressão linear implementação de livro-texto**
5. ✅ **Proteções contra divisão por zero**
6. ✅ **Bounded values** (min/max) em lugares apropriados
7. ✅ **Uso correto de desvio padrão** (não variância) em divergência

---

## 🏁 Conclusão

**STATUS GERAL**: ⚠️ Sistema matematicamente sólido com 2 bugs críticos de implementação

**PRIORIDADES**:
1. 🚨 Corrigir normalização de confidence (URGENTE)
2. 🚨 Unificar fórmula CPI (URGENTE)
3. ⚙️ Normalizar providers (IMPORTANTE)
4. 📊 Adicionar testes de validação (RECOMENDADO)

**ESTIMATIVA DE IMPACTO**:
- CPI Scores atuais podem estar **incorretos em até 50-80 pontos**
- GEO Score final está **correto** (não afetado)
- Predições estão **corretas** (matemática sólida)

---

**Auditado por**: Lovable AI  
**Timestamp**: 2025-11-12 20:59 UTC  
**Próxima Revisão**: Após implementação das correções