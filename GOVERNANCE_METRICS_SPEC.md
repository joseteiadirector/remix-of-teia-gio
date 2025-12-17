# Especificação de Métricas de Governança Algorítmica

## Fontes Oficiais de Dados

### KAPI Metrics (ICE, GAP, Stability)
- **Tabela**: `igo_metrics_history`
- **Função de Cálculo**: `supabase/functions/calculate-igo-metrics/index.ts`
- **Trigada por**: Botão "Coletar Dados dos LLMs" na página de Governança

### CPI (Cognitive Predictive Index)
- **Tabela**: `geo_scores.cpi` (FONTE OFICIAL para Compliance Score)
- **Função de Cálculo**: `supabase/functions/calculate-geo-metrics/index.ts`
- **Fórmula**: Baseado na variância entre diferentes LLMs (linha 198-246)

## Normalização de Confiança

### Problema Identificado
Os dados de `confidence` na tabela `mentions_llm` podem estar em escalas diferentes:
- Escala 0-1 (ex: 0.95)
- Escala 0-100 (ex: 95)

### Solução Implementada
Normalização automática em `AlgorithmicGovernance.tsx`:
```typescript
const rawAvgConfidence = data.reduce(...) / data.length;
// Se média <= 1, assume escala 0-1 e converte para 0-100
const normalizedAvgConfidence = rawAvgConfidence <= 1 ? rawAvgConfidence * 100 : rawAvgConfidence;
```

## Compliance Score

Calculado como média simples das 4 métricas KAPI:
```typescript
const complianceScore = (avgICE + avgStability + avgCPI + avgGAP) / 4;
```

**IMPORTANTE**: Todas as métricas usam lógica DIRETA (maior = melhor) para o Compliance Score.

## PDF Export

O PDF de Governança Algorítmica usa os mesmos dados normalizados da tela.
- Arquivo: `src/utils/pdf/pdfshift-generator.ts` → `generateGovernanceHTML()`
- Valores de confiança já chegam normalizados (0-100)

## Arquivos Relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/pages/AlgorithmicGovernance.tsx` | Página principal, coleta e exibição |
| `src/utils/pdf/pdfshift-generator.ts` | Geração do PDF |
| `supabase/functions/calculate-igo-metrics/index.ts` | Cálculo de ICE, GAP, Stability, CPI (IGO) |
| `supabase/functions/calculate-geo-metrics/index.ts` | Cálculo de GEO Score e CPI (oficial) |
| `src/config/kapiMetrics.ts` | Configuração e thresholds KAPI |

## Regras Críticas

1. **NÃO** modificar fórmulas de cálculo sem atualizar esta documentação
2. **NÃO** usar CPI de `igo_metrics_history` para Compliance Score (usar `geo_scores.cpi`)
3. **SEMPRE** normalizar valores de confiança antes de exibir/exportar
4. **SEMPRE** manter consistência entre tela e PDF

---
Última atualização: 2025-12-17
