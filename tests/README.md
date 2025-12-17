# Testes E2E - Teia Studio GEO

## 📋 Visão Geral

Suite completa de testes End-to-End usando Playwright para garantir que todos os fluxos críticos da aplicação funcionem corretamente.

## 🚀 Como Executar

### Instalação
```bash
# Instalar dependências do Playwright
npx playwright install
```

### Rodar Todos os Testes
```bash
# Modo headless (CI)
npx playwright test

# Modo UI interativo (recomendado para desenvolvimento)
npx playwright test --ui

# Com browser visível
npx playwright test --headed

# Em um browser específico
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Rodar Testes Específicos
```bash
# Um arquivo específico
npx playwright test tests/e2e/auth.spec.ts

# Por nome do teste
npx playwright test -g "should login successfully"

# Modo debug
npx playwright test --debug
```

### Ver Relatório
```bash
npx playwright show-report
```

## 📁 Estrutura de Testes

```
tests/
├── e2e/
│   ├── auth.spec.ts           # Autenticação e registro
│   ├── brands.spec.ts          # Gestão de marcas (CRUD)
│   ├── dashboard.spec.ts       # Dashboard e widgets
│   ├── insights.spec.ts        # Insights de IA
│   ├── llm-mentions.spec.ts    # Coleta de menções
│   ├── reports.spec.ts         # Geração de relatórios
│   └── scores.spec.ts          # Visualização de scores
├── setup.ts                    # Configurações compartilhadas
└── README.md                   # Esta documentação
```

## 🎯 Cobertura de Testes

### ✅ Fluxos Críticos Cobertos

#### 1. **Autenticação** (`auth.spec.ts`)
- ✅ Exibição de formulário de login
- ✅ Validação de campos vazios
- ✅ Validação de formato de email
- ✅ Validação de requisitos de senha
- ✅ Alternância entre login e registro

#### 2. **Gestão de Marcas** (`brands.spec.ts`)
- ✅ Listagem de marcas
- ✅ Criação de nova marca
- ✅ Validação de formulário
- ✅ Filtragem e busca
- ✅ Exibição de empty state

#### 3. **Menções em LLMs** (`llm-mentions.spec.ts`)
- ✅ Seleção de marca
- ✅ Iniciar processo de coleta
- ✅ Exibição de tabela de menções
- ✅ Filtros por provider
- ✅ Badges de sentimento

#### 4. **Relatórios** (`reports.spec.ts`)
- ✅ Geração manual de relatório
- ✅ Exportação em PDF
- ✅ Exportação em Excel
- ✅ Exportação em CSV
- ✅ Navegação entre tipos de relatório

#### 5. **Scores** (`scores.spec.ts`)
- ✅ Exibição de GEO Score
- ✅ Exibição de SEO Score
- ✅ Atualização/cálculo de métricas
- ✅ Visualização de gráficos
- ✅ Comparação de métricas

#### 6. **Dashboard** (`dashboard.spec.ts`)
- ✅ Carregamento da página
- ✅ Exibição de widgets
- ✅ Navegação entre seções

#### 7. **Insights** (`insights.spec.ts`)
- ✅ Loading states
- ✅ Empty states
- ✅ Geração de novos insights
- ✅ Filtragem

## 🎬 Funcionalidades do Playwright

### Screenshots Automáticos
- Captura automática em falhas
- Armazenados em `test-results/`

### Vídeos
- Gravação em falhas
- Útil para debugging

### Traces
- Debug detalhado com network, DOM, console
- Ver com `npx playwright show-trace trace.zip`

### Multi-Browser
- Chrome/Chromium ✅
- Firefox ✅
- Safari/WebKit ✅
- Mobile Chrome ✅

## 📊 CI/CD

### GitHub Actions (exemplo)
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## 🔧 Configuração

Ver `playwright.config.ts` para:
- Timeouts
- Retry policies
- Browsers
- Base URL
- Screenshots/vídeos

## 📝 Boas Práticas

### 1. **Seletores Estáveis**
```typescript
// ✅ Bom - role e texto
page.getByRole('button', { name: /submit/i })

// ❌ Evitar - classes CSS
page.locator('.btn-primary')
```

### 2. **Esperar Corretamente**
```typescript
// ✅ Bom - espera automática
await expect(page.getByText('Success')).toBeVisible()

// ❌ Evitar - timeouts fixos
await page.waitForTimeout(5000)
```

### 3. **Isolar Testes**
```typescript
// ✅ Cada teste independente
test.beforeEach(async ({ page }) => {
  await page.goto('/fresh-start');
});
```

### 4. **Assertions Claras**
```typescript
// ✅ Mensagens descritivas
await expect(submitButton).toBeEnabled({ 
  timeout: 3000 
});

// ✅ Verificações múltiplas
await expect(page).toHaveTitle(/Expected/);
await expect(page).toHaveURL(/success/);
```

## 🐛 Debugging

### Modo Debug
```bash
# Pausa antes de cada ação
npx playwright test --debug

# Inspector do Playwright
PWDEBUG=1 npx playwright test
```

### Trace Viewer
```bash
# Gerar trace
npx playwright test --trace on

# Ver trace
npx playwright show-trace trace.zip
```

### Screenshots
```typescript
// Manual screenshot
await page.screenshot({ path: 'screenshot.png' });
```

## 📈 Métricas

### Tempo de Execução
- **Suite completa**: ~2-3 minutos
- **Por teste**: ~5-15 segundos

### Cobertura
- **7 suites de teste**
- **~50 casos de teste**
- **Fluxos críticos**: 100%

## 🎯 Próximos Passos

### Expansão de Testes
- [ ] Testes de performance
- [ ] Testes de acessibilidade
- [ ] Testes de API
- [ ] Visual regression testing

### Integração
- [ ] Setup CI/CD completo
- [ ] Parallel execution
- [ ] Shard tests para velocidade

### Monitoramento
- [ ] Integração com Sentry
- [ ] Dashboard de métricas
- [ ] Alertas automáticos

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [CI Guide](https://playwright.dev/docs/ci)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Última atualização**: 2025-11-06
**Mantido por**: Time Teia Studio
