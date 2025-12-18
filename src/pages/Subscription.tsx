import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, TrendingUp, Zap, Crown, Shield, Flame, Briefcase, Building2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/utils/logger";
import ROICalculator from "@/components/subscription/ROICalculator";

interface TierData {
  name: string;
  price: string;
  priceId: string;
  productId: string;
  features: string[];
  popular?: boolean;
}

const TIERS: Record<string, TierData> = {
  free: {
    name: "FREE",
    price: "R$ 0",
    priceId: "",
    productId: "free",
    features: [
      "Trial por 7 dias",
      "10 queries/mês",
      "1 marca monitorada",
      "Dashboards básicos",
      "Sem IA",
      "Suporte comunidade"
    ]
  },
  basic: {
    name: "Básico",
    price: "R$ 497,00",
    priceId: "price_1SdNBq6OZijkKYDjLwkm9szs",
    productId: "prod_TaYIyO9s7b04U1",
    features: [
      "100 queries/mês",
      "2 marcas monitoradas",
      "Relatórios básicos",
      "Análise GEO + SEO",
      "Suporte por email (48h)"
    ]
  },
  pro: {
    name: "Profissional",
    price: "R$ 997,00",
    priceId: "price_1SdNC26OZijkKYDjxc3FC4Nn",
    productId: "prod_TaYIG3Xcysq7zC",
    features: [
      "300 queries/mês",
      "5 marcas monitoradas",
      "Relatórios avançados",
      "Análise com IA",
      "Métricas KAPI (ICE, GAP, CPI)",
      "Suporte prioritário (24h)",
      "Automações completas"
    ],
    popular: true
  },
  agency: {
    name: "Agência",
    price: "R$ 1.997,00",
    priceId: "price_1SdNCE6OZijkKYDjGl1Inrpk",
    productId: "prod_TaYIMTXlNTLZwc",
    features: [
      "1.000 queries/mês",
      "Até 7 marcas monitoradas",
      "Relatórios white-label",
      "Certificação IGO oficial",
      "API access completa",
      "Suporte dedicado (12h)",
      "Revenda autorizada"
    ],
    popular: false
  },
  enterprise: {
    name: "Enterprise",
    price: "R$ 4.997,00",
    priceId: "price_1SdNCP6OZijkKYDjXiwZNtAg",
    productId: "prod_TaYJVPctHiC4XA",
    features: [
      "Queries ilimitadas",
      "Até 7 marcas monitoradas",
      "Relatórios científicos",
      "IA avançada + Automações",
      "Detecção de alucinações",
      "Consultor dedicado",
      "SLA garantido 99.9%"
    ]
  }
};

