import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Clock, CheckCircle2, Home, AlertCircle } from "lucide-react";
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
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
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
      
      // Increase timeout to 5 minutes for multiple brands
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      setProgress(`⚡ Processando ${brandsToSync} marca${brandsToSync > 1 ? 's' : ''} em paralelo...`);
      setProgressPercent(30);
      
      // Simulate progress updates
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
      
      // Success details
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Sincronização Híbrida (SEO + GEO)</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Execute sincronização manual de dados SEO (GA4, Search Console) e GEO (menções em LLMs)
            </p>
          </div>
          
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Job: Analytics Sync (SEO + GEO)</h2>
              <p className="text-muted-foreground">
                Este processo sincroniza dados do Google Analytics 4 e Search Console (SEO),
                coleta menções em LLMs (GEO), e calcula os scores híbridos para todas as marcas.
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Agendamento Automático</div>
                <div className="text-sm text-muted-foreground">
                  Executa a cada 6 horas (00:00, 06:00, 12:00, 18:00)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={runSync} disabled={running} size="lg" className="w-full">
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
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                    {progressPercent < 100 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
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
        </Card>

        {result && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <h3 className="text-xl font-semibold">Resultado da Sincronização Híbrida (SEO + GEO)</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
              <div className="p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-green-500">
                  {result.success || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Marcas Sincronizadas</div>
              </div>
              <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-red-500">
                  {result.failed || 0}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Falhas</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-sm font-medium text-blue-500 mb-3">Dados SEO Coletados</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Google Analytics 4</span>
                    <span className="font-medium">5 métricas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Search Console</span>
                    <span className="font-medium">5 métricas</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-blue-500/20">
                    Sessions, Users, Pageviews, Bounce Rate, Avg Duration, Clicks, Impressions, CTR, Position
                  </div>
                </div>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="text-sm font-medium text-purple-500 mb-3">Dados GEO Coletados</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Providers Testados</span>
                    <span className="font-medium">4 LLMs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Queries por Marca</span>
                    <span className="font-medium">6 consultas</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-purple-500/20">
                    ChatGPT, Gemini, Claude, Perplexity - análise de menções contextuais
                  </div>
                </div>
              </div>
            </div>

            {result.cache && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-6">
                <div className="text-sm font-medium text-emerald-500 mb-3">⚡ Cache Inteligente</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Entradas Cacheadas</div>
                    <div className="font-bold text-lg">{result.cache.total_entries}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Taxa de Reuso</div>
                    <div className="font-bold text-lg">{result.cache.avg_hit_rate}x</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Idade Média</div>
                    <div className="font-bold text-lg">{result.cache.avg_age_minutes}min</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-emerald-500/20">
                  Economizando chamadas desnecessárias aos LLMs • Validade: 7 dias
                </div>
              </div>
            )}

            {result.brands_synced?.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium">Marcas Sincronizadas:</div>
                <div className="flex flex-wrap gap-2">
                  {result.brands_synced.map((brand: string) => (
                    <div key={brand} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                      {brand}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors?.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="font-medium text-destructive">Erros:</div>
                <div className="space-y-1">
                  {result.errors.map((error: string, idx: number) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Executado em: {new Date(result.timestamp).toLocaleString('pt-BR')}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;