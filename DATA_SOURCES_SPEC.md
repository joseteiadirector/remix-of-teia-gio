# Especificação Oficial de Fontes de Dados

## ⚠️ DOCUMENTO OFICIAL - JAMAIS MODIFICAR SEM APROVAÇÃO

Este documento define as fontes de dados oficiais e permanentes da plataforma Teia GEO IGO,
baseado no artigo científico "Observabilidade Cognitiva Generativa para Governança de IAs".

---

## FONTES ÚNICAS DE VERDADE

Todas as páginas da plataforma **DEVEM** usar exclusivamente estas tabelas:

| Métrica | Tabela Oficial | Edge Function | Artigo Ref. |
|---------|---------------|---------------|-------------|
| **GEO Score** (5 pilares) | `geo_scores` | `calculate-geo-metrics` | Página 6 |
| **SEO Score** + métricas | `seo_metrics_daily` | `calculate-seo-score` | Página 5 |
| **KAPI Metrics** (ICE, GAP, CPI, Stability) | `igo_metrics_history` | `calculate-igo-metrics` | Página 6 |
| **Menções LLM** | `mentions_llm` | `collect-llm-mentions` | Página 5 |

---

## TABELAS PROIBIDAS PARA MÉTRICAS OFICIAIS

Estas tabelas **NÃO** devem ser usadas para exibir métricas principais:

| Tabela | Propósito Real | Por que NÃO usar |
|--------|---------------|------------------|
| `url_analysis_history` | Análise de URLs avulsas | Cálculo diferente, dados temporários |
| `gsc_queries` | Dados brutos do Google | Não são métricas processadas |
| Qualquer cálculo local | N/A | Viola princípio de fonte única |

---

## FÓRMULAS KAPI (Artigo Científico - Página 6)

### ICE (Índice de Eficiência Cognitiva)
```
ICE = (Mₐ / M) × 100
```
- Mₐ = menções corretas
- M = total de menções
- **Lógica direta**: maior valor = melhor

### GAP (Precisão de Alinhamento de Observabilidade)
```
GAP = (Pₐ / P) × 100 × C
```
- Pₐ = provedores alinhados
- P = total de provedores
- C = fator de consenso semântico
- **Lógica direta**: maior valor = melhor

### Estabilidade Cognitiva
```
Estabilidade = max(0, 100 - (σ × 150))
```
- σ = desvio padrão das confianças
- **Lógica direta**: maior valor = melhor

### CPI (Índice de Previsibilidade Cognitiva)
```
CPI = max(0, 100 - (σ_temporal × 2))
```
- σ_temporal = desvio padrão temporal
- **Lógica direta**: maior valor = melhor

---

## FÓRMULA GEO SCORE (5 Pilares)

```
GEO Score = (BT × 0.2) + (ES × 0.15) + (RC × 0.25) + (AC × 0.25) + (IE × 0.15)
```

| Pilar | Peso | Descrição |
|-------|------|-----------|
| Base Técnica (BT) | 20% | Infraestrutura e dados estruturados |
| Estrutura Semântica (ES) | 15% | Qualidade do conteúdo e contexto |
| Relevância Conversacional (RC) | 25% | Frequência em respostas de alta confiança |
| Autoridade Cognitiva (AC) | 25% | Confiança e credibilidade média |
| Inteligência Estratégica (IE) | 15% | Consistência e evolução temporal |

---

## PÁGINAS E SUAS FONTES OFICIAIS

### ✅ Scores.tsx
- **GEO Score**: `geo_scores.score`
- **Breakdown**: `geo_scores.breakdown`
- **CPI**: `geo_scores.cpi`

### ✅ KPIs.tsx
- **GEO Score**: `geo_scores.score`
- **SEO Score**: `seo_metrics_daily.seo_score` (filtro: > 0)
- **KAPI Metrics**: `igo_metrics_history` (ICE, GAP, CPI, Stability)

### ✅ SeoScores.tsx
- **GEO Score**: `geo_scores.score` (mais recente)
- **SEO Score**: `seo_metrics_daily.seo_score`
- **Métricas SEO**: `seo_metrics_daily` (CTR, posição, cliques)

### ✅ GeoMetrics.tsx
- **Tudo**: `geo_scores` + `mentions_llm`

### ✅ IGODashboard.tsx / IGOObservability.tsx
- **KAPI Metrics**: `igo_metrics_history`

---

## THRESHOLDS KAPI (Classificação)

| Métrica | Excelente | Bom | Regular | Crítico |
|---------|-----------|-----|---------|---------|
| ICE | ≥ 80% | ≥ 60% | ≥ 40% | < 40% |
| GAP | ≥ 75% | ≥ 55% | ≥ 35% | < 35% |
| Stability | ≥ 70% | ≥ 50% | ≥ 30% | < 30% |
| CPI | ≥ 60% | ≥ 40% | ≥ 20% | < 20% |

---

## REGRAS CRÍTICAS

1. **NUNCA** recalcular métricas no frontend - usar valores pré-calculados
2. **NUNCA** usar `url_analysis_history` para métricas principais
3. **SEMPRE** filtrar `seo_score > 0` para evitar valores zerados
4. **SEMPRE** usar `ORDER BY ... DESC LIMIT 1` para obter mais recente
5. **TODAS** as páginas devem exibir os mesmos valores para a mesma marca

---

## VALIDAÇÃO DE CONSISTÊNCIA

O sistema inclui validação automática via:
- `src/utils/consistencyValidator.ts`
- `src/hooks/useConsistencyValidation.ts`
- `src/components/ConsistencyIndicator.tsx`

Tolerância de divergência: **±0.1** pontos

---

## HISTÓRICO DE VERSÕES

| Data | Versão | Mudança |
|------|--------|---------|
| 09/12/2025 | 1.0 | Especificação inicial baseada no artigo científico |

---

**Última atualização:** 09/12/2025  
**Responsável:** Sistema Teia GEO IGO  
**Status:** ✅ ATIVO E IMUTÁVEL  
**Referência:** Artigo "Observabilidade Cognitiva Generativa para Governança de IAs"
