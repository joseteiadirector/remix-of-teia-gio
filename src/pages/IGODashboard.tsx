import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Network, GitCompare, Activity, TrendingUp, RefreshCw, Download, BarChart3, Lightbulb, Sparkles } from "lucide-react";
import { RealCollectionButton } from "@/components/llm/RealCollectionButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useKAPIMetrics } from "@/hooks/useKAPIMetrics";
import { useBrand } from "@/contexts/BrandContext";
import { WidgetCPIScore } from "@/components/dashboard/WidgetCPIScore";
import { exportCPIReport } from "@/utils/pdf";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { logger } from "@/utils/logger";

interface LLMConsensus {
  provider: string;
  mentions: number;
  confidence: number;
  sentiment: number;
}

interface ConvergenceData {
  timestamp: string;
  openai: number;
  claude: number;
  gemini: number;
  perplexity: number;
}

export default function IGODashboard() {
  const { toast } = useToast();
  const { selectedBrandId, setSelectedBrandId, brands: globalBrands } = useBrand();
  const [loading, setLoading] = useState(true);
  const [consensusData, setConsensusData] = useState<LLMConsensus[]>([]);
  const [convergenceData, setConvergenceData] = useState<ConvergenceData[]>([]);
  const [governanceScore, setGovernanceScore] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [cpiData, setCpiData] = useState<{current: number; trend: string; history: Array<{date: string; cpi: number}>}>({
    current: 0,
    trend: "stable",
    history: []
  });
  
  // ✅ USAR HOOK CENTRALIZADO PARA MÉTRICAS KAPI
  const kapiMetricsHook = useKAPIMetrics({ brandId: selectedBrandId });
  const kapiMetrics = kapiMetricsHook.raw;

  useEffect(() => {
    if (selectedBrandId) {
      const timeoutId = setTimeout(() => {
        loadIGOData();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedBrandId]);

  const loadIGOData = async () => {
    setLoading(true);
    try {
      // Load consensus data - mentions from each LLM
      const { data: mentions, error: mentionsError } = await supabase
        .from("mentions_llm")
        .select("provider, mentioned, confidence")
        .eq("brand_id", selectedBrandId)
        .order("collected_at", { ascending: false })
        .limit(100);

      if (mentionsError) throw mentionsError;

      // Aggregate by provider
      const providerStats = new Map<string, { count: number; totalConf: number; mentionedCount: number }>();
      
      mentions?.forEach(m => {
        // Normalize provider name to title case to avoid duplicates
        const normalizedProvider = m.provider.charAt(0).toUpperCase() + m.provider.slice(1).toLowerCase();
        
        if (!providerStats.has(normalizedProvider)) {
          providerStats.set(normalizedProvider, { count: 0, totalConf: 0, mentionedCount: 0 });
        }
        const stats = providerStats.get(normalizedProvider)!;
        stats.count++;
        // Normalize confidence: if > 1, it's already in 0-100 scale, otherwise convert from 0-1 to 0-100
        const normalizedConf = (m.confidence || 0) > 1 ? (m.confidence || 0) : (m.confidence || 0) * 100;
        stats.totalConf += normalizedConf;
        if (m.mentioned) stats.mentionedCount++;
      });

      const consensus: LLMConsensus[] = Array.from(providerStats.entries()).map(([provider, stats]) => ({
        provider,
        mentions: stats.count,
        confidence: stats.count > 0 ? (stats.totalConf / stats.count) / 100 : 0, // Now in 0-1 scale
        sentiment: stats.count > 0 ? (stats.mentionedCount / stats.count) * 100 : 0, // % of mentions where brand was mentioned
      }));

      setConsensusData(consensus);

      // Calculate governance score (average of all confidences)
      const avgConfidence = consensus.reduce((sum, c) => sum + c.confidence, 0) / (consensus.length || 1);
      setGovernanceScore(Math.round(avgConfidence * 100));

      // Load convergence timeline - last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: timeline, error: timelineError } = await supabase
        .from("mentions_llm")
        .select("provider, collected_at, confidence")
        .eq("brand_id", selectedBrandId)
        .gte("collected_at", thirtyDaysAgo.toISOString())
        .order("collected_at");

      if (timelineError) throw timelineError;

      // Group by day and provider
      const dailyData = new Map<string, { openai: number[]; claude: number[]; gemini: number[]; perplexity: number[] }>();
      
      timeline?.forEach(m => {
        const date = new Date(m.collected_at || new Date()).toISOString().split('T')[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, { openai: [], claude: [], gemini: [], perplexity: [] });
        }
        const day = dailyData.get(date)!;
        const provider = m.provider.toLowerCase();
        // Normalize confidence: if > 1, it's already in 0-100 scale, otherwise convert from 0-1 to 0-100
        const normalizedConf = (m.confidence || 0) > 1 ? (m.confidence || 0) : (m.confidence || 0) * 100;
        if (provider in day) {
          (day as any)[provider].push(normalizedConf);
        }
      });

      const convergence: ConvergenceData[] = Array.from(dailyData.entries())
        .map(([date, data]) => ({
          timestamp: date,
          openai: data.openai.length > 0 ? (data.openai.reduce((a, b) => a + b, 0) / data.openai.length) : 0,
          claude: data.claude.length > 0 ? (data.claude.reduce((a, b) => a + b, 0) / data.claude.length) : 0,
          gemini: data.gemini.length > 0 ? (data.gemini.reduce((a, b) => a + b, 0) / data.gemini.length) : 0,
          perplexity: data.perplexity.length > 0 ? (data.perplexity.reduce((a, b) => a + b, 0) / data.perplexity.length) : 0,
        }))
        .slice(-14); // Last 14 days

      setConvergenceData(convergence);

      // Load CPI data from geo_scores (FONTE OFICIAL)
      const { data: geoData } = await supabase
        .from("geo_scores")
        .select("cpi")
        .eq("brand_id", selectedBrandId)
        .gt("cpi", 0)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Load IGO metrics for other KAPI values
      const { data: igoData } = await supabase
        .from("igo_metrics_history")
        .select("ice, gap, cognitive_stability")
        .eq("brand_id", selectedBrandId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const current = geoData?.cpi || 0;
      
      // KAPI metrics agora vem do hook centralizado useKAPIMetrics
      // Não precisa mais fazer setKapiMetrics aqui

      const cpiThirtyDaysAgo = new Date();
      cpiThirtyDaysAgo.setDate(cpiThirtyDaysAgo.getDate() - 30);

      // CPI history from geo_scores (FONTE OFICIAL)
      const { data: historyData } = await supabase
        .from("geo_scores")
        .select("cpi, computed_at")
        .eq("brand_id", selectedBrandId)
        .gt("cpi", 0)
        .gte("computed_at", cpiThirtyDaysAgo.toISOString())
        .order("computed_at", { ascending: true });

      let history: Array<{date: string; cpi: number}> = [];
      let trend = "stable";

      if (historyData && historyData.length > 0) {
        history = historyData.map(d => ({
          date: new Date(d.computed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          cpi: Number(d.cpi) || 0
        }));

        if (historyData.length >= 2) {
          const previous = Number(historyData[historyData.length - 2].cpi) || 0;
          if (current > previous + 2) trend = "up";
          else if (current < previous - 2) trend = "down";
        }
      }

      setCpiData({ current, trend, history });

    } catch (error) {
      logger.error('Erro ao carregar dados IGO', { error });
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados IGO",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const recalculateMetrics = async () => {
    if (!selectedBrandId) return;
    
    setIsRecalculating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke('calculate-geo-metrics', {
        body: { brandId: selectedBrandId, userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "✅ Métricas Recalculadas",
        description: `CPI Score: ${data.cpi_score} | GEO Score: ${data.geo_score}`,
      });

      // Reload data and force widget refresh
      await loadIGOData();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      logger.error('Erro ao recalcular métricas', { error });
      toast({
        title: "Erro ao recalcular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedBrandId) return;

    setIsExporting(true);
    try {
      const brandName = globalBrands?.find(b => b.id === selectedBrandId)?.name || 'Unknown';

      await exportCPIReport({
        brandName,
        cpiMetrics: {
          cpi: kapiMetrics.cpi || cpiData.current,
          ice: kapiMetrics.ice,
          gap: kapiMetrics.gap,
          stability: kapiMetrics.stability
        },
        llmConsensus: consensusData.map(c => ({
          provider: c.provider,
          mentions: c.mentions,
          confidence: c.confidence,
          sentiment: c.sentiment
        })),
        convergenceData: convergenceData,
        coherenceMatrix: coherenceMatrix,
        period: 'Últimos 30 dias'
      });

      toast({
        title: "✅ PDF Exportado",
        description: "Relatório CPI Dashboard gerado com sucesso!",
      });
    } catch (error) {
      logger.error('Erro ao exportar PDF CPI', { error });
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const radarData = consensusData.map(c => ({
    provider: c.provider,
    Confiança: Math.round(c.confidence * 100),
    Sentimento: Math.round(c.sentiment),
    Menções: Math.min(c.mentions * 10, 100), // Normalize to 0-100
  }));

  const coherenceMatrix = [
    { llm: "OpenAI", openai: 100, claude: 0, gemini: 0, perplexity: 0 },
    { llm: "Claude", openai: 0, claude: 100, gemini: 0, perplexity: 0 },
    { llm: "Gemini", openai: 0, claude: 0, gemini: 100, perplexity: 0 },
    { llm: "Perplexity", openai: 0, claude: 0, gemini: 0, perplexity: 100 },
  ];

  // Calculate coherence between LLMs
  if (consensusData.length >= 2) {
    for (let i = 0; i < consensusData.length; i++) {
      for (let j = 0; j < consensusData.length; j++) {
        if (i !== j) {
          const llmA = consensusData[i];
          const llmB = consensusData[j];
          // Coherence = similarity in confidence and sentiment
          const coherence = Math.round(
            100 - Math.abs((llmA.confidence * 100) - (llmB.confidence * 100)) - Math.abs(llmA.sentiment - llmB.sentiment)
          );
          const matrixRow = coherenceMatrix.find(r => r.llm.toLowerCase() === llmA.provider.toLowerCase());
          if (matrixRow) {
            (matrixRow as any)[llmB.provider.toLowerCase()] = Math.max(0, coherence);
          }
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-r from-primary/20 via-violet-900/30 to-primary/20 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(139,92,246,0.2)] transition-all duration-500 hover:shadow-[0_0_80px_rgba(139,92,246,0.3)] hover:border-primary/60 group">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/30 transition-all duration-700" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 group-hover:bg-violet-500/25 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-violet-600 border border-primary/50 shadow-[0_0_40px_rgba(139,92,246,0.5)]">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-white via-primary-foreground to-primary bg-clip-text text-transparent drop-shadow-lg">
                  IGO <span className="text-primary">Framework</span> Dashboard
                </h1>
              </div>
              <p className="text-lg text-primary/70 font-medium">
                Inteligência Generativa Observacional — IA observando IA
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {selectedBrandId && (
                <RealCollectionButton 
                  brandId={selectedBrandId}
                  brandName={globalBrands?.find(b => b.id === selectedBrandId)?.name || ''}
                  onComplete={() => {
                    recalculateMetrics();
                  }}
                />
              )}
              <Button onClick={handleExportPDF} disabled={isExporting || !selectedBrandId} className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] border-0 px-6 py-5 font-bold">
                <Download className="h-5 w-5 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={recalculateMetrics} disabled={isRecalculating || !selectedBrandId} variant="outline" className="border-2 border-primary/40 hover:border-primary/60 hover:bg-primary/10 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] px-6 py-5 font-bold">
                <RefreshCw className={`h-5 w-5 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                Recalcular CPI
              </Button>
              <select value={selectedBrandId || ""} onChange={(e) => setSelectedBrandId(e.target.value)} className="px-5 py-3 border-2 border-primary/40 rounded-xl bg-background/50 backdrop-blur-xl hover:border-primary/60 transition-all focus:ring-2 focus:ring-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] font-medium">
                {globalBrands?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <WidgetCPIScore key={`cpi-${refreshKey}`} brandId={selectedBrandId || undefined} />
          <Card className="relative overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/50 via-background to-purple-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] hover:border-purple-400/60 transition-all duration-500 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 border border-purple-400/50 shadow-lg shadow-purple-500/40">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base font-bold text-purple-100">Governance Score</CardTitle>
              </div>
              <CardDescription className="text-xs text-purple-300/70">Semantic Governance Quality</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-black bg-gradient-to-r from-purple-300 via-violet-200 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">{governanceScore}</div>
                <div className="text-lg text-purple-400/80 font-medium">/100</div>
              </div>
              <p className="text-xs text-purple-300/60 mt-3">
                Média de confiança entre todos os LLMs monitorados
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="relative overflow-hidden border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/50 via-background to-cyan-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:shadow-[0_0_60px_rgba(6,182,212,0.25)] hover:border-cyan-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-cyan-100">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/50 shadow-lg shadow-cyan-500/40">
                <Network className="h-5 w-5 text-white" />
              </div>
              LLMs Monitored
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">{consensusData.length}</div>
            <p className="text-xs text-cyan-300/60 mt-2">Active Observational Nodes</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 via-background to-emerald-900/20 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:shadow-[0_0_60px_rgba(16,185,129,0.25)] hover:border-emerald-400/60 transition-all duration-500 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-500" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-bold flex items-center gap-3 text-emerald-100">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-400/50 shadow-lg shadow-emerald-500/40">
                <GitCompare className="h-5 w-5 text-white" />
              </div>
              Convergence
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
              {consensusData.length > 0 
                ? Math.round((consensusData.reduce((sum, c) => sum + c.confidence, 0) / consensusData.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-emerald-300/60 mt-2">Cognitive Alignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="convergence" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border-2 border-primary/40 p-2 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <TabsTrigger value="convergence" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-400 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(16,185,129,0.5)] rounded-xl py-3 font-bold transition-all duration-300 hover:bg-emerald-500/20">Convergência Cognitiva</TabsTrigger>
          <TabsTrigger value="coherence" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-400 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.5)] rounded-xl py-3 font-bold transition-all duration-300 hover:bg-purple-500/20">Matriz de Coerência</TabsTrigger>
          <TabsTrigger value="consensus" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.5)] rounded-xl py-3 font-bold transition-all duration-300 hover:bg-cyan-500/20">Consenso Multi-LLM</TabsTrigger>
        </TabsList>

        {/* Convergence Tab */}
        <TabsContent value="convergence" className="space-y-6">
          <Card className="relative overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-background to-green-950/20 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.15)] hover:shadow-[0_0_70px_rgba(16,185,129,0.25)] hover:border-emerald-400/60 transition-all duration-500 group">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/25 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <GitCompare className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-300 via-green-200 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
                  Convergência Temporal entre LLMs
                </span>
              </CardTitle>
              <CardDescription className="text-base mt-3 text-emerald-200/60">
                Análise da estabilidade cognitiva ao longo do tempo — Como diferentes IAs convergem na percepção da marca
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={convergenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '2px solid rgba(16,185,129,0.4)', borderRadius: '16px', boxShadow: '0 0 30px rgba(16,185,129,0.2)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="openai" stroke="#10b981" name="OpenAI" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="claude" stroke="#8b5cf6" name="Claude" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
                    <Line type="monotone" dataKey="gemini" stroke="#3b82f6" name="Gemini" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="perplexity" stroke="#f59e0b" name="Perplexity" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-background to-orange-950/20 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] hover:shadow-[0_0_60px_rgba(245,158,11,0.25)] hover:border-amber-400/60 transition-all duration-500 group">
            <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all duration-500" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="font-black text-xl bg-gradient-to-r from-amber-300 via-orange-200 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
                  Interpretação da Convergência
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm relative z-10">
              <p className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><span className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span><strong className="text-emerald-300">Alta convergência (&gt;80%):</strong> <span className="text-emerald-200/80">IAs concordam fortemente sobre a marca — governança semântica estável</span></p>
              <p className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"><span className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span><strong className="text-amber-300">Convergência moderada (60-80%):</strong> <span className="text-amber-200/80">Percepção alinhada com variações esperadas</span></p>
              <p className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30"><span className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span><strong className="text-red-300">Baixa convergência (&lt;60%):</strong> <span className="text-red-200/80">Divergência cognitiva — requer análise de contexto</span></p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coherence Matrix Tab */}
        <TabsContent value="coherence" className="space-y-6">
          <Card className="relative overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-background to-violet-950/20 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] hover:shadow-[0_0_70px_rgba(168,85,247,0.25)] hover:border-purple-400/60 transition-all duration-500 group">
            <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 group-hover:bg-purple-500/25 transition-all duration-700" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-700" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 border border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                  <Network className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-purple-300 via-violet-200 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
                  Matriz de Coerência Semântica
                </span>
              </CardTitle>
              <CardDescription className="text-base mt-3 text-purple-200/60">
                Mapa de concordância entre diferentes LLMs — Quanto cada IA "concorda" com as outras
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="overflow-x-auto rounded-2xl border-2 border-purple-500/30 bg-purple-950/30 shadow-inner">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-purple-500/40 bg-gradient-to-r from-purple-900/50 via-purple-800/30 to-purple-900/50">
                      <th className="p-5 text-left font-black text-purple-200">LLM</th>
                      <th className="p-5 text-center font-black text-emerald-400">OpenAI</th>
                      <th className="p-5 text-center font-black text-purple-400">Claude</th>
                      <th className="p-5 text-center font-black text-cyan-400">Gemini</th>
                      <th className="p-5 text-center font-black text-amber-400">Perplexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coherenceMatrix.map((row) => (
                      <tr key={row.llm} className="border-b border-purple-500/20 hover:bg-purple-500/10 transition-all duration-300">
                        <td className="p-5 font-bold text-purple-100">{row.llm}</td>
                        <td className="p-5 text-center">
                          <div 
                            className="inline-block px-5 py-2.5 rounded-xl font-black text-sm shadow-lg"
                            style={{
                              backgroundColor: row.openai >= 80 ? '#10b981' : row.openai >= 50 ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              boxShadow: row.openai >= 80 ? '0 0 20px rgba(16,185,129,0.4)' : row.openai >= 50 ? '0 0 20px rgba(245,158,11,0.4)' : '0 0 20px rgba(239,68,68,0.4)'
                            }}
                          >
                            {row.openai}%
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div 
                            className="inline-block px-5 py-2.5 rounded-xl font-black text-sm shadow-lg"
                            style={{
                              backgroundColor: row.claude >= 80 ? '#10b981' : row.claude >= 50 ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              boxShadow: row.claude >= 80 ? '0 0 20px rgba(16,185,129,0.4)' : row.claude >= 50 ? '0 0 20px rgba(245,158,11,0.4)' : '0 0 20px rgba(239,68,68,0.4)'
                            }}
                          >
                            {row.claude}%
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div 
                            className="inline-block px-5 py-2.5 rounded-xl font-black text-sm shadow-lg"
                            style={{
                              backgroundColor: row.gemini >= 80 ? '#10b981' : row.gemini >= 50 ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              boxShadow: row.gemini >= 80 ? '0 0 20px rgba(16,185,129,0.4)' : row.gemini >= 50 ? '0 0 20px rgba(245,158,11,0.4)' : '0 0 20px rgba(239,68,68,0.4)'
                            }}
                          >
                            {row.gemini}%
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div 
                            className="inline-block px-5 py-2.5 rounded-xl font-black text-sm shadow-lg"
                            style={{
                              backgroundColor: row.perplexity >= 80 ? '#10b981' : row.perplexity >= 50 ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              boxShadow: row.perplexity >= 80 ? '0 0 20px rgba(16,185,129,0.4)' : row.perplexity >= 50 ? '0 0 20px rgba(245,158,11,0.4)' : '0 0 20px rgba(239,68,68,0.4)'
                            }}
                          >
                            {row.perplexity}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/40 via-violet-900/20 to-purple-900/40 rounded-2xl border-2 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-lg font-black bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent">Metacognição IGO:</p>
                </div>
                <p className="text-sm text-purple-200/70 leading-relaxed">
                  A matriz mostra o grau de "acordo" entre IAs diferentes. Valores altos indicam que múltiplas IAs 
                  geram percepções similares da marca, validando a governança semântica. Esta é a essência do 
                  <strong className="text-purple-300"> IGO Framework</strong> — uma IA observando e validando outras.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consensus Tab */}
        <TabsContent value="consensus" className="space-y-6">
          <Card className="relative overflow-hidden border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 via-background to-blue-950/20 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] hover:shadow-[0_0_70px_rgba(6,182,212,0.25)] hover:border-cyan-400/60 transition-all duration-500 group">
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/25 transition-all duration-700" />
            <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
                  Consenso Multi-LLM — Radar de Observabilidade
                </span>
              </CardTitle>
              <CardDescription className="text-base mt-3 text-cyan-200/60">
                Análise radial das métricas de cada LLM — Confiança, Sentimento e Volume de Menções
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
                </div>
              ) : radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--muted-foreground) / 0.3)" />
                    <PolarAngleAxis 
                      dataKey="provider" 
                      tick={{ fontSize: 14, fill: 'hsl(var(--foreground))' }}
                    />
                    <PolarRadiusAxis angle={45} domain={[0, 100]} />
                    <Radar name="Confiança" dataKey="Confiança" stroke="#10b981" fill="#10b981" fillOpacity={0.5} strokeWidth={2} />
                    <Radar name="Sentimento" dataKey="Sentimento" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Menções" dataKey="Menções" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                    <Legend />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '2px solid rgba(6,182,212,0.4)', borderRadius: '16px', boxShadow: '0 0 30px rgba(6,182,212,0.2)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-cyan-300/60">
                  Sem dados suficientes para análise de consenso
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {consensusData.map((llm, index) => {
              const colors = [
                { border: 'border-emerald-500/40', bg: 'from-emerald-950/40', icon: 'from-emerald-500 to-green-600', text: 'from-emerald-300 to-green-300', shadow: '0_0_30px_rgba(16,185,129,0.3)', glow: 'bg-emerald-500/20' },
                { border: 'border-purple-500/40', bg: 'from-purple-950/40', icon: 'from-purple-500 to-violet-600', text: 'from-purple-300 to-violet-300', shadow: '0_0_30px_rgba(168,85,247,0.3)', glow: 'bg-purple-500/20' },
                { border: 'border-cyan-500/40', bg: 'from-cyan-950/40', icon: 'from-cyan-500 to-blue-600', text: 'from-cyan-300 to-blue-300', shadow: '0_0_30px_rgba(6,182,212,0.3)', glow: 'bg-cyan-500/20' },
                { border: 'border-amber-500/40', bg: 'from-amber-950/40', icon: 'from-amber-500 to-orange-600', text: 'from-amber-300 to-orange-300', shadow: '0_0_30px_rgba(245,158,11,0.3)', glow: 'bg-amber-500/20' },
              ];
              const color = colors[index % colors.length];
              return (
                <Card key={llm.provider} className={`relative overflow-hidden border-2 ${color.border} bg-gradient-to-br ${color.bg} via-background to-background backdrop-blur-xl shadow-[${color.shadow}] hover:shadow-[${color.shadow.replace('0.3', '0.5')}] transition-all duration-500 group`}>
                  <div className={`absolute top-0 right-0 w-40 h-40 ${color.glow} rounded-full blur-3xl group-hover:w-48 group-hover:h-48 transition-all duration-500`} />
                  <CardHeader className="pb-4 relative z-10">
                    <CardTitle className={`text-2xl font-black bg-gradient-to-r ${color.text} bg-clip-text text-transparent drop-shadow-lg`}>{llm.provider}</CardTitle>
                    <CardDescription className="text-muted-foreground/80">Métricas Observacionais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-sm font-medium text-emerald-200/80">Confiança:</span>
                      <span className="font-black text-xl text-emerald-400 drop-shadow-lg">{Math.round(llm.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <span className="text-sm font-medium text-purple-200/80">Sentimento:</span>
                      <span className="font-black text-xl text-purple-400 drop-shadow-lg">{Math.round(llm.sentiment)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-sm font-medium text-amber-200/80">Menções:</span>
                      <Badge className={`bg-gradient-to-r ${color.icon} text-white border-0 shadow-lg px-5 py-1.5 text-sm font-bold`} style={{ boxShadow: color.shadow.replace('0_0_30px', '0 0 15px') }}>{llm.mentions}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden charts for PDF export */}
      <div className="fixed -left-[9999px] top-0">
        {/* CPI History Chart */}
        <div id="cpi-history-chart" data-pdf-export="true" className="bg-white p-8" style={{ width: '900px', height: '500px' }}>
          <h3 className="text-xl font-bold mb-6 text-gray-800">Histórico do CPI Score (30 dias)</h3>
          {cpiData.history.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={cpiData.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpi" stroke="#3b82f6" strokeWidth={3} name="CPI Score" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[380px] flex items-center justify-center text-gray-500">
              Sem dados históricos disponíveis
            </div>
          )}
        </div>

        {/* Convergence Chart */}
        <div id="convergence-chart" data-pdf-export="true" className="bg-white p-8" style={{ width: '900px', height: '500px' }}>
          <h3 className="text-xl font-bold mb-6 text-gray-800">Convergência Temporal entre LLMs</h3>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={convergenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="openai" stroke="#10b981" name="OpenAI" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="claude" stroke="#8b5cf6" name="Claude" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="gemini" stroke="#3b82f6" name="Gemini" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="perplexity" stroke="#f59e0b" name="Perplexity" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Coherence Matrix Chart */}
        <div id="coherence-matrix-chart" data-pdf-export="true" className="bg-white p-8" style={{ width: '900px', minHeight: '600px' }}>
          <h3 className="text-xl font-bold mb-6 text-gray-800">Matriz de Coerência Semântica</h3>
          <div className="overflow-visible">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="p-4 text-left font-bold text-gray-700">LLM</th>
                  <th className="p-4 text-center font-bold text-gray-700">OpenAI</th>
                  <th className="p-4 text-center font-bold text-gray-700">Claude</th>
                  <th className="p-4 text-center font-bold text-gray-700">Gemini</th>
                  <th className="p-4 text-center font-bold text-gray-700">Perplexity</th>
                </tr>
              </thead>
              <tbody>
                {coherenceMatrix.map((row) => (
                  <tr key={row.llm} className="border-b border-gray-200">
                    <td className="p-4 font-semibold text-gray-800">{row.llm}</td>
                    <td className="p-4 text-center">
                      <div 
                        className="inline-block px-4 py-2 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: row.openai >= 80 ? '#10b981' : row.openai >= 50 ? '#f59e0b' : '#ef4444',
                          color: 'white'
                        }}
                      >
                        {row.openai}%
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div 
                        className="inline-block px-4 py-2 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: row.claude >= 80 ? '#10b981' : row.claude >= 50 ? '#f59e0b' : '#ef4444',
                          color: 'white'
                        }}
                      >
                        {row.claude}%
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div 
                        className="inline-block px-4 py-2 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: row.gemini >= 80 ? '#10b981' : row.gemini >= 50 ? '#f59e0b' : '#ef4444',
                          color: 'white'
                        }}
                      >
                        {row.gemini}%
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div 
                        className="inline-block px-4 py-2 rounded-lg font-bold text-sm"
                        style={{
                          backgroundColor: row.perplexity >= 80 ? '#10b981' : row.perplexity >= 50 ? '#f59e0b' : '#ef4444',
                          color: 'white'
                        }}
                      >
                        {row.perplexity}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-bold mb-3 text-gray-800">Metacognição IGO:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              A matriz mostra o grau de "acordo" entre IAs diferentes. Valores altos indicam que múltiplas IAs 
              geram percepções similares da marca, validando a governança semântica. Esta é a essência do 
              <strong> IGO Framework</strong> — uma IA observando e validando outras.
            </p>
          </div>
        </div>

        {/* Consensus Radar Chart */}
        <div id="consensus-radar-chart" data-pdf-export="true" className="bg-white p-8" style={{ width: '900px', height: '600px' }}>
          <h3 className="text-xl font-bold mb-6 text-gray-800">Consenso Multi-LLM — Radar de Observabilidade</h3>
          <p className="text-sm text-gray-600 mb-6">Análise radial das métricas de cada LLM — Confiança, Sentimento e Volume de Menções</p>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="provider" 
                  tick={{ fontSize: 14, fill: '#374151' }}
                />
                <PolarRadiusAxis angle={45} domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Radar name="Confiança" dataKey="Confiança" stroke="#10b981" fill="#10b981" fillOpacity={0.5} strokeWidth={2} />
                <Radar name="Sentimento" dataKey="Sentimento" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                <Radar name="Menções" dataKey="Menções" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[450px] flex items-center justify-center text-gray-500">
              Sem dados suficientes para análise de consenso
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
