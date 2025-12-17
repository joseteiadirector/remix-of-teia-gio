# 📋 Padrões de Código - GEO Analytics Platform

## 🎯 REGRAS CRÍTICAS - NUNCA VIOLAR

### 0. **Rate Limiting Obrigatório**
```typescript
// ✅ SEMPRE use rate limiting para operações críticas
import { useRateLimit, RATE_LIMITS } from '@/utils/rateLimiter';

const { checkLimit } = useRateLimit('ai-generation', RATE_LIMITS.aiGeneration);

const handleGenerate = async () => {
  const { allowed, resetIn } = checkLimit();
  
  if (!allowed) {
    toast.error(`Limite excedido. Aguarde ${Math.ceil(resetIn! / 1000)}s`);
    return;
  }
  
  // Continuar com operação
};
```

### 1. **Cache Primeiro**
```typescript
// ✅ SEMPRE use cache para dados frequentes
import { queryCache } from '@/utils/queryCache';

const cachedData = queryCache.get<Brand[]>('brands');
if (cachedData) return cachedData;

const { data } = await supabase.from('brands').select('*');
queryCache.set('brands', data, 10 * 60 * 1000); // 10min TTL
```

### 2. **Retry Logic Obrigatório**
```typescript
// ✅ SEMPRE use retry para chamadas de API
import { useRetry } from '@/hooks/useRetry';

const { executeWithRetry } = useRetry();

const result = await executeWithRetry(async () => {
  return await supabase.functions.invoke('my-function');
}, { maxAttempts: 3, backoff: true });
```

### 3. **Validação de Dados**
```typescript
// ✅ SEMPRE valide dados antes de usar
import { validateInsight } from '@/utils/dataValidation';

const validation = validateInsight(data);
if (!validation.success) {
  console.error('Validação falhou:', validation.errors);
  return;
}
const insight = validation.data; // Dados validados
```

### 4. **Performance Monitoring**
```typescript
// ✅ SEMPRE monitore operações importantes
import { performanceMonitor } from '@/utils/performance';

const endMeasure = performanceMonitor.startMeasure('fetch-insights');
try {
  // sua operação aqui
} finally {
  endMeasure();
}
```

### 5. **Componentes Reutilizáveis**
```typescript
// ✅ SEMPRE use componentes do design system
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { InsightSkeleton } from '@/components/InsightSkeleton';

// ❌ NUNCA crie UIs customizadas para esses casos
```

---

## 🔧 Padrões de Implementação

### Cache Keys - Nomenclatura Padrão
```typescript
// Formato: <resource>:<filter?>:<id?>
'brands'                    // Lista completa
'brands:user:123'          // Por usuário
'insights'                 // Lista completa
'insights:brand:abc'       // Por marca
'geo-scores:brand:abc'     // Scores de marca
```

### TTL Padrão por Recurso
```typescript
const CACHE_TTL = {
  brands: 10 * 60 * 1000,      // 10 minutos
  insights: 2 * 60 * 1000,     // 2 minutos
  scores: 5 * 60 * 1000,       // 5 minutos
  reports: 1 * 60 * 1000,      // 1 minuto
  analytics: 30 * 60 * 1000,   // 30 minutos
};
```

### Invalidação de Cache
```typescript
// Após mutação, SEMPRE invalide o cache relacionado
await supabase.from('brands').insert(newBrand);
queryCache.invalidatePattern('brands'); // Limpa todos os caches de brands
```

---

## 🎨 Padrões de UI/UX

### Estados de Loading
```typescript
// ✅ Skeleton para dados conhecidos
if (isLoading) return <InsightSkeleton count={3} />;

// ✅ LoadingState para processos
if (isGenerating) return <LoadingState message="Gerando relatório..." />;
```

### Estados Vazios
```typescript
// ✅ SEMPRE use EmptyState com CTA
if (data.length === 0) {
  return (
    <EmptyState
      icon={FileText}
      title="Nenhum insight ainda"
      description="Gere seu primeiro relatório..."
      action={{
        label: "Gerar Relatório",
        onClick: handleGenerate
      }}
    />
  );
}
```

### Debounce em Inputs
```typescript
// ✅ SEMPRE debounce em filtros/busca
import { useDebounce } from '@/hooks/useDebounce';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

// Use debouncedSearch nas queries
```

---

## 🔐 Padrões de Segurança

### 1. Validação de Input
```typescript
// ✅ SEMPRE valide inputs do usuário
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  url: z.string().url(),
  name: z.string().min(1).max(100)
});

const result = schema.safeParse(userInput);
if (!result.success) {
  // Handle erro
}
```

