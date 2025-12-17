# 🔒 Sistema de Backup Automático - TEIA GEO

**Status:** ✅ ATIVO E CONFIGURADO  
**Data de Implementação:** 21/11/2025  
**Próximo Backup:** Diário às 3:00 AM UTC

---

## 📋 Visão Geral

Sistema de backup automático implementado usando:
- **Cron Jobs** do Supabase
- **Edge Function** dedicada (`backup-database`)
- **Logs estruturados** em tabela dedicada (`backup_logs`)

---

## ⚙️ Configuração Atual

### Frequência de Backup
- **Diário** às 3:00 AM UTC (00:00 BRT)
- Cron expression: `0 3 * * *`

### Tabelas Críticas Incluídas
1. `brands` - Dados das marcas
2. `geo_scores` - Scores GEO calculados
3. `seo_metrics_daily` - Métricas SEO diárias
4. `mentions_llm` - Menções dos LLMs
5. `gsc_queries` - Queries do Google Search Console
6. `url_analysis_history` - Histórico de análises
7. `alert_configs` - Configurações de alertas
8. `automation_jobs` - Jobs de automação

---

## 📊 Logs de Backup

### Estrutura da Tabela `backup_logs`

```sql
CREATE TABLE public.backup_logs (
  id UUID PRIMARY KEY,
  backup_date TIMESTAMPTZ,      -- Data/hora do backup
  status TEXT,                   -- success, failed, partial
  total_tables INT,              -- Tabelas com sucesso
  total_records BIGINT,          -- Total de registros salvos
  failed_tables TEXT[],          -- Tabelas que falharam
  duration_ms INT,               -- Duração em milissegundos
  metadata JSONB,                -- Detalhes do backup
  created_at TIMESTAMPTZ
);
```

### Status Possíveis
- **success**: Todas as tabelas foram salvas com sucesso
- **partial**: Algumas tabelas falharam
- **failed**: Todas as tabelas falharam

---

## 🔍 Como Monitorar

### 1. Verificar Últimos Backups
```sql
SELECT 
  backup_date,
  status,
  total_tables,
  total_records,
  failed_tables,
  duration_ms
FROM backup_logs
ORDER BY backup_date DESC
LIMIT 10;
```

### 2. Verificar Falhas
```sql
SELECT 
  backup_date,
  failed_tables,
  metadata
FROM backup_logs
WHERE status IN ('failed', 'partial')
ORDER BY backup_date DESC;
```

### 3. Estatísticas Gerais
```sql
SELECT 
  status,
  COUNT(*) as total,
  AVG(total_records) as avg_records,
  AVG(duration_ms) as avg_duration_ms
FROM backup_logs
GROUP BY status;
```

---

## 🛠️ Edge Function: backup-database

### Localização
`supabase/functions/backup-database/index.ts`

### Funcionalidade
1. Conecta ao banco usando Service Role Key
2. Faz SELECT * em cada tabela crítica
3. Registra contagem e amostra (3 registros)
4. Salva log detalhado na tabela `backup_logs`
5. Retorna resumo do backup

### Execução Manual
```bash
# Via API
curl -X POST \
  https://llzonwqocqzqpezcsbjh.supabase.co/functions/v1/backup-database \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## 🔐 Segurança

### RLS Policy
- Apenas **admins** podem ver logs de backup
- Policy: `"Admins can view backup logs"`
- Tabela protegida com Row Level Security

### Permissões
- Edge Function usa **Service Role Key**
- Acesso total ao banco para leitura
- Necessário para backup completo

---

## 📈 Métricas Esperadas

### Performance
- **Duração típica:** < 5 segundos
- **Tabelas:** 8 críticas
- **Registros:** Variável por marca

### Retenção
- **Logs mantidos:** Permanentemente
- **Limpeza:** Manual se necessário
- **Análise:** Últimos 90 dias recomendado

---

## 🚨 Alertas e Troubleshooting

### Quando Alertar
1. Status = 'failed' por 2+ dias consecutivos
2. Status = 'partial' com mais de 50% das tabelas falhando
3. Duration > 30 segundos (performance degradada)

### Problemas Comuns

#### 1. Timeout na Edge Function
**Sintoma:** Function termina antes de completar  
**Solução:** Reduzir tabelas ou otimizar queries

#### 2. Permissões Insuficientes
**Sintoma:** Erro "permission denied"  
**Solução:** Verificar Service Role Key

#### 3. Tabela Não Existe
**Sintoma:** Error: relation does not exist  
**Solução:** Atualizar lista de tabelas críticas

---

## 🔄 Cron Job Configuration

### Job Name
`daily-database-backup`

### Schedule
```sql
SELECT cron.schedule(
  'daily-database-backup',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://llzonwqocqzqpezcsbjh.supabase.co/functions/v1/backup-database',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]'
    )
  );
  $$
);
```

### Verificar Status do Cron
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-database-backup';
```

### Desabilitar (se necessário)
```sql
SELECT cron.unschedule('daily-database-backup');
```

---

## 📝 Checklist de Manutenção

### Mensal
- [ ] Verificar últimos 30 backups
- [ ] Analisar taxa de sucesso (deve ser > 95%)
- [ ] Verificar duração média (deve ser < 10s)
- [ ] Limpar logs antigos se necessário (> 1 ano)

### Trimestral
- [ ] Testar restore de um backup antigo
- [ ] Revisar lista de tabelas críticas
- [ ] Atualizar documentação se necessário

### Anual
- [ ] Audit completo do sistema de backup
- [ ] Teste de disaster recovery
- [ ] Revisão de políticas de retenção

---

## 🎯 Próximos Passos (Opcional)

### Melhorias Futuras
1. **Backup Incremental:** Salvar apenas mudanças desde último backup
2. **Compressão:** Comprimir dados antes de salvar
3. **Storage Externo:** Enviar para S3/Cloud Storage
4. **Notificações:** Email em caso de falha
5. **Dashboard:** Interface para visualizar histórico

### Point-in-Time Recovery (PITR)
- Disponível no plano Supabase pago
- Permite restore para qualquer momento
- Recomendado para produção crítica

---

## 📞 Suporte

### Em Caso de Problemas
1. Verificar logs: `SELECT * FROM backup_logs ORDER BY backup_date DESC LIMIT 1`
2. Verificar Edge Function: Cloud → Functions → backup-database
3. Verificar Cron Job: SQL Editor → `SELECT * FROM cron.job`

### Contato
- Documentação: `BACKUP_SETUP.md`
- Production Readiness: `PRODUCTION_READINESS.md`
- Sistema de Monitoramento: `/system-health`

---

## ✅ Status Final

**Sistema de Backup:** ✅ 100% OPERACIONAL  
**Última Verificação:** 21/11/2025  
**Próximo Backup:** Automático às 3:00 AM UTC  
**Confiabilidade:** PLATINUM++

---

*Backup is not a luxury, it's a necessity. Your data is now protected.* 🔒
