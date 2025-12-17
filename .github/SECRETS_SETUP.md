# 🔐 Configuração de Secrets do GitHub Actions

## Valores dos Secrets

Copie e cole os valores abaixo no GitHub:

### 1. VITE_SUPABASE_URL
```
https://llzonwqocqzqpezcsbjh.supabase.co
```

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsem9ud3FvY3F6cXBlemNzYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODMzNjgsImV4cCI6MjA3NzM1OTM2OH0.z_8tiINK0X_hFSvsyWAt7Kf-O3ANQTqCNNpgo3_fJ5I
```

---

## 📋 Passo a Passo

### 1️⃣ Acessar o Repositório no GitHub
1. Vá para: https://github.com/joseteladirector/geo-cogni-weave
2. Clique na aba **Settings** (Configurações)

### 2️⃣ Navegar até Secrets
1. No menu lateral esquerdo, clique em **Secrets and variables**
2. Clique em **Actions**

### 3️⃣ Adicionar o Primeiro Secret
1. Clique no botão verde **"New repository secret"**
2. Em **Name**, digite: `VITE_SUPABASE_URL`
3. Em **Secret**, cole: `https://llzonwqocqzqpezcsbjh.supabase.co`
4. Clique em **"Add secret"**

### 4️⃣ Adicionar o Segundo Secret
1. Clique novamente em **"New repository secret"**
2. Em **Name**, digite: `VITE_SUPABASE_ANON_KEY`
3. Em **Secret**, cole o token completo:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxsem9ud3FvY3F6cXBlemNzYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODMzNjgsImV4cCI6MjA3NzM1OTM2OH0.z_8tiINK0X_hFSvsyWAt7Kf-O3ANQTqCNNpgo3_fJ5I
   ```
4. Clique em **"Add secret"**

### 5️⃣ Verificar Configuração
Após adicionar, você deve ver:

```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
```

na lista de secrets do repositório.

---

## 🎯 O Que Acontece Depois

### Workflows Ativados
Assim que você adicionar os secrets, os workflows do GitHub Actions serão capazes de:

1. **CI (Build & Test)** - `ci.yml`
   - Fazer build do projeto
   - Rodar type checking
   - Executar lint
   - Rodar testes

2. **Deploy to Production** - `deploy-production.yml`
   - Build de produção
   - Deploy automático

3. **Security Scan** - `security-scan.yml`
   - Verificar vulnerabilidades
   - Audit de dependências

### Primeiro Test Run
Para testar se está funcionando:

1. Faça qualquer alteração pequena no código
2. Commit e push para a branch `main`
3. Vá em **Actions** no GitHub
4. Veja os workflows rodando ✅

---

## 🔒 Segurança

✅ **Secrets são seguros**
- Não aparecem em logs
- Não podem ser acessados por forks
- Apenas workflows autorizados podem usá-los

⚠️ **ANON_KEY é seguro expor?**
- **SIM**, é uma chave pública (anon/publishable)
- É usada no frontend (navegador)
- RLS protege seus dados no backend
- Não permite operações administrativas

---

## 🚨 Troubleshooting

### Workflow falha com "Environment variable not set"
- ✅ Verifique se os nomes dos secrets estão exatos (case-sensitive)
- ✅ Verifique se colou os valores completos (sem espaços extras)

### Build funciona local mas falha no GitHub
- ✅ Certifique-se que os secrets estão no repositório correto
- ✅ Verifique se o workflow tem permissão de ler secrets

### Como re-configurar um secret
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique no secret que quer alterar
3. Clique em **Update secret**
4. Cole o novo valor
5. Clique em **Update secret**

---

## ✅ Checklist Final

Antes de fechar esta página, confirme:

- [ ] Adicionei `VITE_SUPABASE_URL` no GitHub
- [ ] Adicionei `VITE_SUPABASE_ANON_KEY` no GitHub
- [ ] Os nomes estão escritos exatamente como acima
- [ ] Fiz um commit para testar os workflows
- [ ] Vi os workflows rodando na aba Actions

---

## 📸 Referência Visual

**Caminho completo:**
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```

**Resultado esperado:**
```
Repository secrets (2)
├─ VITE_SUPABASE_URL (Updated X minutes ago)
└─ VITE_SUPABASE_ANON_KEY (Updated X minutes ago)
```

---

## 🎉 Pronto!

Após configurar os secrets, seu CI/CD estará 100% funcional! 🚀

Os workflows rodarão automaticamente em:
- ✅ Todo push para `main` ou `develop`
- ✅ Todo pull request
- ✅ Semanalmente (security scan)

**Próximo passo:** Fazer um commit para ver os workflows em ação! 💪