### 2. Sanitização de HTML
```typescript
// ✅ SEMPRE sanitize HTML
import { sanitizeHTML } from '@/utils/dataValidation';

const cleanHtml = sanitizeHTML(userHtml);
```

### 3. RLS Policies
```sql
-- ✅ SEMPRE use RLS em tabelas com dados de usuário
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own data"
ON my_table FOR SELECT
USING (auth.uid() = user_id);
```

---

## 🚀 Padrões de Performance

### 1. Memoização
```typescript
// ✅ Memoize cálculos pesados
const filteredData = useMemo(() => {
  return data.filter(item => item.score > threshold);
}, [data, threshold]);

// ✅ Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### 2. Lazy Loading
```typescript
// ✅ Lazy load componentes pesados
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingState />}>
  <HeavyComponent />
</Suspense>
```

### 3. Paginação
```typescript
// ✅ SEMPRE pagine listas grandes
import { usePagination } from '@/hooks/usePagination';

const { currentPage, pageSize, paginatedData } = usePagination(data, 10);
```

---

## 📦 Estrutura de Arquivos

### Organização de Componentes
```
src/components/
├── ui/              # Componentes base (shadcn)
├── EmptyState.tsx   # Estados vazios
├── LoadingState.tsx # Estados de loading
├── InsightSkeleton.tsx # Skeletons
└── [Feature]*.tsx   # Componentes de features
```

### Organização de Utils
```
src/utils/
├── queryCache.ts       # Sistema de cache
├── dataValidation.ts   # Validações Zod
├── performance.ts      # Monitoramento
└── performanceReport.ts # Relatórios
```

### Organização de Hooks
```
src/hooks/
├── useRetry.ts      # Retry logic
├── useDebounce.ts   # Debouncing
└── usePagination.ts # Paginação
```

---

## 🧪 Padrões de Testes (Futuro)

### Testes de Componentes
```typescript
// Estrutura para E2E com Playwright
describe('Insights Page', () => {
  it('should load insights', async () => {
    // Test aqui
  });
});
```

### Testes de Edge Functions
```typescript
// Testes locais das functions
describe('ai-report-generator', () => {
  it('should generate report', async () => {
    // Test aqui
  });
});
```

---

## 📊 Métricas de Qualidade

### Checklist de Code Review
- [ ] Cache implementado onde aplicável?
- [ ] Retry logic em APIs externas?
- [ ] Dados validados com Zod?
- [ ] Performance monitorada?
- [ ] Loading/Empty states implementados?
- [ ] Debounce em filtros?
- [ ] Componentes memoizados?
- [ ] RLS policies corretas?
- [ ] HTML sanitizado?
- [ ] Inputs validados?

### Limites de Performance
```typescript
// Alertas automáticos para operações lentas
const PERFORMANCE_THRESHOLDS = {
  query: 1000,      // 1s para queries
  render: 100,      // 100ms para renders
  api: 3000,        // 3s para APIs externas
};
```

---

## 🔄 Processo de Deploy

### Checklist Pré-Deploy
1. ✅ Todos os testes passando
2. ✅ Performance report verificado
3. ✅ Cache configurado corretamente
4. ✅ Validações implementadas
5. ✅ RLS policies testadas
6. ✅ Edge functions deployadas
7. ✅ Secrets configurados

### Comandos Úteis
```bash
# Performance report no console
printPerformanceReport()

# Limpar métricas
clearPerformanceMetrics()

# Cache stats
queryCache.getMetrics()
```

---

## 📚 Recursos Importantes

### Documentação Interna
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Visão geral da arquitetura
- [PERFORMANCE.md](./PERFORMANCE.md) - Relatório de performance
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Documentação funcional

### Links Úteis
- [Lovable Docs](https://docs.lovable.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev)

---

## ⚠️ Anti-Patterns - EVITAR

### ❌ Não fazer queries diretas sem cache
```typescript
// ❌ ERRADO
const { data } = await supabase.from('brands').select('*');

// ✅ CORRETO
const cached = queryCache.get('brands');
if (cached) return cached;
const { data } = await supabase.from('brands').select('*');
queryCache.set('brands', data);
```

### ❌ Não ignorar validação
```typescript
// ❌ ERRADO
const insight = responseData;

// ✅ CORRETO
const validation = validateInsight(responseData);
if (!validation.success) return;
const insight = validation.data;
```

### ❌ Não usar loading states genéricos
```typescript
// ❌ ERRADO
if (isLoading) return <div>Loading...</div>;

// ✅ CORRETO
if (isLoading) return <InsightSkeleton count={3} />;
```

---

**Última atualização:** 2025-11-05
**Versão:** 2.0 - Performance Optimized
**Mantenedor:** GEO Analytics Team
