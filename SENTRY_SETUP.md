# 🔍 Configuração do Sentry - Monitoramento de Erros

## 📋 Visão Geral

Sistema completo de monitoramento de erros e performance em produção usando Sentry.

## 🚀 Setup Inicial

### 1. Criar Conta no Sentry

1. Acesse [sentry.io](https://sentry.io)
2. Crie uma conta (gratuita para até 5k erros/mês)
3. Crie um novo projeto tipo **React**
4. Copie o **DSN** fornecido

### 2. Configurar Environment Variable

Adicione o DSN no arquivo `.env`:

```bash
VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

**⚠️ IMPORTANTE**: 
- O Sentry **SOMENTE** ativa em produção (`import.meta.env.PROD`)
- Em desenvolvimento, erros são logados no console
- Nunca commite o DSN no repositório (use `.env.local`)

### 3. Build para Produção

```bash
npm run build
```

## 🎯 Funcionalidades Implementadas

### ✅ 1. Error Tracking Automático

**O que captura:**
- Erros não tratados (uncaught exceptions)
- Promise rejections
- Erros capturados por ErrorBoundary
- Erros de componentes React

**Implementado em:**
- `src/lib/sentry.ts` - Configuração principal
- `src/main.tsx` - Inicialização
- `src/components/ErrorBoundary.tsx` - Integração com React

### ✅ 2. Performance Monitoring

**Métricas rastreadas:**
- Tempo de carregamento de páginas
- Navegação entre rotas
- Latência de requisições
- Tempo de renderização

**Taxa de amostragem:** 10% das transações

### ✅ 3. Session Replay

**O que grava:**
- Interações do usuário (cliques, scrolls, inputs)
- Mudanças de estado da aplicação
- Network requests
- Console logs

**Privacidade:**
- Textos mascarados automaticamente
- Mídia bloqueada
- Dados sensíveis protegidos

**Taxa de gravação:**
- 10% das sessões normais
- 100% das sessões com erro

### ✅ 4. Filtros Inteligentes

**Erros ignorados automaticamente:**
- Erros de extensões de browser
- Erros de rede conhecidos
- False positives comuns

### ✅ 5. Context Enrichment

**Informações capturadas:**
- User ID e email (quando autenticado)
- Environment (production/staging)
- Release version
- Browser e OS
- URL e route atual

## 📊 Como Usar

### Capturar Erro Manualmente

```typescript
import { captureError } from '@/lib/sentry';

try {
  // Código que pode falhar
  riskyOperation();
} catch (error) {
  captureError(error as Error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
}
```

### Capturar Mensagem

```typescript
import { captureMessage } from '@/lib/sentry';

captureMessage('Operação crítica executada', 'warning');
```

### Configurar Contexto do Usuário

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// No login
setSentryUser(user.id, user.email);

// No logout
clearSentryUser();
```

### Adicionar Breadcrumb

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb('User clicked checkout', 'navigation', {
  cartTotal: 150.00,
  itemCount: 3,
});
```

## 🔧 Configuração Avançada

### Ajustar Taxa de Amostragem

Em `src/lib/sentry.ts`:

```typescript
Sentry.init({
  // Performance - 10% = 0.1, 100% = 1.0
  tracesSampleRate: 0.1,
  
  // Session Replay normal
  replaysSessionSampleRate: 0.1,
  
  // Session Replay em erros
  replaysOnErrorSampleRate: 1.0,
});
```

### Customizar Filtros

```typescript
beforeSend(event, hint) {
  // Seu filtro customizado
  if (shouldIgnoreError(event)) {
    return null; // Não envia para Sentry
  }
  return event;
}
```

### Adicionar Tags Personalizadas

```typescript
import * as Sentry from "@sentry/react";

Sentry.setTag('feature', 'llm-mentions');
Sentry.setContext('collection', {
  brandId: 'abc123',
  provider: 'ChatGPT',
});
```

## 📈 Dashboard do Sentry

### O que você verá:

1. **Issues**
   - Lista de erros agrupados
   - Frequência e impacto
   - Stack traces completos
   - User affected

2. **Performance**
   - Tempo de carregamento
   - Slowest transactions
   - Database queries
   - API calls

3. **Replays**
   - Vídeos de sessões com erro
   - Console logs
   - Network activity
   - DOM mutations

4. **Releases**
   - Erros por versão
   - Deploy tracking
   - Regression detection

## 🚨 Alertas

### Configurar no Sentry:

1. **Issues** → **Alerts**
2. Criar regra de alerta:
   - Email
   - Slack
   - Discord
   - Webhook

### Exemplos de Alertas:

```
- Novo tipo de erro detectado
- Erro afetando > 10 usuários
- Erro com taxa > 10%
- Performance degradation
```

## 🔒 Segurança e Privacidade

### Dados NÃO capturados:

- ❌ Senhas (mascaradas automaticamente)
- ❌ Tokens de autenticação
- ❌ Dados de cartão de crédito
- ❌ PII sensível

### Dados capturados:

- ✅ Stack traces de erros
- ✅ Browser e device info
- ✅ URL e route (sem query params sensíveis)
- ✅ User ID (não email em prod)
- ✅ Breadcrumbs de navegação

### GDPR Compliance:

```typescript
// Remover dados de usuário
Sentry.setUser(null);

// Desabilitar para usuário específico
if (userOptedOut) {
  Sentry.close();
}
```

## 🧪 Testando Sentry

### 1. Build de Produção Local

```bash
# Build
npm run build

# Preview
npm run preview

# Abrir no browser
open http://localhost:4173
```

### 2. Disparar Erro de Teste

Adicione temporariamente em qualquer componente:

```typescript
// Erro de teste
useEffect(() => {
  throw new Error('[TEST] Sentry error tracking');
}, []);
```

### 3. Verificar no Dashboard

1. Acesse [sentry.io](https://sentry.io)
2. Vá em **Issues**
3. Veja seu erro de teste aparecer

## 📊 Métricas e KPIs

### Objetivos:

- **Error Rate**: < 0.1%
- **MTTR** (Mean Time To Resolution): < 24h
- **User Satisfaction**: > 95%
- **Performance Score**: > 90

### Monitorar:

```
├── Error Frequency
├── Error Impact (users affected)
├── Page Load Time
├── API Response Time
└── Session Duration
```

## 🔄 Integração com CI/CD

### Upload Source Maps

```bash
# Install Sentry CLI
npm install --save-dev @sentry/cli

# Build com source maps
npm run build

# Upload (se configurado)
sentry-cli releases files $VERSION upload-sourcemaps ./dist
```

### Notificar Deploy

```bash
sentry-cli releases new $VERSION
sentry-cli releases set-commits $VERSION --auto
sentry-cli releases finalize $VERSION
```

## 🛠️ Troubleshooting

### Sentry não está capturando erros

1. ✅ Verificar que está em produção (`npm run build` + `preview`)
2. ✅ Confirmar DSN no `.env`
3. ✅ Ver console: "Sentry inicializado com sucesso"
4. ✅ Desabilitar adblockers

### Muitos erros de extensões

```typescript
// Já implementado em beforeSend
if (message.includes('chrome-extension://')) {
  return null;
}
```

### Performance impacto

```typescript
// Reduzir taxa de amostragem
tracesSampleRate: 0.05, // 5% ao invés de 10%
replaysSessionSampleRate: 0.05,
```

## 📚 Recursos

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

## 🎯 Roadmap

- [ ] Source maps upload automático
- [ ] Release tracking
- [ ] Custom dashboards
- [ ] PagerDuty integration
- [ ] Slack alerts
- [ ] Weekly error reports

---

**Status**: ✅ Implementado e Pronto
**Plano**: Free (5k erros/mês)
**Upgrade quando**: > 4k erros/mês

**Última atualização**: 2025-11-06
