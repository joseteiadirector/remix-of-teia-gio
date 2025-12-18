import { 
  Building2, 
  Zap, 
  Database, 
  Activity, 
  BarChart3, 
  FileText, 
  Bell, 
  LogOut, 
  GitCompare, 
  Brain, 
  Sparkles, 
  MessageSquare, 
  CreditCard, 
  BookOpen, 
  TrendingUp, 
  ChevronRight, 
  Target, 
  Settings, 
  Search, 
  Bot, 
  Clock, 
  Network, 
  Shield, 
  User,
  Gem,
  Globe,
  LayoutDashboard,
  LineChart,
  Lightbulb,
  Boxes,
  Workflow,
  Gauge,
  Link2,
  MessagesSquare,
  Scale,
  Building,
  Wallet,
  HeartPulse,
  Plug2,
  ChevronLeft
} from "lucide-react";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Categorias organizadas logicamente com ícones premium
const analyticsItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "KPIs", url: "/kpis", icon: Gauge },
  { title: "Insights IA", url: "/insights", icon: Lightbulb },
  { title: "Alertas", url: "/alerts", icon: Bell },
  { title: "Automações", url: "/automation", icon: Workflow },
  { title: "Cron Jobs", url: "/cron-jobs", icon: Clock },
  { title: "Analytics Sync", url: "/analytics", icon: LineChart },
];

const seoGeoItems = [
  { title: "IGO Dashboard", url: "/igo-dashboard", icon: Network },
  { title: "IGO Observability", url: "/igo-observability", icon: Globe },
  { title: "Nucleus Center", url: "/nucleus", icon: Boxes },
  { title: "Governança Algorítmica", url: "/algorithmic-governance", icon: Scale },
  { title: "Relatórios Científicos", url: "/scientific-reports", icon: FileText },
  { title: "GEO Escore", url: "/scores", icon: BarChart3 },
  { title: "SEO Escore", url: "/seo-scores", icon: TrendingUp },
  { title: "Métricas GEO", url: "/geo-metrics", icon: Globe },
  { title: "Métricas SEO", url: "/seo-metrics", icon: Activity },
  { title: "Análise de URL", url: "/url-analysis", icon: Link2 },
  { title: "Menções LLM", url: "/llm-mentions", icon: MessagesSquare },
  { title: "Comparação", url: "/comparison", icon: GitCompare },
];

const settingsItems = [
  { title: "Marcas", url: "/brands", icon: Building },
  { title: "Assinatura", url: "/subscription", icon: Wallet },
  { title: "System Health", url: "/system-health", icon: HeartPulse },
  { title: "Teste de Conexões LLM", url: "/connections-test", icon: Plug2 },
  { title: "Painel Admin", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  
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
    cn(
      "group/item relative transition-all duration-300",
      isActive 
        ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary font-medium border-l-2 border-primary" 
        : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-transparent text-muted-foreground hover:text-foreground"
    );

  // Componente de item de menu com tooltip quando colapsado
  const MenuItem = ({ item, showIcon = true }: { item: typeof analyticsItems[0], showIcon?: boolean }) => {
    const content = (
      <SidebarMenuButton asChild>
        <NavLink to={item.url} className={getNavCls}>
          <item.icon className="h-4 w-4 opacity-70 group-hover/item:opacity-100 transition-opacity shrink-0" />
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-border/50 bg-gradient-to-b from-background via-background to-muted/20"
    >
      <SidebarContent className={cn("px-2", isCollapsed && "px-1")}>
        {/* Header Premium */}
        <div className={cn("px-4 py-6 mb-2", isCollapsed && "px-2 py-4")}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-xl blur-sm opacity-75" />
              <div className={cn(
                "relative bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl border border-primary/30",
                isCollapsed ? "p-2" : "p-2.5"
              )}>
                <Building2 className={cn("text-primary", isCollapsed ? "h-5 w-5" : "h-6 w-6")} />
              </div>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Teia GEO
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                  Enterprise Platform
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Início - Premium */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <MenuItem item={{ title: "Início", url: "/", icon: Building2 }} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics */}
        <Collapsible open={!isCollapsed && analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <SidebarGroup>
            {isCollapsed ? (
              // Modo colapsado: mostrar apenas ícones com tooltips
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {analyticsItems.slice(0, 3).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItem item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 transition-all group/label">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover/label:from-blue-500/30 group-hover/label:to-cyan-500/30 transition-all">
                      <LineChart className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="font-semibold text-foreground/80">Analytics</span>
                    <ChevronRight className={cn(
                      "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-300",
                      analyticsOpen && "rotate-90"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-accordion-down">
                  <SidebarGroupContent className="pl-2 mt-1">
                    <SidebarMenu className="space-y-0.5">
                      {analyticsItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <MenuItem item={item} />
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </>
            )}
          </SidebarGroup>
        </Collapsible>

        {/* SEO & GEO */}
        <Collapsible open={!isCollapsed && seoGeoOpen} onOpenChange={setSeoGeoOpen}>
          <SidebarGroup>
            {isCollapsed ? (
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {seoGeoItems.slice(0, 4).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItem item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 transition-all group/label">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover/label:from-emerald-500/30 group-hover/label:to-teal-500/30 transition-all">
                      <Search className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="font-semibold text-foreground/80">SEO & GEO</span>
                    <ChevronRight className={cn(
                      "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-300",
                      seoGeoOpen && "rotate-90"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-accordion-down">
                  <SidebarGroupContent className="pl-2 mt-1">
                    <SidebarMenu className="space-y-0.5">
                      {seoGeoItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <MenuItem item={item} />
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </>
            )}
          </SidebarGroup>
        </Collapsible>

        {/* Configurações */}
        <Collapsible open={!isCollapsed && settingsOpen} onOpenChange={setSettingsOpen}>
          <SidebarGroup>
            {isCollapsed ? (
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {settingsItems.slice(0, 2).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItem item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 transition-all group/label">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover/label:from-purple-500/30 group-hover/label:to-pink-500/30 transition-all">
                      <Settings className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="font-semibold text-foreground/80">Configurações</span>
                    <ChevronRight className={cn(
                      "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-300",
                      settingsOpen && "rotate-90"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-accordion-down">
                  <SidebarGroupContent className="pl-2 mt-1">
                    <SidebarMenu className="space-y-0.5">
                      {settingsItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <MenuItem item={item} />
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </>
            )}
          </SidebarGroup>
        </Collapsible>

        {/* Documentação */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <MenuItem item={{ title: "Documentação", url: "/documentation", icon: BookOpen }} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {user && (
        <SidebarFooter className={cn(
          "border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {isCollapsed ? (
            // Modo colapsado: apenas ícone com tooltip
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink 
                  to="/profile" 
                  className={({ isActive }) => 
                    cn(
                      "flex items-center justify-center p-2 rounded-lg transition-all",
                      isActive 
                        ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  <User className="h-5 w-5 text-primary" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{user.email}</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => 
                  cn(
                    "flex items-center gap-3 text-sm p-3 rounded-xl transition-all",
                    isActive 
                      ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border border-primary/30" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate font-medium">{user.email}</span>
              </NavLink>
              <Button 
                variant="outline" 
                onClick={signOut} 
                className="w-full mt-2 border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}