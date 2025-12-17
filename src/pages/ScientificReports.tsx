import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, BarChart3, CheckCircle, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/utils/logger";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME } from "@/config/brandVisibility";

export default function ScientificReports() {
  const { toast } = useToast();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // ✅ FILTRO CONTROLADO PELO CÓDIGO
  const { data: brands } = useQuery({
    queryKey: ["brands", USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      let query = supabase.from("brands").select("*");
      
      if (USE_CODE_BASED_VISIBILITY) {
        query = query.eq('name', VISIBLE_BRAND_NAME);
      } else {
        query = query.eq('is_visible', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: reports, refetch: refetchReports } = useQuery({
    queryKey: ["scientific-reports", selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      const { data, error } = await supabase
        .from("scientific_reports")
        .select("*")
        .eq("brand_id", selectedBrand)
        .order("generated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBrand,
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ brandId, reportType, period }: any) => {
      const { data, error } = await supabase.functions.invoke("generate-scientific-report", {
        body: { brandId, reportType, period },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Relatório Científico Gerado",
        description: "O relatório foi gerado com sucesso e está disponível para visualização.",
      });
      refetchReports();
    },
    onError: (error) => {
      toast({
        title: "Erro ao Gerar Relatório",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("scientific_reports")
        .delete()
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Relatório Excluído",
        description: "O relatório foi excluído com sucesso.",
      });
      refetchReports();
      setSelectedReport(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao Excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAllReportsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBrand) throw new Error("Nenhuma marca selecionada");
      const { error } = await supabase
        .from("scientific_reports")
        .delete()
        .eq("brand_id", selectedBrand);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Relatórios Excluídos",
        description: "Todos os relatórios foram excluídos com sucesso.",
      });
      refetchReports();
      setSelectedReport(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao Excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = () => {
    if (!selectedBrand) {
      toast({
        title: "Selecione uma marca",
        description: "É necessário selecionar uma marca antes de gerar o relatório.",
        variant: "destructive",
      });
      return;
    }
    generateReportMutation.mutate({
      brandId: selectedBrand,
      reportType: "full",
      period: 30,
    });
  };

  const handleDownloadPDF = async (report: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const data = report.report_data;
      
      if (!data || !data.metadata) {
        throw new Error('Dados do relatório inválidos ou incompletos');
      }
      
      const dateStr = new Date(report.generated_at).toLocaleDateString("pt-BR");
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
      
      // Header
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Científico IGO', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(data.metadata.brandName, pageWidth / 2, 28, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Período: ${data.metadata.period} dias | ${dateStr}`, pageWidth / 2, 35, { align: 'center' });
      
      yPos = 50;
      doc.setTextColor(0, 0, 0);
      
      // ==================== SUMÁRIO EXECUTIVO ====================
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Sumário Executivo', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const execSummary = data.executive_summary || {};
      doc.text(`ICE Médio: ${(execSummary.avgICE || 0).toFixed(2)}`, 14, yPos);
      yPos += 7;
      doc.text(`GAP Médio: ${(execSummary.avgGAP || 0).toFixed(2)}`, 14, yPos);
      yPos += 7;
      doc.text(`CPI Médio: ${(execSummary.avgCPI || 0).toFixed(2)}`, 14, yPos);
      yPos += 7;
      doc.text(`Estabilidade Cognitiva: ${(execSummary.avgStability || 0).toFixed(1)}%`, 14, yPos);
      yPos += 7;
      doc.text(`Tendência: ${execSummary.trend || 'N/A'}`, 14, yPos);
      yPos += 7;
      doc.text(`Consenso Multi-LLM: ${(execSummary.multiLLMConsensus || 0).toFixed(1)}%`, 14, yPos);
      yPos += 7;
      doc.text(`Risco de Alucinação: ${(execSummary.hallucinationRisk || 0).toFixed(1)}%`, 14, yPos);
      yPos += 12;
      
      // ==================== ANÁLISE TEMPORAL IGO ====================
      const igoAnalysis = data.igo_analysis || {};
      if (igoAnalysis.temporal_evolution && igoAnalysis.temporal_evolution.length > 0) {
        if (yPos > 230) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise Temporal IGO', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Médias das métricas
        doc.text(`ICE: Média ${(igoAnalysis.avgICE || 0).toFixed(2)} | Trend: ${igoAnalysis.trend || 'N/A'}`, 14, yPos);
        yPos += 6;
        doc.text(`GAP: Média ${(igoAnalysis.avgGAP || 0).toFixed(2)}`, 14, yPos);
        yPos += 6;
        doc.text(`CPI: Média ${(igoAnalysis.avgCPI || 0).toFixed(2)}`, 14, yPos);
        yPos += 6;
        doc.text(`Estabilidade: Média ${(igoAnalysis.avgStability || 0).toFixed(1)}%`, 14, yPos);
        yPos += 10;
      }
      
      // ==================== ANÁLISE MULTI-LLM COMPLETA ====================
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise Multi-LLM', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const providers = data.multi_llm_analysis?.provider_comparison || [];
      
      if (providers.length === 0) {
        doc.text('Nenhum dado de providers disponível', 14, yPos);
        yPos += 8;
      } else {
      providers.forEach((p: any) => {
          const providerName = p.provider.charAt(0).toUpperCase() + p.provider.slice(1);
          doc.text(`${providerName}:`, 14, yPos);
          doc.text(`Taxa: ${((p.mentionRate || 0) * 100).toFixed(1)}%`, 60, yPos);
          // Normalizar confiança: se < 1, multiplicar por 100 (é decimal)
          const confidence = (p.avgConfidence || 0) < 1 ? (p.avgConfidence || 0) * 100 : (p.avgConfidence || 0);
          doc.text(`Confiança: ${confidence.toFixed(1)}%`, 120, yPos);
          yPos += 6;
          
          if (p.totalMentions !== undefined) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`  Total de Menções: ${p.totalMentions}`, 14, yPos);
            yPos += 5;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
          }
        });
        yPos += 8;
        
        // Consenso e Divergência
        const multiLLM = data.multi_llm_analysis || {};
        if (multiLLM.consensus_rate !== undefined) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Consenso e Divergência:', 14, yPos);
          yPos += 6;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Taxa de Consenso: ${(multiLLM.consensus_rate || 0).toFixed(1)}%`, 14, yPos);
          yPos += 6;
          
          if (multiLLM.divergence_patterns && multiLLM.divergence_patterns.length > 0) {
            doc.text('Padrões de Divergência:', 14, yPos);
            yPos += 5;
            multiLLM.divergence_patterns.slice(0, 3).forEach((pattern: string) => {
              const lines = doc.splitTextToSize(`• ${pattern}`, pageWidth - 30);
              doc.text(lines, 18, yPos);
              yPos += (lines.length * 5);
            });
          }
          yPos += 8;
        }
      }
      
      // ==================== CONVERGÊNCIA ====================
      const convergence = data.convergence_analysis || {};
      if (Object.keys(convergence).length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise de Convergência', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (convergence.geoIgoAlignment !== undefined) {
          doc.text(`Alinhamento GEO-IGO: ${(convergence.geoIgoAlignment || 0).toFixed(1)}%`, 14, yPos);
          yPos += 6;
        }
        if (convergence.seoIgoCorrelation !== undefined) {
          doc.text(`Correlação SEO-IGO: ${(convergence.seoIgoCorrelation || 0).toFixed(2)}`, 14, yPos);
          yPos += 6;
        }
        if (convergence.overallConvergence !== undefined) {
          doc.text(`Convergência Geral: ${convergence.overallConvergence}`, 14, yPos);
          yPos += 6;
        }
        yPos += 8;
      }
      
      // ==================== ESTABILIDADE COGNITIVA COMPLETA ====================
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      const cognitiveStability = data.cognitive_stability || {};
      if (Object.keys(cognitiveStability).length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise de Estabilidade Cognitiva', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        if (cognitiveStability.stability_score !== undefined) {
          doc.text(`Score de Estabilidade: ${(cognitiveStability.stability_score || 0).toFixed(1)}%`, 14, yPos);
          yPos += 6;
        }
        if (cognitiveStability.volatility !== undefined) {
          doc.text(`Volatilidade: ${(cognitiveStability.volatility || 0).toFixed(2)}`, 14, yPos);
          yPos += 6;
        }
        if (cognitiveStability.consistency_index !== undefined) {
          doc.text(`Índice de Consistência: ${(cognitiveStability.consistency_index || 0).toFixed(1)}%`, 14, yPos);
          yPos += 6;
        }
        if (cognitiveStability.risk_factors && cognitiveStability.risk_factors.length > 0) {
          yPos += 3;
          doc.text('Fatores de Risco:', 14, yPos);
          yPos += 5;
          cognitiveStability.risk_factors.slice(0, 4).forEach((risk: string) => {
            const lines = doc.splitTextToSize(`• ${risk}`, pageWidth - 30);
            doc.text(lines, 18, yPos);
            yPos += (lines.length * 5);
          });
        }
        yPos += 8;
      }
      
      // ==================== VALIDAÇÃO CIENTÍFICA COMPLETA ====================
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Validação Científica', 14, yPos);
      yPos += 10;
      
      const validation = data.scientific_validation || {};
      const hypotheses = validation.hypothesis_testing || {};
      const significance = validation.statistical_significance || {};
      
      // Hipóteses com DETALHES COMPLETOS
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      if (hypotheses.H1) {
        doc.setFont('helvetica', 'bold');
        doc.text(`H1: ${hypotheses.H1.description || 'Métricas IGO representam comportamento de LLMs com confiabilidade'}`, 14, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${hypotheses.H1.status} | Confiança: ${hypotheses.H1.confidence}`, 14, yPos);
        yPos += 6;
        if (hypotheses.H1.evidence) {
          const lines = doc.splitTextToSize(`Evidência: ${hypotheses.H1.evidence}`, pageWidth - 30);
          doc.text(lines, 14, yPos);
          yPos += (lines.length * 5) + 3;
        }
        yPos += 3;
      }
      
      if (hypotheses.H2) {
        doc.setFont('helvetica', 'bold');
        doc.text(`H2: ${hypotheses.H2.description || 'Meta-IA detecta divergências com maior precisão'}`, 14, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${hypotheses.H2.status} | Confiança: ${hypotheses.H2.confidence}`, 14, yPos);
        yPos += 6;
        if (hypotheses.H2.evidence) {
          const lines = doc.splitTextToSize(`Evidência: ${hypotheses.H2.evidence}`, pageWidth - 30);
          doc.text(lines, 14, yPos);
          yPos += (lines.length * 5) + 3;
        }
        yPos += 3;
      }
      
      if (hypotheses.H3) {
        doc.setFont('helvetica', 'bold');
        doc.text(`H3: ${hypotheses.H3.description || 'Correlação entre SEO e IGO'}`, 14, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${hypotheses.H3.status} | Confiança: ${hypotheses.H3.confidence}`, 14, yPos);
        yPos += 6;
        if (hypotheses.H3.evidence) {
          const lines = doc.splitTextToSize(`Evidência: ${hypotheses.H3.evidence}`, pageWidth - 30);
          doc.text(lines, 14, yPos);
          yPos += (lines.length * 5) + 3;
        }
        yPos += 3;
      }
      
      yPos += 5;
      doc.text(`Tamanho da Amostra: ${significance.sampleSize || 0} pontos`, 14, yPos);
      yPos += 6;
      doc.text(`Significância Estatística: ${significance.significance || 'N/A'}`, 14, yPos);
      yPos += 6;
      if (significance.pValue !== undefined) {
        doc.text(`P-value: ${significance.pValue.toFixed(4)}`, 14, yPos);
        yPos += 6;
      }
      yPos += 8;
      
      // ==================== INTERVALOS DE CONFIANÇA ====================
      const confidenceIntervals = validation.confidence_intervals || {};
      if (Object.keys(confidenceIntervals).length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Intervalos de Confiança (95%)', 14, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(confidenceIntervals).forEach(([metric, interval]: [string, any]) => {
          const metricName = metric.toUpperCase();
          doc.text(`${metricName}: ${interval.mean.toFixed(2)} [${interval.lower.toFixed(2)} - ${interval.upper.toFixed(2)}]`, 14, yPos);
          yPos += 6;
        });
        yPos += 8;
      }
      
      // ==================== CORRELAÇÕES ====================
      const correlations = data.correlations || {};
      if (Object.keys(correlations).length > 0) {
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise de Correlações', 14, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(correlations).forEach(([key, value]: [string, any]) => {
          doc.text(`${key}: ${typeof value === 'number' ? value.toFixed(3) : value}`, 14, yPos);
          yPos += 6;
        });
        yPos += 8;
      }
      
      // ==================== RECOMENDAÇÕES COMPLETAS ====================
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendações Científicas', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const recommendations = data.recommendations || [];
      
      if (recommendations.length === 0) {
        doc.text('Nenhuma recomendação gerada.', 14, yPos);
        yPos += 10;
      } else {
        recommendations.forEach((rec: any, index: number) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          
          const priorityLabel = rec.priority === 'high' ? '[ALTA PRIORIDADE]' : 
                               rec.priority === 'medium' ? '[MÉDIA PRIORIDADE]' : '[BAIXA PRIORIDADE]';
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${priorityLabel}`, 14, yPos);
          yPos += 6;
          
          doc.setFont('helvetica', 'normal');
          const actionText = rec.action || rec.title || 'N/A';
          const actionLines = doc.splitTextToSize(actionText, pageWidth - 30);
          doc.text(actionLines, 14, yPos);
          yPos += (actionLines.length * 5) + 3;
          
          if (rec.category) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Categoria: ${rec.category}`, 14, yPos);
            yPos += 5;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
          }
          
          if (rec.impact) {
            doc.setTextColor(100, 100, 100);
            const impactLines = doc.splitTextToSize(`Impacto Esperado: ${rec.impact}`, pageWidth - 30);
            doc.text(impactLines, 14, yPos);
            yPos += (impactLines.length * 5);
            doc.setTextColor(0, 0, 0);
          }
          
          yPos += 5;
        });
      }
      
      // Footer com numeração de páginas
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
        doc.text('Teia GEO - Relatório Científico IGO', 14, 285);
      }
      
      doc.save(`relatorio-cientifico-${data.metadata.brandName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      
      toast({
        title: "PDF Completo Gerado!",
        description: "Relatório científico com todas as análises foi baixado com sucesso.",
      });
    } catch (error) {
      logger.error('Erro ao gerar PDF científico completo', { error, reportId: report.id });
      toast({
        title: "Erro ao Gerar PDF",
        description: "Não foi possível gerar o PDF completo.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = async (report: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const XLSX = await import("xlsx");
      const data = report.report_data;
      
      // Summary Sheet
      const summaryData = [
        ["Relatório Científico IGO"],
        [""],
        ["Marca", data.metadata.brandName],
        ["Período", data.metadata.period],
        ["Data de Geração", new Date(report.generated_at).toLocaleDateString("pt-BR")],
        [""],
        ["Sumário Executivo"],
        ["ICE Médio", data.executive_summary.avgICE.toFixed(2)],
        ["GAP Médio", data.executive_summary.avgGAP.toFixed(2)],
        ["CPI Médio", data.executive_summary.avgCPI],
        ["Estabilidade Cognitiva", data.executive_summary.avgStability.toFixed(2)],
        ["Consenso Multi-LLM (%)", data.executive_summary.multiLLMConsensus.toFixed(1)],
        ["Tendência", data.executive_summary.trend],
        ["Risco de Alucinação (%)", data.executive_summary.hallucinationRisk],
      ];
      
      // Provider Comparison Sheet
      const providerData = [["Provider", "Taxa de Menção (%)", "Confiança Média (%)", "Total de Menções"]];
      if (data.multi_llm_analysis?.provider_comparison) {
        data.multi_llm_analysis.provider_comparison.forEach((p: any) => {
          providerData.push([
            p.provider,
            (p.mentionRate * 100).toFixed(1),
            (p.avgConfidence || 0).toFixed(1),
            p.totalMentions,
          ]);
        });
      }
      
      // Recommendations Sheet
      const recsData = [["Prioridade", "Categoria", "Ação"]];
      if (data.recommendations) {
        data.recommendations.forEach((r: any) => {
          recsData.push([r.priority, r.category, r.action]);
        });
      }
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      const wsProviders = XLSX.utils.aoa_to_sheet(providerData);
      const wsRecs = XLSX.utils.aoa_to_sheet(recsData);
      
      XLSX.utils.book_append_sheet(wb, wsSummary, "Sumário");
      XLSX.utils.book_append_sheet(wb, wsProviders, "Análise Multi-LLM");
      XLSX.utils.book_append_sheet(wb, wsRecs, "Recomendações");
      
      XLSX.writeFile(wb, `relatorio-cientifico-${report.report_type}-${new Date(report.generated_at).toLocaleDateString("pt-BR")}.xlsx`);
      
      toast({
        title: "Excel Gerado",
        description: "O relatório Excel foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao Gerar Excel",
        description: "Não foi possível gerar o Excel.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Premium */}
      <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 border-2 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              Relatórios Científicos
            </span>
          </h1>
          <p className="text-slate-400 mt-2">
            Geração automática de relatórios acadêmicos baseados em métricas IGO
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selecionar Marca Card */}
        <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)] hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Selecionar Marca</CardTitle>
            <CardDescription>Escolha a marca para análise científica</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="bg-slate-800/60 border-slate-600/50 hover:border-purple-500/50 transition-colors">
                <SelectValue placeholder="Selecione uma marca" />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Gerar Relatório Card */}
        <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)] hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Gerar Novo Relatório</CardTitle>
            <CardDescription>Análise completa dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedBrand || generateReportMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300"
            >
              {generateReportMutation.isPending ? "Gerando..." : "Gerar Relatório Científico"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {reports && reports.length > 0 && (
        <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Relatórios Disponíveis</CardTitle>
              <CardDescription>Histórico de relatórios científicos gerados</CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir todos os relatórios?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os {reports.length} relatório(s) serão permanentemente excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllReportsMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Todos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border-2 border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 hover:border-purple-500/30 cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(100,116,139,0.05)] hover:shadow-[0_0_25px_rgba(139,92,246,0.1)]"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-600/20">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Relatório {report.report_type} - {report.period_days} dias
                      </p>
                      <p className="text-sm text-slate-400">
                        Gerado em {new Date(report.generated_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleDownloadPDF(report, e)}
                      className="hover:bg-purple-500/20 hover:text-purple-400"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-900 border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O relatório será permanentemente excluído.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteReportMutation.mutate(report.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport && (
        <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 shadow-[0_0_30px_rgba(100,116,139,0.1)]">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Visualização do Relatório</CardTitle>
            <CardDescription>
              Análise científica completa com métricas IGO e validação de hipóteses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 border border-slate-700/50 p-1 rounded-xl">
                <TabsTrigger value="summary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Sumário</TabsTrigger>
                <TabsTrigger value="metrics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Métricas</TabsTrigger>
                <TabsTrigger value="validation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Validação</TabsTrigger>
                <TabsTrigger value="recommendations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)] rounded-lg transition-all">Recomendações</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">ICE Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-400">
                        {selectedReport.report_data?.executive_summary?.avgICE?.toFixed(2) || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">GAP Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-400">
                        {selectedReport.report_data?.executive_summary?.avgGAP?.toFixed(2) || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">CPI Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-400">
                        {selectedReport.report_data?.executive_summary?.avgCPI?.toFixed(2) || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-950/50 via-slate-900/50 to-slate-950/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Consenso Multi-LLM</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-400">
                        {selectedReport.report_data?.executive_summary?.multiLLMConsensus?.toFixed(1) || "N/A"}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
                  <CardHeader>
                    <CardTitle className="text-base bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Tendência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={
                      selectedReport.report_data?.executive_summary?.trend === 'ascending' 
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                        : selectedReport.report_data?.executive_summary?.trend === 'descending'
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                    }>
                      {selectedReport.report_data?.executive_summary?.trend === 'ascending' ? '↑ Ascendente' : 
                       selectedReport.report_data?.executive_summary?.trend === 'descending' ? '↓ Descendente' : 
                       '→ Estável'}
                    </Badge>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4 mt-6">
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-600/20">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Análise Multi-LLM</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.report_data?.multi_llm_analysis?.provider_comparison?.map((provider: any) => (
                        <div key={provider.provider} className="flex justify-between items-center p-4 border-2 border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-all">
                          <span className="font-medium text-white">{provider.provider}</span>
                          <div className="flex gap-4">
                            <span className="text-sm text-slate-400">
                              Confiança: <span className="text-purple-400 font-medium">{provider.avgConfidence?.toFixed(1)}%</span>
                            </span>
                            <span className="text-sm text-slate-400">
                              Taxa: <span className="text-emerald-400 font-medium">{(provider.mentionRate * 100)?.toFixed(1)}%</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4 mt-6">
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
                  <CardHeader>
                    <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Validação de Hipóteses Científicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedReport.report_data?.scientific_validation?.hypothesis_testing || {}).map(([key, hypothesis]: [string, any]) => (
                      <div key={key} className={`p-4 border-2 rounded-xl transition-all ${
                        hypothesis.status === 'validated' 
                          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/50 to-slate-950/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                          : 'border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/50 to-slate-950/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {hypothesis.status === 'validated' ? (
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-600/20">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                                <TrendingUp className="h-5 w-5 text-amber-400" />
                              </div>
                            )}
                            <span className="font-medium text-white">{key}</span>
                          </div>
                          <Badge className={
                            hypothesis.status === 'validated' 
                              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white' 
                              : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                          }>
                            {hypothesis.confidence}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{hypothesis.hypothesis}</p>
                        <p className="text-sm mt-2 text-slate-300">
                          Status: <span className={`font-medium ${hypothesis.status === 'validated' ? 'text-emerald-400' : 'text-amber-400'}`}>{hypothesis.status}</span>
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4 mt-6">
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
                  <CardHeader>
                    <CardTitle className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Recomendações Científicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedReport.report_data?.recommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-xl border-l-4 transition-all ${
                        rec.priority === 'high' 
                          ? 'border-l-red-500 bg-gradient-to-r from-red-950/30 via-slate-900/50 to-slate-950/50 border-2 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                          : 'border-l-amber-500 bg-gradient-to-r from-amber-950/30 via-slate-900/50 to-slate-950/50 border-2 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={
                            rec.priority === 'high' 
                              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                              : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                          }>
                            {rec.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                          </Badge>
                          <span className="text-sm text-slate-400">{rec.category}</span>
                        </div>
                        <p className="text-sm font-medium text-white">{rec.action}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
