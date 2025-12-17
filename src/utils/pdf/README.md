# Sistema Unificado de PDF Export

## 🎯 Objetivo

Este sistema garante que **NENHUM PDF seja gerado com dados vazios ou inconsistentes**. Todas as exportações passam por validação robusta, captura padronizada de charts e geração estruturada.

## 📁 Estrutura

```
src/utils/pdf/
├── README.md                 # Esta documentação
├── index.ts                  # Entry point - exporta tudo
├── types.ts                  # Tipos TypeScript compartilhados
├── unified-exports.ts        # Funções principais de exportação
├── core/
│   ├── pdfGenerator.ts       # Motor central de geração
│   ├── chartCapture.ts       # Sistema unificado de captura
│   └── dataValidator.ts      # Validação robusta de dados
├── sections/
│   ├── geoSection.ts         # Seção GEO padronizada
│   ├── seoSection.ts         # Seção SEO padronizada
│   ├── igoSection.ts         # Seção IGO/KAPI padronizada
│   └── cpiSection.ts         # Seção CPI padronizada
└── config/
    └── chartIds.ts           # IDs padronizados de charts
```

## 🚀 Como Usar

### Exportar Relatório GEO

```typescript
import { exportGEOReport } from '@/utils/pdf/unified-exports';

const data: ExportDataGEO = {
  brandName: 'Minha Marca',
  brandDomain: 'minhamarca.com',
  geoScore: 85.5,
  pillars: [
    { name: 'Base Técnica', value: 90.0, variation: 5.0 },
    { name: 'Estrutura Semântica', value: 88.0, variation: -2.0 },
    // ...
  ],
  mentions: [
    { provider: 'ChatGPT', query: 'test', mentioned: true, confidence: 0.95 },
    // ...
  ],
  period: 'Novembro 2025',
  kapiMetrics: { ice: 95.0, gap: 12.0, cpi: 88.0, stability: 92.0 }
};

await exportGEOReport(data);
```

### Exportar Relatório SEO

```typescript
import { exportSEOReport } from '@/utils/pdf/unified-exports';

const data: ExportDataSEO = {
  brandName: 'Minha Marca',
  seoScore: 78.5,
  metrics: {
    organic_traffic: 15000,
    total_clicks: 2500,
    total_impressions: 50000,
    ctr: 0.05,
    avg_position: 5.2,
    seo_score: 78.5
  },
  period: 'Novembro 2025'
};

await exportSEOReport(data);
```

### Exportar Relatório IGO

```typescript
import { exportIGOReport } from '@/utils/pdf/unified-exports';

const data: ExportDataIGO = {
  brandName: 'Portfólio',
  brands: [
    {
      name: 'Marca 1',
      metrics: { ice: 95.0, gap: 12.0, cpi: 88.0, stability: 92.0 }
    },
    {
      name: 'Marca 2',
      metrics: { ice: 88.0, gap: 18.0, cpi: 82.0, stability: 85.0 }
    }
  ],
  period: 'Novembro 2025'
};

await exportIGOReport(data);
```

### Exportar Relatório CPI

```typescript
import { exportCPIReport } from '@/utils/pdf/unified-exports';

const data: ExportDataCPI = {
  brandName: 'Minha Marca',
  cpiMetrics: {
    cpi: 88.0,
    ice: 95.0,
    gap: 12.0,
    stability: 92.0
  },
  llmConsensus: [
    { provider: 'ChatGPT', mentions: 50, confidence: 0.95 },
    { provider: 'Gemini', mentions: 45, confidence: 0.92 },
  ],
  period: 'Novembro 2025'
};

await exportCPIReport(data);
```

## 🔍 Validação Automática

Todas as exportações passam por validação robusta ANTES de gerar o PDF:

```typescript
const validation = validateGEOData(data);

if (!validation.isValid) {
  // ❌ BLOQUEIA a geração
  // Exibe toast de erro com detalhes
  // Loga erro completo
  throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
}

if (validation.warnings.length > 0) {
  // ⚠️ PERMITE a geração, mas alerta
  // Exibe toast de warning
  // Loga avisos
}
```

## 📊 IDs de Charts Padronizados

**NUNCA** crie IDs ad-hoc nos componentes. **SEMPRE** use os IDs do sistema:

```typescript
import { CHART_IDS } from '@/utils/pdf/config/chartIds';

// ✅ CORRETO
<div id={CHART_IDS.GEO_PILLARS_CHART}>
  <Chart data={data} />
</div>

// ❌ ERRADO
<div id="my-random-chart-id">
  <Chart data={data} />
</div>
```

### IDs Disponíveis

