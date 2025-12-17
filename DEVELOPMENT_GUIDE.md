# 🚀 Guia de Desenvolvimento - GEO Analytics Platform

## 🎯 Para Novos Desenvolvedores

Este guia garante que você mantenha os **90-95% de robustez** alcançados nesta plataforma.

---

## 📋 Setup Inicial

### 1. Clone e Configure
```bash
# Clone o projeto
git clone [seu-repo]
cd geo-analytics

# Instale dependências
npm install

# Configure variáveis de ambiente
# Copie .env.example para .env
```

### 2. Entenda a Arquitetura
**LEIA PRIMEIRO (ordem importante):**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Visão geral técnica
2. [CODE_STANDARDS.md](./CODE_STANDARDS.md) - Padrões obrigatórios
3. [PERFORMANCE.md](./PERFORMANCE.md) - Otimizações implementadas

---

## 🏗️ Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│         UI Layer (React)            │
│  - Components (EmptyState, etc)     │
│  - Pages (Insights, Dashboard)      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Hooks & Utils Layer            │
│  - useRetry, useDebounce            │
│  - queryCache, dataValidation       │
│  - performanceMonitor               │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Data Layer (Supabase)          │
│  - Database (PostgreSQL + RLS)      │
│  - Edge Functions (Deno)            │
│  - LLM Cache                        │
└─────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados Típico

### Exemplo: Carregar Insights
```typescript
// 1. Componente solicita dados
function InsightsPage() {
  // 2. Hook verifica cache primeiro
  const cachedInsights = queryCache.get<Insight[]>('insights');
  
  if (cachedInsights) {
    return renderInsights(cachedInsights);
  }
  
  // 3. Se não tem cache, busca do Supabase
  const { executeWithRetry } = useRetry();
  
  const { data } = await executeWithRetry(async () => {
    return await supabase
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false });
  });
  
  // 4. Valida dados recebidos
  const validatedData = data
    .map(item => validateInsight(item))
    .filter(v => v.success)
    .map(v => v.data);
  
  // 5. Salva no cache
  queryCache.set('insights', validatedData, 2 * 60 * 1000);
  
  // 6. Renderiza
  return renderInsights(validatedData);
}
```

---

## 📋 Sistema de Logging

### ⚠️ IMPORTANTE: Use Logger ao invés de console.log

```typescript
// ❌ NÃO FAÇA ISSO
console.log('Dados carregados:', data);

// ✅ FAÇA ISSO
import { logger } from '@/utils/logger';
logger.info('Dados carregados', { count: data.length });
```

### Níveis de Log
- `logger.debug()` - Informações técnicas detalhadas (apenas dev)
- `logger.info()` - Fluxo normal da aplicação (apenas dev)
- `logger.warn()` - Situações inesperadas (dev + Sentry)
- `logger.error()` - Erros críticos (dev + Sentry)

📄 Ver [CONSOLE_LOG_MIGRATION_GUIDE.md](./CONSOLE_LOG_MIGRATION_GUIDE.md) para guia completo.

---

## 🛠️ Tarefas Comuns

### Adicionar Nova Página

```typescript
// 1. Criar arquivo src/pages/NovaPage.tsx
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { useRetry } from '@/hooks/useRetry';
import { performanceMonitor } from '@/utils/performance';
import { logger } from '@/utils/logger'; // ✅ Adicione isso

export default function NovaPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { executeWithRetry } = useRetry();
  
  useEffect(() => {
    const endMeasure = performanceMonitor.startMeasure('load-nova-page');
    
    async function loadData() {
      try {
        logger.info('Iniciando carregamento de dados', { page: 'nova' });
        const result = await executeWithRetry(async () => {
          return await supabase.from('tabela').select('*');
        });
        setData(result.data);
        logger.debug('Dados carregados com sucesso', { count: result.data?.length });
      } catch (error) {
        logger.error('Erro ao carregar dados', { error: error.message });
      } finally {
        setLoading(false);
        endMeasure();
      }
    }
    
    loadData();
  }, []);
  
  if (loading) return <LoadingState message="Carregando..." />;
  if (data.length === 0) return <EmptyState title="Sem dados" />;
  
  return (
    <div>
      {/* Seu conteúdo */}
    </div>
  );
}

// 2. Adicionar rota em src/main.tsx ou App.tsx
```

### Criar Nova Edge Function

```typescript
// 1. Criar supabase/functions/minha-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Seu código aqui
    const { data } = await req.json();
    
    // Processar
    const result = processData(data);
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 2. Deploy automático ao fazer push
```

### Adicionar Tabela no Supabase

```sql
-- 1. Criar migration (via ferramenta de migração)
CREATE TABLE public.minha_tabela (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.minha_tabela ENABLE ROW LEVEL SECURITY;

-- 3. Criar policies
CREATE POLICY "Users see own data"
ON public.minha_tabela FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own data"
ON public.minha_tabela FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Trigger para updated_at
CREATE TRIGGER update_minha_tabela_updated_at
BEFORE UPDATE ON public.minha_tabela
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### Implementar Cache para Novo Recurso

```typescript
// 1. Definir TTL
const MEUS_DADOS_TTL = 5 * 60 * 1000; // 5 minutos

