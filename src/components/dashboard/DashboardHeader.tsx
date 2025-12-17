import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, RotateCcw, Home } from "lucide-react";
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
    <>
      {/* Breadcrumbs - hidden on mobile for space */}
      <div className="hidden sm:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard Principal
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Visão geral de todas as métricas e indicadores
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs sm:text-sm whitespace-nowrap"
              aria-label="Status do sistema: Tempo Real Ativo"
            >
              Tempo Real Ativo
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  aria-label="Configurações do Dashboard"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline ml-2">Configurar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Widgets Visíveis</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(widgets).map(([key, enabled]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={enabled}
                    onCheckedChange={() => onToggleWidget(key)}
                    aria-label={`${enabled ? 'Ocultar' : 'Mostrar'} widget ${widgetNames[key]}`}
                  >
                    {widgetNames[key]}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onReset}
                  aria-label="Restaurar configurações padrão do dashboard"
                >
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Restaurar Padrão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
