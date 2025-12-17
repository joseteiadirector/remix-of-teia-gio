# Configuration & Constants

Constantes globais e configurações centralizadas do projeto.

## 📁 Estrutura

```
src/config/
└── constants.ts          # Todas as constantes da aplicação
```

## 🎯 Como Usar

### Import de Constantes
```tsx
import { ROUTES, API_CONFIG, ERROR_MESSAGES } from '@/config/constants';
```

### Uso em Componentes
```tsx
import { ROUTES, ERROR_MESSAGES } from '@/config/constants';
import { useNavigate } from 'react-router-dom';

export function LoginButton() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    try {
      // ... lógica de login
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      toast.error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }
  };
  
  return <Button onClick={handleLogin}>Login</Button>;
}
```

## 📦 Categorias de Constantes

### 🗺️ ROUTES
Todas as rotas da aplicação
```tsx
ROUTES.HOME           // '/'
ROUTES.DASHBOARD      // '/dashboard'
ROUTES.BRANDS         // '/brands'
ROUTES.NOT_FOUND      // '/404'
```

### ⚙️ API_CONFIG
Configurações de API e timeouts
```tsx
API_CONFIG.TIMEOUTS.DEFAULT    // 30000ms
API_CONFIG.RETRY.MAX_ATTEMPTS  // 3
API_CONFIG.RATE_LIMITS.DEFAULT // { maxRequests: 100, windowMs: 60000 }
```

### 📄 PAGINATION
Configurações de paginação
```tsx
PAGINATION.DEFAULT_PAGE_SIZE   // 10
PAGINATION.PAGE_SIZES          // [10, 25, 50, 100]
PAGINATION.MAX_PAGE_SIZE       // 100
```

### 🎨 UI_CONFIG
Configurações de interface
```tsx
UI_CONFIG.TOAST.DURATION           // 5000ms
UI_CONFIG.ANIMATION.DELAYS.SHORT   // 100ms
UI_CONFIG.DEBOUNCE.SEARCH          // 500ms
UI_CONFIG.BREAKPOINTS.MOBILE       // 768px
```

### ❌ ERROR_MESSAGES
Mensagens de erro padronizadas
```tsx
ERROR_MESSAGES.GENERIC
ERROR_MESSAGES.NETWORK
ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS
ERROR_MESSAGES.SUBSCRIPTION.LIMIT_REACHED
```

### ✅ SUCCESS_MESSAGES
Mensagens de sucesso padronizadas
```tsx
SUCCESS_MESSAGES.SAVED
SUCCESS_MESSAGES.AUTH.SIGNED_IN
SUCCESS_MESSAGES.BRAND.CREATED
```

### 🔒 VALIDATION
Regras de validação
```tsx
VALIDATION.EMAIL.REGEX
VALIDATION.PASSWORD.MIN_LENGTH
VALIDATION.URL.MAX_LENGTH
```

### 🚩 FEATURES
Feature flags
```tsx
FEATURES.ENABLE_PWA
FEATURES.ENABLE_ANALYTICS
FEATURES.ENABLE_AI_INSIGHTS
```

### 📊 SCORE_RANGES
Ranges de pontuação
```tsx
SCORE_RANGES.EXCELLENT  // { min: 90, max: 100, color: 'green' }
SCORE_RANGES.GOOD       // { min: 70, max: 89, color: 'blue' }
```

### 💾 STORAGE_KEYS
Chaves do localStorage
```tsx
STORAGE_KEYS.AUTH_TOKEN
STORAGE_KEYS.USER_PREFERENCES
STORAGE_KEYS.THEME
```

## 📝 Exemplos Práticos

### Timeout em API Call
```tsx
import { API_CONFIG } from '@/config/constants';

const fetchData = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    API_CONFIG.TIMEOUTS.LONG
  );
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};
```

### Validação de Email
```tsx
import { VALIDATION, ERROR_MESSAGES } from '@/config/constants';

const validateEmail = (email: string) => {
  if (!VALIDATION.EMAIL.REGEX.test(email)) {
    throw new Error(ERROR_MESSAGES.VALIDATION);
  }
  if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
    throw new Error(ERROR_MESSAGES.VALIDATION);
  }
  return true;
};
```

### Navegação com Rotas
```tsx
import { ROUTES } from '@/config/constants';
import { useNavigate } from 'react-router-dom';

export function Navigation() {
  const navigate = useNavigate();
  
  return (
    <nav>
      <Link to={ROUTES.HOME}>Home</Link>
      <Link to={ROUTES.DASHBOARD}>Dashboard</Link>
      <Link to={ROUTES.BRANDS}>Brands</Link>
    </nav>
  );
}
```

### Animações com Delays
```tsx
import { UI_CONFIG } from '@/config/constants';

export function AnimatedCard({ index }: { index: number }) {
  const delay = index * UI_CONFIG.ANIMATION.DELAYS.SHORT;
  
  return (
    <div 
      className="animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      Content
    </div>
  );
}
```

### Toast Messages
```tsx
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/config/constants';
import { toast } from 'sonner';

const saveBrand = async () => {
  try {
    await api.saveBrand(brand);
    toast.success(SUCCESS_MESSAGES.BRAND.CREATED);
  } catch (error) {
    toast.error(ERROR_MESSAGES.GENERIC);
  }
};
```

## ✅ Benefícios

1. **Consistência**: Valores únicos em todo o app
2. **Manutenibilidade**: Mudanças em um único lugar
3. **Type Safety**: TypeScript garante uso correto
4. **Descoberta**: Autocomplete mostra todas as opções
5. **Documentação**: Constantes auto-documentadas
6. **Testabilidade**: Fácil mockar em testes

## 🚀 Boas Práticas

1. **Sempre use constantes** ao invés de valores hardcoded
2. **Não duplique valores** - importe das constantes
3. **Use `as const`** para garantir readonly
4. **Agrupe constantes relacionadas** em objetos
5. **Documente constantes complexas** com comentários
6. **Mantenha organizado** por categoria

## 🔄 Atualizando Constantes

Quando adicionar novas constantes:
1. Adicione na categoria apropriada em `constants.ts`
2. Use `as const` para garantir imutabilidade
3. Adicione exemplo neste README se necessário
4. Atualize imports em arquivos que precisam

## ⚠️ Importante

- **NUNCA modifique constantes em runtime**
- **Use UPPER_CASE** para constantes top-level
- **Use camelCase** para propriedades aninhadas
- **Evite valores mágicos** no código - use constantes
