# 🚀 Guia de Deploy e CI/CD

## Workflows Configurados

### 1. **CI - Build & Test** (`ci.yml`)
- **Trigger**: Push ou PR para `main` ou `develop`
- **Ações**:
  - ✅ Checkout do código
  - ✅ Setup Node.js 20
  - ✅ Instalação de dependências
  - ✅ Type checking
  - ✅ Lint do código
  - ✅ Build do projeto
  - ✅ Execução de testes
  - ✅ Upload de artifacts

### 2. **Deploy to Production** (`deploy-production.yml`)
- **Trigger**: Push para `main` ou manual
- **Ações**:
  - ✅ Build de produção
  - ✅ Deploy automático

### 3. **Security Scan** (`security-scan.yml`)
- **Trigger**: Push, PR ou agenda semanal
- **Ações**:
  - ✅ npm audit
  - ✅ Verificação de vulnerabilidades

## 📋 Configuração Necessária no GitHub

### Secrets a Adicionar no Repositório:

**📋 Veja instruções detalhadas em: [SECRETS_SETUP.md](./SECRETS_SETUP.md)**

Resumo:
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione os seguintes secrets:

```
VITE_SUPABASE_URL=https://llzonwqocqzqpezcsbjh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsem9ud3FvY3F6cXBlemNzYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODMzNjgsImV4cCI6MjA3NzM1OTM2OH0.z_8tiINK0X_hFSvsyWAt7Kf-O3ANQTqCNNpgo3_fJ5I
```

### Opcionais (para deploy em outras plataformas):
```
VERCEL_TOKEN=seu_token_vercel
VERCEL_ORG_ID=seu_org_id
VERCEL_PROJECT_ID=seu_project_id
```

## 🔄 Fluxo de Deploy

### Deploy Lovable (Padrão)
```
1. Desenvolver no Lovable
2. Push automático para GitHub
3. GitHub Actions roda CI
4. Frontend: Clicar "Update" no botão Publish
5. Backend: Deploy automático de Edge Functions
```

### Deploy Alternativo (Vercel/Netlify)
```
1. Descomentar seção de deploy no workflow
2. Adicionar secrets necessários
3. Push para main = deploy automático
```

## 🏷️ Environments

Para configurar ambientes no GitHub:

1. **Settings** → **Environments** → **New environment**
2. Criar: `production`, `staging`, `development`
3. Adicionar protection rules:
   - Require approval
   - Restrict branches (main only)

## 📊 Status Badges

Adicione ao README.md:

```markdown
![CI Status](https://github.com/SEU-USUARIO/SEU-REPO/workflows/CI%20-%20Build%20%26%20Test/badge.svg)
![Deploy Status](https://github.com/SEU-USUARIO/SEU-REPO/workflows/Deploy%20to%20Production/badge.svg)
```

## 🔐 Segurança

- ✅ Secrets armazenados no GitHub (nunca no código)
- ✅ npm audit executado semanalmente
- ✅ Dependências verificadas em cada PR
- ✅ Branch protection ativada para `main`

## 📝 Próximos Passos

1. [ ] Conectar repositório ao GitHub
2. [ ] Adicionar secrets no GitHub
3. [ ] Configurar environments
4. [ ] Ativar branch protection
5. [ ] Fazer primeiro push para testar workflows
6. [ ] Adicionar status badges ao README

## 🚨 Troubleshooting

**Build falha?**
- Verificar se secrets estão configurados
- Verificar logs no GitHub Actions

**Deploy não funciona?**
- Backend: Deploy é automático no Lovable Cloud
- Frontend: Clicar "Update" no Publish após merge

**Testes falhando?**
- Adicionar testes ao projeto
- Configurar Playwright para CI
