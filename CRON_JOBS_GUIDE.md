# 🕐 Guia de Cron Jobs - GEO Analytics Platform

## ✅ Status: Configurado via Supabase Scheduled Functions

Os cron jobs foram **configurados com sucesso** usando **Supabase Scheduled Edge Functions** via `supabase/config.toml`.

**✨ Mudança Importante (Nov 2025):** Migrado de `pg_cron` (que não executava) para **Scheduled Functions nativas do Supabase**, garantindo automação confiável e estável.

---

## 📋 Automação Ativa

### ⚡ Automation Orchestrator (A cada hora)
- **Nome da função:** `automation-orchestrator`
- **Schedule:** `0 * * * *` (minuto 0 de cada hora: 00:00, 01:00, 02:00...)
- **Configuração:** `supabase/config.toml`
- **Tipo:** Scheduled Edge Function (nativa Supabase)

**O que faz:**
- ✅ Verifica configurações de automação com `next_run` vencida
- ✅ Executa cada tipo de automação:
  - 🤖 Coleta de Menções LLM
  - 📊 Análise SEO
  - 📈 Métricas GEO
  - 📧 Relatório Semanal
  - 🔔 Verificação de Alertas
- ✅ Registra resultados em `automation_jobs`
- ✅ Calcula próxima execução automaticamente

---

## 🔧 Configuração (config.toml)

```toml
[functions.automation-orchestrator]
verify_jwt = false  # Permite execução agendada sem autenticação
[functions.automation-orchestrator.schedule]
cron = "0 * * * *"  # A cada hora no minuto 0
```

**Vantagens desta abordagem:**
- ✅ Configuração declarativa e versionada (Git)
- ✅ Deploy automático com resto do código
- ✅ Logs integrados no Supabase Dashboard
- ✅ Mais confiável que pg_cron
- ✅ Suporte oficial Supabase

---

## 🔍 Como Verificar

### Via Interface Web (Recomendado)
1. Acesse `/cron-jobs` na plataforma
2. Visualize estatísticas de execução (24h)
3. Veja histórico de jobs em `automation_jobs`
4. **Teste manualmente:** Clique em "Executar Agora" para disparar o orchestrator
5. Verifique logs de execução em tempo real

### Via Supabase Dashboard
1. **Edge Functions** → `automation-orchestrator` → **Logs**
2. Veja execuções automáticas e manuais
3. Verifique timestamps e duração

### Via SQL (Histórico de Execuções)
```sql
-- Ver execuções recentes de automação
SELECT 
  job_type,
  status,
  created_at,
  completed_at,
  duration_ms,
  error
FROM automation_jobs
ORDER BY created_at DESC
LIMIT 20;

-- Estatísticas de sucesso (últimas 24h)
SELECT 
  status,
  COUNT(*) as total,
  AVG(duration_ms) as avg_duration_ms
FROM automation_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

---

## ⏱️ Sintaxe de Cron

Formato: `minuto hora dia mês dia-da-semana`

| Padrão | Descrição | Exemplo Uso |
|--------|-----------|---------|
| `0 * * * *` | ✅ A cada hora (minuto 0) | **automation-orchestrator** |
| `*/30 * * * *` | A cada 30 minutos | Coletas rápidas |
| `0 9 * * *` | Diariamente às 9h | Relatórios diários |
| `0 3 * * *` | Diariamente às 3h | Backups |
| `0 9 * * 1` | Segundas às 9h | Relatórios semanais |
| `0 0 * * 0` | Domingos à meia-noite | Relatórios semanais |

**Referência:** https://crontab.guru/

---

## 🛠️ Gerenciamento de Scheduled Functions

### Adicionar Nova Automação Agendada

**1. Editar `supabase/config.toml`:**
```toml
[functions.minha-nova-funcao]
verify_jwt = false  # Para scheduled functions
[functions.minha-nova-funcao.schedule]
cron = "0 3 * * *"  # Diariamente às 3h
```

**2. Criar Edge Function:**
```typescript
// supabase/functions/minha-nova-funcao/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log('[SCHEDULED] Executando...');
  
  // Sua lógica aqui
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

**3. Deploy automático** ao fazer commit/push

### Desativar Scheduled Function

**Opção 1: Comentar no config.toml**
```toml
# [functions.automation-orchestrator.schedule]
# cron = "0 * * * *"
```

