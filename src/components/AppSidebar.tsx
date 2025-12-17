import { Home, Zap, Database, Activity, BarChart3, FileText, Bell, LogOut, GitCompare, Brain, Sparkles, MessageSquare, Key, CreditCard, BookOpen, Plug, TrendingUp, ChevronRight, Target, Settings, Search, Bot, Clock, Network, Shield, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Categorias organizadas logicamente
const analyticsItems = [
  { title: "Dashboard", url: "/dashboard", icon: Activity },
  { title: "KPIs", url: "/kpis", icon: Target },
  { title: "Insights IA", url: "/insights", icon: Brain },
  { title: "Alertas", url: "/alerts", icon: Bell },
  { title: "Automações", url: "/automation", icon: Bot },
  { title: "Cron Jobs", url: "/cron-jobs", icon: Clock },
  { title: "Analytics Sync", url: "/analytics", icon: Activity },
];

const seoGeoItems = [
  { title: "IGO Dashboard", url: "/igo-dashboard", icon: Network },
  { title: "IGO Observability", url: "/igo-observability", icon: Brain },
  { title: "Nucleus Center", url: "/nucleus", icon: Brain },
  { title: "Governança Algorítmica", url: "/algorithmic-governance", icon: Shield },
  { title: "Relatórios Científicos", url: "/scientific-reports", icon: FileText },
  { title: "GEO Escore", url: "/scores", icon: BarChart3 },
  { title: "SEO Escore", url: "/seo-scores", icon: Activity },
  { title: "Métricas GEO", url: "/geo-metrics", icon: Brain },
  { title: "Métricas SEO", url: "/seo-metrics", icon: TrendingUp },
  { title: "Análise de URL", url: "/url-analysis", icon: Sparkles },
  { title: "Menções LLM", url: "/llm-mentions", icon: MessageSquare },
  { title: "Comparação", url: "/comparison", icon: GitCompare },
];

const settingsItems = [
  { title: "Marcas", url: "/brands", icon: Database },
  { title: "Assinatura", url: "/subscription", icon: CreditCard },
  { title: "System Health", url: "/system-health", icon: Activity },
  { title: "Teste de Conexões LLM", url: "/connections-test", icon: Zap },
  { title: "⚙️ Painel Admin", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  // Persist collapsible states
  const [analyticsOpen, setAnalyticsOpen] = useLocalStorage(
    'sidebar-analytics-open',
    location.pathname.includes('/dashboard') ||
    location.pathname.includes('/kpis') ||
    location.pathname.includes('/insights') ||
    location.pathname.includes('/alerts') ||
    location.pathname.includes('/automation') ||
    location.pathname.includes('/analytics')
  );
  const [seoGeoOpen, setSeoGeoOpen] = useLocalStorage(
    'sidebar-seogeo-open',
    location.pathname.includes('/scores') || 
    location.pathname.includes('/metrics') || 
    location.pathname.includes('/analysis') ||
    location.pathname.includes('/mentions') ||
    location.pathname.includes('/comparison')
  );
  const [settingsOpen, setSettingsOpen] = useLocalStorage(
    'sidebar-settings-open',
    location.pathname.includes('/brands') ||
    location.pathname.includes('/api') ||
    location.pathname.includes('/subscription') ||
    location.pathname.includes('/test')
  );

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar>
      <SidebarContent>
        {/* Início - Sempre visível */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className={getNavCls}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>🏠 Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 📊 Analytics */}
        <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 flex items-center">
                📊 Analytics
                <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${analyticsOpen ? 'rotate-90' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {analyticsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* 🔍 SEO & GEO */}
        <Collapsible open={seoGeoOpen} onOpenChange={setSeoGeoOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 flex items-center">
                <Search className="mr-2 h-4 w-4" />
                SEO & GEO
                <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${seoGeoOpen ? 'rotate-90' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {seoGeoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* ⚙️ Configurações */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
                <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${settingsOpen ? 'rotate-90' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Documentação - Sempre visível */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/documentation" className={getNavCls}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>📚 Documentação</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {user && (
        <SidebarFooter className="p-4 border-t space-y-2">
          <NavLink 
            to="/profile" 
            className={({ isActive }) => 
              `flex items-center gap-2 text-sm p-2 rounded-md transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'
              }`
            }
          >
            <User className="h-4 w-4" />
            <span className="truncate">{user.email}</span>
          </NavLink>
          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}