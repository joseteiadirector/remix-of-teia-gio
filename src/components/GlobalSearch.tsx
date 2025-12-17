import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Target,
  FileText,
  Bell,
  Search,
  Settings,
} from "lucide-react";

const searchItems = [
  {
    group: "Navegação",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", keywords: ["inicio", "home", "painel"] },
      { icon: BarChart3, label: "Analytics", path: "/analytics", keywords: ["sincronização", "dados", "ga4"] },
      { icon: Package, label: "Marcas", path: "/brands", keywords: ["gerenciar", "adicionar", "domínio"] },
      { icon: Target, label: "Scores GEO", path: "/scores", keywords: ["pontuação", "pilares", "métricas"] },
      { icon: FileText, label: "Relatórios", path: "/reports", keywords: ["exportar", "pdf", "excel"] },
      { icon: Bell, label: "Alertas", path: "/alerts", keywords: ["notificações", "email", "configurar"] },
    ],
  },
  {
    group: "Ações Rápidas",
    items: [
      { icon: Search, label: "Buscar marcas", action: "search-brands", keywords: ["procurar", "encontrar"] },
      { icon: Settings, label: "Configurações", action: "settings", keywords: ["ajustes", "preferências"] },
    ],
  },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (item: any) => {
    setOpen(false);
    if (item.path) {
      navigate(item.path);
    } else if (item.action === "search-brands") {
      navigate("/brands");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar páginas, ações..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {searchItems.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.label}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
