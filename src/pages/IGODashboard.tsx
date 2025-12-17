import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Network, GitCompare, Activity, TrendingUp, RefreshCw, Download } from "lucide-react";
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

      <div className="container mx-auto p-6 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  IGO Framework Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground">
                Inteligência Generativa Observacional — IA observando IA
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {selectedBrandId && (
                <RealCollectionButton 
                  brandId={selectedBrandId}
                  brandName={globalBrands?.find(b => b.id === selectedBrandId)?.name || ''}
                  onComplete={() => {
                    recalculateMetrics();
                  }}
                />
              )}
              <Button onClick={handleExportPDF} disabled={isExporting || !selectedBrandId} className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25">
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={recalculateMetrics} disabled={isRecalculating || !selectedBrandId} variant="outline" className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
                Recalcular CPI
              </Button>
              <select value={selectedBrandId || ""} onChange={(e) => setSelectedBrandId(e.target.value)} className="px-4 py-2 border border-primary/30 rounded-lg bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all focus:ring-2 focus:ring-primary/20">
                {globalBrands?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <WidgetCPIScore key={`cpi-${refreshKey}`} brandId={selectedBrandId || undefined} />
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Governance Score</CardTitle>
              </div>
              <CardDescription className="text-xs">Semantic Governance Quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold">{governanceScore}</div>
                <div className="text-sm text-muted-foreground">/100</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Média de confiança entre todos os LLMs monitorados
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="h-4 w-4 text-secondary" />
              LLMs Monitored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consensusData.length}</div>
            <p className="text-xs text-muted-foreground">Active Observational Nodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-accent" />
              Convergence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {consensusData.length > 0 
                ? Math.round((consensusData.reduce((sum, c) => sum + c.confidence, 0) / consensusData.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Cognitive Alignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="convergence" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="convergence">Convergência Cognitiva</TabsTrigger>
          <TabsTrigger value="coherence">Matriz de Coerência</TabsTrigger>
          <TabsTrigger value="consensus">Consenso Multi-LLM</TabsTrigger>
        </TabsList>

        {/* Convergence Tab */}
        <TabsContent value="convergence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Convergência Temporal entre LLMs
              </CardTitle>
              <CardDescription>
                Análise da estabilidade cognitiva ao longo do tempo — Como diferentes IAs convergem na percepção da marca
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={convergenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="openai" stroke="#10b981" name="OpenAI" strokeWidth={2} />
                    <Line type="monotone" dataKey="claude" stroke="#8b5cf6" name="Claude" strokeWidth={2} />
                    <Line type="monotone" dataKey="gemini" stroke="#3b82f6" name="Gemini" strokeWidth={2} />
                    <Line type="monotone" dataKey="perplexity" stroke="#f59e0b" name="Perplexity" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="text-lg">📊 Interpretação da Convergência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Alta convergência (&gt;80%):</strong> IAs concordam fortemente sobre a marca — governança semântica estável</p>
              <p><strong>Convergência moderada (60-80%):</strong> Percepção alinhada com variações esperadas</p>
              <p><strong>Baixa convergência (&lt;60%):</strong> Divergência cognitiva — requer análise de contexto</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coherence Matrix Tab */}
        <TabsContent value="coherence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Matriz de Coerência Semântica
              </CardTitle>
              <CardDescription>
                Mapa de concordância entre diferentes LLMs — Quanto cada IA "concorda" com as outras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-semibold">LLM</th>
                      <th className="p-3 text-center font-semibold">OpenAI</th>
                      <th className="p-3 text-center font-semibold">Claude</th>
                      <th className="p-3 text-center font-semibold">Gemini</th>
                      <th className="p-3 text-center font-semibold">Perplexity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coherenceMatrix.map((row) => (
                      <tr key={row.llm} className="border-b">
                        <td className="p-3 font-medium">{row.llm}</td>
                        <td className="p-3 text-center">
                          <div 
                            className="inline-block px-3 py-1 rounded font-semibold text-sm"
                            style={{
                              backgroundColor: `hsl(${row.openai * 1.2}, 70%, ${90 - row.openai * 0.4}%)`,
                              color: row.openai > 50 ? 'white' : 'black'
                            }}
                          >
                            {row.openai}%
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div 
                            className="inline-block px-3 py-1 rounded font-semibold text-sm"
                            style={{
                              backgroundColor: `hsl(${row.claude * 1.2}, 70%, ${90 - row.claude * 0.4}%)`,
                              color: row.claude > 50 ? 'white' : 'black'
                            }}
                          >
                            {row.claude}%
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div 
                            className="inline-block px-3 py-1 rounded font-semibold text-sm"
                            style={{
                              backgroundColor: `hsl(${row.gemini * 1.2}, 70%, ${90 - row.gemini * 0.4}%)`,
                              color: row.gemini > 50 ? 'white' : 'black'
                            }}
                          >
                            {row.gemini}%
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div 
                            className="inline-block px-3 py-1 rounded font-semibold text-sm"
                            style={{
                              backgroundColor: `hsl(${row.perplexity * 1.2}, 70%, ${90 - row.perplexity * 0.4}%)`,
                              color: row.perplexity > 50 ? 'white' : 'black'
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

              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-semibold mb-2">🧠 Metacognição IGO:</p>
                <p className="text-sm text-muted-foreground">
                  A matriz mostra o grau de "acordo" entre IAs diferentes. Valores altos indicam que múltiplas IAs 
                  geram percepções similares da marca, validando a governança semântica. Esta é a essência do 
                  <strong> IGO Framework</strong> — uma IA observando e validando outras.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consensus Tab */}
        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Consenso Multi-LLM — Radar de Observabilidade
              </CardTitle>
              <CardDescription>
                Análise radial das métricas de cada LLM — Confiança, Sentimento e Volume de Menções
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="provider" 
                      tick={{ fontSize: 12, dy: -10 }}
                    />
                    <PolarRadiusAxis angle={45} domain={[0, 100]} />
                    <Radar name="Confiança" dataKey="Confiança" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                    <Radar name="Sentimento" dataKey="Sentimento" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Radar name="Menções" dataKey="Menções" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Sem dados suficientes para análise de consenso
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consensusData.map((llm) => (
              <Card key={llm.provider}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{llm.provider}</CardTitle>
                  <CardDescription>Métricas Observacionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confiança:</span>
                    <span className="font-bold">{Math.round(llm.confidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sentimento:</span>
                    <span className="font-bold">{Math.round(llm.sentiment)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Menções:</span>
                    <Badge variant="secondary">{llm.mentions}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <p className="text-sm font-bold mb-3 text-gray-800">🧠 Metacognição IGO:</p>
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
