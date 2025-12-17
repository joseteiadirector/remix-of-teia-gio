import { useBrand } from "@/contexts/BrandContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Calendar,
  Building2,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardPremiumHeaderProps {
  className?: string;
}

export function DashboardPremiumHeader({ className }: DashboardPremiumHeaderProps) {
  const { brands, selectedBrandId, setSelectedBrandId, selectedBrand, isLoading } = useBrand();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand Selector */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-xl blur-sm opacity-75" />
            <Select
              value={selectedBrandId || undefined}
              onValueChange={setSelectedBrandId}
              disabled={isLoading}
            >
              <SelectTrigger className="relative min-w-[320px] h-14 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Marca</span>
                    <SelectValue placeholder="Selecionar marca" className="text-base font-semibold" />
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {brands.map((brand) => (
                  <SelectItem 
                    key={brand.id} 
                    value={brand.id}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{brand.name}</span>
                      <span className="text-xs text-muted-foreground">{brand.domain}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status & Period */}
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="px-3 py-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Sincronizado
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 bg-card/50 border-border/50 hover:bg-primary/10 hover:border-primary/30"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Últimos 30 dias</span>
          </Button>
        </div>
      </div>

      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                Olá, bem-vindo
              </span>
            </h1>
            <div className="p-1.5 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          {selectedBrand && (
            <p className="text-muted-foreground flex items-center gap-2">
              Visualizando dados de
              <span className="font-semibold text-foreground">{selectedBrand.name}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-xs bg-muted px-2 py-0.5 rounded">{selectedBrand.domain}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}