export default function Subscription() {
  const { subscription, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = useCallback(async (priceId: string, tierKey: string) => {
    try {
      setLoading(tierKey);
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      logger.error('Erro no checkout', { error, priceId, tierKey });
      toast.error("Erro ao criar checkout: " + error.message);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleManageSubscription = useCallback(async () => {
    try {
      setLoading("portal");
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      logger.error('Erro ao abrir portal', { error });
      toast.error("Erro ao abrir portal: " + error.message);
    } finally {
      setLoading(null);
    }
  }, []);

  const getCurrentTier = useCallback(() => {
    if (!subscription?.subscribed || !subscription?.product_id) return null;
    return Object.entries(TIERS).find(([_, tier]) => tier.productId === subscription.product_id)?.[0];
  }, [subscription]);

  const currentTier = useMemo(() => getCurrentTier(), [getCurrentTier]);

  const tiersArray = useMemo(() => Object.entries(TIERS), []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        {/* Hero Section Premium */}
        <div className="text-center mb-12 animate-slideUp">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 border-primary/30 bg-primary/5 backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 inline text-primary drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
            Framework IGO Exclusivo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            Escolha seu Plano
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Potencialize sua presença em respostas de IA com o único framework IGO do mercado
          </p>
        </div>

      {subscription?.subscribed && (
        <Card className="relative overflow-hidden mb-8 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-xl shadow-xl hover:shadow-primary/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <Crown className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  </div>
                  Assinatura Ativa
                </CardTitle>
                <CardDescription className="mt-3 text-base">
                  Você está no plano <strong className="text-primary">{TIERS[currentTier as keyof typeof TIERS]?.name}</strong>
                  {subscription.subscription_end && (
                    <span className="block mt-1 text-muted-foreground">
                      Renovação automática em {new Date(subscription.subscription_end).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button 
              onClick={handleManageSubscription}
              disabled={loading === "portal"}
              size="lg"
              variant="outline"
              className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
            >
              {loading === "portal" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4 text-primary" />
                  Gerenciar Assinatura
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-[1400px] mx-auto">
        {tiersArray.map(([key, tier], index) => {
          const isCurrentPlan = currentTier === key;
          const tierColors: Record<string, { border: string; bg: string; icon: string; glow: string }> = {
            free: { border: 'border-muted/50', bg: 'from-muted/10', icon: 'text-muted-foreground', glow: '' },
            basic: { border: 'border-cyan-500/30', bg: 'from-cyan-500/10', icon: 'text-cyan-500', glow: 'hover:shadow-cyan-500/20' },
            pro: { border: 'border-primary/50', bg: 'from-primary/10', icon: 'text-primary', glow: 'hover:shadow-primary/20 shadow-lg shadow-primary/10' },
            agency: { border: 'border-orange-500/30', bg: 'from-orange-500/10', icon: 'text-orange-500', glow: 'hover:shadow-orange-500/20' },
            enterprise: { border: 'border-yellow-500/30', bg: 'from-yellow-500/10', icon: 'text-yellow-500', glow: 'hover:shadow-yellow-500/20' }
          };
          const colors = tierColors[key] || tierColors.free;
          
          return (
            <Card 
              key={key}
              className={`relative group transition-all duration-500 hover:-translate-y-1 animate-fadeIn flex flex-col h-[580px] backdrop-blur-xl overflow-hidden ${colors.border} bg-gradient-to-br ${colors.bg} via-background to-background ${colors.glow} ${
                isCurrentPlan 
                  ? 'ring-2 ring-primary shadow-[0_0_30px_rgba(168,85,247,0.3)]' 
                  : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                style={{ backgroundColor: key === 'pro' ? 'rgba(139,92,246,0.2)' : key === 'agency' ? 'rgba(249,115,22,0.2)' : key === 'enterprise' ? 'rgba(234,179,8,0.2)' : key === 'basic' ? 'rgba(6,182,212,0.2)' : 'rgba(100,100,100,0.1)' }} 
              />

              {/* Badges */}
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 border-0 shadow-lg shadow-primary/30 z-10">
                  <Flame className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}
              {key === 'agency' && !isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg shadow-orange-500/30 z-10">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Canal Indireto
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 z-10 bg-green-500/20 text-green-500 border-green-500/30">
                  <Crown className="w-3 h-3 mr-1" />
                  Seu Plano
                </Badge>
              )}
              
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="text-lg mb-1 flex items-center gap-2 whitespace-nowrap">
                  {key === 'enterprise' && <Building2 className={`w-4 h-4 ${colors.icon} drop-shadow-[0_0_6px_rgba(234,179,8,0.5)] shrink-0`} />}
                  {key === 'pro' && <Sparkles className={`w-4 h-4 ${colors.icon} drop-shadow-[0_0_6px_rgba(139,92,246,0.5)] shrink-0`} />}
                  {key === 'agency' && <Briefcase className={`w-4 h-4 ${colors.icon} drop-shadow-[0_0_6px_rgba(249,115,22,0.5)] shrink-0`} />}
                  {key === 'basic' && <Zap className={`w-4 h-4 ${colors.icon} drop-shadow-[0_0_6px_rgba(6,182,212,0.5)] shrink-0`} />}
                  <span className="truncate">{tier.name}</span>
                </CardTitle>
                <div className="text-2xl font-bold mt-1 flex items-baseline gap-1">
                  <span className={`whitespace-nowrap tabular-nums ${key === 'pro' ? 'text-primary' : key === 'agency' ? 'text-orange-500' : key === 'enterprise' ? 'text-yellow-500' : key === 'basic' ? 'text-cyan-500' : 'text-foreground'}`}>
                    {tier.price}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground/80">/mês</span>
                </div>
                {tier.popular && (
                  <p className="text-[10px] text-primary mt-1.5 font-medium flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Escolha de 70%
                  </p>
                )}
                {key === 'agency' && (
                  <p className="text-[10px] text-orange-500 mt-1.5 font-medium flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Canal Indireto
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="relative z-10 flex-1 flex flex-col justify-between pt-0 px-4">
                <ul className="space-y-2 mb-3 flex-1">
                  {tier.features.map((feature, i) => (
                    <li 
                      key={i} 
                      className="flex items-start gap-2 group/item hover:translate-x-1 transition-transform duration-200"
                    >
                      <div className={`mt-0.5 p-0.5 rounded-full ${key === 'pro' ? 'bg-primary/20' : key === 'agency' ? 'bg-orange-500/20' : key === 'enterprise' ? 'bg-yellow-500/20' : key === 'basic' ? 'bg-cyan-500/20' : 'bg-muted/20'} group-hover/item:scale-110 transition-transform shrink-0`}>
                        <Check className={`h-2.5 w-2.5 ${colors.icon}`} />
                      </div>
                      <span className="text-[11px] leading-relaxed break-words">{feature}</span>
                    </li>
                  ))}
                </ul>

                {key === 'free' ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    Plano Atual (Trial)
                  </Button>
                ) : key === 'agency' ? (
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/25"
                    variant="default"
                    onClick={() => window.open('mailto:contato@teiageo.com?subject=Plano Agência - Interesse', '_blank')}
                    size="lg"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Contatar Provedor
                  </Button>
                ) : (
                  <Button
                    className={`w-full group relative overflow-hidden ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25' 
                        : ''
                    }`}
                    variant={tier.popular ? "default" : "outline"}
                    onClick={() => handleCheckout(tier.priceId, key)}
                    disabled={loading === key || isCurrentPlan}
                    size="lg"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading === key ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Plano Atual
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                          Assinar Agora
                        </>
                      )}
                    </span>
                    {/* Shimmer effect */}
                    {!isCurrentPlan && !loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de Benefícios Premium */}
      <div className="mt-20 animate-fadeIn" style={{ animationDelay: '600ms' }}>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text text-transparent">
            Por que escolher Teia GEO?
          </h2>
          <p className="text-muted-foreground">
            O único framework IGO do mercado com resultados comprovados
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-xl p-6 group hover:shadow-lg hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="relative z-10 p-0 pb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 w-fit mb-4">
                <Sparkles className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              </div>
              <CardTitle className="text-xl">Framework IGO Exclusivo</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-0">
              <p className="text-sm text-muted-foreground">
                Único no mundo. Monitore sua presença em LLMs com métricas científicas: CPI, GAP, ICE e Estabilidade Cognitiva.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-background to-background backdrop-blur-xl p-6 group hover:shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="relative z-10 p-0 pb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              </div>
              <CardTitle className="text-xl">Análise Multi-LLM</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-0">
              <p className="text-sm text-muted-foreground">
                Monitore ChatGPT, Claude, Gemini e mais. Detecção de alucinações e análise de risco em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-background to-background backdrop-blur-xl p-6 group hover:shadow-lg hover:shadow-orange-500/20 hover:border-orange-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="relative z-10 p-0 pb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 w-fit mb-4">
                <Zap className="h-6 w-6 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </div>
              <CardTitle className="text-xl">Integração Completa</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-0">
              <p className="text-sm text-muted-foreground">
                Google Search Console, Google Analytics 4 e automações inteligentes. Tudo em uma única plataforma.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ROI Calculator */}
      <ROICalculator />

      {/* Trust signals Premium */}
      <div className="mt-16 text-center animate-fadeIn" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
            <Award className="h-4 w-4 text-primary drop-shadow-[0_0_4px_rgba(139,92,246,0.5)]" />
            <span>Certificação PLATINUM</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/5 border border-green-500/20">
            <Shield className="h-4 w-4 text-green-500 drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
            <span>GDPR/LGPD Compliant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/20">
            <Check className="h-4 w-4 text-cyan-500 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
            <span>Suporte em Português</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/20">
            <Zap className="h-4 w-4 text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]" />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