// 2. Função de fetch com cache
async function fetchMeusDados(userId: string) {
  const cacheKey = `meus-dados:${userId}`;
  
  // Verificar cache
  const cached = queryCache.get<MeusDados[]>(cacheKey);
  if (cached) return cached;
  
  // Buscar do DB
  const { data } = await supabase
    .from('minha_tabela')
    .select('*')
    .eq('user_id', userId);
  
  // Salvar no cache
  queryCache.set(cacheKey, data, MEUS_DADOS_TTL);
  
  return data;
}

// 3. Invalidar após mutação
async function criarMeuDado(novoDado: MeusDados) {
  const { data } = await supabase
    .from('minha_tabela')
    .insert(novoDado);
  
  // Invalidar cache
  queryCache.invalidatePattern(`meus-dados:${novoDado.user_id}`);
  
  return data;
}
```

---

## 🐛 Debugging

### Performance Issues
```typescript
// 1. Ativar performance report
printPerformanceReport(); // No console do navegador

// 2. Verificar operações lentas (> 1s)
// 3. Adicionar cache onde necessário
// 4. Verificar se há queries N+1
```

### Cache Issues
```typescript
// Limpar todo o cache
queryCache.clear();

// Verificar cache específico
const data = queryCache.get('minha-key');
console.log('Cache:', data);

// Forçar invalidação
queryCache.invalidatePattern('pattern');
```

### API Errors
```typescript
// Edge functions têm logs automáticos
// Ver em: Lovable Cloud > Functions > Logs

// Adicionar logs estruturados
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'error',
  message: 'Erro específico',
  context: { userId, requestId }
}));
```

---

## 🧪 Testes (Futuro)

### Estrutura de Testes
```typescript
// tests/unit/queryCache.test.ts
import { describe, it, expect } from 'vitest';
import { queryCache } from '@/utils/queryCache';

describe('QueryCache', () => {
  it('should cache and retrieve data', () => {
    queryCache.set('test', { value: 123 }, 1000);
    const data = queryCache.get('test');
    expect(data).toEqual({ value: 123 });
  });
});
```

### E2E com Playwright
```typescript
// tests/e2e/insights.spec.ts
import { test, expect } from '@playwright/test';

test('should load insights page', async ({ page }) => {
  await page.goto('/insights');
  await expect(page.getByText('Insights de IA')).toBeVisible();
});
```

---

## 📊 Monitoramento de Produção

### Métricas Importantes
```typescript
// Ativar Web Vitals (já configurado)
// Ver em: Console > Performance

// Métricas críticas:
// - LCP (Largest Contentful Paint) < 2.5s
// - FID (First Input Delay) < 100ms
// - CLS (Cumulative Layout Shift) < 0.1
```

### Alertas
```typescript
// Operações lentas são logadas automaticamente
// Ver console para: "[PERFORMANCE] Operação lenta detectada"
```

---

## 🔒 Segurança

### Checklist de Segurança
- [ ] Todas as tabelas têm RLS habilitado
- [ ] Policies verificam `auth.uid()`
- [ ] Inputs são validados com Zod
- [ ] HTML é sanitizado
- [ ] Secrets estão em variáveis de ambiente
- [ ] APIs externas usam retry logic
- [ ] Rate limiting em edge functions

---

## 📦 Deploy

### Processo de Deploy
1. **Commit código** → GitHub (sync automático)
2. **Push para main** → Lovable detecta
3. **Build automático** → Preview atualizado
4. **Testes manuais** → Verificar funcionalidade
5. **Deploy produção** → Botão "Publish"

### Rollback
Se algo der errado:
1. Ir em **History** (topo do chat)
2. Selecionar versão anterior
3. Clicar em **Restore**

---

## 💡 Dicas Pro

### 1. Use o Console
```javascript
// Comandos úteis no console do navegador
printPerformanceReport()  // Ver performance
clearPerformanceMetrics() // Limpar métricas
queryCache.clear()        // Limpar cache
```

### 2. Hot Reload
O preview atualiza automaticamente ao salvar código.

### 3. Logs Estruturados
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  action: 'user_action',
  userId: user.id,
  metadata: { ... }
}));
```

### 4. Git Workflow
```bash
# Branch para features
git checkout -b feature/nova-funcionalidade

# Commits descritivos
git commit -m "feat: adiciona cache para insights"

# Pull request para main
```

---

## 🆘 Problemas Comuns

### "Cache não está funcionando"
```typescript
// Verificar TTL não expirado
// Verificar invalidação não está sendo chamada
// Limpar cache: queryCache.clear()
```

### "Edge function timeout"
```typescript
// Reduzir max_tokens em AI calls
// Implementar timeout no fetch
// Verificar logs da function
```

### "RLS blocking queries"
```typescript
// Verificar auth.uid() está setado
// Verificar policy permite operação
// Ver policies em: Lovable Cloud > Database
```

---

## 📚 Recursos Adicionais

### Documentação
- [Lovable Docs](https://docs.lovable.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)

### Comunidade
- [Lovable Discord](https://discord.gg/lovable)
- [GitHub Discussions](#)

---

**Última atualização:** 2025-11-05
**Versão:** 2.0
**Contato:** [seu-email]
