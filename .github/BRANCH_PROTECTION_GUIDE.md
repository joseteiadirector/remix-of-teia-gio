# 🔒 Guia de Configuração de Branch Protection

## Configuração Manual no GitHub (Recomendado)

### Passo a Passo:

1. **Acesse as configurações do repositório**
   - Vá para `https://github.com/SEU-USUARIO/SEU-REPO/settings`
   - Ou: Repositório → Settings

2. **Navegue até Branch Protection Rules**
   - No menu lateral: **Branches**
   - Clique em **Add branch protection rule**

3. **Configure a branch `main`**
   
   **Branch name pattern:**
   ```
   main
   ```

### ✅ Regras Recomendadas

#### Proteções Básicas (Essenciais)
- ☑️ **Require a pull request before merging**
  - ☑️ Require approvals: **1** (ou mais)
  - ☑️ Dismiss stale pull request approvals when new commits are pushed
  - ☑️ Require review from Code Owners (opcional)

- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - Selecione os status checks:
    - `build-and-test` (do workflow ci.yml)
    - `security-scan` (do workflow security-scan.yml)

#### Proteções Adicionais (Recomendadas)
- ☑️ **Require conversation resolution before merging**
  - Força resolver todos os comentários antes do merge

- ☑️ **Require signed commits** (opcional, maior segurança)
  - Requer commits assinados com GPG

- ☑️ **Require linear history**
  - Evita merge commits, força rebase/squash

- ☑️ **Include administrators**
  - Aplica as regras mesmo para admins

#### Proteções Avançadas
- ☑️ **Restrict who can push to matching branches**
  - Adicione usuários/equipes específicas

- ☑️ **Allow force pushes** → **DESABILITADO**
  - Previne force push acidental

- ☑️ **Allow deletions** → **DESABILITADO**
  - Previne deleção acidental da branch

4. **Salve as configurações**
   - Clique em **Create** ou **Save changes**

## 📋 Configuração Recomendada para Este Projeto

```yaml
Branch: main

✅ Require pull request:
   - Approvals required: 1
   - Dismiss stale reviews: Yes
   
✅ Require status checks:
   - Require branches up to date: Yes
   - Required checks:
     * build-and-test
     * security-scan
     
✅ Require conversation resolution: Yes

✅ Require linear history: Yes

✅ Include administrators: Yes

❌ Allow force pushes: No

❌ Allow deletions: No
```

## 🔄 Fluxo de Trabalho com Branch Protection

### Desenvolvendo uma Feature:

1. **Criar branch a partir da main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/minha-feature
   ```

2. **Desenvolver e commitar:**
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   git push origin feature/minha-feature
   ```

3. **Criar Pull Request:**
   - Vá no GitHub e clique em "Compare & pull request"
   - Preencha título e descrição
   - Aguarde CI passar ✅

4. **Code Review:**
   - Solicite revisão de pelo menos 1 pessoa
   - Responda comentários
   - Faça ajustes se necessário

5. **Merge:**
   - Após aprovação e CI verde ✅
   - Clique em "Squash and merge" ou "Rebase and merge"
   - Delete a branch após merge

## 🚨 Regras de CI que Bloqueiam Merge

Os seguintes checks precisam passar:

1. **build-and-test** (de `.github/workflows/ci.yml`)
   - ✅ Type checking
   - ✅ Lint
   - ✅ Build
   - ✅ Tests

2. **security-scan** (de `.github/workflows/security-scan.yml`)
   - ✅ npm audit
   - ✅ Verificação de vulnerabilidades

## 👥 Configuração para Times

### Para projetos com múltiplos desenvolvedores:

**Approvals recomendadas:**
- Time pequeno (2-3 pessoas): 1 aprovação
- Time médio (4-10 pessoas): 2 aprovações
- Time grande (10+ pessoas): 2-3 aprovações

**Code Owners (opcional):**

Crie arquivo `.github/CODEOWNERS`:
```
# Owners globais
* @seu-usuario

# Owners específicos
/src/components/** @frontend-team
/supabase/functions/** @backend-team
*.md @docs-team
```

## 🔧 Troubleshooting

### Problema: "Status checks não aparecem"
**Solução:** Faça um PR primeiro, os checks aparecerão após o primeiro run

### Problema: "Não consigo fazer merge"
**Solução:** Verifique:
- [ ] Aprovações necessárias recebidas?
- [ ] CI está verde?
- [ ] Branch está atualizada com main?
- [ ] Conversas resolvidas?

### Problema: "Preciso fazer hotfix urgente"
**Solução:** 
1. Temporariamente desabilite branch protection
2. Faça o hotfix direto na main
3. Reabilite branch protection
4. OU: Crie exceção para admins

## 📊 Métricas de Qualidade

Com branch protection ativa, você garante:

- ✅ **100% de code review** antes do merge
- ✅ **0 bugs** que não passam pelo CI
- ✅ **Histórico limpo** e rastreável
- ✅ **Colaboração** forçada entre time
- ✅ **Qualidade** consistente do código

## 🎯 Próximos Passos

1. [ ] Ativar branch protection conforme guia acima
2. [ ] Criar arquivo CODEOWNERS (se time)
3. [ ] Documentar fluxo de trabalho para o time
4. [ ] Fazer primeiro PR de teste
5. [ ] Ajustar regras conforme necessidade do time

## 📚 Recursos Adicionais

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Code Owners Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
