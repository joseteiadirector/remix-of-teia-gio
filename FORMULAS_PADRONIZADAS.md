# Fórmulas Padronizadas do Sistema GEO

**ATENÇÃO**: Este documento define as fórmulas matemáticas OFICIAIS do sistema. 
**NUNCA** altere essas fórmulas sem atualizar TODAS as páginas que as utilizam.

---

## 📊 Score GEO

**Fonte**: Tabela `geo_scores.score`  
**Cálculo**: Realizado pela Edge Function `calculate-geo-metrics`  
**Range**: 0-100

### Componentes (5 Pilares):
1. **Base Técnica (BT)** - Peso: 20%
2. **Estrutura Semântica (ES)** - Peso: 15%
3. **Relevância Conversacional (RC)** - Peso: 25%
4. **Autoridade Cognitiva (AC)** - Peso: 25%
5. **Inteligência Estratégica (IE)** - Peso: 15%

**Fórmula Final (conforme CALCULATION_SPEC.md)**:
```
GEO Score = (BT × 0.20) + (ES × 0.15) + (RC × 0.25) + (AC × 0.25) + (IE × 0.15)
```

**Páginas que usam**:
- `src/pages/KPIs.tsx` (linha ~97)
- `src/pages/Scores.tsx` (linha ~97)
- `src/pages/GeoMetrics.tsx` (linha ~120)
- `src/pages/SeoScores.tsx` (linha ~86)

---

## 📈 Score SEO

**Fonte**: Calculado a partir de `seo_metrics_daily`  
**Dados Base**: Google Search Console (GSC) + Google Analytics 4 (GA4)  
**Range**: 0-100

### ⚠️ FÓRMULA PADRONIZADA (USAR EM TODO O SISTEMA)

```typescript
// 1. Normalizar CTR (banco armazena como decimal: 0.028 = 2.8%)
const ctrNormalized = ctr * 100;

// 2. CTR Score: ideal 5% = 100 pontos
const ctrScore = Math.min(100, (ctrNormalized / 5) * 100);

// 3. Posição Score: escala 1-10 (posição 1 = 100pts, posição 10 = 0pts)
const positionScore = Math.max(0, 100 - ((avgPosition - 1) * 11.11));

// 4. Conversão Score: ideal 5% = 100 pontos
const conversionScore = Math.min(100, (conversionRate / 5) * 100);

// 5. SCORE FINAL: Peso 40% posição, 30% CTR, 30% conversão
seoScore = Math.round((positionScore * 0.4) + (ctrScore * 0.3) + (conversionScore * 0.3));
```

### Justificativa dos Pesos:
- **Posição (40%)**: Maior impacto direto na visibilidade
- **CTR (30%)**: Indica qualidade do snippet e relevância
- **Conversão (30%)**: Mede efetividade do tráfego

**Páginas que usam**:
- `src/pages/KPIs.tsx` (linha ~123-139)
- `src/pages/GeoMetrics.tsx` (linha ~141-161)
- `src/pages/SeoScores.tsx` (linha ~97-105)

---

## 🎯 ICE - Índice de Convergência Estratégica

**Significado**: Mede o alinhamento entre estratégias GEO e SEO  
**Range**: 0-1 (exibido como 0-100 nos gráficos)

### Fórmula:
```typescript
ICE = 1 - (Math.abs(scoreGEO - scoreSEO) / 100)
```

### Interpretação:
- **ICE = 1.0 (100%)**: Perfeito alinhamento (GEO = SEO)
- **ICE = 0.52 (52%)**: Gap de 48 pontos entre GEO e SEO
- **ICE = 0.0 (0%)**: Máxima distorção (diferença de 100 pontos)

**Páginas que usam**:
- `src/pages/KPIs.tsx` (linha ~143)

---

## ⚡ GAP - Prioridade Estratégica de Ação

**Significado**: Divergência absoluta entre otimização para IA e busca tradicional  
**Range**: 0-100

### Fórmula Padronizada:
```typescript
GAP = Math.abs(scoreGEO - scoreSEO)
```

### Interpretação:
- **GAP = 0**: Perfeito alinhamento (mesma pontuação GEO e SEO)
- **GAP = 20-30**: Divergência moderada - estratégias complementares
- **GAP = 50+**: Alta divergência - necessário ajuste de estratégia
- **GAP = 80-100**: Divergência crítica - requer ação imediata

