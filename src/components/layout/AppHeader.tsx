import { ChevronRight, Home, Bell, Search, Moon, Sun } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mapeamento de rotas para nomes amigáveis
const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  brands: "Marcas",
  analytics: "Analytics",
  scores: "GEO Escore",
  "seo-scores": "SEO Escore",
  "seo-metrics": "Métricas SEO",
  "geo-metrics": "Métricas GEO",
  comparison: "Comparação",
  "url-analysis": "Análise de URL",
  insights: "Insights IA",
  "insights-ia": "Insights IA",
  "llm-mentions": "Menções LLM",
  reports: "Relatórios",
  alerts: "Alertas",
  automation: "Automações",
  "cron-jobs": "Cron Jobs",
  nucleus: "Nucleus Center",
  "igo-dashboard": "IGO Dashboard",
  "igo-observability": "IGO Observability",
  "algorithmic-governance": "Governança Algorítmica",
  "scientific-reports": "Relatórios Científicos",
  subscription: "Assinatura",
  "google-setup": "Setup Google",
  kpis: "KPIs",
  "system-health": "System Health",
  "connections-test": "Teste de Conexões",
  profile: "Perfil",
  documentation: "Documentação",
  admin: "Painel Admin",
};

export function AppHeader() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Gerar breadcrumbs a partir da rota atual
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isLast = index === pathSegments.length - 1;
    
    return { path, name, isLast };
  });

  return (
    <header className="h-14 border-b border-border/40 flex items-center gap-4 px-4 bg-background/95 backdrop-blur-xl sticky top-0 z-20">
      {/* Sidebar Toggle */}
      <SidebarTrigger className="shrink-0" />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              to="/dashboard" 
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Dashboard</TooltipContent>
        </Tooltip>
        
        {breadcrumbs.length > 0 && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        )}
        
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-1 min-w-0">
            {crumb.isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {crumb.name}
              </span>
            ) : (
              <>
                <Link 
                  to={crumb.path}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                >
                  {crumb.name}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </>
            )}
          </div>
        ))}
      </nav>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search (desktop only) */}
        <div className="hidden lg:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="w-48 pl-9 h-9 bg-muted/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
        
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </TooltipContent>
        </Tooltip>
        
        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" asChild>
              <Link to="/alerts">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full animate-pulse" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Alertas</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
