import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, RotateCcw, Home, Sparkles } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  widgets: Record<string, boolean>;
  widgetNames: Record<string, string>;
  onToggleWidget: (widgetId: string) => void;
  onReset: () => void;
}

export function DashboardHeader({ 
  widgets, 
  widgetNames, 
  onToggleWidget, 
  onReset 
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs - hidden on mobile for space */}
      <div className="hidden sm:block animate-fade-in">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-tight">
                <span className="bg-gradient-to-r from-primary via-purple-400 to-secondary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Dashboard Principal
                </span>
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Live</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Visão geral de todas as métricas e indicadores em tempo real
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className="relative text-xs sm:text-sm whitespace-nowrap bg-green-500/10 border-green-500/30 text-green-400 px-3 py-1.5"
              aria-label="Status do sistema: Tempo Real Ativo"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Tempo Real Ativo
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 bg-card/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                  aria-label="Configurações do Dashboard"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Configurar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl border-border/50">
                <DropdownMenuLabel className="text-muted-foreground">Widgets Visíveis</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                {Object.entries(widgets).map(([key, enabled]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={enabled}
                    onCheckedChange={() => onToggleWidget(key)}
                    aria-label={`${enabled ? 'Ocultar' : 'Mostrar'} widget ${widgetNames[key]}`}
                    className="cursor-pointer"
                  >
                    {widgetNames[key]}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem 
                  onClick={onReset}
                  aria-label="Restaurar configurações padrão do dashboard"
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Restaurar Padrão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}