# Configuração Centralizada de KAPI Metrics

## ⚠️ DOCUMENTO OFICIAL - JAMAIS MODIFICAR SEM APROVAÇÃO

Este arquivo define a configuração centralizada das métricas KAPI, garantindo que todas as páginas, 
componentes e PDFs usem a MESMA lógica de classificação e interpretação.

---

## ARQUIVO DE REFERÊNCIA

**Fonte única de verdade para KAPI:** `src/config/kapiMetrics.ts`

Este arquivo exporta:
- `KAPI_CONFIGS` - Configurações de cada métrica
- `classifyKAPIMetric()` - Função de classificação
- `isKAPIMetricOk()` - Verificação de threshold
- `getKAPIThresholdDescription()` - Descrição textual

---

## LÓGICAS DE INTERPRETAÇÃO

| Métrica | Lógica | Interpretação |
|---------|--------|---------------|
| **ICE** | DIRETA | Maior = Melhor (≥75% = Bom) |
| **GAP** | **INVERSA** | **Menor = Melhor (≤25 = Bom)** |
| **CPI** | DIRETA | Maior = Melhor (≥65% = Bom) |
| **Stability** | DIRETA | Maior = Melhor (≥70% = Bom) |

### Thresholds de Classificação:
- **ICE**: ≥90 Excelente, ≥75 Bom, ≥60 Regular, <60 Crítico
- **GAP**: ≤10 Excelente, ≤25 Bom, ≤40 Atenção, >40 Crítico
- **CPI**: ≥80 Excelente, ≥65 Bom, ≥50 Regular, <50 Crítico
- **Stability**: ≥85 Excelente, ≥70 Bom, ≥55 Regular, <55 Crítico

---

## USO OBRIGATÓRIO

Todas as páginas e componentes que exibem métricas KAPI **DEVEM** importar de:

```typescript
import { classifyKAPIMetric, isKAPIMetricOk, KAPI_CONFIGS } from '@/config/kapiMetrics';
// ou
import { useKAPIMetrics } from '@/hooks/useKAPIMetrics';
```

---

## PÁGINAS CONFORMES

- ✅ `src/pages/IGODashboard.tsx`
- ✅ `src/pages/IGOObservability.tsx`
- ✅ `src/pages/AlgorithmicGovernance.tsx`
- ✅ `src/pages/KPIs.tsx`
- ✅ `src/pages/Insights.tsx`
- ✅ `src/components/metrics/MetricInterpretationBadge.tsx`
- ✅ `src/components/metrics/MetricsOverviewCard.tsx`

---

## PROIBIÇÕES

❌ **NUNCA** classificar métricas KAPI manualmente em componentes  
❌ **NUNCA** usar thresholds hardcoded diferentes dos oficiais  
❌ **NUNCA** recalcular KAPI no frontend (usar valores do banco)  
❌ **NUNCA** inverter a lógica do GAP (sempre: menor = melhor)

---

**Status:** ✅ ATIVO E IMUTÁVEL
