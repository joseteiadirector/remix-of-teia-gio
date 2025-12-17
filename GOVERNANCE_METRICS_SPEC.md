# Especificação de Métricas KAPI - Fonte Única da Verdade

## Documento Científico Base
**"Observabilidade Cognitiva Generativa"** - Este documento é a FONTE DA VERDADE para todas as fórmulas e cálculos da plataforma.

## Fontes Oficiais de Dados (TODA A PLATAFORMA)

### KAPI Metrics (ICE, GAP, Stability)
- **Tabela**: `igo_metrics_history`
- **Função de Cálculo**: `supabase/functions/calculate-igo-metrics/index.ts`
- **Lógica**: DIRETA (maior valor = melhor performance) para TODAS

### CPI (Cognitive Predictive Index)
- **Tabela**: `geo_scores.cpi` (FONTE OFICIAL ÚNICA)
- **Função de Cálculo**: `supabase/functions/calculate-geo-metrics/index.ts`
- **IMPORTANTE**: Usar `geo_scores.cpi` em TODA a plataforma (telas E PDFs)

## Fórmulas do Artigo Científico

### ICE (Index of Cognitive Efficiency)
```
ICE = 1 - σ(taxas de menção entre LLMs)
```
- Lógica: DIRETA (maior = melhor)
- Threshold: ≥75% é OK

### GAP (Precisão de Alinhamento de Observabilidade)
```
GAP = (Pₐ / Pₜ) × 100 × C
```
- Pₐ = provedores alinhados
- Pₜ = total de provedores
- C = fator de consenso
- Lógica: DIRETA (maior = melhor)
- Threshold: ≥60% é OK

### Estabilidade Cognitiva
```
Estabilidade = max(0, 100 - σ×150)
```
- σ = desvio padrão normalizado (0-1)
- Lógica: DIRETA (maior = melhor)
- Threshold: ≥70% é OK

### CPI (Cognitive Predictive Index)
```
CPI = 1 - (variância média das previsões)
```
- Lógica: DIRETA (maior = melhor)
- Threshold: ≥65% é OK

## Normalização de Confiança

### Problema Identificado
Os dados de `confidence` na tabela `mentions_llm` podem estar em escalas diferentes:
- Escala 0-1 (ex: 0.95)
- Escala 0-100 (ex: 95)

### Solução Implementada
Normalização automática em TODAS as telas e PDFs:
```typescript
const rawAvgConfidence = data.reduce(...) / data.length;
// Se média <= 1, assume escala 0-1 e converte para 0-100
const normalizedAvgConfidence = rawAvgConfidence <= 1 ? rawAvgConfidence * 100 : rawAvgConfidence;
```

## Arquivos Relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/hooks/useKAPIMetrics.ts` | Hook centralizado para métricas KAPI |
| `src/config/kapiMetrics.ts` | Configuração e thresholds KAPI |
| `src/pages/AlgorithmicGovernance.tsx` | Página Governança Algorítmica |
| `src/pages/IGOObservability.tsx` | Página IGO Observability |
| `src/utils/pdf/pdfshift-generator.ts` | Geração de todos os PDFs |
| `supabase/functions/calculate-igo-metrics/index.ts` | Cálculo ICE, GAP, Stability |
| `supabase/functions/calculate-geo-metrics/index.ts` | Cálculo GEO Score e CPI |

## Regras Críticas

1. **NUNCA** modificar fórmulas sem consultar o artigo científico
2. **SEMPRE** usar `geo_scores.cpi` como fonte de CPI em TODA a plataforma
3. **SEMPRE** normalizar valores de confiança antes de exibir/exportar
4. **SEMPRE** manter consistência TELA = PDF
5. **TODAS** as métricas KAPI usam lógica DIRETA (maior = melhor)

---
Última atualização: 2025-12-17
