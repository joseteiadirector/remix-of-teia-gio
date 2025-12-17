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
  ArrowUpRight,
  Sparkles
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
    bg: 'from-purple-500/30 via-purple-500/10 to-transparent',
    border: 'border-purple-500/40',
    borderHover: 'hover:border-purple-400/60',
    icon: 'from-purple-500/30 to-purple-600/20 text-purple-400 shadow-purple-500/30',
    value: 'from-purple-400 to-purple-300',
    glow: 'group-hover:shadow-purple-500/30',
    ring: 'ring-purple-500/20',
    gradient: 'from-purple-500 to-purple-600',
  },
  blue: {
    bg: 'from-blue-500/30 via-blue-500/10 to-transparent',
    border: 'border-blue-500/40',
    borderHover: 'hover:border-blue-400/60',
    icon: 'from-blue-500/30 to-blue-600/20 text-blue-400 shadow-blue-500/30',
    value: 'from-blue-400 to-blue-300',
    glow: 'group-hover:shadow-blue-500/30',
    ring: 'ring-blue-500/20',
    gradient: 'from-blue-500 to-blue-600',
  },
  emerald: {
    bg: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    border: 'border-emerald-500/40',
    borderHover: 'hover:border-emerald-400/60',
    icon: 'from-emerald-500/30 to-emerald-600/20 text-emerald-400 shadow-emerald-500/30',
    value: 'from-emerald-400 to-emerald-300',
    glow: 'group-hover:shadow-emerald-500/30',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  amber: {
    bg: 'from-amber-500/30 via-amber-500/10 to-transparent',
    border: 'border-amber-500/40',
    borderHover: 'hover:border-amber-400/60',
    icon: 'from-amber-500/30 to-amber-600/20 text-amber-400 shadow-amber-500/30',
    value: 'from-amber-400 to-amber-300',
    glow: 'group-hover:shadow-amber-500/30',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500 to-amber-600',
  },
  cyan: {
    bg: 'from-cyan-500/30 via-cyan-500/10 to-transparent',
    border: 'border-cyan-500/40',
    borderHover: 'hover:border-cyan-400/60',
    icon: 'from-cyan-500/30 to-cyan-600/20 text-cyan-400 shadow-cyan-500/30',
    value: 'from-cyan-400 to-cyan-300',
    glow: 'group-hover:shadow-cyan-500/30',
    ring: 'ring-cyan-500/20',
    gradient: 'from-cyan-500 to-cyan-600',
  },
};

function KPICard({ title, value, suffix = '', icon, trend, color, description, delay = 0 }: KPICardProps) {
  const variant = colorVariants[color];
  
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-emerald-400 bg-emerald-500/10' : trend < 0 ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground bg-muted/50';

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-3xl border-2 bg-card/40 backdrop-blur-xl",
        "transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl",
        variant.border,
        variant.borderHover,
        variant.glow
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animation: 'fade-in 0.6s ease-out forwards',
        opacity: 0
      }}
    >
      {/* Glass Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated Corner Gradient */}
      <div className={cn(
        "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        `bg-gradient-to-br ${variant.gradient}`
      )} />
      
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-30 group-hover:opacity-60 transition-opacity duration-500",
        variant.bg
      )} />
      
      {/* Shimmer Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-5">
          {/* Icon with Glow */}
          <div className="relative">
            <div className={cn("absolute inset-0 rounded-2xl blur-lg opacity-50", `bg-gradient-to-br ${variant.gradient}`)} />
            <div className={cn(
              "relative p-3.5 rounded-2xl bg-gradient-to-br border border-white/10 shadow-lg",
              variant.icon
            )}>
              {icon}
            </div>
          </div>
          
          {/* Trend Badge */}
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm",
              trendColor
            )}>
              {TrendIcon && <TrendIcon className="h-4 w-4" />}
              <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-semibold tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-5xl font-display font-black tracking-tighter bg-gradient-to-r bg-clip-text text-transparent",
              variant.value
            )}>
              {value !== null ? value.toFixed(1) : '—'}
            </span>
            {suffix && <span className="text-xl text-muted-foreground font-medium">{suffix}</span>}
          </div>
          <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        `bg-gradient-to-r ${variant.gradient}`
      )} />

      {/* Hover Arrow with Glow */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <div className={cn("p-2 rounded-full bg-gradient-to-br", variant.icon)}>
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      
      {/* Sparkle on Hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
        <Sparkles className={cn("h-4 w-4 animate-pulse", `text-${color}-400`)} />
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