import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles, TrendingUp, Zap, Crown } from "lucide-react";
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
      "💰 Revenda autorizada"
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Hero Section com animação */}
      <div className="text-center mb-12 animate-slideUp">
        <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 border-primary/30">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
          Framework IGO Exclusivo
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Escolha seu Plano
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Potencialize sua presença em respostas de IA com o único framework IGO do mercado
        </p>
      </div>

      {subscription?.subscribed && (
        <Card className="mb-8 border-primary/50 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-fadeIn hover-lift">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Crown className="h-5 w-5 text-primary" />
                  Assinatura Ativa
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  Você está no plano <strong className="text-primary">{TIERS[currentTier as keyof typeof TIERS]?.name}</strong>
                  {subscription.subscription_end && (
                    <span className="block mt-1">
                      Renovação automática em {new Date(subscription.subscription_end).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="animate-pulse-glow">
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleManageSubscription}
              disabled={loading === "portal"}
              size="lg"
              variant="outline"
              className="hover:bg-primary/10 transition-colors"
            >
              {loading === "portal" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
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
          return (
            <Card 
              key={key}
              className={`relative group transition-all duration-500 hover-lift animate-fadeIn flex flex-col h-[580px] ${
                tier.popular 
                  ? 'border-primary/50 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 shadow-xl' 
                  : 'border-border/50 hover:border-border'
              } ${
                key === 'agency'
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : ''
              } ${
                isCurrentPlan 
                  ? 'ring-2 ring-primary/70 shadow-[0_0_30px_rgba(168,85,247,0.4)]' 
                  : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Badges com melhor visual */}
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary border-0 shadow-lg animate-pulse-glow z-10">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}
              {key === 'agency' && !isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 border-0 shadow-lg z-10">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Canal Indireto
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 z-10" variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Seu Plano
                </Badge>
              )}
              
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-3xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="text-lg mb-1 flex items-center gap-2 whitespace-nowrap">
                  {key === 'enterprise' && <Crown className="w-4 h-4 text-primary shrink-0" />}
                  {key === 'pro' && <Sparkles className="w-4 h-4 text-primary shrink-0" />}
                  {key === 'agency' && <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />}
                  <span className="truncate">{tier.name}</span>
                </CardTitle>
                <div className="text-2xl font-bold mt-1 gradient-text flex items-baseline gap-1">
                  <span className="whitespace-nowrap tabular-nums">{tier.price}</span>
                  <span className="text-xs font-normal text-muted-foreground/80">/mês</span>
                </div>
                {tier.popular && (
                  <p className="text-[10px] text-primary/80 mt-1.5 font-medium">
                    🔥 Escolha de 70%
                  </p>
                )}
                {key === 'agency' && (
                  <p className="text-[10px] text-amber-500/80 mt-1.5 font-medium">
                    💼 Canal Indireto
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
                      <div className="mt-0.5 p-0.5 rounded-full bg-primary/10 group-hover/item:bg-primary/20 transition-colors shrink-0">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-[11px] leading-relaxed break-words">{feature}</span>
                    </li>
                  ))}
                </ul>

                {key === 'free' ? (
                  <Button
                    className="w-full group"
                    variant="outline"
                    disabled
                  >
                    Plano Atual (Trial)
                  </Button>
                ) : key === 'agency' ? (
                  <Button
                    className="w-full group bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                    variant="default"
                    onClick={() => window.open('mailto:contato@teiageo.com?subject=Plano Agência - Interesse', '_blank')}
                    size="lg"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      💼 Contatar Provedor
                    </span>
                  </Button>
                ) : (
                  <Button
                    className={`w-full group relative overflow-hidden ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90' 
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
                    {/* Shimmer effect on hover */}
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

      {/* Seção de Benefícios / FAQ */}
      <div className="mt-20 animate-fadeIn" style={{ animationDelay: '600ms' }}>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Por que escolher Teia GEO?</h2>
          <p className="text-muted-foreground">
            O único framework IGO do mercado com resultados comprovados
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="hover-lift border-border/50">
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-3" />
              <CardTitle className="text-xl">Framework IGO Exclusivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Único no mundo. Monitore sua presença em LLMs com métricas científicas: CPI, GAP, ICE e Estabilidade Cognitiva.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <CardTitle className="text-xl">Análise Multi-LLM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitore ChatGPT, Claude, Gemini e mais. Detecção de alucinações e análise de risco em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50">
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-3" />
              <CardTitle className="text-xl">Integração Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Google Search Console, Google Analytics 4 e automações inteligentes. Tudo em uma única plataforma.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ROI Calculator */}
      <ROICalculator />

      {/* Trust signals */}
      <div className="mt-16 text-center animate-fadeIn" style={{ animationDelay: '800ms' }}>
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>Certificação PLATINUM</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>GDPR/LGPD Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>Suporte em Português</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
}