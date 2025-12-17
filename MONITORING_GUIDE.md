# 📊 Guia de Monitoramento - Coletas Automáticas

> **Como verificar se as métricas estão atualizando corretamente**

---

## ⏰ Horário de Coleta e Relatórios

```
🌙 ~01:00-01:20 AM - Coletas automáticas rodam
├── collect-llm-mentions (menções LLM)
├── calculate-geo-metrics (scores GEO)
└── collect-seo-metrics (métricas SEO)

🌅 08:00 AM - Relatório DIÁRIO é enviado por email
└── send-scheduled-weekly-reports (relatório das últimas 24h)
```

**📅 Frequência:** 
- **Coletas:** Diárias (a cada 24 horas)
- **Relatórios:** Diárias às 8:00 AM

---

## 🔍 Como Verificar Atualizações Diárias

### 1️⃣ Verificar Menções LLM

**Rota:** `/llm-mentions`

**O que verificar:**
- [ ] Data da última coleta mudou?
- [ ] Total de menções aumentou?
- [ ] Novas menções aparecem no topo da lista?

**Query SQL para verificar:**
```sql
-- Últimas coletas por dia
SELECT 
  DATE(collected_at) as dia,
  COUNT(*) as mencoes,
  MAX(collected_at) as horario_ultima_coleta
FROM mentions_llm
WHERE collected_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(collected_at)
ORDER BY dia DESC;
```

**Resultado esperado:**
- Cada dia deve ter ~80-120 menções
- Horário deve ser ~01:00-01:30 AM
- Deve haver entrada para HOJE

---

### 2️⃣ Verificar Scores GEO

**Rota:** `/geo-metrics`

**O que verificar:**
- [ ] Score mudou desde ontem?
- [ ] Data do último cálculo é de hoje?
- [ ] Gráfico de histórico mostra nova entrada?

**Query SQL para verificar:**
```sql
-- Scores dos últimos 7 dias
SELECT 
  brand_id,
  DATE(computed_at) as dia,
  AVG(score) as score_medio,
  COUNT(*) as calculos
FROM geo_scores
WHERE computed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY brand_id, DATE(computed_at)
ORDER BY brand_id, dia DESC;
```

**Resultado esperado:**
- Score pode variar entre ±5 pontos diariamente
- Deve haver cálculo para HOJE
- Breakdown (autoridade, relevância) deve mudar

---

### 3️⃣ Verificar Métricas SEO

**Rota:** `/seo-metrics`

**O que verificar:**
- [ ] Impressões/clicks atualizados?
- [ ] Data mais recente é de hoje?
- [ ] CTR/position changes refletem novos dados?

**Query SQL para verificar:**
```sql
-- Métricas SEO dos últimos 7 dias
SELECT 
  date as dia,
  COUNT(DISTINCT brand_id) as marcas,
  AVG(total_clicks) as media_clicks,
  AVG(total_impressions) as media_impressions,
  AVG(ctr) as media_ctr
FROM seo_metrics_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

**Resultado esperado:**
- Deve haver entrada para HOJE
- Valores podem variar ±10-20% diariamente
- Não deve ter dias faltando

---

## 🚨 Sinais de Problema

### ❌ Coletas NÃO Estão Rodando

| Sintoma | Causa Provável | Como Verificar |
|---------|----------------|----------------|
| Última coleta > 48h atrás | Cron job parado | Ver logs edge functions |
| Zero menções novas | Rate limit ou API down | Ver logs de erro |
| Mesmo score por 3+ dias | Cálculo não rodou | Ver tabela geo_scores |
| Gaps no histórico | Falha intermitente | Verificar dias faltantes |

### 🔧 Como Diagnosticar

#### 1. Ver Logs de Edge Functions
```
Lovable Cloud Backend > Functions > 
├── scheduled-mentions-collection > Logs
├── collect-llm-mentions > Logs
└── calculate-geo-metrics > Logs
```

**Procurar por:**
- ✅ "✓ Collected X/Y mentions" - Sucesso
- ❌ "Rate limit exceeded" - Limite atingido
- ❌ "Failed to fetch brands" - Erro de auth
- ❌ "Timeout" - Função demorou muito

#### 2. Verificar Tabelas Diretamente

**Ver últimas coletas:**
```sql
-- Menções
SELECT MAX(collected_at) FROM mentions_llm;

-- Scores
SELECT MAX(computed_at) FROM geo_scores;

