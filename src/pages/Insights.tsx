import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Home,
  Lightbulb,
  TrendingUp,
  FileText,
  Clock,
  Brain,
  Calendar,
  Plus,
  Settings,
  Trash2,
  Share2,
  Play,
  Download,
  Copy,
  Mail,
  Layers,
  Link,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { InsightListSkeleton } from "@/components/InsightSkeleton";
import { useRetry } from "@/hooks/useRetry";
import { useDebounce } from "@/hooks/useDebounce";
import { queryCache } from "@/utils/queryCache";
import { validateInsight } from "@/utils/dataValidation";
import { performanceMonitor } from "@/utils/performance";
import { logger } from "@/utils/logger";
import { MetricsGuide } from "@/components/metrics/MetricsGuide";
import { MetricInterpretationBadge } from "@/components/metrics/MetricInterpretationBadge";
import { MetricsOverviewCard } from "@/components/metrics/MetricsOverviewCard";

interface AIInsight {
  id: string;
  type: "prediction" | "suggestion" | "report" | "summary";
  title: string;
  content: any;
  created_at: string;
  brand_id?: string;
  brands?: {
    name: string;
  };
}

interface ScheduledReport {
  id: string;
  report_type: string;
  frequency: string;
  enabled: boolean;
  next_run: string | null;
  last_run: string | null;
}

interface GeneratedReport {
  id: string;
  report_type: string;
  generated_at: string;
  status: string;
  content: any;
  email_sent: boolean;
}

