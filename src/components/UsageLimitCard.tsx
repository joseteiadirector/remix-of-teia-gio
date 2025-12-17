import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crown, TrendingUp } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function UsageLimitCard() {
  const { limits, usage, brandsUsagePercent, analysesUsagePercent, isSubscribed } = useSubscriptionLimits();
  const navigate = useNavigate();

  const isNearLimit = brandsUsagePercent > 80 || analysesUsagePercent > 80;
  const isAtLimit = brandsUsagePercent >= 100 || analysesUsagePercent >= 100;

  return (
    <Card className={isAtLimit ? "border-destructive" : isNearLimit ? "border-warning" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Plano {limits.name}
            </CardTitle>
            <CardDescription>Uso do mês atual</CardDescription>
          </div>
          {!isSubscribed && (
            <Button size="sm" onClick={() => navigate("/subscription")}>
              Fazer Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brands Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Marcas</span>
            <span className="text-muted-foreground">
              {usage.brands} / {limits.maxBrands === -1 ? "∞" : limits.maxBrands}
            </span>
          </div>
          {limits.maxBrands !== -1 && (
            <Progress 
              value={brandsUsagePercent} 
              className={brandsUsagePercent >= 100 ? "bg-destructive/20" : ""}
            />
          )}
        </div>

        {/* Analyses Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Análises</span>
            <span className="text-muted-foreground">
              {usage.analyses} / {limits.maxAnalysesPerMonth === -1 ? "∞" : limits.maxAnalysesPerMonth}
            </span>
          </div>
          {limits.maxAnalysesPerMonth !== -1 && (
            <Progress 
              value={analysesUsagePercent}
              className={analysesUsagePercent >= 100 ? "bg-destructive/20" : ""}
            />
          )}
        </div>

        {/* Features */}
        <div className="space-y-1 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={limits.hasAI ? "default" : "secondary"} className="text-xs">
              {limits.hasAI ? "✓" : "✗"} IA Avançada
            </Badge>
            <Badge variant={limits.hasAPI ? "default" : "secondary"} className="text-xs">
              {limits.hasAPI ? "✓" : "✗"} API Access
            </Badge>
          </div>
        </div>

        {/* Warning */}
        {isAtLimit && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Limite atingido!</p>
              <p className="text-muted-foreground">Faça upgrade para continuar usando.</p>
            </div>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
            <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
            <div>
              <p className="font-medium">Próximo do limite</p>
              <p className="text-muted-foreground">Considere fazer upgrade do seu plano.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}