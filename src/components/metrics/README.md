# Sistema de Interpretação de Métricas KAPI

Este módulo fornece componentes para interpretar e exibir métricas de performance da plataforma Teia GEO de forma clara e contextualizada para o usuário final.

## Componentes Disponíveis

### 1. MetricInterpretationBadge

Badge interpretativo que classifica automaticamente o valor de uma métrica KAPI.

**Props:**
- `metricType`: `'ice' | 'gap' | 'cpi' | 'stability'` - Tipo da métrica
- `value`: `number` - Valor numérico da métrica
- `showTooltip`: `boolean` (opcional, padrão: `true`) - Exibir tooltip explicativo

**Exemplo de uso:**
```tsx
import { MetricInterpretationBadge } from "@/components/metrics";

<MetricInterpretationBadge metricType="ice" value={75} />
// Resultado: 🟡 Bom (com tooltip explicativo)
```

**Faixas de Interpretação:**

#### ICE (Índice de Convergência Estratégica)
- 🟢 90-100: Excelente
- 🟡 75-89: Bom
- 🟠 60-74: Regular
- 🔴 0-59: Crítico

#### GAP (Prioridade de Ação)
- 🟢 0-10: Excelente
- 🟡 11-25: Bom
- 🟠 26-40: Atenção
- 🔴 41+: Crítico

#### CPI (Previsibilidade Cognitiva)
- 🟢 80-100: Excelente
- 🟡 65-79: Bom
- 🟠 50-64: Regular
- 🔴 0-49: Crítico

#### Estabilidade Cognitiva
- 🟢 85-100: Excelente
- 🟡 70-84: Bom
- 🟠 55-69: Regular
- 🔴 0-54: Crítico

---

### 2. MetricsGuide

Painel expansível com guia completo de interpretação de todas as métricas KAPI, incluindo exemplos práticos, faixas de valores e benchmarks de mercado.

**Props:** Nenhuma (componente standalone)

**Exemplo de uso:**
```tsx
import { MetricsGuide } from "@/components/metrics";

// Em qualquer página onde você quer educação sobre métricas
<MetricsGuide />
```

**Conteúdo inclui:**
- Explicação detalhada de cada métrica (ICE, GAP, CPI, Estabilidade)
- Faixas de interpretação com badges coloridos
- Exemplos práticos de tradução de valores
- Recomendações de ação por faixa
- Benchmarks de mercado por segmento (E-commerce, B2B SaaS, Marketing)

---

### 3. MetricsOverviewCard

Card completo que exibe múltiplas métricas KAPI com interpretação visual (badges, progress bars, ícones).

**Props:**
- `ice`: `number` (opcional) - Valor do ICE
- `gap`: `number` (opcional) - Valor do GAP
- `cpi`: `number` (opcional) - Valor do CPI
- `stability`: `number` (opcional) - Valor da Estabilidade Cognitiva
- `className`: `string` (opcional) - Classes CSS adicionais

**Exemplo de uso:**
```tsx
import { MetricsOverviewCard } from "@/components/metrics";

// Exibir todas as métricas disponíveis
<MetricsOverviewCard
  ice={75.5}
  gap={24.2}
  cpi={68.0}
  stability={72.8}
/>

// Exibir apenas métricas específicas
<MetricsOverviewCard
  ice={82}
  gap={18}
/>
```

---

## Quando usar cada componente?

### Use `MetricInterpretationBadge` quando:
- Você quer exibir apenas a classificação de uma métrica (sem valor numérico completo)
- Precisa de um indicador rápido e compacto
- Está dentro de uma tabela ou lista onde espaço é limitado
- Exemplo: Dashboard widgets, listas de marcas, comparativos

### Use `MetricsGuide` quando:
- O usuário precisa entender o que cada métrica significa
- Está em uma página educacional ou de onboarding
- Quer oferecer contexto profundo sobre as métricas
- Exemplo: Página de Insights, página de Help/Documentação

### Use `MetricsOverviewCard` quando:
- Você quer exibir múltiplas métricas de uma vez com contexto visual completo
- Precisa mostrar valores numéricos + interpretação + progresso
- Está em uma página de detalhes de marca ou relatório
- Exemplo: Dashboard principal, página de KPIs, Insights

---

## Exemplo Completo de Implementação

### Em uma página de Dashboard de Marca:

```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  MetricsGuide, 
  MetricsOverviewCard, 
  MetricInterpretationBadge 
} from "@/components/metrics";

export function BrandDashboard({ brandId }: { brandId: string }) {
  // Buscar métricas IGO mais recentes
  const { data: metrics } = useQuery({
    queryKey: ["igo-metrics", brandId],
    queryFn: async () => {
      const { data } = await supabase
        .from("igo_metrics_history")
        .select("ice, gap, cpi, cognitive_stability")
        .eq("brand_id", brandId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Guia educacional no topo */}
      <MetricsGuide />

      {/* Overview visual das métricas */}
      {metrics && (
        <MetricsOverviewCard
          ice={metrics.ice}
          gap={metrics.gap}
          cpi={metrics.cpi}
          stability={metrics.cognitive_stability}
        />
      )}

      {/* Uso individual em outras seções */}
      <Card>
        <h3>Performance Estratégica</h3>
        <div className="flex items-center gap-2">
          <span>ICE Atual:</span>
          {metrics && (
            <MetricInterpretationBadge 
              metricType="ice" 
              value={metrics.ice} 
            />
          )}
        </div>
      </Card>
    </div>
  );
}
```

---

## Páginas que já utilizam estes componentes:

- ✅ `/insights` - Usa MetricsGuide + MetricsOverviewCard

## Páginas recomendadas para implementação:

- 🔄 `/kpis` - Adicionar badges nas métricas individuais
- 🔄 `/igo-dashboard` - Adicionar MetricsOverviewCard no resumo
- 🔄 `/igo-observability` - Usar badges nos comparativos
- 🔄 `/brands` - Exibir badges no card de cada marca
- 🔄 `/dashboard` - Adicionar overview no widget de métricas

---

## Benefícios da Implementação

1. **Clareza Imediata**: Usuários entendem se uma métrica é boa ou ruim instantaneamente
2. **Educação Contextual**: Tooltips e guia fornecem conhecimento profundo sem sobrecarregar a UI
3. **Consistência Visual**: Mesma linguagem de cores/badges em toda plataforma
4. **Ação Orientada**: Recomendações específicas por faixa de valor
5. **Benchmarking**: Comparação com médias de mercado

---

## Estilo e Tematização

Todos os componentes seguem o design system da aplicação:
- Cores semânticas (HSL) do `index.css`
- Variantes de Badge do shadcn/ui
- Ícones do lucide-react
- Totalmente responsivo (mobile-first)
- Suporte a dark mode automático