**Opção 2: Remover completamente**
```toml
[functions.automation-orchestrator]
verify_jwt = false
# Remove a seção .schedule
```

---

## 📊 Monitoramento

### Teste Manual (Interface Web)
1. Acesse `/cron-jobs`
2. Clique em **"Executar Agora"**
3. Aguarde confirmação de execução
4. Verifique novos registros em "Execuções Recentes"

### Logs da Edge Function
```bash
# Via Supabase CLI
supabase functions logs automation-orchestrator --limit 50

# Ou via Dashboard: Edge Functions → automation-orchestrator → Logs
```

### Verificar Status das Automações
```sql
-- Últimas 10 execuções
SELECT 
  id,
  job_type,
  status,
  created_at,
  duration_ms,
  error
FROM automation_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Taxa de sucesso por tipo
SELECT 
  job_type,
  COUNT(*) FILTER (WHERE status = 'completed') as successes,
  COUNT(*) FILTER (WHERE status = 'failed') as failures,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*),
    2
  ) as success_rate
FROM automation_jobs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY job_type;
```

---

## 🚨 Troubleshooting

### Scheduled Function não está executando

**1. Verificar configuração no config.toml**
```toml
[functions.automation-orchestrator]
verify_jwt = false  # ✅ DEVE ser false
[functions.automation-orchestrator.schedule]
cron = "0 * * * *"  # ✅ DEVE ter seção .schedule
```

**2. Verificar logs da função**
- Dashboard Supabase → Edge Functions → automation-orchestrator → Logs
- Procurar por timestamps recentes (última hora)

**3. Testar manualmente**
- `/cron-jobs` → Botão "Executar Agora"
- Se funcionar manualmente mas não automaticamente: problema de schedule
- Se falhar manualmente: problema na função

**4. Verificar `automation_jobs` table**
```sql
SELECT COUNT(*) FROM automation_jobs 
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Se retornar 0: scheduled function não está disparando
```

### Erros comuns

**`verify_jwt = true`** → Scheduled functions precisam `verify_jwt = false`
**Seção .schedule ausente** → Função existe mas não está agendada
**Sintaxe cron inválida** → Verificar em https://crontab.guru/

---

## 🔐 Segurança

### Boas Práticas
- ✅ Use `verify_jwt = false` **APENAS** para scheduled functions
- ✅ Valide origem/contexto dentro da edge function se necessário
- ✅ Use service role key para operações sensíveis
- ✅ Implemente rate limiting interno
- ✅ Monitore execuções falhadas via alertas

### Exemplo de Validação Interna
```typescript
// Dentro da edge function
const { manual, source } = await req.json();

if (!manual && !isScheduledExecution(req)) {
  return new Response('Unauthorized', { status: 401 });
}

function isScheduledExecution(req: Request): boolean {
  // Scheduled functions vêm de IPs internos Supabase
  const userAgent = req.headers.get('user-agent') || '';
  return userAgent.includes('Deno');
}
```

---

## 📝 Logs e Auditoria

Todas as execuções do orchestrator são registradas em:
- **`automation_jobs`** - Histórico completo de execuções com timestamps, duração, status
- **`automation_configs`** - `last_run` e `next_run` atualizados automaticamente
- **Edge function logs** - Via Supabase Dashboard ou CLI
- **Interface `/cron-jobs`** - Visualização em tempo real com estatísticas

### Retenção de Logs
- `automation_jobs`: Mantido indefinidamente (filtrar por data conforme necessário)
- Edge function logs: ~7 dias no Supabase (plano gratuito)

---

## 🎯 Resumo da Implementação Atual

✅ **Scheduled Function ativa:** `automation-orchestrator` (a cada hora)  
✅ **Configuração:** Via `supabase/config.toml` (versionada)  
✅ **Deploy:** Automático com push/commit  
✅ **Teste manual:** Botão "Executar Agora" em `/cron-jobs`  
✅ **Monitoramento:** Interface web + logs + SQL queries  
✅ **Histórico:** Tabela `automation_jobs` com todas execuções  

---

## 📚 Recursos

- [Supabase Scheduled Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Cron Syntax Guide](https://crontab.guru/)
- [Edge Functions Documentation](https://supabase.com/docs/guides/functions)

---

**Última atualização:** 2025-11-25  
**Status:** ✅ Ativo via Scheduled Functions (migrado de pg_cron)  
**Próxima revisão:** Monitorar por 7 dias após migração