-- SEO
SELECT MAX(date) FROM seo_metrics_daily;
```

**Se qualquer um estiver > 48h:**
- 🚨 PROBLEMA: Coletas não estão rodando
- 🔧 AÇÃO: Verificar logs edge functions

---

## 📊 Padrões Normais vs Anormais

### ✅ NORMAL (Esperado)

```
Dia     | Menções | Score | Mudança
--------|---------|-------|--------
06/11   | 98      | 68.5  | +2.3
05/11   | 96      | 66.2  | -1.8
04/11   | 84      | 68.0  | +3.5
03/11   | 120     | 64.5  | -
```

**Características:**
- ✅ Dados TODOS OS DIAS
- ✅ Menções entre 80-120
- ✅ Score varia ±5 pontos
- ✅ Horário ~01:00 AM

### ❌ ANORMAL (Problema)

```
Dia     | Menções | Score | Mudança
--------|---------|-------|--------
06/11   | 98      | 68.5  | +0.0  ⚠️ Mesmo score
05/11   | 98      | 68.5  | +0.0  ⚠️ Mesmas menções
04/11   | -       | -     | -     🚨 Dia faltando
03/11   | 5       | 64.5  | -     ⚠️ Muito baixo
```

**Problemas identificados:**
- 🚨 Dia faltando = Coleta falhou
- ⚠️ Score idêntico por 2+ dias = Cálculo não rodou
- ⚠️ < 20 menções = Rate limit ou erro
- ⚠️ > 200 menções = Duplicação

---

## 🎯 Checklist Diário de Monitoramento

### Manhã (após 8:00 AM)

- [ ] **Menções LLM:**
  - [ ] Última coleta é de hoje (entre 01:00-02:00 AM)?
  - [ ] Total aumentou comparado a ontem?
  - [ ] Novas menções no topo da lista?

- [ ] **Scores GEO:**
  - [ ] Score atualizado hoje?
  - [ ] Valor mudou (mesmo que pouco)?
  - [ ] Breakdown mostra novos dados?

- [ ] **Métricas SEO:**
  - [ ] Data mais recente é hoje?
  - [ ] Clicks/impressions atualizaram?
  - [ ] Gráficos mostram continuidade?

### Semanal (Toda Segunda)

- [ ] **Histórico Completo:**
  - [ ] Últimos 7 dias SEM gaps?
  - [ ] Tendência de dados faz sentido?
  - [ ] Não há dias com zero dados?

- [ ] **Logs de Erro:**
  - [ ] Edge functions sem erros críticos?
  - [ ] Rate limits sob controle (<5%)?
  - [ ] Timeouts raros (<1%)?

---

## 🔔 Alertas Recomendados

### Configurar Alertas Para:

1. **⚠️ Coleta Atrasada**
   ```
   SE última_coleta > 36 horas
   ENTÃO avisar via email/slack
   ```

2. **⚠️ Zero Dados Novos**
   ```
   SE mentions_hoje == 0
   ENTÃO verificar logs
   ```

3. **⚠️ Score Congelado**
   ```
   SE score_hoje == score_ontem == score_anteontem
   ENTÃO verificar cálculo
   ```

4. **⚠️ Taxa de Erro Alta**
   ```
   SE error_rate > 10%
   ENTÃO investigar causa
   ```

---

## 📈 Métricas de Saúde do Sistema

### KPIs para Monitorar

| Métrica | Target | Alerta | Crítico |
|---------|--------|--------|---------|
| **Uptime coletas** | 100% | <98% | <95% |
| **Menções/dia** | 80-120 | <50 ou >200 | <20 ou >300 |
| **Latência coleta** | <5min | >10min | >15min |
| **Taxa de erro** | <2% | >5% | >10% |
| **Gaps histórico** | 0 dias | 1 dia/semana | 2+ dias/semana |

---

## 🛠️ Troubleshooting Rápido

### Problema: "Menções não atualizaram hoje"

**Passos:**
1. Verificar última coleta: `SELECT MAX(collected_at) FROM mentions_llm;`
2. Se > 24h, ver logs: `scheduled-mentions-collection`
3. Procurar erro específico
4. Se rate limit: esperar 24h
5. Se erro auth: verificar service key
6. Se timeout: otimizar queries

### Problema: "Score não mudou em 3 dias"

**Passos:**
1. Verificar cálculos: `SELECT COUNT(*) FROM geo_scores WHERE computed_at > NOW() - INTERVAL '3 days';`
2. Se zero, ver logs: `calculate-geo-metrics`
3. Verificar se há menções novas para calcular
4. Se sim, mas score igual = bug no cálculo
5. Se não = coleta de menções falhou primeiro

### Problema: "Dados com gaps (dias faltando)"

**Passos:**
1. Identificar dias faltantes
2. Ver logs daqueles dias específicos
3. Procurar padrão (sempre fim de semana? sempre mesma hora?)
4. Verificar se cron job está ativo
5. Considerar executar coleta manual para preencher

---

## 🚀 Ações de Melhoria

### Curto Prazo
1. [ ] Adicionar logs mais detalhados nas coletas
2. [ ] Implementar retry automático em falhas
3. [ ] Dashboard de saúde das coletas
4. [ ] Alertas automáticos por email

### Médio Prazo
1. [ ] Backup de dados antes de cada coleta
2. [ ] Sistema de recuperação automática de gaps
3. [ ] Métricas de performance das coletas
4. [ ] Rate limiting inteligente

### Longo Prazo
1. [ ] Múltiplos horários de coleta
2. [ ] Coleta incremental (apenas novos dados)
3. [ ] Predição de falhas
4. [ ] Auto-scaling baseado em carga

---

**📅 Última Verificação:** 06/11/2025 01:20 AM  
**✅ Status Atual:** OPERACIONAL  
**📊 Uptime (7 dias):** 100%  
**🎯 Próxima Coleta:** 07/11/2025 ~01:00 AM
