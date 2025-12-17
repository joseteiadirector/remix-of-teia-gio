# 🔐 Guia de Configuração de Backups

## Status Atual: ⚠️ CRÍTICO - Backups Não Configurados

Este guia detalha como configurar backups completos para proteger seus dados e código.

---

## 📊 Tipos de Backup Necessários

### 1. 🗄️ Backup do Banco de Dados (CRÍTICO)

#### Opções Disponíveis:

**A. Backups Automáticos Diários**
- ✅ Disponível em planos pagos do Lovable Cloud
- ✅ Retenção de 7-30 dias
- ✅ Restauração com um clique
- 🔧 **Como configurar:**
  1. Acesse suas configurações do backend
  2. Navegue para: Settings → Database → Backups
  3. Ative "Daily Automatic Backups"
  4. Configure a retenção desejada (7-30 dias)

**B. Point-in-Time Recovery (PITR)**
- ✅ Restauração para qualquer momento nas últimas 7-30 dias
- ✅ Proteção contra erros humanos
- ✅ Disponível em planos Pro+
- 🔧 **Como configurar:**
  1. No backend, acesse: Settings → Database → Point-in-Time Recovery
  2. Ative PITR
  3. Escolha o período de retenção

**C. Backups Manuais (Recomendado AGORA)**
Enquanto configura os backups automáticos, faça backup manual:

```bash
# Exportar todas as tabelas principais
# Use o botão de export no backend para cada tabela:
- brands
- mentions_llm
- geo_scores
- seo_metrics_daily
- api_keys
- alerts
- user_preferences
```

#### 📋 Checklist de Backup do Banco:
- [ ] Ativar backups automáticos diários
- [ ] Configurar PITR (se disponível no seu plano)
- [ ] Fazer backup manual inicial de todas as tabelas
- [ ] Testar restauração de um backup
- [ ] Documentar processo de recuperação
- [ ] Configurar alertas de falha de backup

---

### 2. 💾 Backup do Código (CRÍTICO)

#### GitHub Integration (FORTEMENTE RECOMENDADO)

**Benefícios:**
- ✅ Versionamento completo do código
- ✅ Sync bidirecional automático
- ✅ Histórico de todas as mudanças
- ✅ Permite CI/CD
- ✅ Colaboração em equipe
- ✅ Rollback fácil

**Como Conectar:**
1. No Lovable, clique em "GitHub" no canto superior direito
2. Clique em "Connect to GitHub"
3. Autorize o Lovable GitHub App
4. Selecione sua conta/organização
5. Clique em "Create Repository"

#### 📋 Checklist de Backup do Código:
- [ ] Conectar ao GitHub
- [ ] Verificar que o repositório foi criado
- [ ] Confirmar que o código foi enviado
- [ ] Testar sync bidirecional (fazer uma mudança no GitHub)
- [ ] Configurar branch protection rules
- [ ] Documentar processo de deploy

---

### 3. 🔑 Backup de Secrets e Configurações

**O que precisa ser backupado:**
- ✅ Variáveis de ambiente (.env)
- ✅ Secrets do backend
- ✅ Configurações de integração (GSC, GA4, APIs)

**Como fazer:**

```bash
# Documente seus secrets em local seguro (1Password, etc):
- RESEND_API_KEY
- GOOGLE_API_KEY
- GSC_CREDENTIALS_JSON
- GA4_PROPERTY_ID
- OPENAI_API_KEY
- PERPLEXITY_API_KEY
- ANTHROPIC_API_KEY
- STRIPE_SECRET_KEY
```

#### 📋 Checklist de Secrets:
- [ ] Listar todos os secrets configurados
- [ ] Salvar em gerenciador de senhas seguro
- [ ] Documentar onde cada secret é usado
- [ ] Criar procedimento de rotação de keys
- [ ] Testar recuperação recriando um secret

---

## 🚨 Plano de Recuperação de Desastres