**Páginas que usam**:
- `src/pages/KPIs.tsx` (linha ~167)
- `src/pages/GeoMetrics.tsx` (linha ~183)

**Relação com ICE**: ICE = 1 - (GAP / 100)

---

## 🧠 Métricas IGO (Intelligent Governance Optimization)

### CPI - Cognitive Predictive Index

**Significado**: Consistência preditiva das respostas dos LLMs  
**Range**: 0-100  
**Edge Function**: `calculate-igo-metrics`

#### Fórmula:
```typescript
// 1. Calcular desvio padrão das confianças de todos os LLMs
const allConfidences = providers.flatMap(p => byProvider[p].confidences);
const meanConfidence = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
const confidenceVariance = allConfidences.reduce((acc, val) => 
  acc + Math.pow(val - meanConfidence, 2), 0
) / allConfidences.length;
const confidenceStdDev = Math.sqrt(confidenceVariance);

// 2. CPI final
CPI = 100 - (confidenceStdDev × 1.5)
```

#### Interpretação:
- **CPI = 90-100**: Excelente consistência - LLMs concordam nas confianças
- **CPI = 70-89**: Boa consistência - pequenas variações
- **CPI = 50-69**: Consistência moderada - variações significativas
- **CPI = 0-49**: Baixa consistência - LLMs têm níveis de confiança muito diferentes

**Exemplo Real**: CPI = 37% indica alta variância entre confianças dos LLMs (divergência de ~42%)

---

### GAP (IGO) - Governance Alignment Precision

**Significado**: Precisão de alinhamento contextual (confiança média ponderada)  
**Range**: 0-100  
**Edge Function**: `calculate-igo-metrics`  
**⚠️ NOTA**: GAP (IGO) é diferente de GAP (GEO vs SEO)

#### Fórmula:
```typescript
// 1. Calcular média ponderada de confiança
let totalWeightedConfidence = 0;
let totalWeight = 0;

providers.forEach(p => {
  const avgConfidence = metrics.confidences.reduce((a, b) => a + b, 0) / metrics.confidences.length;
  const weight = metrics.mentioned; // Peso = menções positivas
  totalWeightedConfidence += avgConfidence × weight;
  totalWeight += weight;
});

const weightedAvgConfidence = totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;

// 2. Fator de cobertura (ideal: 4 LLMs)
const coverageFactor = Math.min(providerCount / 4, 1);

// 3. GAP final
GAP = weightedAvgConfidence × coverageFactor
```

#### Interpretação:
- **GAP = 85-100**: Excelente alinhamento e cobertura completa
- **GAP = 70-84**: Bom alinhamento com cobertura adequada
- **GAP = 50-69**: Alinhamento moderado - melhorar cobertura
- **GAP = 0-49**: Baixo alinhamento - revisar governança

**Exemplo Real**: GAP = 59% indica confiança moderada com possível cobertura incompleta

---

### Estabilidade Cognitiva

**Significado**: Consistência temporal das respostas (últimos 7 dias vs 7-30 dias)  
**Range**: 0-100  
**Edge Function**: `calculate-igo-metrics`

#### Fórmula:
```typescript
// 1. Baseline perfeita
let stability = 100;

// 2. Calcular taxas de menção em períodos diferentes
const recentRate = recentMentions.filter(m => m.mentioned).length / recentMentions.length;
const olderRate = olderMentions.filter(m => m.mentioned).length / olderMentions.length;

// 3. Calcular variação temporal
const temporalVariation = Math.abs(recentRate - olderRate) × 100;

// 4. Estabilidade final (penalização progressiva)
stability = 100 - (temporalVariation × 2)
```

#### Interpretação:
- **Estabilidade = 90-100**: Comportamento extremamente consistente
- **Estabilidade = 70-89**: Comportamento estável com pequenas variações
- **Estabilidade = 50-69**: Variações moderadas - monitorar tendências
- **Estabilidade = 0-49**: Alta volatilidade - investigar causas

**Exemplo Real**: 82% indica comportamento estável com variação temporal de ~9%

---

### ICE (IGO) - Index of Cognitive Efficiency

**Significado**: Eficiência de consenso entre LLMs  
**Range**: 0-100  
**Edge Function**: `calculate-igo-metrics`  
**⚠️ NOTA**: ICE (IGO) é diferente de ICE (GEO vs SEO)

