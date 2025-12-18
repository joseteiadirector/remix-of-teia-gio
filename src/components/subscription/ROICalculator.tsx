import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  Shield, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Target,
  Sparkles
} from "lucide-react";

interface PlanROI {
  plan: string;
  monthlyPrice: number;
  annualCost: number;
  potentialSavings: number;
  roi: number;
  paybackMonths: number;
}

const PLAN_PRICES: Record<string, number> = {
  starter: 997,
  professional: 2997,
  agency: 9997,
  enterprise: 14997
};

const ROI_FACTORS = {
  // Custo médio de uma crise de reputação por alucinação de IA (fonte: estimativa B2B)
  hallucinationCrisisCost: 150000,
  // Probabilidade de crise sem monitoramento (anual)
  crisisProbabilityWithout: 0.35,
  // Redução de probabilidade com monitoramento
  crisisReductionFactor: 0.85,
  // Horas economizadas por mês em monitoramento manual
  hoursSavedPerMonth: 40,
  // Custo médio hora de analista
  analystHourlyCost: 150,
  // Valor de inteligência competitiva mensal
  competitiveIntelligenceValue: 5000,
  // Multiplicador por marca adicional
  brandMultiplier: 0.7
};

export default function ROICalculator() {
  const [brands, setBrands] = useState(3);
  const [monthlyRevenue, setMonthlyRevenue] = useState(500000);
  const [reputationImportance, setReputationImportance] = useState(70);

  const calculations = useMemo(() => {
    const brandFactor = 1 + (brands - 1) * ROI_FACTORS.brandMultiplier;
    const revenueFactor = monthlyRevenue / 500000;
    const importanceFactor = reputationImportance / 100;

    // Economia em prevenção de crises
    const crisisSavings = 
      ROI_FACTORS.hallucinationCrisisCost * 
      ROI_FACTORS.crisisProbabilityWithout * 
      ROI_FACTORS.crisisReductionFactor * 
      brandFactor * 
      importanceFactor;

    // Economia em horas de trabalho
    const laborSavings = 
      ROI_FACTORS.hoursSavedPerMonth * 
      ROI_FACTORS.analystHourlyCost * 
      12 * 
      brandFactor;

    // Valor de inteligência competitiva
    const intelligenceValue = 
      ROI_FACTORS.competitiveIntelligenceValue * 
      12 * 
      revenueFactor * 
      brandFactor;

    // Total de valor anual gerado
    const totalAnnualValue = crisisSavings + laborSavings + intelligenceValue;

    // Calcular ROI para cada plano
    const planROIs: PlanROI[] = Object.entries(PLAN_PRICES).map(([plan, price]) => {
      const annualCost = price * 12;
      const potentialSavings = totalAnnualValue;
      const netValue = potentialSavings - annualCost;
      const roi = ((netValue / annualCost) * 100);
      const paybackMonths = annualCost / (potentialSavings / 12);

      return {
        plan,
        monthlyPrice: price,
        annualCost,
        potentialSavings,
        roi: Math.round(roi),
        paybackMonths: Math.round(paybackMonths * 10) / 10
      };
    });

    return {
      crisisSavings: Math.round(crisisSavings),
      laborSavings: Math.round(laborSavings),
      intelligenceValue: Math.round(intelligenceValue),
      totalAnnualValue: Math.round(totalAnnualValue),
      planROIs
    };
  }, [brands, monthlyRevenue, reputationImportance]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      starter: "Starter",
      professional: "Professional",
      agency: "Agency",
      enterprise: "Enterprise"
    };
    return labels[plan] || plan;
  };

  const getROIColor = (roi: number) => {
    if (roi >= 500) return "text-green-500";
    if (roi >= 200) return "text-emerald-500";
    if (roi >= 100) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <div className="mt-20 animate-fadeIn" style={{ animationDelay: '700ms' }}>
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 border-primary/30 bg-primary/5 backdrop-blur-xl">
          <Calculator className="w-3.5 h-3.5 mr-1.5 inline text-primary drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
          Calculadora de ROI
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3 relative">
          <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
            Calcule seu Retorno sobre Investimento
          </span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto px-4">
          Descubra quanto você pode economizar com observabilidade de LLM e proteção de marca
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Inputs */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur-xl overflow-hidden group hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                  <Target className="h-4 w-4 text-primary drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Configure seu cenário</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Marcas monitoradas</span>
                  <span className="font-bold text-primary">{brands}</span>
                </div>
                <Slider
                  value={[brands]}
                  onValueChange={(v) => setBrands(v[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Faturamento mensal</span>
                  <span className="font-bold text-primary">{formatCurrency(monthlyRevenue)}</span>
                </div>
                <Slider
                  value={[monthlyRevenue]}
                  onValueChange={(v) => setMonthlyRevenue(v[0])}
                  min={100000}
                  max={10000000}
                  step={100000}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Importância da reputação</span>
                  <span className="font-bold text-primary">{reputationImportance}%</span>
                </div>
                <Slider
                  value={[reputationImportance]}
                  onValueChange={(v) => setReputationImportance(v[0])}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Value Breakdown */}
          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-background to-background backdrop-blur-xl md:col-span-2 overflow-hidden group hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30">
                  <TrendingUp className="h-4 w-4 text-cyan-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Valor Gerado Anualmente</span>
              </CardTitle>
              <CardDescription>
                Baseado em benchmarks de mercado B2B
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-4 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Prevenção de Crises</span>
                  </div>
                  <p className="text-xl font-bold text-red-500">
                    {formatCurrency(calculations.crisisSavings)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Redução de risco de alucinações
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Economia de Tempo</span>
                  </div>
                  <p className="text-xl font-bold text-blue-500">
                    {formatCurrency(calculations.laborSavings)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Automação de monitoramento manual
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Inteligência Competitiva</span>
                  </div>
                  <p className="text-xl font-bold text-purple-500">
                    {formatCurrency(calculations.intelligenceValue)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Insights estratégicos multi-LLM
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-4 rounded-lg border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Valor Total Anual</span>
                  </div>
                  <p className="text-2xl font-bold gradient-text">
                    {formatCurrency(calculations.totalAnnualValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI por Plano */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              ROI por Plano
            </CardTitle>
            <CardDescription>
              Compare o retorno esperado para cada nível de investimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {calculations.planROIs.map((planROI) => (
                <div 
                  key={planROI.plan}
                  className="bg-background/80 p-5 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{getPlanLabel(planROI.plan)}</h4>
                    <Badge variant="outline" className={getROIColor(planROI.roi)}>
                      {planROI.roi > 0 ? '+' : ''}{planROI.roi}% ROI
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investimento anual</span>
                      <span className="font-medium">{formatCurrency(planROI.annualCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor gerado</span>
                      <span className="font-medium text-green-500">
                        {formatCurrency(planROI.potentialSavings)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Retorno líquido</span>
                      <span className={`font-bold ${planROI.potentialSavings - planROI.annualCost > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(planROI.potentialSavings - planROI.annualCost)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payback</span>
                        <span className="font-medium text-primary">
                          {planROI.paybackMonths <= 12 
                            ? `${planROI.paybackMonths} meses` 
                            : `${(planROI.paybackMonths / 12).toFixed(1)} anos`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                  Metodologia de Cálculo
                </p>
                <p className="text-muted-foreground text-xs">
                  ROI calculado com base em: custo médio de crise de reputação por alucinação de IA (R$ 150k), 
                  probabilidade de incidentes (35% a.a. sem monitoramento), economia de 40h/mês em monitoramento manual, 
                  e valor de inteligência competitiva proporcional ao faturamento. Valores são estimativas baseadas 
                  em benchmarks de mercado B2B e podem variar conforme o setor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
