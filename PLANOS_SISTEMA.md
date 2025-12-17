# Sistema de Planos TEIA GEO

## Estrutura de Planos

### FREE (Trial 7 dias)
**Preço:** R$ 0  
**Duração:** 7 dias de trial  
**Características:**
- 3 marcas monitoradas
- 10 queries (não análises completas)
- Dashboards básicos
- Sem acesso à IA
- Suporte por email (72h)
- Acesso automático para novos usuários

**Objetivo:** Permitir que novos usuários testem o sistema antes de assinar.

**Limitações:**
- Após 7 dias, precisa fazer upgrade para continuar usando
- Não pode renovar o trial
- Funcionalidades de IA bloqueadas

---

### BÁSICO
**Preço:** R$ 297/mês  
**Stripe Price ID:** `price_1SOTfi6OZijkKYDjAlQO6B9l`  
**Stripe Product ID:** `prod_TL9znKfXz4iDXu7`

**Características:**
- 100 queries/mês
- 5 marcas monitoradas
- 1 relatório básico/mês
- Suporte por email (48h)

**Ideal para:** Pequenas empresas e startups começando com GEO.

---

### PROFISSIONAL
**Preço:** R$ 797/mês  
**Stripe Price ID:** `price_1SOTfz6OZijkKYDjso3HLs6l`  
**Stripe Product ID:** `prod_TL9zkY2kAhbdMad`  
**Badge:** "Mais Popular"

**Características:**
- 500 queries/mês
- 20 marcas monitoradas
- Relatórios avançados ilimitados
- **Análise com IA incluída**
- Suporte prioritário (24h)
- Automações básicas

**Ideal para:** Empresas médias que precisam de análise avançada e IA.

---

### AGÊNCIA
**Preço:** R$ 497/mês  
**Stripe Price ID:** `price_agency_placeholder`  
**Stripe Product ID:** `prod_agency_placeholder`  
**Badge:** "Canal Indireto"

**Características:**
- 800 queries/mês
- 20 marcas monitoradas
- **Relatórios white-label**
- **Certificação em IGO Framework**
- API access básica
- Suporte prioritário (24h)
- **Revenda permitida** (markup livre)

**Ideal para:** Agências digitais que atendem múltiplos clientes e querem revender a solução.

**Modelo de negócio sugerido:**
- Agência paga R$ 497/mês
- Cobra R$ 200-300/cliente dos 20 slots
- Fatura potencial: R$ 4.000-6.000/mês
- Lucro líquido: R$ 3.500-5.500/mês

---

### ENTERPRISE
**Preço:** R$ 1.997/mês  
**Stripe Price ID:** `price_1SOTgE6OZijkKYDjuBp17sYf`  
**Stripe Product ID:** `prod_TLA8lNTQMQDhXsy`

**Características:**
- **Alto volume de queries (até 5.000/mês)**
- **Até 100 marcas monitoradas**
- Relatórios avançados ilimitados
- IA + Automações avançadas
- Suporte dedicado (12h)
- Consultor dedicado + API access completa

**Ideal para:** Grandes empresas, corporações e holdings.

**Nota Técnica:** Limites baseados em capacidade real de infraestrutura e custos de APIs de LLMs.

---

## Fluxo do Usuário

### 1. Novo Cadastro
```
Usuário cria conta → Recebe automaticamente plano FREE
↓
Tem 7 dias para testar
↓
3 marcas + 10 queries disponíveis
```

### 2. Durante Trial (7 dias)
```
Usuário explora o sistema
↓
Vê limites: "Você tem X queries restantes do seu trial"
↓
Recebe avisos quando se aproxima do limite
```

### 3. Fim do Trial
```
Trial expira após 7 dias
↓
Sistema bloqueia novas análises
↓
Exibe: "Seu trial expirou. Faça upgrade para continuar"
↓
Redireciona para /subscription
```

### 4. Upgrade
```
Usuário escolhe plano (Básico/Pro/Enterprise)
↓
Clica "Assinar Agora"
↓
Redireciona para Stripe Checkout
↓
Completa pagamento
↓
Volta automaticamente para o app
↓
Sistema detecta pagamento e libera recursos
```

## Sistema de Limites

### Como Funciona
- **Marcas:** Limitadas por número total criadas
- **Queries:** Limitadas por mês (reseta dia 1)
- **Bloqueio:** Ao atingir limite, bloqueia ação e sugere upgrade

### Verificação
```typescript
// useSubscriptionLimits.ts
checkLimit('brands') // Verifica se pode criar marca
checkLimit('analyses') // Verifica se pode fazer análise
```

### Avisos
- **80% do limite:** Email de aviso
- **90% do limite:** Email de aviso urgente
- **100% do limite:** Bloqueio + Modal de upgrade

## Gestão de Assinatura

### Portal do Cliente (Stripe)
Usuários podem:
- Ver histórico de pagamentos
- Atualizar cartão
- Cancelar assinatura
- Fazer upgrade/downgrade
- Baixar notas fiscais

### Acesso ao Portal
```
Dashboard → Botão "Gerenciar Assinatura"
↓
Abre Stripe Customer Portal em nova aba
↓
Usuário faz mudanças
↓
Volta para o app
↓
Mudanças aplicadas automaticamente
```

## Isolamento de Dados

### Segurança RLS (Row Level Security)
Cada usuário vê **APENAS** seus dados:
```sql
-- Exemplo de política RLS
CREATE POLICY "Users can view their own brands"
ON brands FOR SELECT
USING (auth.uid() = user_id);
```

### Garantias
- Usuário A **NUNCA** vê dados do Usuário B
- Cada conta é completamente isolada
- Mesmo admins não veem dados de outros usuários (sem permissão explícita)

## Receita Recorrente

### Modelo de Negócio
```
100 usuários no plano Básico (R$ 297)
= R$ 29.700/mês de receita recorrente

50 usuários no plano Pro (R$ 897)
= R$ 44.850/mês de receita recorrente

10 usuários no plano Enterprise (R$ 2.497)
= R$ 24.970/mês de receita recorrente

TOTAL: R$ 99.520/mês MRR (Monthly Recurring Revenue)
```

### Churn Management
- Trial de 7 dias ajuda a qualificar leads
- Limites bem definidos incentivam upgrades
- Suporte diferenciado por plano aumenta retenção

## Configuração Técnica

### Stripe Integration
- **create-checkout:** Cria sessão de pagamento
- **check-subscription:** Verifica status da assinatura
- **customer-portal:** Abre portal de gerenciamento

### Verificação Automática
Sistema verifica assinatura:
- No login
- A cada 60 segundos
- Após checkout bem-sucedido

### Edge Functions
```typescript
// Exemplo: create-checkout
await stripe.checkout.sessions.create({
  customer: customerId,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${origin}/dashboard`,
  cancel_url: `${origin}/subscription`
});
```

## Monitoramento

### Métricas Importantes
- Taxa de conversão Trial → Pago
- Churn rate por plano
- MRR (Monthly Recurring Revenue)
- Lifetime Value (LTV)
- Uso médio por plano

### Alertas
- Email quando trial está acabando (dia 5)
- Email quando limite está próximo (80%, 90%)
- Email quando assinatura vai vencer

---

**Última atualização:** 21/11/2025
**Versão:** 2.0 (Com plano FREE Trial)