// ✅ Componente auxiliar para exibir métricas KAPI dentro de insights
// GARANTIDO: Funciona para TODAS as marcas de forma consistente
const InsightMetricsSection = ({ brandId, brandName }: { brandId: string; brandName?: string }) => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["insight-kapi-metrics", brandId],
    queryFn: async () => {
      if (!brandId) {
        logger.debug("Sem brandId para buscar métricas KAPI");
        return null;
      }

      // Buscar ICE, GAP, Stability de igo_metrics_history
      const { data: igoData, error: igoError } = await supabase
        .from("igo_metrics_history")
        .select("ice, gap, cognitive_stability")
        .eq("brand_id", brandId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar CPI de geo_scores (FONTE OFICIAL)
      const { data: geoData, error: geoError } = await supabase
        .from("geo_scores")
        .select("cpi")
        .eq("brand_id", brandId)
        .gt("cpi", 0)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (igoError && geoError) {
        logger.warn("Erro ao buscar métricas KAPI para exibição", { igoError, geoError, brandId });
        return null;
      }

      const combinedData = {
        ice: igoData?.ice || 0,
        gap: igoData?.gap || 0,
        cognitive_stability: igoData?.cognitive_stability || 0,
        cpi: geoData?.cpi || igoData?.cognitive_stability || 0 // CPI de geo_scores ou fallback
      };

      logger.info("Métricas KAPI carregadas para exibição (CPI de geo_scores)", { brandId, cpi: combinedData.cpi });

      return combinedData;
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Não exibir se estiver carregando, sem dados, ou com erro
  if (isLoading || !metrics || error) return null;

  return (
    <div className="mt-4 mb-4">
      <MetricsOverviewCard
        brandName={brandName}
        ice={metrics.ice}
        gap={metrics.gap}
        cpi={metrics.cpi}
        stability={metrics.cognitive_stability}
        className="border-primary/20"
      />
    </div>
  );
};

const Insights = () => {
  const { user } = useAuth();
  const { selectedBrandId, setSelectedBrandId, brands, isLoading: brandsLoading } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { executeWithRetry } = useRetry();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [reportType, setReportType] = useState("");
  const [emailForSchedule, setEmailForSchedule] = useState("");

  // Debounce dos filtros para evitar queries desnecessárias
  const debouncedType = useDebounce(selectedType, 300);
  const debouncedBrandId = useDebounce(selectedBrandId, 300);

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ["ai-insights", user?.id, debouncedType, debouncedBrandId],
    queryFn: async () => {
      const endMeasure = performanceMonitor.startMeasure('fetch-insights');
      
      logger.debug('Buscando insights com filtros', {
        userId: user!.id,
        type: debouncedType,
        brandId: debouncedBrandId
      });
      
      const cacheKey = `insights-${user!.id}-${debouncedType}-${debouncedBrandId}`;
      
      // NÃO USAR CACHE - sempre buscar dados frescos para evitar problemas
      // const cached = queryCache.get<AIInsight[]>(cacheKey);
      // if (cached) {
      //   console.log('[CACHE] Usando insights do cache');
      //   endMeasure();
      //   return cached;
      // }

      let query = supabase
        .from("ai_insights")
        .select(`
          *,
          brands (
            name
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      // Mapeamento de tipos:
      // - "prediction" = Análises Preditivas (geradas por ai-predictions)
      // - "report" = Relatórios Completos (gerados por ai-report-generator)
      // - "summary" = Resumos de URL (gerados por analyze-url) ✅ TIPO PRÓPRIO
      // - "suggestion" = Sugestões (dentro de predictions)
      
      if (debouncedType !== "all" && debouncedType !== "suggestion") {
        // Filtrar pelo tipo exato (prediction, report, summary)
        query = query.eq("type", debouncedType);
        logger.debug('Filtrando por tipo', { type: debouncedType });
      } else if (debouncedType === "suggestion") {
        // Sugestões estão dentro das análises preditivas
        query = query.eq("type", "prediction");
        logger.debug('Buscando sugestões (type=prediction)');
      }

      // Filtro de marca - SEMPRE incluir insights com brand_id null para relatórios comparativos
      if (debouncedBrandId !== "all") {
        query = query.or(`brand_id.eq.${debouncedBrandId},brand_id.is.null`);
        logger.debug('Filtrando por marca ou null', { brandId: debouncedBrandId });
      }

      const { data, error } = await query;
      if (error) {
        logger.error("Erro ao buscar insights", { error });
        throw error;
      }
      
      logger.debug('Dados retornados da query', { count: data?.length || 0 });
      
      // Validar dados antes de retornar
      const validatedData = data?.map(item => {
        const validation = validateInsight(item);
        if (!validation.success) {
          logger.warn('Insight inválido', { insightId: item.id });
        }
        return item;
      }) || [];
      
      logger.info("Insights encontrados", { count: validatedData.length });
      
      // Salvar no cache por 30 segundos apenas
      queryCache.set(cacheKey, validatedData as AIInsight[], 30 * 1000);
      
      endMeasure();
      return validatedData as AIInsight[];
    },
    enabled: !!user,
    staleTime: 0, // SEMPRE considerar dados stale para forçar refetch
    gcTime: 30 * 1000, // Manter cache por 30 segundos apenas
  });

  // Memoizar insights filtrados para evitar re-renders desnecessários
  const filteredInsights = useMemo(() => {
    return insights || [];
  }, [insights]);

  // Buscar métricas IGO mais recentes da marca selecionada (CPI de geo_scores)
  const { data: igoMetrics } = useQuery({
    queryKey: ["igo-metrics-latest", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId || selectedBrandId === "all") return null;

      // ICE, GAP, Stability de igo_metrics_history
      const { data: igoData } = await supabase
        .from("igo_metrics_history")
        .select("ice, gap, cognitive_stability")
        .eq("brand_id", selectedBrandId)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // CPI de geo_scores (FONTE OFICIAL)
      const { data: geoData } = await supabase
        .from("geo_scores")
        .select("cpi")
        .eq("brand_id", selectedBrandId)
        .gt("cpi", 0)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ice: igoData?.ice || 0,
        gap: igoData?.gap || 0,
        cognitive_stability: igoData?.cognitive_stability || 0,
        cpi: geoData?.cpi || 0
      };
    },
    enabled: !!selectedBrandId && selectedBrandId !== "all",
  });

  // ✅ Hook reutilizável para buscar métricas KAPI de qualquer marca
  // GARANTIDO: CPI vem de geo_scores (fonte oficial)
  const useInsightMetrics = (brandId: string | undefined) => {
    return useQuery({
      queryKey: ["insight-kapi-metrics", brandId],
      queryFn: async () => {
        if (!brandId) {
          logger.debug("Hook useInsightMetrics: brandId não fornecido");
          return null;
        }

        // ICE, GAP, Stability de igo_metrics_history
        const { data: igoData } = await supabase
          .from("igo_metrics_history")
          .select("ice, gap, cognitive_stability, brand_id")
          .eq("brand_id", brandId)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // CPI de geo_scores (FONTE OFICIAL)
        const { data: geoData } = await supabase
          .from("geo_scores")
          .select("cpi")
          .eq("brand_id", brandId)
          .gt("cpi", 0)
          .order("computed_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const combined = {
          ice: igoData?.ice || 0,
          gap: igoData?.gap || 0,
          cognitive_stability: igoData?.cognitive_stability || 0,
          cpi: geoData?.cpi || 0,
          brand_id: brandId
        };

        logger.info("Hook useInsightMetrics: Métricas carregadas (CPI de geo_scores)", { brandId, cpi: combined.cpi });

        return combined;
      },
      enabled: !!brandId,
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    });
  };

  const { data: schedules, refetch: refetchSchedules } = useQuery({
    queryKey: ["scheduled-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_reports")
        .select("*")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data as ScheduledReport[];
    },
    enabled: !!user,
  });

  const { data: generatedReports, refetch: refetchGeneratedReports } = useQuery({
    queryKey: ["generated-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("generated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as GeneratedReport[];
    },
    enabled: !!user,
  });

  const { data: userEmail } = useQuery({
    queryKey: ["user-email", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_configs")
        .select("email")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data?.email || "";
    },
    enabled: !!user,
  });

  const createSchedule = useMutation({
    mutationFn: async () => {
      if (!emailForSchedule || !emailForSchedule.includes("@")) {
        throw new Error("Por favor, insira um email válido para receber os relatórios");
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Usuário não autenticado");

      // Calcular next_run baseado na frequência
      const nextRun = new Date();
      if (frequency === "weekly") {
        nextRun.setDate(nextRun.getDate() + 7);
      } else if (frequency === "monthly") {
        nextRun.setMonth(nextRun.getMonth() + 1);
      } else if (frequency === "daily") {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      const { error } = await supabase.from("scheduled_reports").insert({
        user_id: authUser.id,
        report_type: reportType,
        frequency,
        enabled: true,
        next_run: nextRun.toISOString(),
      });

      if (error) throw error;

      // Salvar ou atualizar configuração de email do usuário
      const { error: alertError } = await supabase
        .from("alert_configs")
        .upsert({
          user_id: authUser.id,
          email: emailForSchedule,
          weekly_report: true,
        }, {
          onConflict: 'user_id'
        });

      if (alertError) logger.error("Erro ao salvar email", { error: alertError });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reports"] });
      queryClient.invalidateQueries({ queryKey: ["user-email"] });
      setShowNew(false);
      setFrequency("");
      setReportType("");
      setEmailForSchedule("");
      toast({ 
        title: "✅ Agendamento criado!", 
        description: `Os relatórios serão enviados automaticamente para ${emailForSchedule}` 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePrediction = useCallback(async () => {
    if (!user) return;

    setIsGenerating(true);
    const endMeasure = performanceMonitor.startMeasure('generate-prediction');
    
    toast({
      title: "🔄 Gerando Análise Preditiva em Tempo Real",
      description: "Aguarde enquanto processamos os dados atuais...",
    });
    
    try {
      // ✅ PASSO 1: Deletar análises preditivas anteriores desta marca (evitar histórico)
      const brandToClean = selectedBrandId !== "all" ? selectedBrandId : null;
      
      if (brandToClean) {
        // Deletar apenas análises preditivas desta marca específica
        await supabase
          .from("ai_insights")
          .delete()
          .eq("user_id", user.id)
          .eq("type", "prediction")
          .eq("brand_id", brandToClean);
        
        logger.info("Análises preditivas anteriores removidas para gerar nova", { brandId: brandToClean });
      } else {
        // Se "Todos", deletar todas as análises preditivas
        await supabase
          .from("ai_insights")
          .delete()
          .eq("user_id", user.id)
          .eq("type", "prediction");
        
        logger.info("Todas análises preditivas anteriores removidas");
      }

      // ✅ PASSO 2: Gerar nova análise em tempo real
      const { data, error } = await supabase.functions.invoke("ai-predictions", {
        body: { 
          userId: user.id,
          brandId: brandToClean
        },
      });

      if (error) {
        if (error.message?.includes("429") || error.message?.includes("excedido")) {
          throw new Error("Limite de requisições excedido. Por favor, aguarde alguns instantes.");
        } else if (error.message?.includes("402") || error.message?.includes("créditos")) {
          throw new Error("Créditos insuficientes. Adicione créditos à sua workspace.");
        }
        throw error;
      }

      queryCache.clear();
      
      toast({
        title: "✅ Análise preditiva gerada em tempo real!",
        description: "Dados atualizados com sucesso.",
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await queryClient.invalidateQueries({ queryKey: ["insights"] });
      await refetch();
      
    } catch (error: any) {
      logger.error("Erro ao gerar análise", { error });
      toast({
        title: "Erro ao gerar análise",
        description: error.message || "Não foi possível gerar a análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      endMeasure();
    }
  }, [user, selectedType, selectedBrandId, toast, refetch, queryClient]);

  // Mutation para deletar todos os insights do usuário
  const deleteAllInsights = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('ai_insights')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      // Resetar o cache completamente e forçar refetch
      queryClient.resetQueries({ queryKey: ['insights', user?.id] });
      await refetch();
      
      toast({
        title: "✅ Insights limpos",
        description: "Todos os insights antigos foram removidos com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao limpar insights",
        description: error.message || "Não foi possível limpar os insights",
        variant: "destructive",
      });
    },
  });

  const generateReport = async (type: 'individual' | 'comparative') => {
    if (!user) return;

    // Validação: relatório individual precisa de marca específica
    if (type === 'individual' && selectedBrandId === "all") {
      toast({
        title: "Selecione uma marca",
        description: "Para gerar um relatório individual, selecione uma marca específica",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await executeWithRetry(async () => {
        toast({
          title: type === 'individual' ? "Gerando Relatório Individual em Tempo Real" : "Gerando Relatório Comparativo em Tempo Real",
          description: "Aguarde enquanto processamos os dados atuais...",
        });
        
        const brandIds = selectedBrandId !== "all" ? [selectedBrandId] : brands?.map(b => b.id);
        
        // ✅ PASSO 1: Deletar relatórios anteriores desta marca (evitar histórico)
        if (type === 'individual' && selectedBrandId !== "all") {
          await supabase
            .from("ai_insights")
            .delete()
            .eq("user_id", user.id)
            .eq("type", "report")
            .eq("brand_id", selectedBrandId);
          
          logger.info("Relatórios anteriores removidos para gerar novo", { brandId: selectedBrandId });
        }
        
        // ✅ PASSO 2: Gerar novo relatório em tempo real
        const { data, error } = await supabase.functions.invoke("ai-report-generator", {
          body: { 
            userId: user.id, 
            reportType: type,
            brandIds: brandIds,
            period: "30days"
          },
        });

        if (error) {
          if (error.message?.includes("429") || error.message?.includes("excedido")) {
            throw new Error("Limite de requisições excedido. Por favor, aguarde alguns instantes e tente novamente.");
          } else if (error.message?.includes("402") || error.message?.includes("créditos")) {
            throw new Error("Créditos insuficientes. Por favor, adicione créditos à sua workspace.");
          }
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Buscar o insight recém-criado
        const { data: latestInsight, error: fetchError } = await supabase
          .from("ai_insights")
          .select(`
            *,
            brands (
              name
            )
          `)
          .eq("user_id", user.id)
          .eq("type", "report")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          logger.error("Erro ao buscar insight criado", { error: fetchError });
        }

        queryCache.clear();
        await queryClient.invalidateQueries({ queryKey: ["insights"] });
        await refetch();
        
        if (latestInsight) {
          toast({
            title: "✅ Relatório gerado em tempo real!",
            description: "Iniciando download do PDF...",
          });
          
          await downloadInsightPDF(latestInsight as AIInsight);
        } else {
          toast({
            title: "✅ Relatório gerado em tempo real!",
            description: "Dados atualizados com sucesso.",
          });
        }
        
      }, { maxAttempts: 2, delayMs: 2000 });
      
    } catch (error: any) {
      logger.error("Erro ao gerar relatório", { error });
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("scheduled_reports")
        .update({ enabled })
        .eq("id", scheduleId);

      if (error) throw error;

      refetchSchedules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_reports")
        .delete()
        .eq("id", scheduleId);

      if (error) throw error;

      toast({
        title: "Agendamento removido",
        description: "O relatório automático foi cancelado",
      });
      refetchSchedules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateManualReport = async (reportType: string) => {
    try {
      toast({
        title: "Processando...",
        description: "Gerando relatório. Aguarde alguns instantes.",
      });

      const { data, error } = await supabase.functions.invoke("generate-manual-report", {
        body: { reportType },
      });

      if (error) {
        logger.error("Erro na edge function", { error });
        throw new Error(error.message || "Falha ao gerar relatório");
      }

      toast({
        title: "✅ Relatório gerado",
        description: "O relatório foi gerado com sucesso e está disponível no histórico abaixo",
      });
      refetchGeneratedReports();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatReportForSharing = (report: GeneratedReport): string => {
    const brandName = report.content?.brandName || "Múltiplas Marcas";
    let text = `📊 ${report.content?.title || `${brandName} - RELATÓRIO ${report.report_type.toUpperCase()}`}\n`;
    text += `📅 Gerado em: ${new Date(report.generated_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}\n`;
    text += `\n${"=".repeat(50)}\n\n`;

    if (report.content?.brands && Array.isArray(report.content.brands)) {
      text += `📈 RESUMO GERAL\n`;
      text += `Total de Menções: ${report.content.totalMentions || 0}\n`;
      text += `Marcas Analisadas: ${report.content.brands.length}\n\n`;

      if (report.content.period) {
        text += `📅 Período: ${new Date(report.content.period.start).toLocaleDateString("pt-BR")} até ${new Date(report.content.period.end).toLocaleDateString("pt-BR")}\n\n`;
      }

      text += `${"=".repeat(50)}\n\n`;

      text += `🏆 DESEMPENHO POR MARCA\n\n`;
      report.content.brands.forEach((brand: any, idx: number) => {
        text += `${idx + 1}. ${brand.name}\n`;
        text += `   • Score: ${brand.score}/10\n`;
        text += `   • Menções: ${brand.mentions}\n`;
        text += `\n`;
      });
    }

    text += `${"=".repeat(50)}\n\n`;
    text += `Gerado automaticamente pela plataforma Teia GEO — Inteligência Artificial Generativa Observacional\n`;

    return text;
  };

  const copyReportToClipboard = async (report: GeneratedReport) => {
    try {
      const formattedText = formatReportForSharing(report);
      await navigator.clipboard.writeText(formattedText);
      
      toast({
        title: "✅ Copiado!",
        description: "Relatório copiado para a área de transferência. Pronto para colar no WhatsApp ou email!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao copiar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    try {
      const formattedText = formatReportForSharing(report);
      const blob = new Blob([formattedText], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const brandName = report.content?.brandName || "multiplas-marcas";
      const sanitizedBrandName = brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      link.download = `relatorio-${sanitizedBrandName}-${report.report_type}-${new Date(report.generated_at).toISOString().split('T')[0]}.txt`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Download iniciado",
        description: "O relatório foi baixado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao baixar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from("ai_insights")
        .delete()
        .eq("id", insightId);

      if (error) throw error;

      toast({
        title: "Insight removido",
        description: "A análise foi excluída com sucesso",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadInsightPDF = async (insight: AIInsight, onlySuggestions: boolean = false) => {
    try {
      // ✅ BUSCAR MÉTRICAS KAPI PARA TODAS AS MARCAS - CPI de geo_scores
      let kapiMetrics = null;
      if (insight.brand_id) {
        try {
          // ICE, GAP, Stability de igo_metrics_history
          const { data: igoData } = await supabase
            .from('igo_metrics_history')
            .select('ice, gap, cognitive_stability')
            .eq('brand_id', insight.brand_id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // CPI de geo_scores (FONTE OFICIAL)
          const { data: geoData } = await supabase
            .from('geo_scores')
            .select('cpi')
            .eq('brand_id', insight.brand_id)
            .gt('cpi', 0)
            .order('computed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          kapiMetrics = {
            ice: igoData?.ice || 0,
            gap: igoData?.gap || 0,
            cognitive_stability: igoData?.cognitive_stability || 0,
            cpi: geoData?.cpi || 0
          };
          
          logger.info('Métricas KAPI carregadas para PDF (CPI de geo_scores)', { 
            brandId: insight.brand_id,
            cpi: kapiMetrics.cpi 
          });
        } catch (error) {
          logger.error('Erro inesperado ao buscar métricas KAPI', { 
            error, 
            brandId: insight.brand_id 
          });
        }
      } else {
        logger.debug('Insight sem brand_id - pulando métricas KAPI', { 
          insightId: insight.id 
        });
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = 20;

      // Função para adicionar rodapé em uma página específica
      const addFooter = (pageNum: number, totalPages: number) => {
        const currentY = yPosition; // Salvar posição atual
        
        // Linha separadora
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        // Texto do rodapé
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        
        const footerText = `Página ${pageNum} de ${totalPages}`;
        const dateText = `Gerado pelo Sistema Teia GEO - ${new Date().toLocaleDateString("pt-BR")}`;
        
        doc.text(footerText, margin, pageHeight - 10);
        doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), pageHeight - 10);
        
        yPosition = currentY; // Restaurar posição
      };

      // Função auxiliar para verificar e adicionar nova página
      const checkAddPage = (neededSpace: number = 30) => {
        // FIX: Aumentar margem de segurança para 30 e só adicionar se realmente necessário
        if (yPosition + neededSpace > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Título - SEMPRE usar terminologia correta
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      
      // Determinar o título correto baseado no contexto
      let title: string;
      if (onlySuggestions) {
        title = "Sugestões Inteligentes";
      } else if (insight.type === "summary") {
        title = "Resumo de Análise de URL";
      } else if (insight.type === "prediction") {
        title = "Análise Preditiva Completa";
      } else if (insight.type === "report") {
        title = "Relatório GEO Completo";
      } else {
        title = insight.title;
      }
      
      const titleLines = doc.splitTextToSize(title, maxWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8 + 2;

      // Data
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        new Date(insight.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        margin,
        yPosition
      );
      yPosition += 15;

      // SEÇÃO: MÉTRICAS KAPI (se disponíveis)
      if (kapiMetrics && !onlySuggestions) {
        checkAddPage(70);
        
        // Título da seção com fundo azul
        doc.setFillColor(59, 130, 246); // blue-500
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        const sectionTitle = `Visão Geral das Métricas KAPI${insight.brands?.name ? ` - ${insight.brands.name}` : ''}`;
        doc.text(sectionTitle, margin + 3, yPosition + 2);
        yPosition += 14;

        // Helper para obter cor e interpretação - CONFORME kapiMetrics.ts
        const getMetricInfo = (metricType: string, value: number) => {
          if (metricType === 'ice') {
            // ICE: lógica DIRETA (maior = melhor)
            if (value >= 90) return { color: [16, 185, 129], label: 'Excelente', bgColor: [16, 185, 129, 0.1] };
            if (value >= 75) return { color: [234, 179, 8], label: 'Bom', bgColor: [234, 179, 8, 0.1] };
            if (value >= 60) return { color: [245, 158, 11], label: 'Regular', bgColor: [245, 158, 11, 0.1] };
            return { color: [239, 68, 68], label: 'Crítico', bgColor: [239, 68, 68, 0.1] };
          }
          if (metricType === 'gap') {
            // GAP: lógica INVERSA (menor = melhor)
            if (value <= 10) return { color: [16, 185, 129], label: 'Excelente', bgColor: [16, 185, 129, 0.1] };
            if (value <= 25) return { color: [234, 179, 8], label: 'Bom', bgColor: [234, 179, 8, 0.1] };
            if (value <= 40) return { color: [245, 158, 11], label: 'Atenção', bgColor: [245, 158, 11, 0.1] };
            return { color: [239, 68, 68], label: 'Crítico', bgColor: [239, 68, 68, 0.1] };
          }
          if (metricType === 'cpi') {
            // CPI: lógica DIRETA (maior = melhor)
            if (value >= 80) return { color: [16, 185, 129], label: 'Excelente', bgColor: [16, 185, 129, 0.1] };
            if (value >= 65) return { color: [234, 179, 8], label: 'Bom', bgColor: [234, 179, 8, 0.1] };
            if (value >= 50) return { color: [245, 158, 11], label: 'Regular', bgColor: [245, 158, 11, 0.1] };
            return { color: [239, 68, 68], label: 'Crítico', bgColor: [239, 68, 68, 0.1] };
          }
          // Stability: lógica DIRETA (maior = melhor)
          if (value >= 85) return { color: [16, 185, 129], label: 'Excelente', bgColor: [16, 185, 129, 0.1] };
          if (value >= 70) return { color: [234, 179, 8], label: 'Bom', bgColor: [234, 179, 8, 0.1] };
          if (value >= 55) return { color: [245, 158, 11], label: 'Regular', bgColor: [245, 158, 11, 0.1] };
          return { color: [239, 68, 68], label: 'Crítico', bgColor: [239, 68, 68, 0.1] };
        };

        // Renderizar cada métrica KAPI em um card
        const metrics = [
          { label: 'ICE', value: kapiMetrics.ice, type: 'ice', desc: 'Convergência Estratégica (GEO ↔️ SEO)' },
          { label: 'GAP', value: kapiMetrics.gap, type: 'gap', desc: 'Prioridade de Ação (quanto menor, melhor)' },
          { label: 'CPI', value: kapiMetrics.cpi, type: 'cpi', desc: 'Previsibilidade Cognitiva dos LLMs' },
          { label: 'Estabilidade', value: kapiMetrics.cognitive_stability, type: 'stability', desc: 'Consistência Temporal das Menções' }
        ];

        metrics.forEach((metric, idx) => {
          checkAddPage(18);
          
          const metricInfo = getMetricInfo(metric.type, metric.value);
          
          // Card de fundo
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 2, 2, "F");
          
          // Label da métrica
          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(metric.label, margin + 3, yPosition + 5);
          
          // Badge de interpretação
          const badgeWidth = doc.getTextWidth(metricInfo.label) + 8;
          doc.setFillColor(metricInfo.color[0], metricInfo.color[1], metricInfo.color[2]);
          doc.roundedRect(pageWidth - margin - badgeWidth - 3, yPosition + 2, badgeWidth, 6, 1.5, 1.5, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(metricInfo.label, pageWidth - margin - badgeWidth + 2, yPosition + 5.5);
          
          // Valor da métrica
          doc.setTextColor(30, 41, 59);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          const valueText = metric.value.toFixed(1);
          doc.text(valueText, margin + 3, yPosition + 10);
          
          // Descrição
          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(metric.desc, margin + 3, yPosition + 13);
          
          yPosition += 17;
        });
        
        yPosition += 5;
      }

      // Conteúdo baseado no tipo
      doc.setFontSize(12);

      if (onlySuggestions && (insight.content as any)?.suggestions) {
        // ========================================================================
        // PDF de SUGESTÕES - FORMATO COLORIDO COMO KPI
        // ========================================================================
        const suggestions = (insight.content as any).suggestions;
        
        if (suggestions.length === 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text("Nenhuma sugestão disponível.", margin, yPosition);
          yPosition += 10;
        } else {
          // Cabeçalho com fundo verde
          doc.setFillColor(16, 185, 129); // green-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(`Total: ${suggestions.length} sugestões`, margin + 3, yPosition + 2);
          yPosition += 12;

          suggestions.forEach((sugg: any, idx: number) => {
            // FIX: Reduzir o espaço necessário para evitar páginas em branco
            checkAddPage(35);
            
            // Card de sugestão
            const cardStartY = yPosition;
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 5, 2, 2, "F");
            
            yPosition += 3;
            
            // Título
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            const suggTitle = `${idx + 1}. ${sugg.title || "Sugestão"}`;
            const titleLines = doc.splitTextToSize(suggTitle, maxWidth - 6);
            doc.text(titleLines, margin + 3, yPosition);
            yPosition += titleLines.length * 6;

            // Badge de prioridade
            yPosition += 2;
            const prioColor = sugg.priority === "high" ? [239, 68, 68] :
                             sugg.priority === "medium" ? [245, 158, 11] : [59, 130, 246];
            doc.setFillColor(prioColor[0], prioColor[1], prioColor[2], 0.2);
            doc.roundedRect(margin + 3, yPosition - 3, 28, 6, 1, 1, "F");
            doc.setTextColor(prioColor[0], prioColor[1], prioColor[2]);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            const prioText = sugg.priority === "high" ? "Alta" :
                            sugg.priority === "medium" ? "Média" : "Baixa";
            doc.text(`Prioridade: ${prioText}`, margin + 5, yPosition);
            
            yPosition += 8;

              // Descrição
              if (sugg.description) {
                const descLines = doc.splitTextToSize(sugg.description, maxWidth - 8);
                
                // SMART PAGE BREAK: Check if we can fit at least 3 lines (minimum)
                if (descLines.length > 3) {
                  checkAddPage(Math.min(descLines.length * 5, 30));
                }
                
                doc.setTextColor(51, 65, 85);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                
                // Now write with reduced checking (every 5 lines instead of every line)
                descLines.forEach((line: string, idx: number) => {
                  if (idx % 5 === 0) checkAddPage(6);
                  doc.text(line, margin + 3, yPosition);
                  yPosition += 5;
                });
                yPosition += 3;
              }

              // Impacto Esperado
              if (sugg.expectedImpact) {
                const impactLines = doc.splitTextToSize(sugg.expectedImpact, maxWidth - 8);
                checkAddPage(Math.min(impactLines.length * 4.5 + 10, 25));
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(59, 130, 246); // blue
                doc.text("Impacto Esperado:", margin + 3, yPosition);
                yPosition += 5;
                
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                impactLines.forEach((line: string, idx: number) => {
                  if (idx % 5 === 0) checkAddPage(5);
                  doc.text(line, margin + 3, yPosition);
                  yPosition += 4.5;
                });
                yPosition += 2;
              }

            // Implementação
            if (sugg.implementation) {
              const steps = Array.isArray(sugg.implementation) ? sugg.implementation : 
                           sugg.implementation.steps ? sugg.implementation.steps : [];
              
              if (steps.length > 0) {
                checkAddPage(15);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(147, 51, 234); // purple
                doc.text("Implementação:", margin + 3, yPosition);
                yPosition += 5;
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                steps.slice(0, 4).forEach((step: string, stepIdx: number) => {
                  checkAddPage(8);
                  const stepLines = doc.splitTextToSize(`${stepIdx + 1}. ${step}`, maxWidth - 10);
                  doc.text(stepLines, margin + 6, yPosition);
                  yPosition += stepLines.length * 4.5;
                });
                yPosition += 2;
              }
            }

            // Timeline
            if (sugg.timeline || (sugg.implementation && sugg.implementation.timeline)) {
              const timeline = sugg.timeline || sugg.implementation.timeline;
              checkAddPage(8);
              doc.setFont("helvetica", "italic");
              doc.setFontSize(8);
              doc.setTextColor(100, 116, 139);
              doc.text(`Prazo: ${timeline}`, margin + 3, yPosition);
              yPosition += 6;
            }
            
            const cardHeight = yPosition - cardStartY;
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(margin, cardStartY, pageWidth - 2 * margin, cardHeight, 2, 2, "S");
            
            yPosition += 6;
          });
        }
      } else if (insight.type === "prediction" && (insight.content as any)?.predictions) {
        // ========================================================================
        // PDF de Análises Preditivas - FORMATO COLORIDO COMO KPI
        // ========================================================================
        
        const content = insight.content as any;
        const predictions = content.predictions || [];
        const suggestions = content.suggestions || [];
        
        logger.debug('PDF Debug - tipo de insight', { 
          type: insight.type,
          predictions: predictions.length,
          suggestions: suggestions.length,
          contentKeys: Object.keys(content)
        });
        
        // Verificar se há conteúdo
        if (predictions.length === 0 && suggestions.length === 0) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text("Nenhuma análise preditiva disponível. Tente gerar novamente.", margin, yPosition);
          yPosition += 10;
        } else {
          // SEÇÃO: PREDIÇÕES
          if (predictions.length > 0) {
            checkAddPage(30);
            
            // Título da seção com fundo roxo
            doc.setFillColor(147, 51, 234); // purple-600
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Análises Preditivas", margin + 3, yPosition + 2);
            yPosition += 12;
            
            predictions.forEach((pred: any, idx: number) => {
              // 🔥 CORREÇÃO DEFINITIVA: Calcular espaço total necessário ANTES de começar
              const predTitle = `${idx + 1}. ${pred.title || "Predição"}`;
              const titleLines = doc.splitTextToSize(predTitle, maxWidth - 6);
              const descLines = pred.description ? doc.splitTextToSize(pred.description, maxWidth - 8) : [];
              
              // Espaço mínimo: título + badges + pelo menos 5 linhas descrição + análise híbrida
              const minSpaceNeeded = (titleLines.length * 6) + 10 + Math.min(descLines.length * 5, 30) + 25;
              
              // Se não couber, nova página ANTES de começar
              if (yPosition + minSpaceNeeded > pageHeight - margin) {
                doc.addPage();
                yPosition = 20;
              }
              
              // Card de predição com fundo claro
              const cardStartY = yPosition;
              doc.setFillColor(249, 250, 251); // bg-gray-50
              doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 5, 2, 2, "F");
              
              yPosition += 3;
              
              // Título da predição
              doc.setTextColor(30, 41, 59); // text-slate-800
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.text(titleLines, margin + 3, yPosition);
              yPosition += titleLines.length * 6;

              // Badges: Confiança e Timeframe
              yPosition += 2;
              doc.setFontSize(9);
              
              // Badge de confiança
              const confColor = pred.confidence === "high" ? [16, 185, 129] : 
                               pred.confidence === "medium" ? [245, 158, 11] : [239, 68, 68];
              doc.setFillColor(confColor[0], confColor[1], confColor[2], 0.2);
              doc.roundedRect(margin + 3, yPosition - 3, 25, 6, 1, 1, "F");
              doc.setTextColor(confColor[0], confColor[1], confColor[2]);
              doc.setFont("helvetica", "bold");
              const confText = pred.confidence === "high" ? "Alta" : 
                              pred.confidence === "medium" ? "Média" : "Baixa";
              doc.text(confText, margin + 5, yPosition);
              
              // Timeframe
              if (pred.timeframe) {
                doc.setTextColor(100, 116, 139);
                doc.setFont("helvetica", "normal");
                doc.text(`• ${pred.timeframe}`, margin + 31, yPosition);
              }
              
              yPosition += 8;

              // Descrição
              if (pred.description) {
                const descLines = doc.splitTextToSize(pred.description, maxWidth - 8);
                // Verificar se há espaço para pelo menos 3 linhas da descrição
                checkAddPage(descLines.length > 3 ? 20 : descLines.length * 6);
                
                doc.setTextColor(51, 65, 85);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                descLines.forEach((line: string, lineIdx: number) => {
                  // Só verificar novamente se for muitas linhas
                  if (lineIdx > 0 && lineIdx % 5 === 0) {
                    checkAddPage(6);
                  }
                  doc.text(line, margin + 3, yPosition);
                  yPosition += 5;
                });
                yPosition += 3;
              }

              // Análise Híbrida (SEO + GEO)
              if (pred.hybridAnalysis) {
                const hybridLines = doc.splitTextToSize(pred.hybridAnalysis, maxWidth - 8);
                // Verificar espaço para título + pelo menos 3 linhas
                checkAddPage(hybridLines.length > 3 ? 25 : 15 + (hybridLines.length * 5));
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(147, 51, 234); // purple
                doc.text("Análise Híbrida (SEO + GEO):", margin + 3, yPosition);
                yPosition += 5;
                
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                hybridLines.forEach((line: string, lineIdx: number) => {
                  if (lineIdx > 0 && lineIdx % 5 === 0) {
                    checkAddPage(5);
                  }
                  doc.text(line, margin + 3, yPosition);
                  yPosition += 4.5;
                });
                yPosition += 3;
              }

              // Oportunidades
              if (pred.opportunities && pred.opportunities.length > 0) {
                checkAddPage(15);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(16, 185, 129); // green
                doc.text("Oportunidades:", margin + 3, yPosition);
                yPosition += 5;
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                pred.opportunities.slice(0, 3).forEach((opp: string) => {
                  checkAddPage(8);
                  const oppLines = doc.splitTextToSize(`• ${opp}`, maxWidth - 10);
                  doc.text(oppLines, margin + 6, yPosition);
                  yPosition += oppLines.length * 4.5;
                });
                yPosition += 2;
              }
              
              // Calcular altura do card e desenhar borda
              const cardHeight = yPosition - cardStartY;
              doc.setDrawColor(226, 232, 240); // border-slate-200
              doc.roundedRect(margin, cardStartY, pageWidth - 2 * margin, cardHeight, 2, 2, "S");
              
              yPosition += 6;
            });
          }

          // SEÇÃO: SUGESTÕES
          if (suggestions.length > 0) {
            // Verificar espaço para o título da seção
            if (yPosition > pageHeight - 60) {
              doc.addPage();
              yPosition = 20;
            }
            
            // Título da seção com fundo verde
            doc.setFillColor(16, 185, 129); // green-500
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Sugestões de Ação", margin + 3, yPosition + 2);
            yPosition += 12;

            suggestions.forEach((sugg: any, idx: number) => {
              // 🔥 CORREÇÃO DEFINITIVA: Calcular espaço total necessário ANTES de começar
              const suggTitle = `${idx + 1}. ${sugg.title || "Sugestão"}`;
              const titleLines = doc.splitTextToSize(suggTitle, maxWidth - 6);
              const descLines = sugg.description ? doc.splitTextToSize(sugg.description, maxWidth - 8) : [];
              
              // Espaço mínimo necessário: título + badge + pelo menos 5 linhas de descrição
              const minSpaceNeeded = (titleLines.length * 6) + 8 + Math.min(descLines.length * 5, 25) + 20;
              
              // Se não couber, adicionar nova página ANTES de começar
              if (yPosition + minSpaceNeeded > pageHeight - margin) {
                doc.addPage();
                yPosition = 20;
              }
              
              // Card de sugestão
              const cardStartY = yPosition;
              doc.setFillColor(249, 250, 251);
              doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 5, 2, 2, "F");
              
              yPosition += 3;
              
              // Título
              doc.setTextColor(30, 41, 59);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.text(titleLines, margin + 3, yPosition);
              yPosition += titleLines.length * 6;

              // Badge de prioridade
              yPosition += 2;
              const prioColor = sugg.priority === "high" ? [239, 68, 68] :
                               sugg.priority === "medium" ? [245, 158, 11] : [59, 130, 246];
              doc.setFillColor(prioColor[0], prioColor[1], prioColor[2], 0.2);
              doc.roundedRect(margin + 3, yPosition - 3, 28, 6, 1, 1, "F");
              doc.setTextColor(prioColor[0], prioColor[1], prioColor[2]);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              const prioText = sugg.priority === "high" ? "Alta" :
                              sugg.priority === "medium" ? "Média" : "Baixa";
              doc.text(`Prioridade: ${prioText}`, margin + 5, yPosition);
              
              yPosition += 8;

              // Descrição
              if (sugg.description) {
                const descLines = doc.splitTextToSize(sugg.description, maxWidth - 8);
                
                // SMART PAGE BREAK: Check if we can fit at least 3 lines (minimum)
                if (descLines.length > 3) {
                  checkAddPage(Math.min(descLines.length * 5, 30));
                }
                
                doc.setTextColor(51, 65, 85);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                
                // Now write with reduced checking (every 5 lines instead of every line)
                descLines.forEach((line: string, idx: number) => {
                  if (idx % 5 === 0) checkAddPage(6);
                  doc.text(line, margin + 3, yPosition);
                  yPosition += 5;
                });
                yPosition += 3;
              }

              // Impacto Esperado
              if (sugg.expectedImpact) {
                checkAddPage(10);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(59, 130, 246); // blue
                doc.text("Impacto Esperado:", margin + 3, yPosition);
                yPosition += 5;
                
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                const impactLines = doc.splitTextToSize(sugg.expectedImpact, maxWidth - 8);
                impactLines.forEach((line: string) => {
                  checkAddPage(5);
                  doc.text(line, margin + 3, yPosition);
                  yPosition += 4.5;
                });
                yPosition += 2;
              }

              // Passos de Implementação
              if (sugg.implementation?.steps && sugg.implementation.steps.length > 0) {
                checkAddPage(15);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(147, 51, 234);
                doc.text("Passos de Implementação:", margin + 3, yPosition);
                yPosition += 5;
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                sugg.implementation.steps.slice(0, 4).forEach((step: string, stepIdx: number) => {
                  checkAddPage(8);
                  const stepLines = doc.splitTextToSize(`${stepIdx + 1}. ${step}`, maxWidth - 10);
                  doc.text(stepLines, margin + 6, yPosition);
                  yPosition += stepLines.length * 4.5;
                });
              }
              
              const cardHeight = yPosition - cardStartY;
              doc.setDrawColor(226, 232, 240);
              doc.roundedRect(margin, cardStartY, pageWidth - 2 * margin, cardHeight, 2, 2, "S");
              
              yPosition += 6;
            });
          }
        }
      } else if (insight.type === "report") {
        // ========================================================================
        // PDF de RELATÓRIO COMPLETO - FORMATO COLORIDO COMO KPI
        // ========================================================================
        
        const content = insight.content as any;
        
        // SEÇÃO: SUMÁRIO EXECUTIVO
        if (content.executiveSummary) {
          checkAddPage(30);
          
          // Título com fundo roxo
          doc.setFillColor(147, 51, 234);
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Sumário Executivo", margin + 3, yPosition + 2);
          yPosition += 14;
          
          // Conteúdo
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const summaryLines = doc.splitTextToSize(content.executiveSummary, maxWidth);
          summaryLines.forEach((line: string) => {
            checkAddPage(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          yPosition += 10;
        }

        // SEÇÃO: MÉTRICAS CHAVE
        if (content.keyMetrics) {
          checkAddPage(35);
          
          doc.setFillColor(59, 130, 246); // blue-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Métricas Principais", margin + 3, yPosition + 2);
          yPosition += 14;
          
          // Tabela de métricas com listras
          const metrics = Object.entries(content.keyMetrics);
          metrics.forEach(([key, value]: [string, any], idx: number) => {
            checkAddPage(8);
            
            // Linha alternada
            if (idx % 2 === 0) {
              doc.setFillColor(249, 250, 251);
              doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 7, "F");
            }
            
            doc.setTextColor(71, 85, 105);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            doc.text(label.charAt(0).toUpperCase() + label.slice(1), margin + 2, yPosition);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 41, 59);
            doc.text(String(value), pageWidth - margin - 40, yPosition);
            
            yPosition += 7;
          });
          
          yPosition += 8;
        }

        // SEÇÃO: INSIGHTS
        if (content.insights && Array.isArray(content.insights) && content.insights.length > 0) {
          checkAddPage(30);
          
          doc.setFillColor(16, 185, 129); // green-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Principais Insights", margin + 3, yPosition + 2);
          yPosition += 14;
          
          content.insights.slice(0, 5).forEach((insight: any, idx: number) => {
            checkAddPage(20);
            
            const cardStartY = yPosition;
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 5, 2, 2, "F");
            yPosition += 3;
            
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            const titleLines = doc.splitTextToSize(`${idx + 1}. ${insight.title || "Insight"}`, maxWidth - 6);
            doc.text(titleLines, margin + 3, yPosition);
            yPosition += titleLines.length * 5.5;
            
            if (insight.description) {
              doc.setFont("helvetica", "normal");
              doc.setTextColor(71, 85, 105);
              doc.setFontSize(9);
              const descLines = doc.splitTextToSize(insight.description, maxWidth - 8);
              descLines.forEach((line: string) => {
                checkAddPage(5);
                doc.text(line, margin + 3, yPosition);
                yPosition += 4.5;
              });
            }
            
            const cardHeight = yPosition - cardStartY;
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(margin, cardStartY, pageWidth - 2 * margin, cardHeight, 2, 2, "S");
            yPosition += 6;
          });
        }

        // SEÇÃO: RECOMENDAÇÕES
        if (content.recommendations && Array.isArray(content.recommendations) && content.recommendations.length > 0) {
          checkAddPage(35); // CORRIGIDO: Aumentar espaço
          
          doc.setFillColor(245, 158, 11); // amber-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Recomendações Estratégicas", margin + 3, yPosition + 2);
          yPosition += 14;

          content.recommendations.slice(0, 5).forEach((rec: any, idx: number) => {
            checkAddPage(25);
            
            const cardStartY = yPosition;
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 5, 2, 2, "F");
            yPosition += 3;
            
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            const recTitle = typeof rec === "string" ? rec : rec.title || rec.description || "Recomendação";
            const titleLines = doc.splitTextToSize(`${idx + 1}. ${recTitle}`, maxWidth - 6);
            doc.text(titleLines, margin + 3, yPosition);
            yPosition += titleLines.length * 5.5;
            
            if (typeof rec === "object" && rec.description && rec.description !== rec.title) {
              doc.setFont("helvetica", "normal");
              doc.setTextColor(71, 85, 105);
              doc.setFontSize(9);
              const descLines = doc.splitTextToSize(rec.description, maxWidth - 8);
              descLines.forEach((line: string) => {
                checkAddPage(5);
                doc.text(line, margin + 3, yPosition);
                yPosition += 4.5;
              });
            }
            
            // Prioridade e impacto
            if (typeof rec === "object" && rec.priority) {
              yPosition += 2;
              const prioColor = rec.priority === "high" ? [239, 68, 68] :
                               rec.priority === "medium" ? [245, 158, 11] : [59, 130, 246];
              doc.setFillColor(prioColor[0], prioColor[1], prioColor[2], 0.2);
              doc.roundedRect(margin + 3, yPosition - 3, 20, 5, 1, 1, "F");
              doc.setTextColor(prioColor[0], prioColor[1], prioColor[2]);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8);
              const prioText = rec.priority === "high" ? "Alta" :
                              rec.priority === "medium" ? "Média" : "Baixa";
              doc.text(prioText, margin + 5, yPosition);
              yPosition += 5;
            }
            
            const cardHeight = yPosition - cardStartY;
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(margin, cardStartY, pageWidth - 2 * margin, cardHeight, 2, 2, "S");
            yPosition += 6;
          });
          
          yPosition += 8; // CORRIGIDO: Espaço extra após todas as recomendações
        }

        // SEÇÃO: ANÁLISE COMPETITIVA
        if (content.competitiveAnalysis) {
          checkAddPage(40);
          
          doc.setFillColor(168, 85, 247); // purple-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Análise Competitiva", margin + 3, yPosition + 2);
          yPosition += 14;
          
          if (content.competitiveAnalysis.positioning) {
            doc.setTextColor(51, 65, 85);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const posLines = doc.splitTextToSize(content.competitiveAnalysis.positioning, maxWidth);
            posLines.forEach((line: string) => {
              checkAddPage(6);
              doc.text(line, margin, yPosition);
              yPosition += 5;
            });
            yPosition += 5;
          }
          
          // Forças e Fraquezas
          if (content.competitiveAnalysis.strengths?.length > 0) {
            checkAddPage(15); // CORRIGIDO: Verificar espaço antes
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129);
            doc.setFontSize(10);
            doc.text("Forças:", margin, yPosition);
            yPosition += 6;
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(9);
            content.competitiveAnalysis.strengths.slice(0, 3).forEach((str: string) => {
              checkAddPage(8);
              const strLines = doc.splitTextToSize(`• ${str}`, maxWidth - 5);
              doc.text(strLines, margin + 3, yPosition);
              yPosition += strLines.length * 4.5;
            });
            yPosition += 6; // CORRIGIDO: Espaço após forças
          }
          
          if (content.competitiveAnalysis.weaknesses?.length > 0) {
            checkAddPage(15); // CORRIGIDO: Verificar espaço antes de começar
            doc.setFont("helvetica", "bold");
            doc.setTextColor(239, 68, 68);
            doc.setFontSize(10);
            doc.text("Fraquezas:", margin, yPosition);
            yPosition += 6;
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(9);
            content.competitiveAnalysis.weaknesses.slice(0, 3).forEach((weak: string) => {
              checkAddPage(8);
              const weakLines = doc.splitTextToSize(`• ${weak}`, maxWidth - 5);
              doc.text(weakLines, margin + 3, yPosition);
              yPosition += weakLines.length * 4.5;
            });
            yPosition += 8; // CORRIGIDO: Adicionar espaço após a seção
          } else {
            yPosition += 8; // CORRIGIDO: Espaço mesmo se não houver fraquezas
          }
        } else {
          yPosition += 8; // CORRIGIDO: Espaço mesmo se não houver análise competitiva
        }

        // SEÇÃO: PRÓXIMOS PASSOS
        if (content.nextSteps && Array.isArray(content.nextSteps) && content.nextSteps.length > 0) {
          checkAddPage(35); // CORRIGIDO: Aumentar espaço necessário para o cabeçalho
          
          doc.setFillColor(239, 68, 68); // red-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Próximos Passos", margin + 3, yPosition + 2);
          yPosition += 14;
          
          content.nextSteps.slice(0, 5).forEach((step: any, idx: number) => {
            checkAddPage(12);
            
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            const stepText = typeof step === "string" ? step : step.action || "";
            const stepLines = doc.splitTextToSize(`${idx + 1}. ${stepText}`, maxWidth - 5);
            doc.text(stepLines, margin, yPosition);
            yPosition += stepLines.length * 5.5 + 2;
          });
        }
      } else if (insight.type === "summary") {
        // ========================================================================
        // PDF de RESUMO DE URL - FORMATO PROFISSIONAL E COLORIDO
        // ========================================================================
        
        const content = insight.content as any;
        
        // URL Analisada
        if (content?.url) {
          checkAddPage(15);
          doc.setFillColor(147, 51, 234); // purple-600
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("URL Analisada", margin + 3, yPosition + 2);
          yPosition += 14;
          
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const urlLines = doc.splitTextToSize(content.url, maxWidth);
          urlLines.forEach((line: string) => {
            checkAddPage(5);
            doc.text(line, margin, yPosition);
            yPosition += 4.5;
          });
          yPosition += 10;
        }

        // SEÇÃO: SCORES COM BADGES COLORIDOS
        checkAddPage(35);
        doc.setFillColor(59, 130, 246); // blue-500
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Scores de Performance", margin + 3, yPosition + 2);
        yPosition += 16;

        // Criar badges de score
        const scores = [
          { label: "Score Geral", value: content.score || 0, color: [147, 51, 234] },
          { label: "GEO Score", value: content.geoScore || 0, color: [16, 185, 129] },
          { label: "SEO Score", value: content.seoScore || 0, color: [59, 130, 246] }
        ];
        
        scores.forEach((scoreData) => {
          checkAddPage(12);
          
          // Background do card
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, yPosition - 2, pageWidth - 2 * margin, 10, 2, 2, "F");
          
          // Label
          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(scoreData.label, margin + 3, yPosition + 3);
          
          // Score com badge colorido
          const scoreText = `${scoreData.value}/10`;
          const scoreWidth = doc.getTextWidth(scoreText) + 8;
          doc.setFillColor(scoreData.color[0], scoreData.color[1], scoreData.color[2]);
          doc.roundedRect(pageWidth - margin - scoreWidth - 3, yPosition - 1, scoreWidth, 7, 1.5, 1.5, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(scoreText, pageWidth - margin - scoreWidth + 1, yPosition + 3.5);
          
          yPosition += 12;
        });
        
        yPosition += 6;

        // SEÇÃO: SUMÁRIO EXECUTIVO
        if (content.summary) {
          checkAddPage(30);
          
          doc.setFillColor(16, 185, 129); // green-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Sumário Executivo", margin + 3, yPosition + 2);
          yPosition += 14;
          
          doc.setTextColor(51, 65, 85);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const summaryLines = doc.splitTextToSize(content.summary, maxWidth);
          summaryLines.forEach((line: string) => {
            checkAddPage(6);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
          yPosition += 10;
        }
        
        // SEÇÃO: PRINCIPAIS INSIGHTS (se houver)
        if (content.insights && Array.isArray(content.insights) && content.insights.length > 0) {
          checkAddPage(30);
          
          doc.setFillColor(245, 158, 11); // orange-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Principais Insights", margin + 3, yPosition + 2);
          yPosition += 14;
          
          content.insights.slice(0, 5).forEach((ins: string, idx: number) => {
            checkAddPage(10);
            
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`${idx + 1}.`, margin, yPosition);
            
            doc.setFont("helvetica", "normal");
            const insightLines = doc.splitTextToSize(ins, maxWidth - 8);
            doc.text(insightLines, margin + 6, yPosition);
            yPosition += insightLines.length * 5 + 3;
          });
          yPosition += 6;
        }
        
        // SEÇÃO: RECOMENDAÇÕES (se houver)
        if (content.recommendations && Array.isArray(content.recommendations) && content.recommendations.length > 0) {
          checkAddPage(30);
          
          doc.setFillColor(239, 68, 68); // red-500
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Recomendações", margin + 3, yPosition + 2);
          yPosition += 14;
          
          content.recommendations.slice(0, 5).forEach((rec: string, idx: number) => {
            checkAddPage(10);
            
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`${idx + 1}.`, margin, yPosition);
            
            doc.setFont("helvetica", "normal");
            const recLines = doc.splitTextToSize(rec, maxWidth - 8);
            doc.text(recLines, margin + 6, yPosition);
            yPosition += recLines.length * 5 + 3;
          });
        }
      }

      // Adicionar rodapés em todas as páginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      // Salvar PDF com nome apropriado
      const brandName = insight.brands?.name || "insight";
      const sanitizedBrandName = brandName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      // Determinar o tipo de documento para o nome do arquivo
      const typeLabel = onlySuggestions ? "sugestoes" :
                       insight.type === "prediction" ? "prediction" :
                       insight.type === "report" ? "report" :
                       insight.type === "summary" ? "summary" :
                       insight.type;
      
      const fileName = `${sanitizedBrandName}-${typeLabel}-${new Date(insight.created_at).toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "✅ Download concluído",
        description: "O PDF foi baixado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const shareInsight = async (insight: AIInsight) => {
    try {
      let shareText = `${insight.title}\n`;
      shareText += `${new Date(insight.created_at).toLocaleDateString("pt-BR")}\n\n`;

      if (insight.type === "summary" && (insight.content as any)?.url) {
        shareText += `URL: ${(insight.content as any).url}\n\n`;
        shareText += `📊 Score Geral: ${(insight.content as any).score}\n`;
        shareText += `🌍 GEO: ${(insight.content as any).geoScore}\n`;
        shareText += `🔍 SEO: ${(insight.content as any).seoScore}\n\n`;
        if ((insight.content as any).summary) {
          shareText += `Resumo:\n${(insight.content as any).summary}\n`;
        }
      } else if (insight.type === "prediction" && (insight.content as any)?.predictions) {
        shareText += `Análises Preditivas:\n\n`;
        (insight.content as any).predictions.forEach((pred: any, idx: number) => {
          shareText += `${idx + 1}. ${pred.title}\n`;
          shareText += `   Confiança: ${pred.confidence}\n`;
          if (pred.description) shareText += `   ${pred.description}\n`;
          shareText += `\n`;
        });
      } else if (insight.type === "suggestion" && (insight.content as any)?.suggestions) {
        shareText += `Sugestões:\n\n`;
        (insight.content as any).suggestions.forEach((sugg: any, idx: number) => {
          shareText += `${idx + 1}. ${sugg.title} (${sugg.priority})\n`;
          if (sugg.description) shareText += `   ${sugg.description}\n`;
          shareText += `\n`;
        });
      } else if (insight.type === "report" && (insight.content as any)?.executiveSummary) {
        shareText += `${(insight.content as any).executiveSummary}\n`;
      }

      await navigator.clipboard.writeText(shareText);
      
      toast({
        title: "Copiado!",
        description: "O conteúdo foi copiado para a área de transferência",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o conteúdo",
        variant: "destructive",
      });
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <TrendingUp className="w-5 h-5" />;
      case "suggestion":
        return <Lightbulb className="w-5 h-5" />;
      case "report":
        return <FileText className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "prediction":
        return "text-blue-500";
      case "suggestion":
        return "text-yellow-500";
      case "report":
        return "text-green-500";
      default:
        return "text-purple-500";
    }
  };

  const extractSiteNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const siteName = hostname.replace('www.', '').split('.')[0];
      return siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch {
      return 'Site';
    }
  };

  const getInsightTypeLabel = (type: string) => {
    switch (type) {
      case "prediction":
        return "Análise Preditiva";
      case "suggestion":
        return "Sugestões";
      case "report":
        return "Relatório";
      case "summary":
        return "Resumo";
      default:
        return "Insight";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8 relative z-10">
        {/* Premium Breadcrumb */}
        <div className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl p-4 shadow-lg">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                    <Home className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Dashboard</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-primary/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2 font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Insights IA
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Premium Header Section */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-50 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-cyan-500/20 border border-white/10 backdrop-blur-sm">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Insights Híbridos de IA
                  </span>
                  <span className="text-muted-foreground text-xl md:text-2xl ml-2">(SEO + GEO)</span>
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
                  Análises preditivas, sugestões e relatórios gerados por IA baseados em dados de SEO (Google Analytics, Search Console) e GEO (Menções em LLMs)
                </p>
              </div>
            </div>
            
            {/* Premium Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/30 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse" />
                Dados SEO
              </Badge>
              <Badge className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 mr-2 animate-pulse" />
                Dados GEO
              </Badge>
              <Badge className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all duration-300 px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                Análise Híbrida
              </Badge>
            </div>
          </div>
          
          {/* Premium Brand Selector */}
          {brands && brands.length > 0 && (
            <div className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl p-4 shadow-lg">
              <Select value={selectedBrandId || ""} onValueChange={setSelectedBrandId}>
                <SelectTrigger className="w-[220px] bg-background/50 border-white/10 hover:bg-background/80 transition-all duration-300">
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id} className="hover:bg-primary/10 transition-colors">{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 h-auto">
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-xl py-3 transition-all duration-300"
            >
              <Brain className="w-5 h-5 mr-2" />
              <span className="font-medium">Insights Salvos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="schedule"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 rounded-xl py-3 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-medium">Agendamentos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* Verificar se há marcas cadastradas */}
            {brandsLoading ? (
              <LoadingState />
            ) : !brands || brands.length === 0 ? (
              <Card className="p-12 text-center backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                  <div className="relative w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                    <Brain className="w-10 h-10 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma marca cadastrada</h3>
                <p className="text-muted-foreground mb-6">
                  Você precisa cadastrar ao menos uma marca antes de gerar insights de IA
                </p>
                <Button 
                  onClick={() => window.location.href = '/brands'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Marca
                </Button>
              </Card>
            ) : (
              <>
            {/* Painel de Interpretação de Métricas */}
            <MetricsGuide />

            {/* Visão Geral das Métricas da Marca Selecionada */}
            {igoMetrics && selectedBrandId && selectedBrandId !== "all" && (
              <MetricsOverviewCard
                brandName={brands?.find(b => b.id === selectedBrandId)?.name}
                ice={igoMetrics.ice}
                gap={igoMetrics.gap}
                cpi={igoMetrics.cpi}
                stability={igoMetrics.cognitive_stability}
              />
            )}

            {/* Premium Filter Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl p-4 shadow-lg">
              <div className="flex gap-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-56 bg-background/50 border-white/10 hover:bg-background/80 transition-all duration-300">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 z-50">
                    <SelectItem value="all" className="hover:bg-primary/10">Todos</SelectItem>
                    <SelectItem value="prediction" className="hover:bg-primary/10">Predições e Sugestões</SelectItem>
                    <SelectItem value="report" className="hover:bg-primary/10">Relatórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Botões contextuais baseados no tipo selecionado */}
                {selectedType === "report" ? (
                  <Button 
                    onClick={() => generateReport('individual')} 
                    disabled={isGenerating || selectedBrandId === "all"}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 shadow-lg shadow-primary/25 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar Relatório
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={generatePrediction} 
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 shadow-lg shadow-primary/25 transition-all duration-300"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Análise
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja limpar TODOS os insights? Esta ação não pode ser desfeita.')) {
                      deleteAllInsights.mutate();
                    }
                  }} 
                  disabled={deleteAllInsights.isPending}
                  variant="outline"
                  size="icon"
                  title="Limpar todos os insights"
                  className="border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                
                {/* Botões de relatório */}
                {selectedBrandId !== "all" && (
                  <Button onClick={() => generateReport('individual')} disabled={isGenerating} variant="outline" className="border-white/10 hover:bg-white/5 transition-all duration-300">
                    {isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Relatório Individual
                      </>
                    )}
                  </Button>
                )}
                {selectedBrandId === "all" && (
                  <Button onClick={() => generateReport('comparative')} disabled={isGenerating} variant="outline" className="border-white/10 hover:bg-white/5 transition-all duration-300">
                    {isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4 mr-2" />
                        Relatório Comparativo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <InsightListSkeleton />
            ) : !filteredInsights || filteredInsights.length === 0 ? (
              (() => {
                // Verificar se existem insights de outros tipos
                const allInsights = insights || [];
                const hasPredictions = allInsights.some(i => i.type === 'prediction');
                const hasReports = allInsights.some(i => i.type === 'report');
                const hasSummaries = allInsights.some(i => i.type === 'summary');
                
                // Se está filtrando e há insights de outro tipo, sugerir mudar filtro
                if (selectedType !== 'all' && allInsights.length > 0) {
                  let suggestion = '';
                  let suggestedFilter = 'all';
                  
                  if (selectedType === 'report' && hasPredictions) {
                    suggestion = 'Existem Análises Preditivas disponíveis. Mude o filtro para "Predições" ou "Todos" para visualizá-las.';
                    suggestedFilter = 'prediction';
                  } else if (selectedType === 'prediction' && hasReports) {
                    suggestion = 'Existem Relatórios disponíveis. Mude o filtro para "Relatórios" ou "Todos" para visualizá-los.';
                    suggestedFilter = 'report';
                  } else if (selectedType === 'summary' && (hasReports || hasPredictions)) {
                    suggestion = 'Não há resumos de URL para esta marca. Mude para "Todos" para ver outros insights.';
                    suggestedFilter = 'all';
                  } else {
                    suggestion = 'Não há insights deste tipo para a marca selecionada. Mude para "Todos" ou selecione outra marca.';
                    suggestedFilter = 'all';
                  }
                  
                  return (
                    <Card className="p-12 text-center">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">
                        Nenhum {selectedType === 'report' ? 'relatório' : 'análise preditiva'} encontrado
                      </h3>
                      <p className="text-muted-foreground mb-6">{suggestion}</p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={() => setSelectedType(suggestedFilter)} variant="outline">
                          Mudar para {suggestedFilter === 'all' ? 'Todos' : suggestedFilter === 'prediction' ? 'Predições' : 'Relatórios'}
                        </Button>
                        <Button onClick={() => selectedType === 'report' ? generateReport('individual') : generatePrediction()} disabled={isGenerating}>
                          Gerar {selectedType === 'report' ? 'Relatório' : 'Análise'}
                        </Button>
                      </div>
                    </Card>
                  );
                }
                
                return (
                  <EmptyState
                    icon={Brain}
                    title="Nenhum insight encontrado"
                    description="Gere sua primeira análise preditiva ou relatório completo para começar a monitorar sua performance GEO."
                    action={{
                      label: "Gerar Análise",
                      onClick: generatePrediction,
                      disabled: isGenerating,
                    }}
                    secondaryAction={selectedBrandId !== "all" ? {
                      label: "Gerar Relatório Individual",
                      onClick: () => generateReport('individual'),
                      disabled: isGenerating,
                    } : {
                      label: "Gerar Relatório Comparativo",
                      onClick: () => generateReport('comparative'),
                      disabled: isGenerating,
                    }}
                  />
                );
              })()
            ) : (
              <div className="space-y-8">
                {/* Análises Preditivas - Premium Card */}
                {(debouncedType === "all" || debouncedType === "prediction") && filteredInsights.filter(i => i.type === "prediction").length > 0 && (
                  <Card className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {/* Premium Header with Gradient Border */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50" />
                            <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                              <TrendingUp className="w-6 h-6 text-blue-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Análises Preditivas Híbridas</h3>
                            <p className="text-sm text-muted-foreground">Baseadas em dados SEO + GEO</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 px-3 py-1">
                            {insights.filter(i => i.type === "prediction").length}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3">SEO</Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-3">GEO</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {insights.filter(i => i.type === "prediction").map((insight) => {
                        const insightBrandId = insight.brand_id;
                        const brandName = insight.brands?.name || brands?.find(b => b.id === insightBrandId)?.name;
                        
                        return (
                        <Card key={insight.id} className="p-5 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 border border-white/10 rounded-xl hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">{insight.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(insight.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={async () => await downloadInsightPDF(insight)} title="Baixar PDF">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => shareInsight(insight)} title="Compartilhar">
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteInsight(insight.id)} title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Métricas KAPI da marca - Contexto do Presente */}
                          {insightBrandId && (
                            <InsightMetricsSection brandId={insightBrandId} brandName={brandName} />
                          )}
                          
                          {(insight.content as any)?.predictions && (insight.content as any).predictions.length > 0 ? (
                            <div className="space-y-4 mt-4">
                              <div>
                                <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Predições ({(insight.content as any).predictions.length})
                                </p>
                                {(insight.content as any).predictions.map((pred: any, idx: number) => (
                                  <div key={idx} className="mb-4 p-4 bg-background rounded-lg border">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-sm flex-1">{pred.title}</h5>
                                      <Badge variant="outline" className="ml-2">
                                        {pred.confidence === "high" ? "Alta Confiança" : pred.confidence === "medium" ? "Média Confiança" : "Baixa Confiança"}
                                      </Badge>
                                    </div>
                                    {pred.description && (
                                      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                        {pred.description}
                                      </p>
                                    )}
                                    
                                    {/* Análise Híbrida SEO + GEO */}
                                    {(pred.seoInsights || pred.geoInsights || pred.hybridAnalysis) && (
                                      <div className="grid md:grid-cols-2 gap-3 mb-3">
                                        {/* SEO Insights */}
                                        {pred.seoInsights && (
                                          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500">SEO</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">{pred.seoInsights.finding}</p>
                                            {pred.seoInsights.metrics && pred.seoInsights.metrics.length > 0 && (
                                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                {pred.seoInsights.metrics.map((metric: string, i: number) => (
                                                  <li key={i}>{metric}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        )}
                                        
                                        {/* GEO Insights */}
                                        {pred.geoInsights && (
                                          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">GEO</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">{pred.geoInsights.finding}</p>
                                            {pred.geoInsights.metrics && pred.geoInsights.metrics.length > 0 && (
                                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                                {pred.geoInsights.metrics.map((metric: string, i: number) => (
                                                  <li key={i}>{metric}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Análise da Conversação SEO + GEO */}
                                    {pred.hybridAnalysis && (
                                      <div className="mb-3 p-3 bg-green-500/5 border border-green-500/20 rounded">
                                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 mb-2">Análise Híbrida</Badge>
                                        <p className="text-xs text-muted-foreground">{pred.hybridAnalysis}</p>
                                      </div>
                                    )}
                                    
                                    {pred.timeframe && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        <strong>Período:</strong> {pred.timeframe}
                                      </p>
                                    )}
                                    {pred.opportunities && pred.opportunities.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-semibold mb-1">Oportunidades:</p>
                                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                          {pred.opportunities.map((opp: string, i: number) => (
                                            <li key={i}>{opp}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {(insight.content as any).suggestions && (insight.content as any).suggestions.length > 0 && (
                                <div>
                                  <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" />
                                    Sugestões ({(insight.content as any).suggestions.length})
                                  </p>
                                  {(insight.content as any).suggestions.map((sugg: any, idx: number) => (
                                    <div key={idx} className="mb-4 p-4 bg-background rounded-lg border">
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-semibold text-sm flex-1">{sugg.title}</h5>
                                        <Badge variant="outline" className="ml-2">
                                          Prioridade: {sugg.priority === "high" ? "Alta" : sugg.priority === "medium" ? "Média" : "Baixa"}
                                        </Badge>
                                      </div>
                                      {sugg.description && (
                                        <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                          {sugg.description}
                                        </p>
                                      )}
                                      
                                      {/* Foco SEO + GEO */}
                                      {(sugg.seoFocus || sugg.geoFocus) && (
                                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                                          {/* SEO Focus */}
                                          {sugg.seoFocus && (
                                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                                              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 mb-2">Foco SEO</Badge>
                                              {sugg.seoFocus.actions && sugg.seoFocus.actions.length > 0 && (
                                                <ul className="text-xs text-muted-foreground list-disc list-inside mb-1">
                                                  {sugg.seoFocus.actions.slice(0, 2).map((action: string, i: number) => (
                                                    <li key={i}>{action}</li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* GEO Focus */}
                                          {sugg.geoFocus && (
                                            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                                              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 mb-2">Foco GEO</Badge>
                                              {sugg.geoFocus.actions && sugg.geoFocus.actions.length > 0 && (
                                                <ul className="text-xs text-muted-foreground list-disc list-inside mb-1">
                                                  {sugg.geoFocus.actions.slice(0, 2).map((action: string, i: number) => (
                                                    <li key={i}>{action}</li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      {sugg.expectedImpact && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                          <strong>Impacto Esperado:</strong> {sugg.expectedImpact}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-xs text-muted-foreground">
                                Conteúdo vazio. Clique em "Gerar Análise" novamente
                              </p>
                            </div>
                          )}
                        </Card>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Sugestões Inteligentes - Premium Card */}
                {(selectedType === "all" || selectedType === "suggestion") && 
                  insights.filter(i => i.type === "prediction" && (i.content as any)?.suggestions?.length > 0).length > 0 && (
                  <Card className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {/* Premium Header with Gradient Border */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl blur-md opacity-50" />
                            <div className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10">
                              <Lightbulb className="w-6 h-6 text-amber-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Sugestões Inteligentes</h3>
                            <p className="text-sm text-muted-foreground">Recomendações baseadas em análise híbrida SEO + GEO</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 px-3 py-1">
                            {insights.filter(i => i.type === "prediction" && (i.content as any)?.suggestions?.length > 0)
                              .reduce((acc, i) => acc + ((i.content as any)?.suggestions?.length || 0), 0)}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3">SEO</Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-3">GEO</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {insights
                        .filter(i => i.type === "prediction" && (i.content as any)?.suggestions?.length > 0)
                        .map((insight) => (
                        <Card key={insight.id} className="p-5 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1 text-foreground">{insight.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(insight.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={async () => await downloadInsightPDF(insight, true)} title="Baixar PDF" className="hover:bg-amber-500/10 hover:text-amber-400 transition-colors">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => shareInsight(insight)} title="Compartilhar" className="hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteInsight(insight.id)} title="Excluir" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-400">
                              <Lightbulb className="w-4 h-4" />
                              Sugestões ({(insight.content as any).suggestions.length})
                            </p>
                            {(insight.content as any).suggestions.map((sugg: any, idx: number) => (
                              <div key={idx} className="mb-4 p-4 bg-card/50 rounded-xl border border-white/10 hover:border-amber-500/20 transition-all duration-300">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-sm flex-1">{sugg.title}</h5>
                                  <Badge variant="outline" className="ml-2">
                                    Prioridade: {sugg.priority === "high" ? "Alta" : sugg.priority === "medium" ? "Média" : "Baixa"}
                                  </Badge>
                                </div>
                                {sugg.description && (
                                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                    {sugg.description}
                                  </p>
                                )}
                                
                                {/* Foco SEO + GEO */}
                                {(sugg.seoFocus || sugg.geoFocus) && (
                                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                                    {/* SEO Focus */}
                                    {sugg.seoFocus && (
                                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500">Foco SEO</Badge>
                                        </div>
                                        {sugg.seoFocus.actions && sugg.seoFocus.actions.length > 0 && (
                                          <>
                                            <p className="text-xs font-semibold mb-1">Ações:</p>
                                            <ul className="text-xs text-muted-foreground list-disc list-inside mb-2">
                                              {sugg.seoFocus.actions.map((action: string, i: number) => (
                                                <li key={i}>{action}</li>
                                              ))}
                                            </ul>
                                          </>
                                        )}
                                        {sugg.seoFocus.targetMetrics && sugg.seoFocus.targetMetrics.length > 0 && (
                                          <>
                                            <p className="text-xs font-semibold mb-1">Métricas-Alvo:</p>
                                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                                              {sugg.seoFocus.targetMetrics.map((metric: string, i: number) => (
                                                <li key={i}>{metric}</li>
                                              ))}
                                            </ul>
                                          </>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* GEO Focus */}
                                    {sugg.geoFocus && (
                                      <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">Foco GEO</Badge>
                                        </div>
                                        {sugg.geoFocus.actions && sugg.geoFocus.actions.length > 0 && (
                                          <>
                                            <p className="text-xs font-semibold mb-1">Ações:</p>
                                            <ul className="text-xs text-muted-foreground list-disc list-inside mb-2">
                                              {sugg.geoFocus.actions.map((action: string, i: number) => (
                                                <li key={i}>{action}</li>
                                              ))}
                                            </ul>
                                          </>
                                        )}
                                        {sugg.geoFocus.targetMetrics && sugg.geoFocus.targetMetrics.length > 0 && (
                                          <>
                                            <p className="text-xs font-semibold mb-1">Métricas-Alvo:</p>
                                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                                              {sugg.geoFocus.targetMetrics.map((metric: string, i: number) => (
                                                <li key={i}>{metric}</li>
                                              ))}
                                            </ul>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {sugg.expectedImpact && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    <strong>Impacto Esperado:</strong> {sugg.expectedImpact}
                                  </p>
                                )}
                                {sugg.implementation && (
                                  <div className="mt-3 p-3 bg-muted/20 rounded">
                                    <p className="text-xs font-semibold mb-2">Implementação:</p>
                                    {sugg.implementation.steps && (
                                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                        {sugg.implementation.steps.slice(0, 3).map((step: string, i: number) => (
                                          <li key={i}>{step}</li>
                                        ))}
                                      </ul>
                                    )}
                                    {sugg.implementation.timeline && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        <strong>Prazo:</strong> {sugg.implementation.timeline}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Relatórios Completos - Premium Card */}
                {(selectedType === "all" || selectedType === "report") && insights.filter(i => i.type === "report").length > 0 && (
                  <Card className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {/* Premium Header with Gradient Border */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl blur-md opacity-50" />
                            <div className="relative p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10">
                              <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Relatórios Completos</h3>
                            <p className="text-sm text-muted-foreground">Análise abrangente com dados SEO + GEO</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1">
                            {insights.filter(i => i.type === "report").length}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3">SEO</Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-3">GEO</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {insights.filter(i => i.type === "report").map((insight) => {
                        const insightBrandId = insight.brand_id;
                        const brandName = insight.brands?.name || brands?.find(b => b.id === insightBrandId)?.name;
                        
                        return (
                        <Card key={insight.id} className="p-5 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5 border border-white/10 rounded-xl hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1 text-foreground">{insight.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(insight.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={async () => await downloadInsightPDF(insight)} title="Baixar PDF" className="hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => shareInsight(insight)} title="Compartilhar" className="hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteInsight(insight.id)} title="Excluir" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Métricas KAPI da marca - Diagnóstico Atual */}
                          {insightBrandId && (
                            <InsightMetricsSection brandId={insightBrandId} brandName={brandName} />
                          )}
                          
                          {(insight.content as any)?.executiveSummary && (
                            <div className="mt-4 p-4 bg-card/50 rounded-xl border border-white/10">
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{(insight.content as any).executiveSummary}</p>
                            </div>
                          )}
                        </Card>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Resumos de URLs - Premium Card */}
                {(selectedType === "all" || selectedType === "summary") && insights.filter(i => i.type === "summary").length > 0 && (
                  <Card className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {/* Premium Header with Gradient Border */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-violet-500/10 via-transparent to-fuchsia-500/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl blur-md opacity-50" />
                            <div className="relative p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10">
                              <Brain className="w-6 h-6 text-violet-400" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Resumos de URLs</h3>
                            <p className="text-sm text-muted-foreground">Análise detalhada com scores SEO + GEO</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-400 border border-violet-500/30 px-3 py-1">
                            {insights.filter(i => i.type === "summary").length}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3">SEO</Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-3">GEO</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {insights.filter(i => i.type === "summary").map((insight) => {
                        // Parse seguro do conteúdo do resumo
                        let reportContent = insight.content;
                        let displayContent: any;
                        
                        try {
                          // Se o conteúdo já está no formato correto, usar diretamente
                          if (reportContent && typeof reportContent === 'object' && 
                              (reportContent.title || reportContent.executiveSummary)) {
                            displayContent = reportContent;
                          } 
                          // Se for string, tentar fazer parse
                          else if (typeof reportContent === 'string') {
                            // Remover markdown code blocks
                            let jsonStr = reportContent.trim();
                            if (jsonStr.includes('```json')) {
                              jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                            }
                            
                            // Extrair apenas o JSON válido
                            const firstBrace = jsonStr.indexOf('{');
                            const lastBrace = jsonStr.lastIndexOf('}');
                            
                            if (firstBrace !== -1 && lastBrace !== -1) {
                              jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                              displayContent = JSON.parse(jsonStr);
                            } else {
                              throw new Error('JSON inválido - não encontrado delimitadores');
                            }
                          }
                          // Fallback se nada funcionar
                          else {
                            displayContent = {
                              title: insight.title || 'Relatório sem título',
                              executiveSummary: 'Conteúdo não disponível',
                              sections: []
                            };
                          }
                        } catch (e) {
                          // Log silencioso - não exibir erro para o usuário
                          logger.warn('Relatório com formato não reconhecido', { insightId: insight.id });
                          
                          // Criar visualização de fallback amigável
                          displayContent = {
                            title: insight.title || 'Relatório',
                            executiveSummary: 'Este relatório está em formato legado. Gere um novo relatório para obter a análise mais recente.',
                            sections: []
                          };
                        }

                        return (
                        <Card key={insight.id} className="p-5 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5 border border-white/10 rounded-xl hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1 text-foreground">
                                {displayContent?.title || insight.title}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {new Date(insight.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={async () => await downloadInsightPDF(insight)} title="Baixar PDF">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => shareInsight(insight)} title="Compartilhar">
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteInsight(insight.id)} title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Resumo Executivo */}
                          {displayContent?.executiveSummary && (
                            <div className="mt-4 p-4 bg-background rounded-lg border">
                              <h5 className="font-semibold mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Sumário Executivo
                              </h5>
                              <p className="text-sm leading-relaxed">{displayContent.executiveSummary}</p>
                            </div>
                          )}

                          {/* Seções do Relatório */}
                          {displayContent?.sections && Array.isArray(displayContent.sections) && displayContent.sections.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <h5 className="font-semibold text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Análises Detalhadas ({displayContent.sections.length} seções)
                              </h5>
                              {displayContent.sections.slice(0, 3).map((section: any, idx: number) => (
                                <div key={idx} className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                                  <h6 className="font-semibold mb-2 text-sm text-primary">{section.title}</h6>
                                  {section.content && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                                      {section.content}
                                    </p>
                                  )}
                                  {section.metrics && Array.isArray(section.metrics) && section.metrics.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {section.metrics.slice(0, 3).map((metric: any, mIdx: number) => (
                                        <Badge key={mIdx} variant="outline" className="text-xs">
                                          {typeof metric === 'object' ? metric.label : metric}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {displayContent.sections.length > 3 && (
                                <div className="text-center">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadInsightPDF(insight)}
                                    className="text-xs"
                                  >
                                    <Download className="w-3 h-3 mr-2" />
                                    Ver relatório completo ({displayContent.sections.length} seções)
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Scores (formato de URL analysis) */}
                          {(displayContent?.score || displayContent?.geoScore || displayContent?.seoScore) && (
                            <div className="grid grid-cols-3 gap-3 mt-4">
                              {displayContent?.score && (
                                <div className="p-3 bg-background rounded-lg text-center border">
                                  <p className="text-xs text-muted-foreground mb-1">Score Geral</p>
                                  <p className="text-2xl font-bold text-primary">{displayContent.score}</p>
                                </div>
                              )}
                              {displayContent?.geoScore && (
                                <div className="p-3 bg-background rounded-lg text-center border">
                                  <p className="text-xs text-muted-foreground mb-1">GEO Score</p>
                                  <p className="text-2xl font-bold text-purple-500">{displayContent.geoScore}</p>
                                </div>
                              )}
                              {displayContent?.seoScore && (
                                <div className="p-3 bg-background rounded-lg text-center border">
                                  <p className="text-xs text-muted-foreground mb-1">SEO Score</p>
                                  <p className="text-2xl font-bold text-blue-500">{displayContent.seoScore}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      )})}
                    </div>
                  </Card>
                )}
              </div>
            )}
              </>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6 mt-6">
            <Card className="backdrop-blur-xl bg-card/40 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              {/* Premium Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl blur-md opacity-50" />
                      <div className="relative p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10">
                        <Calendar className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Agendamentos Automáticos</h3>
                      <p className="text-sm text-muted-foreground">
                        Crie agendamentos para receber relatórios automáticos por email periodicamente
                      </p>
                    </div>
                  </div>
                  {!showNew && (
                    <Button 
                      onClick={() => {
                        setShowNew(true);
                        setEmailForSchedule(userEmail || "");
                      }}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Agendamento
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6">
              {showNew && (
                <div className="space-y-4 p-5 border border-white/10 rounded-xl bg-card/50 mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Como funcionam os Agendamentos Automáticos?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ao criar um agendamento, o sistema irá gerar e enviar relatórios automaticamente por email na periodicidade escolhida.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email para Receber os Relatórios *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailForSchedule}
                      onChange={(e) => setEmailForSchedule(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-background/50 border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Tipo de Relatório *</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger id="report-type" className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Selecione o tipo..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                          <SelectItem value="weekly">Relatório Semanal</SelectItem>
                          <SelectItem value="monthly">Relatório Mensal</SelectItem>
                          <SelectItem value="daily">Relatório Diário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequência de Envio *</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger id="frequency" className="bg-background/50 border-white/10">
                          <SelectValue placeholder="Selecione a frequência..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                          <SelectItem value="daily">Diária (todo dia)</SelectItem>
                          <SelectItem value="weekly">Semanal (toda semana)</SelectItem>
                          <SelectItem value="monthly">Mensal (todo mês)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => createSchedule.mutate()} 
                      disabled={!frequency || !reportType || !emailForSchedule || createSchedule.isPending}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                    >
                      {createSchedule.isPending ? "Criando..." : "Criar Agendamento"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowNew(false);
                      setEmailForSchedule("");
                      setFrequency("");
                      setReportType("");
                    }} className="border-white/10 hover:bg-white/5">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
              </div>
            </Card>

            {schedules && schedules.length > 0 ? (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-primary/10 rounded">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">
                                Relatório{" "}
                                {schedule.frequency === "weekly"
                                  ? "Semanal"
                                  : schedule.frequency === "monthly"
                                  ? "Mensal"
                                  : "Diário"}
                                {" "}Automático
                              </h4>
                              <Badge variant={schedule.enabled ? "default" : "secondary"}>
                                {schedule.enabled ? "Ativo" : "Pausado"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {schedule.frequency === "weekly" && "Enviado automaticamente por email toda semana com análise completa"}
                              {schedule.frequency === "monthly" && "Enviado automaticamente por email todo mês com análise completa"}
                              {schedule.frequency === "daily" && "Enviado automaticamente por email todo dia com análise completa"}
                            </p>
                            {userEmail && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Enviado para: {userEmail}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generateManualReport(schedule.frequency)}
                            title="Gerar relatório agora (manualmente)"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSchedule(schedule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Última execução: </span>
                            <span className="font-medium">
                              {schedule.last_run 
                                ? format(new Date(schedule.last_run), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                : "Ainda não executado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Próxima execução: </span>
                            <span className="font-medium text-primary">
                              {schedule.next_run 
                                ? format(new Date(schedule.next_run), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                : schedule.enabled ? "Aguardando configuração" : "Pausado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum agendamento configurado</p>
                  <p className="text-sm mt-2 max-w-md mx-auto">
                    Clique em "Novo Agendamento" acima para criar um agendamento automático. Os relatórios serão gerados e enviados por email automaticamente na periodicidade escolhida.
                  </p>
                </div>
              </Card>
            )}

            {schedules && schedules.length > 0 && (
              <>
                <div className="border-t my-8"></div>
                
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Histórico de Relatórios Gerados</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Relatórios gerados manualmente (botão ▶️ Play acima) e automaticamente (pelos agendamentos) ficam salvos aqui
                  </p>
                  
                  {generatedReports && generatedReports.length > 0 ? (
                    <div className="space-y-3">
                      {generatedReports.map((report) => (
                        <Card key={report.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  {report.content?.title || (
                                    <>
                                      {report.content?.brandName && `${report.content.brandName} - `}
                                      {report.report_type === "weekly" && "Relatório Semanal"}
                                      {report.report_type === "monthly" && "Relatório Mensal"}
                                      {report.report_type === "daily" && "Relatório Diário"}
                                    </>
                                  )}
                                </h4>
                                <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                                  {report.status === "completed" ? "Concluído" : "Processando"}
                                </Badge>
                                {report.email_sent && (
                                  <Badge variant="outline" className="text-xs">
                                    ✉️ Email enviado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Gerado em {format(new Date(report.generated_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                              </p>
                              {report.content && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {report.content.totalMentions} menções • {report.content.brands?.length || 0} marcas analisadas
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Copiar para área de transferência"
                              onClick={() => copyReportToClipboard(report)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Baixar relatório"
                              onClick={() => downloadReport(report)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhum relatório gerado ainda</p>
                      <p className="text-xs mt-1">
                        Clique no botão ▶️ Play ao lado de um agendamento para gerar um relatório manualmente
                      </p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Insights;
