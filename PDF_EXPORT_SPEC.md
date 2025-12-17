# Especificação de Exportação de Relatórios PDF

## ⚠️ DOCUMENTO OFICIAL - CÁLCULO DE VARIAÇÃO

Este documento define como calcular a variação dos pilares GEO nos relatórios PDF exportados.

---

## Fórmula de Variação dos Pilares

```
Variação (%) = ((Valor Final - Valor Inicial) / Valor Inicial) × 100
```

### Componentes:
- **Valor Inicial:** Primeiro score registrado no histórico (mais antigo)
- **Valor Final:** Último score registrado (mais recente)

### Casos Especiais:

1. **Valor Inicial = 0 e Valor Final > 0:**
   - Resultado: `+100%` (crescimento completo)

2. **Valor Inicial > 0 e Valor Final = 0:**
   - Resultado: `-100%` (queda completa)

3. **Sem mudança:**
   - Resultado: `+0.0%`

### Formatação:
- Crescimento: `+X.X%` (sinal positivo explícito)
- Queda: `-X.X%` (sinal negativo)
- Sem mudança: `+0.0%` (com sinal positivo)

---

## Implementação

**Arquivo:** `src/pages/Scores.tsx` → função `handleExport`

```typescript
const pillarNames = [
  'base_tecnica',
  'estrutura_semantica', 
  'relevancia_conversacional',
  'autoridade_cognitiva',
  'inteligencia_estrategica'
] as const;

metrics: pillars.map((p, index) => {
  const pillarKey = pillarNames[index];
  const initialValue = firstScore?.breakdown?.[pillarKey] || 0;
  const finalValue = p.value;
  
  // Calcular variação percentual
  const variation = initialValue > 0 
    ? ((finalValue - initialValue) / initialValue * 100)
    : (finalValue > 0 ? 100 : 0);
  
  const sign = variation > 0 ? '+' : '';
  
  return {
    label: p.name,
    value: p.value.toFixed(1),
    change: `${sign}${variation.toFixed(1)}%`,
  };
})
```

---

## Estrutura do Relatório PDF

### Seção 1: Cabeçalho
```
Relatório GEO Score
Marca: [Nome da marca]
Período: [Data Inicial] - [Data Final]
Data: [Data de geração]
```

### Seção 2: Tabela de Métricas

| Métrica | Valor | Variação |
|---------|-------|----------|
| Base Técnica | 72.0 | +12.5% |
| Estrutura Semântica | 50.0 | -5.0% |
| Relevância Conversacional | 100.0 | +38.9% |
| Autoridade Cognitiva | 85.0 | +41.7% |
| Inteligência Estratégica | 50.0 | +150.0% |

### Seção 3: Resumo do Score

```
Score Inicial: 52.5
Score Final: 75.7
Crescimento: +44.2%
```

### Seção 4: Principais Insights

**INSIGHTS DINÂMICOS - Gerados automaticamente com base nos dados reais de cada marca**

#### Regras de Geração:

1. **Por Métrica:**
   - Se variação > +5%: "Crescimento positivo de +X% (valor atual: Y)"
   - Se variação < -5%: "Queda de X% - requer atenção (valor atual: Y)"
   - Se valor ≥ 90: "Excelente desempenho mantido em X"

2. **Score Geral:**
   - Se crescimento > 0%: "Evolução positiva de +X% no período analisado"
   - Se crescimento = 0%: "Mantido estável em X pontos"
   - Se crescimento < 0%: "Variação de -X% - oportunidade de melhoria"

3. **Fallback:** Mínimo de 2 insights sempre presentes

#### Exemplos por Marca:

**WYSE (sem histórico suficiente):**
```
• Score Geral: Mantido estável em 72.0 pontos
• Score atual: 72.0 pontos - análise em andamento
• Continue monitorando para identificar tendências
```

**Teia Studio (com variações positivas):**
```
• Inteligência Estratégica: Crescimento positivo de +11.1% (valor atual: 100.0)
• Score Geral: Evolução positiva de +10.5% no período analisado
```

---

## Exemplo de Cálculo

### Dados:
- **Marca:** WYSE
- **Período:** 03/11/2025 - 05/11/2025

### Base Técnica:
- Valor Inicial: 72.0
- Valor Final: 72.0
- Cálculo: `((72.0 - 72.0) / 72.0) × 100 = 0.0%`
- Resultado: `+0.0%`

### Relevância Conversacional:
- Valor Inicial: 72.0
- Valor Final: 100.0
- Cálculo: `((100.0 - 72.0) / 72.0) × 100 = 38.9%`
- Resultado: `+38.9%`

### Inteligência Estratégica:
- Valor Inicial: 20.0
- Valor Final: 50.0
- Cálculo: `((50.0 - 20.0) / 20.0) × 100 = 150.0%`
- Resultado: `+150.0%`

---

## Garantias de Consistência

### ✅ Funciona para qualquer marca:
- Os dados vêm direto do histórico da tabela `geo_scores`
- Não há valores hardcoded
- Cálculo é sempre relativo aos dados reais
- **Insights são dinâmicos e específicos para cada marca**

### ✅ Funciona para qualquer período:
- Sempre compara primeiro vs último registro do histórico
- Se houver apenas 1 registro: variação = `+0.0%`
- Insights adaptam-se ao contexto (com ou sem histórico)

### ✅ Funciona para múltiplas exportações:
- Cada exportação calcula valores em tempo real
- Não depende de cache ou valores salvos anteriormente
- **Insights são regenerados a cada exportação**

### ✅ Formato Visual Padronizado:
- Todas as marcas têm o mesmo layout de relatório
- Seções idênticas (Cabeçalho, Métricas, Resumo, Insights)
- Cores e estilos consistentes (roxo #7C3AED para headers)

---

## Formatos de Exportação

Todos os formatos usam a mesma lógica de cálculo:

1. **PDF** (`exportToPDF`)
   - Tabela formatada com jsPDF + autoTable
   - Visual profissional

2. **Excel** (`exportToExcel`)
   - Planilha XLSX com formatação
   - Colunas ajustadas automaticamente

3. **CSV** (`exportToCSV`)
   - Arquivo CSV simples
   - Compatível com Excel/Google Sheets

---

## Validação

### Testes para garantir funcionamento:

1. **Marca com 1 score apenas:**
   - Todas variações devem ser `+0.0%`

2. **Marca com crescimento:**
   - Variações devem mostrar `+X.X%`

3. **Marca com queda:**
   - Variações devem mostrar `-X.X%`

4. **Marca nova (sem histórico):**
   - Deve exibir mensagem de erro ou valores zerados

---

## Histórico de Versões

| Data | Versão | Mudança |
|------|--------|---------|
| 05/11/2025 | 1.0 | Correção do cálculo de variação (era hardcoded `+0%`) |
| 05/11/2025 | 1.1 | Documentação completa e proteção permanente |
| 05/11/2025 | 1.2 | Insights dinâmicos implementados - formato padronizado para todas as marcas |

---

**Última atualização:** 05/11/2025 22:50  
**Responsável:** Sistema Teia GEO  
**Status:** ✅ ATIVO, CORRIGIDO E PADRONIZADO PARA TODAS AS MARCAS
