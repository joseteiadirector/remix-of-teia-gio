# Utilitários do Sistema Teia GEO

Este diretório contém funções utilitárias reutilizáveis em todo o sistema.

## 📊 GEO Score Helper

**Arquivo:** `geoScoreHelper.ts`  
**Propósito:** Fonte única de verdade para buscar GEO Scores reais

### Funções Disponíveis:

```typescript
import { 
  getRealGeoScore,
  getGeoScoreBreakdown,
  getGeoScoreHistory,
  hasGeoScore 
} from '@/utils/geoScoreHelper';

// Buscar GEO Score mais recente
const score = await getRealGeoScore(brandId);

// Buscar breakdown completo (5 pilares)
const breakdown = await getGeoScoreBreakdown(brandId);

// Buscar histórico
const history = await getGeoScoreHistory(brandId, 30);

// Verificar se tem score
const hasScore = await hasGeoScore(brandId);
```

**⚠️ REGRA OBRIGATÓRIA:** Sempre use estas funções para buscar GEO Scores em dashboards e relatórios.

---

## 📤 Export Reports

**Arquivo:** `exportReports.ts`  
**Propósito:** Exportar relatórios em PDF, Excel e CSV

```typescript
import { exportToPDF, exportToExcel, exportToCSV } from '@/utils/exportReports';

const reportData = {
  period: '01/11/2025 - 06/11/2025',
  brand: 'Marca Exemplo',
  metrics: [
    { label: 'GEO Score', value: '88.6', change: '+17.1%' }
  ]
};

exportToPDF(reportData);
exportToExcel(reportData);
exportToCSV(reportData);
```

---

## 🔄 Data Import

**Arquivo:** `dataImport.ts`  
**Propósito:** Importar dados de arquivos CSV/Excel

---

## ✅ Data Validation

**Arquivo:** `dataValidation.ts`  
**Propósito:** Validar estrutura de dados

---

## 🐛 Error Tracking

**Arquivo:** `errorTracking.ts`  
**Propósito:** Rastreamento e logging de erros

---

## 🌍 GEO API

**Arquivo:** `geoApi.ts`  
**Propósito:** Cliente para comunicação com edge functions GEO

---

## 🔁 GEO Jobs

**Arquivo:** `geoJobs.ts`  
**Propósito:** Gerenciamento de jobs assíncronos GEO

---

## 💬 Mention Helpers

**Arquivo:** `mentionHelpers.ts`  
**Propósito:** Funções auxiliares para menções LLM

---

## ⚡ Performance

**Arquivo:** `performance.ts`  
**Propósito:** Monitoramento e otimização de performance

---

## 📊 Performance Report

**Arquivo:** `performanceReport.ts`  
**Propósito:** Geração de relatórios de performance

---

## 💾 Query Cache

**Arquivo:** `queryCache.ts`  
**Propósito:** Cache de queries para otimização

---

## 🚦 Rate Limiter

**Arquivo:** `rateLimiter.ts`  
**Propósito:** Controle de taxa de requisições

---

## 📝 Convenções

### Nomenclatura
- Use camelCase para funções: `getRealGeoScore()`
- Use PascalCase para classes/tipos: `GeoScoreData`
- Prefixo `get` para funções que buscam dados
- Prefixo `has` para funções booleanas
- Prefixo `calculate` para funções de cálculo

### Documentação
- Sempre documente funções públicas com JSDoc
- Inclua exemplos de uso quando relevante
- Documente casos especiais e limitações

### Errors
- Use try/catch e log erros com contexto
- Retorne `null` ou valores padrão em vez de throw quando apropriado
- Inclua mensagens descritivas

### Performance
- Evite queries dentro de loops
- Use batch operations quando possível
- Implemente cache quando apropriado

---

**Última atualização:** 06/11/2025
