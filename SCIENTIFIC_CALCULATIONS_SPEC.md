# Especificação de Cálculos - Artigo Científico

**Documento Base**: "Observabilidade Cognitiva Generativa para Governança de IAs"  
**Data de Referência**: 25/11/2025

---

## 1. Métricas KAPI (Key Algorithmic Predictive Indicators)

### 1.1 ICE - Índice de Eficiência Cognitiva

**Fórmula Científica (Capítulo 3):**
```
ICE = (Mₐ / Mₜ) × 100
```

**Onde:**
- Mₐ = número de menções corretas
- Mₜ = número total de menções

**Implementação:** `supabase/functions/calculate-igo-metrics/index.ts` (linhas 190-201)
```typescript
const ice = Math.round((correctMentions / totalMentionsAll) * 100);
```

**Lógica:** DIRETA (maior = melhor)  
**Referência:** Ross (2014); Russell & Norvig (2020)

---

### 1.2 GAP - Precisão de Alinhamento de Observabilidade

**Fórmula Científica (Capítulo 3):**
```
GAP = (Pₐ / Pₜ) × 100 × C
```

**Onde:**
- Pₐ = provedores alinhados (mentionRate > 50% E confidence > 50%)
- Pₜ = total de provedores
- C = fator de consenso semântico (média das confianças normalizadas)

**Implementação:** `supabase/functions/calculate-igo-metrics/index.ts` (linhas 203-232)
```typescript
const gap = Math.round((alignedProviders / providerCount) * 100 * consensusFactor);
```

**Lógica:** DIRETA (maior = melhor)  
**Referência:** Landis & Koch (1977)

---

### 1.3 Estabilidade Cognitiva

**Fórmula Científica (Capítulo 3):**
```
Estabilidade = max(0, 100 - (σ × 150))
```

**Onde:**
- σ = desvio padrão das confianças (escala 0-1 normalizada)

**Equivalência Matemática:**
- Artigo: σ_normalizado × 150 (σ em escala 0-1)
- Implementação: σ_bruto × 1.5 (σ em escala 0-100)
- Prova: σ_bruto × 1.5 = (σ_bruto/100) × 150 = σ_normalizado × 150 ✓

**Implementação:** `supabase/functions/calculate-igo-metrics/index.ts` (linhas 276-318)
```typescript
stability = Math.round(Math.max(0, 100 - (confidenceStdDev * 1.5)));
```

**Lógica:** DIRETA (maior = melhor)  
**Referência:** Montgomery et al. (2012)

---

### 1.4 CPI - Índice de Previsibilidade Cognitiva

**Fórmula Científica (Capítulo 3):**
```
CPI = max(0, 100 - (σ_temporal × 2))
```

**Onde:**
- σ_temporal = desvio padrão das confianças ao longo do tempo

**Interpretação:**
- CPI > 80 = comportamento estável
- CPI < 50 = volatilidade cognitiva crítica

**Implementação:** `supabase/functions/calculate-igo-metrics/index.ts` (linhas 234-274)
```typescript
const cpi = Math.round(Math.max(0, 100 - (temporalStdDev * 2)));
```

**Lógica:** DIRETA (maior = melhor)  
**Referência:** Montgomery (2012)

---

## 2. Algoritmos Computacionais

### 2.1 Regressão Linear

**Fórmula (Capítulo 3 - Métodos Estatísticos):**
```
y = β₀ + β₁x
β₁ = Σ(xᵢ - x̄)(yᵢ - ȳ) / Σ(xᵢ - x̄)²
β₀ = ȳ - β₁x̄
R² = 1 - (SS_res / SS_tot)
```

**Implementação:** `src/utils/linearRegression.ts`
- ✅ Calcula slope (β₁) via mínimos quadrados
- ✅ Calcula intercept (β₀)
- ✅ Calcula R² (coeficiente de determinação)
- ✅ Calcula intervalos de confiança
- ✅ Detecta anomalias via análise de resíduos

**Referência:** Montgomery et al. (2012)

---

### 2.2 Árvore de Decisão

**Critério (Capítulo 3 - Algoritmos Computacionais):**
- Classifica severidade de desvios cognitivos
- Utiliza critério de impureza de Gini para segmentação

**Implementação:** `src/utils/decisionTree.ts`
- ✅ Árvore pré-treinada para classificação de alertas
- ✅ Features: score, trend, frequency, velocity, duration
- ✅ Classes: low, medium, high, critical
- ✅ Thresholds definidos por regras de negócio

**Referência:** Breiman et al. (1984)

---

### 2.3 Similaridade Semântica

**Fórmula (Capítulo 3):**
```
Sim(A, B) = (A · B) / (||A|| × ||B||)
```

**Implementação:** Utilizada internamente no cálculo do fator de consenso (C) do GAP

**Referência:** Jurafsky & Martin (2020)

---

## 3. Thresholds de Classificação

| Métrica | Excelente | Bom | Regular | Crítico |
|---------|-----------|-----|---------|---------|
| ICE | ≥ 90% | ≥ 75% | ≥ 60% | < 60% |
| GAP | ≥ 80% | ≥ 60% | ≥ 40% | < 40% |
| Estabilidade | ≥ 85% | ≥ 70% | ≥ 55% | < 55% |
| CPI | ≥ 80% | ≥ 65% | ≥ 50% | < 50% |

---

## 4. Arquivos de Implementação

| Componente | Arquivo | Linhas Críticas |
|------------|---------|-----------------|
| ICE | `calculate-igo-metrics/index.ts` | 190-201 |
| GAP | `calculate-igo-metrics/index.ts` | 203-232 |
| CPI | `calculate-igo-metrics/index.ts` | 234-274 |
| Estabilidade | `calculate-igo-metrics/index.ts` | 276-318 |
| GEO Score | `calculate-geo-metrics/index.ts` | 118-195 |
| Regressão | `src/utils/linearRegression.ts` | 31-77 |
| Árvore Decisão | `src/utils/decisionTree.ts` | 28-93 |
| Config KAPI | `src/config/kapiMetrics.ts` | 36-122 |

---

## 5. Validação de Conformidade

**Checklist:**
- [x] ICE: Fórmula científica implementada corretamente
- [x] GAP: Fórmula científica implementada corretamente (CORRIGIDO: lógica direta)
- [x] Estabilidade: Fórmula científica com equivalência matemática verificada
- [x] CPI: Fórmula científica implementada corretamente
- [x] Regressão Linear: Implementação padrão mínimos quadrados
- [x] Árvore de Decisão: Implementação funcional para classificação

---

**Última Verificação:** 2025-12-17  
**Documento Científico de Referência:** Artigo_-_Observabilidade_Cognitiva_Generativa_25.11.2025_.docx
