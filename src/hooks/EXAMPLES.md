# 🎯 Exemplos Práticos de Uso dos Hooks

## 1. Sidebar Responsivo com Persistência

```tsx
import { useMediaQuery, useLocalStorage } from '@/hooks';

function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isOpen, setIsOpen] = useLocalStorage('sidebar-open', true);

  // Auto-close no mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [isMobile]);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Fechar' : 'Abrir'}
      </button>
      {/* Conteúdo do sidebar */}
    </aside>
  );
}
```

---

## 2. Dropdown com Click Outside

```tsx
import { useClickOutside } from '@/hooks';

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside(() => setIsOpen(false));

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        Menu
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          <a href="/profile">Perfil</a>
          <a href="/settings">Configurações</a>
          <button onClick={handleLogout}>Sair</button>
        </div>
      )}
    </div>
  );
}
```

---

## 3. Tema Persistido

```tsx
import { useLocalStorage } from '@/hooks';

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
```

---

## 4. Loading de Dados com useAsync

```tsx
import { useAsync } from '@/hooks';
import { toast } from 'sonner';

function BrandDetails({ brandId }: { brandId: string }) {
  const { data, loading, error, execute } = useAsync(
    async (id: string) => {
      const res = await fetch(`/api/brands/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  );

  useEffect(() => {
    execute(brandId);
  }, [brandId]);

  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar marca');
    }
  }, [error]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

---

## 5. Form com Auto-save

```tsx
import { useLocalStorage, useDebounce } from '@/hooks';

function NoteEditor() {
  const [note, setNote] = useLocalStorage('draft-note', '');
  const debouncedNote = useDebounce(note, 1000);

  useEffect(() => {
    if (debouncedNote) {
      console.log('Auto-saved:', debouncedNote);
      // Salvar no backend
    }
  }, [debouncedNote]);

  return (
    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Digite sua nota..."
    />
  );
}
```

---

## 6. Modal com Múltiplas Features

```tsx
import { useClickOutside, useMediaQuery } from '@/hooks';

function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useClickOutside(onClose);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div 
        ref={modalRef} 
        className={`modal ${isMobile ? 'modal-mobile' : 'modal-desktop'}`}
      >
        <button onClick={onClose} className="modal-close">×</button>
        {children}
      </div>
    </div>
  );
}
```

---

## 7. Search com Filtros Persistidos

```tsx
import { useLocalStorage, useDebounce } from '@/hooks';
import { useFetch } from '@/hooks';

function BrandSearch() {
  const [search, setSearch] = useLocalStorage('brand-search', '');
  const [filters, setFilters] = useLocalStorage('brand-filters', {
    category: 'all',
    status: 'active'
  });
  
  const debouncedSearch = useDebounce(search, 500);

  const { data, loading, refetch } = useFetch(
    () => fetchBrands(debouncedSearch, filters),
    [debouncedSearch, filters]
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar marcas..."
      />
      
      <select
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
      >
        <option value="all">Todas</option>
        <option value="tech">Tech</option>
        <option value="food">Food</option>
      </select>

      {loading && <Spinner />}
      {data && <BrandList brands={data} />}
    </div>
  );
}
```

---

## 8. Navigation Menu Responsivo

```tsx
import { useMediaQuery, useClickOutside } from '@/hooks';

function Navigation() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useClickOutside(() => setMobileMenuOpen(false));

  if (isMobile) {
    return (
      <nav>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
        
        {mobileMenuOpen && (
          <div ref={menuRef} className="mobile-menu">
            <a href="/">Home</a>
            <a href="/about">Sobre</a>
            <a href="/contact">Contato</a>
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="desktop-menu">
      <a href="/">Home</a>
      <a href="/about">Sobre</a>
      <a href="/contact">Contato</a>
    </nav>
  );
}
```

---

## 9. User Preferences Panel

```tsx
import { useLocalStorage } from '@/hooks';

function PreferencesPanel() {
  const [preferences, setPreferences] = useLocalStorage('user-preferences', {
    notifications: true,
    emailDigest: 'weekly',
    language: 'pt-BR',
    theme: 'auto'
  });

  const updatePreference = (key: string, value: any) => {
    setPreferences({ ...preferences, [key]: value });
  };

  return (
    <div>
      <h2>Preferências</h2>
      
      <label>
        <input
          type="checkbox"
          checked={preferences.notifications}
          onChange={(e) => updatePreference('notifications', e.target.checked)}
        />
        Notificações
      </label>

      <select
        value={preferences.emailDigest}
        onChange={(e) => updatePreference('emailDigest', e.target.value)}
      >
        <option value="daily">Diário</option>
        <option value="weekly">Semanal</option>
        <option value="never">Nunca</option>
      </select>

      <select
        value={preferences.language}
        onChange={(e) => updatePreference('language', e.target.value)}
      >
        <option value="pt-BR">Português</option>
        <option value="en-US">English</option>
        <option value="es-ES">Español</option>
      </select>
    </div>
  );
}
```

---

## 10. Dashboard com Widgets Customizáveis

```tsx
import { useLocalStorage } from '@/hooks';

interface Widget {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

function CustomizableDashboard() {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>('dashboard-widgets', [
    { id: 'sales', title: 'Vendas', visible: true, order: 0 },
    { id: 'users', title: 'Usuários', visible: true, order: 1 },
    { id: 'revenue', title: 'Receita', visible: true, order: 2 },
  ]);

  const toggleWidget = (id: string) => {
    setWidgets(
      widgets.map(w => 
        w.id === id ? { ...w, visible: !w.visible } : w
      )
    );
  };

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="widget-controls">
        {widgets.map(widget => (
          <label key={widget.id}>
            <input
              type="checkbox"
              checked={widget.visible}
              onChange={() => toggleWidget(widget.id)}
            />
            {widget.title}
          </label>
        ))}
      </div>

      <div className="dashboard-grid">
        {visibleWidgets.map(widget => (
          <Widget key={widget.id} {...widget} />
        ))}
      </div>
    </div>
  );
}
```

---

## 💡 Dicas de Combinação

### Hook Stack Comum:

```tsx
// Dashboard completo com todas features
function Dashboard() {
  const isMobile = useIsMobile();
  const [layout, setLayout] = useLocalStorage('dashboard-layout', 'grid');
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebar', !isMobile);
  const { data, loading, refetch } = useFetch(fetchDashboardData, []);

  return (
    <div className={`dashboard ${layout}`}>
      {sidebarOpen && <Sidebar />}
      {/* ... */}
    </div>
  );
}
```

---

**Última atualização:** 2025-11-07  
**Total de exemplos:** 10 casos práticos