### Cenário 1: Perda de Dados do Banco
1. Acesse o backend
2. Vá para Database → Backups
3. Selecione o backup mais recente
4. Clique em "Restore"
5. Confirme a operação
6. Verifique a integridade dos dados

### Cenário 2: Perda do Código
1. Clone o repositório do GitHub
2. Configure variáveis de ambiente localmente
3. Execute `npm install`
4. Execute `npm run dev` para testar
5. Deploy a partir do GitHub se necessário

### Cenário 3: Perda de Secrets
1. Acesse seu gerenciador de senhas
2. No backend, vá para Settings → Secrets
3. Reconfigure cada secret manualmente
4. Teste as integrações uma por uma

---

## ⏱️ Cronograma de Backups Recomendado

| Tipo | Frequência | Retenção | Automático |
|------|-----------|----------|------------|
| Banco de Dados | Diário | 30 dias | ✅ Sim |
| PITR | Contínuo | 7-30 dias | ✅ Sim |
| Código (GitHub) | Cada commit | Ilimitado | ✅ Sim |
| Secrets | Mensal | Ilimitado | ❌ Manual |
| Backup Manual Completo | Semanal | 90 dias | ❌ Manual |

---

## ✅ Checklist Final - Antes de Ir para Produção

### Crítico (Faça AGORA):
- [ ] **Conectar ao GitHub** (5 minutos)
- [ ] **Ativar backups automáticos do banco** (10 minutos)
- [ ] **Fazer backup manual inicial** (15 minutos)
- [ ] **Salvar secrets em gerenciador seguro** (10 minutos)

### Importante (Primeira semana):
- [ ] Configurar PITR se disponível
- [ ] Testar restauração de um backup
- [ ] Configurar alertas de falha de backup
- [ ] Documentar processo de recuperação

### Recomendado (Primeiro mês):
- [ ] Criar runbook de recuperação de desastres
- [ ] Fazer drill de recuperação completa
- [ ] Configurar CI/CD via GitHub Actions
- [ ] Implementar backup de arquivos de mídia (se houver)

---

## 📊 Monitoramento de Backups

### Métricas a Acompanhar:
- ✅ Data do último backup bem-sucedido
- ✅ Tamanho do banco de dados
- ✅ Taxa de crescimento dos dados
- ✅ Tempo de restauração (RTO)
- ✅ Ponto de recuperação (RPO)

### Alertas Recomendados:
- 🚨 Backup falhou por 24h
- ⚠️ Tamanho do banco cresceu >50% em 7 dias
- ⚠️ GitHub sync falhou
- ⚠️ Secret expirando em breve

---

## 🎯 Objetivos de Recuperação

### RTO (Recovery Time Objective)
- **Meta:** < 1 hora para restauração completa
- **Atual:** Não configurado ⚠️
- **Ação:** Configurar backups automáticos

### RPO (Recovery Point Objective)  
- **Meta:** < 24 horas de perda de dados
- **Atual:** Sem limite ⚠️
- **Ação:** Ativar backups diários mínimo

---

## 📞 Suporte em Caso de Emergência

Se ocorrer perda de dados:
1. **NÃO ENTRE EM PÂNICO** 🧘
2. **NÃO faça mais mudanças** no sistema
3. Documente o que aconteceu
4. Acesse o backend → Backups
5. Siga o plano de recuperação acima
6. Contate suporte do Lovable se necessário

---

## ✨ Próximos Passos

1. **AGORA:** Conecte ao GitHub (botão abaixo)
2. **AGORA:** Configure backups automáticos do banco (botão abaixo)
3. **HOJE:** Faça backup manual de todas as tabelas críticas
4. **HOJE:** Salve todos os secrets em local seguro
5. **ESTA SEMANA:** Teste uma restauração completa

---

**Última atualização:** 2025-11-07  
**Status:** 🔴 AÇÃO IMEDIATA NECESSÁRIA