#### Fórmula:
```typescript
// 1. Calcular taxas de menção por provider
const mentionRates = providers.map(p => 
  (byProvider[p].mentioned / byProvider[p].total) × 100
);

// 2. Média e desvio padrão das taxas
const meanRate = mentionRates.reduce((a, b) => a + b, 0) / mentionRates.length;
const variance = mentionRates.reduce((acc, val) => 
  acc + Math.pow(val - meanRate, 2), 0
) / mentionRates.length;
const stdDev = Math.sqrt(variance);
const normalizedStdDev = stdDev / 100; // Normalizar para 0-1

// 3. Consenso
const consensus = meanRate / 100; // Converter para 0-1

// 4. ICE final
ICE = (consensus × 100) × (1 - normalizedStdDev)
```

#### Interpretação:
- **ICE = 85-100**: Alto consenso - LLMs concordam
- **ICE = 70-84**: Bom consenso com pequenas divergências
- **ICE = 50-69**: Consenso moderado - analisar divergências
- **ICE = 0-49**: Baixo consenso - investigar alucinações

---

### Score de Compliance Algorítmico

**Fonte**: `src/pages/AlgorithmicGovernance.tsx`  
**Range**: 0-100

#### Fórmula:
```typescript
complianceScore = (avgStability + avgCPI + avgGAP) / 3
```

#### Thresholds de Compliance:
- **≥ 85**: Excelente - Sistema em conformidade
- **70-84**: Bom - Pequenos ajustes necessários
- **50-69**: Adequado - Ação corretiva recomendada
- **< 50**: Crítico - Intervenção imediata necessária

**Páginas que usam**:
- `src/pages/AlgorithmicGovernance.tsx` (Governança Algorítmica)

---

## 🔄 Consistência entre Páginas

### Páginas Sincronizadas:
✅ **KPIs** (`/kpis`) - Usa fórmulas padronizadas  
✅ **GEO Scores** (`/scores`) - Score GEO da tabela oficial  
✅ **SEO Scores** (`/seo-scores`) - Score SEO calculado com fórmula padronizada  
✅ **GEO Metrics** (`/geo-metrics`) - Score SEO calculado com fórmula padronizada  
✅ **SEO Metrics** (`/seo-metrics`) - Métricas base (CTR, Posição, Conversão)  

---

## 🎨 Visualização nos Gráficos

### Gráfico ICE (BarChart):
- **Eixo Y**: 0-100 (scores normalizados)
- **Barras**:
  - Score GEO: valor direto (ex: 82.2)
  - Score SEO: valor direto (ex: 34.0)
  - ICE Final: `ICE × 100` (ex: 0.52 × 100 = 52.0)

### Gráfico GAP (BarChart):
- **Eixo Y**: 0-100
- **Barras**:
  - Score GEO: valor direto (ex: 82.2)
  - Score SEO: valor direto (ex: 34.0)
  - GAP: diferença absoluta (ex: 48.2)

---

## 📝 Checklist de Manutenção

Ao modificar qualquer cálculo, verificar:

- [ ] `src/pages/KPIs.tsx` - Função `loadKPIData()`
- [ ] `src/pages/GeoMetrics.tsx` - Função `calculateSeoScore()`
- [ ] `src/pages/SeoScores.tsx` - Cálculo em `fetchData()`
- [ ] `src/pages/Scores.tsx` - Score GEO (apenas leitura)
- [ ] `src/pages/SeoMetrics.tsx` - Métricas base (apenas exibição)
- [ ] `src/pages/AlgorithmicGovernance.tsx` - Métricas IGO e Compliance
- [ ] `supabase/functions/calculate-igo-metrics/index.ts` - Cálculos IGO
- [ ] Este documento `FORMULAS_PADRONIZADAS.md`

---

## 🚨 Regras Críticas

1. **NUNCA** calcule SEO Score de forma diferente entre páginas
2. **SEMPRE** use a tabela `geo_scores.score` para GEO Score (não calcular novamente)
3. **SEMPRE** use métricas reais do GSC/GA4 para SEO Score (não análise técnica)
4. **NUNCA** altere pesos sem atualizar todas as páginas
5. **SEMPRE** documente mudanças neste arquivo
6. **ATENÇÃO**: GAP e ICE têm duas definições diferentes (GEO vs SEO / IGO Multi-LLM)

---

**Última atualização**: 2025-11-14  
**Versão**: 2.0.0  
**Status**: ✅ TODAS AS PÁGINAS SINCRONIZADAS + IGO DOCUMENTADO
