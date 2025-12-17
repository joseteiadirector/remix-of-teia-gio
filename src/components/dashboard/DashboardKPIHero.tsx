import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  Search, 
  Zap, 
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: number | null;
  suffix?: string;
  icon: React.ReactNode;
  trend?: number;
  color: 'purple' | 'blue' | 'emerald' | 'amber' | 'cyan';
  description: string;
  delay?: number;
}

const colorVariants = {
  purple: {
    bg: 'from-purple-500/20 via-purple-500/10 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-500/50',
    icon: 'bg-purple-500/20 text-purple-400',
    value: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  blue: {
    bg: 'from-blue-500/20 via-blue-500/10 to-transparent',
    border: 'border-blue-500/30 hover:border-blue-500/50',
    icon: 'bg-blue-500/20 text-blue-400',
    value: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  emerald: {
    bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    icon: 'bg-emerald-500/20 text-emerald-400',
    value: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  amber: {
    bg: 'from-amber-500/20 via-amber-500/10 to-transparent',
    border: 'border-amber-500/30 hover:border-amber-500/50',
    icon: 'bg-amber-500/20 text-amber-400',
    value: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  cyan: {
    bg: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-500/50',
    icon: 'bg-cyan-500/20 text-cyan-400',
    value: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
};

function KPICard({ title, value, suffix = '', icon, trend, color, description, delay = 0 }: KPICardProps) {
  const variant = colorVariants[color];
  
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm p-6",
        "transition-all duration-500 hover:-translate-y-1 hover:shadow-xl",
        variant.border,
        variant.glow
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animation: 'fade-in 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity duration-500",
        variant.bg
      )} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", variant.icon)}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
              {TrendIcon && <TrendIcon className="h-4 w-4" />}
              <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-4xl font-display font-bold tracking-tight", variant.value)}>
              {value !== null ? value.toFixed(1) : '—'}
            </span>
            {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
        </div>
      </div>

      {/* Hover Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <ArrowUpRight className={cn("h-5 w-5", variant.value)} />
      </div>
    </div>
  );
}

export function DashboardKPIHero() {
  const { selectedBrandId } = useBrand();

  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['dashboard-kpi-hero', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId || selectedBrandId === 'all') return null;

      // Fetch GEO Score
      const { data: geoData } = await supabase
        .from('geo_scores')
        .select('score, cpi')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch SEO metrics
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('avg_position, ctr')
        .eq('brand_id', selectedBrandId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch LLM mentions
      const { data: mentionsData } = await supabase
        .from('mentions_llm')
        .select('confidence')
        .eq('brand_id', selectedBrandId)
        .eq('mentioned', true);

      // Fetch IGO metrics (for Stability)
      const { data: igoData } = await supabase
        .from('igo_metrics_history')
        .select('cognitive_stability')
        .eq('brand_id', selectedBrandId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Calculate LLM visibility score
      const llmVisibility = mentionsData?.length 
        ? Math.round(mentionsData.reduce((acc, m) => acc + m.confidence, 0) / mentionsData.length)
        : null;

      // Calculate SEO score
      let seoScore = null;
      if (seoData) {
        const positionScore = Math.max(0, 100 - ((seoData.avg_position - 1) * 10));
        const ctrScore = Math.min(100, (seoData.ctr * 100 / 5) * 100);
        seoScore = Math.round((positionScore * 0.6) + (ctrScore * 0.4));
      }

      return {
        geoScore: geoData?.score || null,
        seoScore,
        llmVisibility,
        cpi: geoData?.cpi || null,
        stability: igoData?.cognitive_stability || null,
        // Mock trends for now - in production these would be calculated from historical data
        geoTrend: 2.3,
        seoTrend: -1.2,
        llmTrend: 5.0,
        cpiTrend: 0,
        stabilityTrend: 1.5,
      };
    },
    enabled: !!selectedBrandId && selectedBrandId !== 'all',
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-6">
            <Skeleton className="h-12 w-12 rounded-xl mb-4" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KPICard
        title="GEO Score"
        value={kpiData?.geoScore || null}
        icon={<Brain className="h-6 w-6" />}
        trend={kpiData?.geoTrend}
        color="purple"
        description="Otimização para IA generativa"
        delay={0}
      />
      <KPICard
        title="SEO Score"
        value={kpiData?.seoScore || null}
        icon={<Search className="h-6 w-6" />}
        trend={kpiData?.seoTrend}
        color="blue"
        description="Performance em buscadores"
        delay={100}
      />
      <KPICard
        title="Visibilidade LLM"
        value={kpiData?.llmVisibility || null}
        suffix="%"
        icon={<Zap className="h-6 w-6" />}
        trend={kpiData?.llmTrend}
        color="emerald"
        description="Presença em modelos de IA"
        delay={200}
      />
      <KPICard
        title="CPI"
        value={kpiData?.cpi || null}
        icon={<Target className="h-6 w-6" />}
        trend={kpiData?.cpiTrend}
        color="amber"
        description="Performance Cognitiva"
        delay={300}
      />
      <KPICard
        title="Stability"
        value={kpiData?.stability || null}
        suffix="%"
        icon={<Shield className="h-6 w-6" />}
        trend={kpiData?.stabilityTrend}
        color="cyan"
        description="Estabilidade Cognitiva"
        delay={400}
      />
    </div>
  );
}