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
  ChevronRight,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardPremiumHeaderProps {
  className?: string;
}

export function DashboardPremiumHeader({ className }: DashboardPremiumHeaderProps) {
  const { brands, selectedBrandId, setSelectedBrandId, selectedBrand, isLoading } = useBrand();

  return (
    <div className={cn("space-y-8", className)}>
      {/* Platinum Header Card */}
      <div className="relative overflow-hidden rounded-3xl">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/20 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
        
        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-card/60 backdrop-blur-xl" />
        
        {/* Floating Orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Brand Selector & Title */}
            <div className="space-y-6">
              {/* Brand Selector - Premium Style */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <Select
                  value={selectedBrandId || undefined}
                  onValueChange={setSelectedBrandId}
                  disabled={isLoading}
                >
                  <SelectTrigger className="relative min-w-[340px] h-16 bg-card/90 backdrop-blur-sm border-0 ring-1 ring-border/50 hover:ring-primary/50 rounded-xl transition-all duration-300 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-xl blur-sm opacity-50" />
                        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold">Marca Ativa</span>
                        <SelectValue placeholder="Selecionar marca" className="text-lg font-bold" />
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-2xl border-border/30 rounded-xl shadow-2xl">
                    {brands.map((brand) => (
                      <SelectItem 
                        key={brand.id} 
                        value={brand.id}
                        className="cursor-pointer hover:bg-primary/10 rounded-lg m-1 transition-colors"
                      >
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1.5 rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-semibold">{brand.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{brand.domain}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title with Gradient */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-foreground via-primary/90 to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                      Bem-vindo ao Painel
                    </span>
                  </h1>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-md opacity-50 animate-pulse-glow" />
                    <div className="relative p-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
                {selectedBrand && (
                  <p className="text-muted-foreground flex items-center gap-2 text-lg">
                    Monitorando
                    <span className="font-bold text-foreground bg-gradient-to-r from-primary/10 to-secondary/10 px-3 py-1 rounded-lg border border-primary/20">
                      {selectedBrand.name}
                    </span>
                    <ChevronRight className="h-5 w-5 text-primary" />
                    <span className="text-sm bg-muted/50 backdrop-blur-sm px-3 py-1 rounded-lg border border-border/30">
                      {selectedBrand.domain}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Premium Badge */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
                <Badge 
                  className="relative px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50 text-amber-300 gap-2 rounded-full"
                >
                  <Crown className="h-4 w-4" />
                  <span className="font-semibold">Platinum</span>
                </Badge>
              </div>

              {/* Sync Status */}
              <Badge 
                variant="outline" 
                className="px-4 py-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 gap-2 rounded-full backdrop-blur-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="font-medium">Sincronizado</span>
              </Badge>
              
              {/* Period Selector */}
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 hover:border-primary/30 rounded-full px-5 h-10 transition-all duration-300"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Últimos 30 dias</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </div>
  );
}