# 🎣 Custom Hooks

Biblioteca de hooks reutilizáveis para a aplicação Teia GEO.

## 📚 Hooks Disponíveis

### 1. `useMediaQuery`
Detecta media queries e breakpoints de forma reativa.

```tsx
import { useMediaQuery, useIsMobile, useIsDesktop } from '@/hooks';

// Uso customizado
const isTabletOrSmaller = useMediaQuery('(max-width: 1023px)');
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

// Presets convenientes
const isMobile = useIsMobile();      // max-width: 768px
const isTablet = useIsTablet();      // 769px - 1023px
const isDesktop = useIsDesktop();    // min-width: 1024px

return (
  <div>
    {isMobile ? <MobileNav /> : <DesktopNav />}
  </div>
);
```

**Casos de uso:**
- Renderização condicional mobile/desktop
- Layout responsivo
- Menus adaptativos
- Sidebars collapsible

---

### 2. `useLocalStorage`
Persiste estado no localStorage com sincronização automática.

```tsx
import { useLocalStorage } from '@/hooks';

const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
const [settings, setSettings] = useLocalStorage('user-settings', {
  notifications: true,
  language: 'pt-BR'
});

return (
  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
    Alternar tema
  </button>
);
```

**Casos de uso:**
- Preferências do usuário
- Estado de UI (sidebar aberto/fechado)
- Filtros e ordenação
- Cache de formulários
- Modo escuro/claro

---

### 3. `useClickOutside`
Detecta cliques fora de um elemento (útil para dropdowns e modals).

```tsx
import { useClickOutside, useOnClickOutside } from '@/hooks';

// Opção 1: Hook cria o ref
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useClickOutside(() => setIsOpen(false));

return (
  <div ref={dropdownRef}>
    <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
    {isOpen && <Dropdown />}
  </div>
);

// Opção 2: Usar ref existente
const menuRef = useRef<HTMLDivElement>(null);
useOnClickOutside(menuRef, () => setMenuOpen(false));

return <div ref={menuRef}>...</div>;
```

**Casos de uso:**
- Dropdowns
- Context menus
- Modals
- Popovers
- Tooltips
- Mobile menus

**Bonus:** Também fecha com tecla `Escape`!

---

### 4. `useAsync`
Gerencia estados de operações assíncronas (loading, error, data).

```tsx
import { useAsync, useFetch } from '@/hooks';

// Opção 1: Execução manual
const { data, loading, error, execute, reset } = useAsync(
  async (brandId: string) => {
    const res = await fetch(`/api/brands/${brandId}`);
    return res.json();
  }
);

return (
  <>
    <button onClick={() => execute('123')} disabled={loading}>
      Carregar
    </button>
    {loading && <Spinner />}
    {error && <Error message={error.message} />}
    {data && <BrandDetails brand={data} />}
  </>
);

// Opção 2: Execução automática (useFetch)
const { data, loading, error, refetch } = useFetch(
  () => fetch('/api/brands').then(r => r.json()),
  [] // deps array
);

return (
  <>
    {loading && <Spinner />}
    {error && <Error />}
    {data && <BrandList brands={data} />}
    <button onClick={refetch}>Atualizar</button>
  </>
);
```

**Casos de uso:**
- API calls
- Form submissions
- Data fetching
- Upload de arquivos
- Operações com retry
- Loading states consistentes

---

## 🎯 Hooks Existentes (Re-exportados)

Todos os hooks existentes também estão disponíveis:

```tsx
import { 
  useDebounce,           // Debounce de valores
  usePagination,         // Paginação de listas
  useRetry,              // Retry automático
  useSubscriptionLimits, // Limites de subscription
  useDashboardConfig,    // Config do dashboard
  useToast               // Toast notifications
} from '@/hooks';
```

---

## 📦 Importação

```tsx
// ✅ Importar de @/hooks (recomendado)
import { useMediaQuery, useLocalStorage, useClickOutside } from '@/hooks';

// ❌ Evitar importação direta
import { useMediaQuery } from '@/hooks/useMediaQuery';
```

---

## 🔧 TypeScript

Todos os hooks são totalmente tipados com TypeScript:

```tsx
import { UseAsyncReturn } from '@/hooks';

// Types são exportados automaticamente
const asyncState: UseAsyncReturn<Brand> = useAsync(fetchBrand);

// Generic types funcionam
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

---

## 🎨 Padrões de Uso

### Combinando Hooks

```tsx
import { useMediaQuery, useLocalStorage, useClickOutside } from '@/hooks';

function Sidebar() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useLocalStorage('sidebar-open', true);
  const sidebarRef = useClickOutside(() => isMobile && setIsOpen(false));

  return (
    <div ref={sidebarRef} className={isOpen ? 'open' : 'closed'}>
      {/* Sidebar content */}
    </div>
  );
}
```

### Com React Query

```tsx
import { useMediaQuery } from '@/hooks';
import { useQuery } from '@tanstack/react-query';

function BrandList() {
  const isMobile = useIsMobile();
  const { data, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands
  });

  return (
    <div className={isMobile ? 'grid-cols-1' : 'grid-cols-3'}>
      {/* ... */}
    </div>
  );
}
```

---

## 📊 Performance

Todos os hooks são otimizados para performance:

- ✅ Memoização com `useCallback`
- ✅ Cleanup automático de event listeners
- ✅ Dependências mínimas
- ✅ Re-renders otimizados
- ✅ TypeScript strict mode

---

## 🧪 Testing

Os hooks podem ser testados com `@testing-library/react-hooks`:

```tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useLocalStorage } from '@/hooks';

test('useLocalStorage persists value', () => {
  const { result } = renderHook(() => 
    useLocalStorage('test-key', 'initial')
  );

  act(() => {
    result.current[1]('updated');
  });

  expect(result.current[0]).toBe('updated');
  expect(localStorage.getItem('test-key')).toBe('"updated"');
});
```

---

## 💡 Contribuindo

Ao adicionar novos hooks:

1. Criar arquivo em `src/hooks/useNomeDoHook.ts`
2. Adicionar JSDoc completo com exemplos
3. Exportar no `src/hooks/index.ts`
4. Adicionar documentação neste README
5. Adicionar tipos TypeScript
6. Adicionar testes (opcional mas recomendado)

---

**Última atualização:** 2025-11-07  
**Total de hooks:** 12 (4 novos + 8 existentes)