- **GEO:** `GEO_PILLARS_CHART`, `GEO_EVOLUTION_CHART`, `GEO_MENTIONS_CHART`
- **SEO:** `SEO_METRICS_CHART`, `SEO_EVOLUTION_CHART`, `SEO_TRAFFIC_CHART`
- **IGO:** `IGO_BRANDS_COMPARISON`, `IGO_EVOLUTION_CHART`, `IGO_METRICS_RADAR`
- **CPI:** `CPI_GAUGE_CHART`, `CPI_METRICS_CHART`, `CPI_CONSENSUS_CHART`
- **LLM:** `LLM_MENTIONS_HEATMAP`, `LLM_PROVIDERS_CHART`
- **Dashboard:** `DASHBOARD_UNIFIED_SCORE`, `DASHBOARD_TRENDS`, `DASHBOARD_MENTIONS`

## 🛡️ Garantias

### ✅ O que ESTE sistema garante:

1. **Zero PDFs Vazios:** Validação bloqueia geração se dados críticos estão ausentes
2. **Charts Completos:** Sistema aguarda renderização antes de capturar
3. **Dados Consistentes:** Todas as métricas são validadas antes de aparecerem no PDF
4. **Logs Completos:** Toda operação é logada para debugging
5. **Feedback ao Usuário:** Toasts informam sucesso/erro/warning
6. **Arquitetura Única:** Single source of truth elimina drift entre implementações

### ⚠️ Limitações:

- Charts devem estar renderizados no DOM (não funcionam em rotas não visitadas)
- Dados devem ser fornecidos completos pelos componentes
- Usuário precisa ter permissão RLS para acessar dados

## 📝 Migração de Código Legado

### Arquivos Descontinuados:

- ~~`src/utils/exportReports.ts`~~ → Usar `unified-exports.ts`
- ~~`src/utils/exportCPIDashboardReport.ts`~~ → Usar `unified-exports.ts`
- ~~`src/utils/exportIGOReport.ts`~~ → Usar `unified-exports.ts`

### Exemplo de Migração:

**ANTES:**
```typescript
import { exportToPDF } from '@/utils/exportReports';

const data = { /* dados soltos */ };
await exportToPDF(data);
```

**DEPOIS:**
```typescript
import { exportGEOReport, type ExportDataGEO } from '@/utils/pdf/unified-exports';

const data: ExportDataGEO = {
  brandName: brand.name,
  geoScore: score.score,
  pillars: pillarsData,
  mentions: mentionsData,
  // ...tipo garantido
};

await exportGEOReport(data);
```

## 🧪 Debugging

Se um PDF sair vazio ou incompleto:

1. **Checar logs do console:**
   ```
   🔍 [chartCapture] Capturando chart: geo-pillars-chart
   ✅ [chartCapture] Chart capturado com sucesso
   ```

2. **Verificar se chart está no DOM:**
   ```typescript
   const element = document.querySelector('#geo-pillars-chart');
   console.log('Element:', element);
   console.log('Offset Height:', element?.offsetHeight);
   ```

3. **Validar dados antes de exportar:**
   ```typescript
   import { validateGEOData } from '@/utils/pdf/core/dataValidator';
   
   const validation = validateGEOData(data);
   console.log('Validation:', validation);
   ```

4. **Forçar re-render antes de export:**
   ```typescript
   // Aguardar 500ms para garantir charts renderizados
   await new Promise(resolve => setTimeout(resolve, 500));
   await exportGEOReport(data);
   ```

## 🔐 Segurança

- Dados validados ANTES de logging
- Nenhuma informação sensível em logs de produção
- Validação impede SQL injection via metadata

## 📈 Performance

- Captura de charts em paralelo (não sequencial)
- PDF gerado em memória (sem I/O desnecessário)
- Lazy loading de bibliotecas pesadas (jsPDF, html2canvas)

## 🎓 Boas Práticas

1. **Sempre tipar dados:** Use `ExportDataGEO`, `ExportDataSEO`, etc.
2. **Validar antes de exportar:** Mesmo que componente tenha validação própria
3. **Usar IDs padronizados:** Nunca criar IDs customizados
4. **Logar operações:** Use `logger.info/warn/error` com contexto
5. **Feedback ao usuário:** Toast em sucesso E erro
6. **Tratar exceções:** `try/catch` em todas as chamadas de export

## 📚 Referências

- Documentação jsPDF: https://github.com/parallax/jsPDF
- Documentação autoTable: https://github.com/simonbengtsson/jsPDF-AutoTable
- Documentação html2canvas: https://html2canvas.hertzen.com/
