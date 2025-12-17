import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  Play, 
  Clock, 
  CheckCircle2, 
  Home, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Zap,
  Database,
  Globe,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { logger } from "@/utils/logger";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Brand {
  id: string;
  name: string;
  domain: string;
}

interface SyncResult {
  success: number;
  failed: number;
  brands_synced: string[];
  errors: string[];
  timestamp: string;
  cache?: {
    total_entries: number;
    avg_hit_rate: number;
    avg_age_minutes: number;
  };
}

const Analytics = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState(0);

  // Otimizar busca de marcas com React Query
  const { data: brands = [] } = useQuery({
    queryKey: ['brands-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, domain')
        .eq('is_visible', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (brands.length > 0 && selectedBrand === "") {
      setSelectedBrand("all");
    }
  }, [brands, selectedBrand]);

  const runSync = async () => {
    setRunning(true);
    setResult(null);
    setProgress("🚀 Iniciando sincronização...");
    setProgressPercent(10);

    try {
      const payload = selectedBrand !== "all" ? { brandId: selectedBrand } : {};
      const brandsToSync = selectedBrand !== "all" ? 1 : brands.length;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      
      setProgress(`⚡ Processando ${brandsToSync} marca${brandsToSync > 1 ? 's' : ''} em paralelo...`);
      setProgressPercent(30);
      
      const progressInterval = setInterval(() => {
        setProgressPercent(prev => {
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 2000);
      
      const { data, error } = await supabase.functions.invoke('analytics-sync', {
        body: payload,
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      setProgressPercent(100);

      if (error) throw error;

      setResult(data);
      const brandName = selectedBrand !== "all" 
        ? brands.find(b => b.id === selectedBrand)?.name 
        : "todas as marcas";
      
      setProgress("✅ Sincronização concluída!");
      
      const successMsg = `${data.success || 0} marca(s) sincronizada(s) com sucesso`;
      const failMsg = data.failed > 0 ? ` • ${data.failed} falha(s)` : '';
      
      toast({
        title: "Sincronização concluída! 🎉",
        description: `${successMsg}${failMsg} (${brandName})`,
      });
    } catch (error) {
      logger.error('Error running sync', { error });
      const errorMessage = error instanceof Error
        ? error.message 
        : "A sincronização pode estar demorando mais que o esperado. Verifique os resultados em GEO Scores em alguns minutos.";
      
      setProgress("❌ Erro na sincronização");
      setProgressPercent(0);
      toast({
        title: "Erro na sincronização",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setRunning(false);
        setProgress("");
        setProgressPercent(0);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/8 to-cyan-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/8 to-violet-500/4 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-primary-glow/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Premium Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList className="bg-card/30 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Sparkles className="h-3 w-3 text-primary/50" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2 text-primary font-medium">
                <RefreshCw className="h-4 w-4" />
                Analytics Sync
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Premium Header */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-violet-500/10 rounded-3xl blur-xl transition-all duration-500 group-hover:from-blue-500/20 group-hover:via-purple-500/25 group-hover:to-violet-500/20" />
          <Card className="relative p-8 bg-card/40 backdrop-blur-xl border-border/50 overflow-hidden transition-all duration-500 group-hover:border-blue-500/40 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15),0_0_80px_rgba(59,130,246,0.1)] group-hover:bg-card/60">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl transition-all duration-500 group-hover:from-blue-500/20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl transition-all duration-500 group-hover:from-purple-500/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-violet-500/20 flex items-center justify-center border border-blue-500/30 transition-all duration-500 group-hover:border-blue-400/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <RefreshCw className="w-10 h-10 text-blue-400 transition-all duration-500 group-hover:text-blue-300" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-violet-400 bg-clip-text text-transparent mb-2">
                    Sincronização Híbrida
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg">
                    Execute sincronização manual de dados SEO (GA4, Search Console) e GEO (menções em LLMs)
                  </p>
                </div>
              </div>
              
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full md:w-[280px] bg-background/50 border-border/50 focus:border-blue-500/50">
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary" />
                      Todas as marcas
                    </div>
                  </SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Sync Job Card */}
        <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-cyan-500/30 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500 rounded-l-lg" />
          
          <div className="p-6 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                    Job: Analytics Sync
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </h2>
                  <p className="text-muted-foreground">
                    Sincroniza dados do Google Analytics 4, Search Console e coleta menções em LLMs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Agendamento Automático</div>
                  <div className="text-sm text-muted-foreground">
                    Executa a cada 6 horas (00:00, 06:00, 12:00, 18:00)
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={runSync} 
                  disabled={running} 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Executar Sincronização Manual
                    </>
                  )}
                </Button>
                
                {running && (
                  <div className="space-y-3">
                    <Progress value={progressPercent} className="h-2 bg-background/50" />
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                      {progressPercent < 100 ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      <span>{progress}</span>
                    </div>
                    {progressPercent > 30 && progressPercent < 90 && (
                      <div className="text-xs text-center text-muted-foreground/60">
                        Tempo estimado: ~{Math.ceil((100 - progressPercent) / 5 * 2)}s
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Results Card */}
        {result && (
          <Card className="relative overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-green-500 rounded-l-lg" />
            
            <div className="p-6 relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    Resultado da Sincronização Híbrida
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </h3>
                  <p className="text-sm text-muted-foreground">SEO + GEO</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-400">
                    {result.success || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Marcas Sincronizadas</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-xl">
                  <div className="text-2xl font-bold text-rose-400">
                    {result.failed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Falhas</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Dados SEO Coletados</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Google Analytics 4</span>
                      <span className="font-medium text-foreground">5 métricas</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Search Console</span>
                      <span className="font-medium text-foreground">5 métricas</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-blue-500/20">
                      Sessions, Users, Pageviews, Bounce Rate, Avg Duration, Clicks, Impressions, CTR, Position
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Dados GEO Coletados</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Providers Testados</span>
                      <span className="font-medium text-foreground">4 LLMs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Queries por Marca</span>
                      <span className="font-medium text-foreground">6 consultas</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-purple-500/20">
                      ChatGPT, Gemini, Claude, Perplexity - análise de menções contextuais
                    </div>
                  </div>
                </div>
              </div>

              {result.cache && (
                <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Cache Inteligente</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Entradas Cacheadas</div>
                      <div className="font-bold text-lg text-foreground">{result.cache.total_entries}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Taxa de Reuso</div>
                      <div className="font-bold text-lg text-foreground">{result.cache.avg_hit_rate}x</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Idade Média</div>
                      <div className="font-bold text-lg text-foreground">{result.cache.avg_age_minutes}min</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-amber-500/20">
                    Economizando chamadas desnecessárias aos LLMs • Validade: 7 dias
                  </div>
                </div>
              )}

              {result.brands_synced?.length > 0 && (
                <div className="space-y-2 mb-4">
                  <div className="font-medium text-foreground">Marcas Sincronizadas:</div>
                  <div className="flex flex-wrap gap-2">
                    {result.brands_synced.map((brand: string) => (
                      <div key={brand} className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-full text-sm border border-primary/20 text-primary">
                        {brand}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="font-medium text-rose-400">Erros:</div>
                  <div className="space-y-1">
                    {result.errors.map((error: string, idx: number) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Executado em: {new Date(result.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;
