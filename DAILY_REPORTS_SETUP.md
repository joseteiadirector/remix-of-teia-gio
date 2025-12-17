# 📧 Relatórios Diários - Configuração e Status

> **Status:** ✅ ATIVO - Relatórios enviados DIARIAMENTE às 8:00 AM

---

## 🎯 Configuração Atual

### ⏰ Agendamento
- **Frequência:** DIÁRIA
- **Horário:** 8:00 AM (todos os dias)
- **Destinatário:** jose.vev26@gmail.com
- **Cron Job:** `daily-geo-reports`

### 📊 Conteúdo do Relatório

| Item | Descrição |
|------|-----------|
| **Período** | Últimas 24 horas |
| **Comparação** | Dia anterior (24-48h atrás) |
| **Marcas** | Todas as marcas do usuário |
| **Métricas** | Menções, Scores, Tendências |

### 📧 Exemplo de Email

```
De: GEO-Cognition <onboarding@resend.dev>
Para: jose.vev26@gmail.com
Assunto: 📊 Relatório Diário GEO - 06/11 - 07/11

┌─────────────────────────────────────┐
│     📊 Relatório Diário GEO         │
│        06/11 - 07/11                │
└─────────────────────────────────────┘

Olá Jose,

Aqui está seu relatório diário de performance 
das suas marcas no GEO-Cognition.

┌─────────────────┐
│   2 Marcas      │
│   98 Menções    │
└─────────────────┘

Desempenho por Marca
─────────────────────────────────────
Marca          Trend  Atual  Anterior  Menções
─────────────────────────────────────
Teia Studio    📈    68.5    66.2      48
WYSE           📉    65.2    67.8      50
─────────────────────────────────────

[Ver Relatório Completo]
```

---

## 🔧 Configuração Técnica

### Cron Job SQL

```sql
-- Relatório DIÁRIO às 8:00 AM
SELECT cron.schedule(
  'daily-geo-reports',
  '0 8 * * *',  -- Todos os dias às 8:00 AM
  $$
  SELECT net.http_post(
    url := 'https://llzonwqocqzqpezcsbjh.supabase.co/functions/v1/send-scheduled-weekly-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [ANON_KEY]'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Edge Functions Envolvidas

1. **`send-scheduled-weekly-reports`** (nome mantido, mas agora é diário)
   - Busca dados das últimas 24h
   - Compara com dia anterior
   - Prepara dados do relatório
   - Chama `send-weekly-report`

2. **`send-weekly-report`** (nome mantido, mas agora é diário)
   - Gera HTML do email
   - Envia via Resend API
   - Retorna status

---

## ✅ Verificação de Status

### Verificar Cron Job Ativo

```sql
-- Ver se o cron job está ativo
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'daily-geo-reports';
```

**Resultado esperado:**
```
jobname           | schedule    | active | jobid
daily-geo-reports | 0 8 * * *   | true   | 6
```

### Verificar Últimas Execuções

```sql
-- Ver últimas 10 execuções
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-geo-reports')
ORDER BY start_time DESC 
LIMIT 10;
```

### Verificar Dados Disponíveis

```sql
-- Ver quantas menções existem para relatório de hoje
SELECT 
  b.name as marca,
  COUNT(*) as mencoes_ontem,
  AVG(m.confidence) * 100 as score_medio
FROM brands b
LEFT JOIN mentions_llm m ON m.brand_id = b.id
WHERE m.collected_at >= CURRENT_DATE - INTERVAL '1 day'
  AND m.collected_at < CURRENT_DATE
  AND m.mentioned = true
GROUP BY b.name;
```

---

## 📅 Calendário de Envios

### Próximos Envios Programados

| Data | Horário | Status | Conteúdo |
|------|---------|--------|----------|
| **07/11** | 08:00 AM | ⏳ Agendado | Dados de 06/11 |
| 08/11 | 08:00 AM | ⏳ Agendado | Dados de 07/11 |
| 09/11 | 08:00 AM | ⏳ Agendado | Dados de 08/11 |
| 10/11 | 08:00 AM | ⏳ Agendado | Dados de 09/11 |

### Histórico de Envios

```sql
-- Ver histórico via logs de edge function
-- (Executar no Lovable Cloud Backend > Edge Functions > Logs)
```

---

## 🐛 Troubleshooting

### Problema: Não recebi o relatório

**Passos:**

1. **Verificar se o cron rodou:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-geo-reports')
  AND start_time::date = CURRENT_DATE
ORDER BY start_time DESC;
```

