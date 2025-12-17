# Especificação de Cálculo do GEO Score

## ⚠️ DOCUMENTO OFICIAL - NÃO MODIFICAR SEM APROVAÇÃO

Este documento define a fórmula oficial e permanente para o cálculo do GEO Score.

---

## Fórmula do GEO Score Final

```
GEO Score = (BT × 0.2) + (ES × 0.15) + (RC × 0.25) + (AC × 0.25) + (IE × 0.15)
```

Onde:
- **BT** = Base Técnica (0-100)
- **ES** = Estrutura Semântica (0-100)
- **RC** = Relevância Conversacional (0-100)
- **AC** = Autoridade Cognitiva (0-100)
- **IE** = Inteligência Estratégica (0-100)

---

## 1. Base Técnica (BT) - Peso: 20%

**Definição:** Infraestrutura e dados estruturados

**Cálculo:**
```javascript
baseTecnica = min(100, round(
  (mentionRate × 80) +                              // Taxa de menção ponderada
  (totalQueries > 50 ? 20 : (totalQueries/50) × 20) // Volume de queries
))
```

**Componentes:**
- Taxa de menção entre queries (80% do peso)
- Volume total de queries analisadas (20% do peso, máximo em 50 queries)

---

## 2. Estrutura Semântica (ES) - Peso: 15%

**Definição:** Qualidade do conteúdo e contexto

**Cálculo:**
```javascript
uniqueTopics = Set(mentions.filter(m => m.mentioned).map(m => m.query))
topicDiversity = min(100, (uniqueTopics.size / 20) × 100)
estruturaSemantica = round(topicDiversity)
```

**Componentes:**
- Diversidade de tópicos mencionados (máximo: 20 tópicos únicos = 100 pontos)

---

## 3. Relevância Conversacional (RC) - Peso: 25%

**Definição:** Frequência e contexto nas respostas de alta confiança

**Cálculo:**
```javascript
top3Mentions = mentions.filter(m => m.mentioned && m.confidence > 70).length
top3Rate = totalQueries > 0 ? (top3Mentions / totalQueries) : 0
relevanciaConversacional = round(top3Rate × 100)
```

**Componentes:**
- Taxa de menções com alta confiança (>70%)

---

## 4. Autoridade Cognitiva (AC) - Peso: 25%

**Definição:** Confiança e credibilidade média

**Cálculo:**
```javascript
mentionsWithConfidence = mentions.filter(m => m.mentioned && m.confidence > 0)
avgConfidence = mentionsWithConfidence.length > 0
  ? sum(mentionsWithConfidence.map(m => m.confidence)) / mentionsWithConfidence.length
  : 0
autoridadeCognitiva = round(avgConfidence)
```

**Componentes:**
- Média da confiança de todas as menções válidas

---

## 5. Inteligência Estratégica (IE) - Peso: 15%

**Definição:** Consistência e evolução temporal

**Cálculo:**
```javascript
// Consistência (60%)
mean = avgConfidence
variance = sum((confidence - mean)²) / n
stdDev = sqrt(variance)
consistency = max(0, 100 - (stdDev × 150))

// Evolução (40%)
growthRate = (recentMentions - previousMentions) / previousMentions
evolutionScore = min(100, 50 + (growthRate × 100))

inteligenciaEstrategica = round((consistency × 0.6) + (evolutionScore × 0.4))
```

**Componentes:**
- Consistência das menções (60% - baseado no desvio padrão)
- Evolução temporal últimos 7 vs 14 dias (40%)

---

## Implementação

**Arquivo:** `supabase/functions/calculate-geo-metrics/index.ts`

**Tabela de destino:** `geo_scores`

**Campos armazenados:**
```typescript
{
  brand_id: string,
  score: number,           // GEO Score Final (0-100)
  breakdown: {
    base_tecnica: number,
    estrutura_semantica: number,
    relevancia_conversacional: number,
    autoridade_cognitiva: number,
    inteligencia_estrategica: number,
    // Métricas adicionais para análise
    total_mentions: number,
    total_queries: number,
    mention_rate: number,
    top3_rate: number,
    avg_confidence: number,
    topic_coverage: number
  },
  computed_at: timestamp
}
```

---

## Garantia de Consistência

### Telas que consomem este cálculo:
1. **GeoMetrics** (`src/pages/GeoMetrics.tsx`)
   - Lê da tabela `geo_scores`
   - Exibe score total e breakdown dos 5 pilares

2. **Scores** (`src/pages/Scores.tsx`)
   - Lê da tabela `geo_scores`
   - Exibe score total, breakdown e gráficos de evolução

### Fonte Única de Verdade:
- ✅ Ambas as telas leem **EXATAMENTE** da mesma fonte: tabela `geo_scores`
- ✅ Apenas a edge function `calculate-geo-metrics` escreve nesta tabela
- ✅ Não há cálculos duplicados no frontend
- ✅ Consistência matemática garantida

---

## Exemplo de Validação

Para WYSE em 05/11/2025:

| Pilar | Valor | Peso | Contribuição |
|-------|-------|------|--------------|
| Base Técnica | 72.0 | 20% | 14.40 |
| Estrutura Semântica | 50.0 | 15% | 7.50 |
| Relevância Conversacional | 100.0 | 25% | 25.00 |
| Autoridade Cognitiva | 85.0 | 25% | 21.25 |
| Inteligência Estratégica | 50.0 | 15% | 7.50 |
| **TOTAL** | | **100%** | **75.65** |

**Score arredondado:** 75.7 (quando exibido com 1 casa decimal)

---

## Histórico de Versões

| Data | Versão | Mudança |
|------|--------|---------|
| 05/11/2025 | 1.0 | Especificação inicial oficial |

---

## Notas Importantes

1. **Não modificar os pesos sem análise de impacto completa**
2. **Todo cálculo é armazenado com timestamp para auditoria**
3. **Histórico completo é mantido na tabela `geo_scores`**
4. **Cada execução cria um novo registro (não sobrescreve)**
5. **Esta fórmula é a base para comparações e relatórios**

---

**Última atualização:** 05/11/2025 22:23  
**Responsável:** Sistema Teia GEO  
**Status:** ✅ ATIVO E VALIDADO