2. **Verificar logs da edge function:**
   - Ir para Lovable Cloud Backend
   - Edge Functions > `send-scheduled-weekly-reports`
   - Ver logs de hoje às 8:00 AM

3. **Verificar se há dados:**
```sql
-- Ver se há menções de ontem
SELECT COUNT(*) FROM mentions_llm 
WHERE collected_at >= CURRENT_DATE - INTERVAL '1 day'
  AND collected_at < CURRENT_DATE;
```

4. **Verificar email do Resend:**
   - Ir para https://resend.com/emails
   - Verificar se email foi enviado
   - Ver status de entrega

### Problema: Relatório chegou vazio

**Causa:** Provavelmente não há dados das últimas 24h.

**Verificar:**
```sql
-- Confirmar se há dados
SELECT 
  DATE(collected_at) as dia,
  COUNT(*) as mencoes
FROM mentions_llm
WHERE collected_at >= CURRENT_DATE - INTERVAL '2 days'
GROUP BY DATE(collected_at)
ORDER BY dia DESC;
```

Se não houver dados de ontem, significa que a coleta automática falhou. Ver [MONITORING_GUIDE.md](./MONITORING_GUIDE.md).

### Problema: Recebendo em horário errado

**Causa:** Timezone do Supabase pode estar diferente.

**Solução:**
```sql
-- Ver timezone atual
SHOW timezone;

-- Ajustar cron se necessário (exemplo para UTC-3):
SELECT cron.unschedule('daily-geo-reports');
SELECT cron.schedule(
  'daily-geo-reports',
  '0 11 * * *',  -- 11:00 UTC = 08:00 UTC-3
  $$...[resto do código]...$$
);
```

---

## 🔄 Desabilitar/Reabilitar

### Desabilitar Temporariamente

```sql
-- Desabilitar sem remover
UPDATE cron.job 
SET active = false 
WHERE jobname = 'daily-geo-reports';
```

### Reabilitar

```sql
-- Reabilitar
UPDATE cron.job 
SET active = true 
WHERE jobname = 'daily-geo-reports';
```

### Remover Completamente

```sql
-- Remover cron job
SELECT cron.unschedule('daily-geo-reports');
```

---

## 📊 Métricas de Envio

### KPIs para Monitorar

| Métrica | Target | Alerta |
|---------|--------|--------|
| **Taxa de envio** | 100% | <95% |
| **Tempo de processamento** | <30s | >60s |
| **Taxa de erro** | 0% | >5% |
| **Emails entregues** | 100% | <98% |

### Query de Métricas

```sql
-- Sucesso dos últimos 7 dias
SELECT 
  DATE(start_time) as dia,
  COUNT(*) as total_execucoes,
  COUNT(*) FILTER (WHERE status = 'succeeded') as sucessos,
  COUNT(*) FILTER (WHERE status = 'failed') as falhas,
  ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)))) as tempo_medio_s
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-geo-reports')
  AND start_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(start_time)
ORDER BY dia DESC;
```

---

## 🎯 Próximos Passos

### Melhorias Planejadas

- [ ] Adicionar gráficos no email (charts em HTML)
- [ ] Permitir usuário escolher horário preferido
- [ ] Adicionar resumo executivo com insights IA
- [ ] Notificação push mobile além de email
- [ ] Dashboard de histórico de relatórios

### Opções de Personalização

Usuário pode configurar em `/alerts`:
- ✅ Email de destino
- ✅ Tipos de alerta
- ⏳ Frequência (daily/weekly/monthly) - Em breve
- ⏳ Horário preferido - Em breve
- ⏳ Formato (HTML/PDF) - Em breve

---

**📅 Última Atualização:** 06/11/2025  
**✅ Status:** OPERACIONAL  
**🎯 Próximo Envio:** 07/11/2025 às 8:00 AM  
**📧 Destinatário:** jose.vev26@gmail.com
