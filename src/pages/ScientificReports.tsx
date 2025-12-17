import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, BarChart3, CheckCircle, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/utils/logger";
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
          doc.text(`Confiança: ${(p.avgConfidence || 0).toFixed(1)}%`, 120, yPos);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Relatórios Científicos
          </h1>
          <p className="text-muted-foreground mt-2">
            Geração automática de relatórios acadêmicos baseados em métricas IGO
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Marca</CardTitle>
            <CardDescription>Escolha a marca para análise científica</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
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

        <Card>
          <CardHeader>
            <CardTitle>Gerar Novo Relatório</CardTitle>
            <CardDescription>Análise completa dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedBrand || generateReportMutation.isPending}
              className="w-full"
            >
              {generateReportMutation.isPending ? "Gerando..." : "Gerar Relatório Científico"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {reports && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Relatórios Disponíveis</CardTitle>
            <CardDescription>Histórico de relatórios científicos gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        Relatório {report.report_type} - {report.period_days} dias
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Gerado em {new Date(report.generated_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleDownloadPDF(report, e)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDownloadExcel(report, e)}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Download Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle>Visualização do Relatório</CardTitle>
            <CardDescription>
              Análise científica completa com métricas IGO e validação de hipóteses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Sumário</TabsTrigger>
                <TabsTrigger value="metrics">Métricas</TabsTrigger>
                <TabsTrigger value="validation">Validação</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ICE Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedReport.report_data?.executive_summary?.avgICE?.toFixed(2) || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">GAP Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedReport.report_data?.executive_summary?.avgGAP?.toFixed(2) || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">CPI Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedReport.report_data?.executive_summary?.avgCPI?.toFixed(2) || "N/A"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Consenso Multi-LLM</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedReport.report_data?.executive_summary?.multiLLMConsensus?.toFixed(1) || "N/A"}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tendência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={
                      selectedReport.report_data?.executive_summary?.trend === 'ascending' ? 'default' : 'secondary'
                    }>
                      {selectedReport.report_data?.executive_summary?.trend === 'ascending' ? '↑ Ascendente' : 
                       selectedReport.report_data?.executive_summary?.trend === 'descending' ? '↓ Descendente' : 
                       '→ Estável'}
                    </Badge>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Análise Multi-LLM
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.report_data?.multi_llm_analysis?.provider_comparison?.map((provider: any) => (
                        <div key={provider.provider} className="flex justify-between items-center p-3 border rounded">
                          <span className="font-medium">{provider.provider}</span>
                          <div className="flex gap-4">
                            <span className="text-sm text-muted-foreground">
                              Confiança: {provider.avgConfidence?.toFixed(1)}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Taxa: {(provider.mentionRate * 100)?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Validação de Hipóteses Científicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedReport.report_data?.scientific_validation?.hypothesis_testing || {}).map(([key, hypothesis]: [string, any]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {hypothesis.status === 'validated' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingUp className="h-5 w-5 text-yellow-600" />
                            )}
                            <span className="font-medium">{key}</span>
                          </div>
                          <Badge variant={hypothesis.status === 'validated' ? 'default' : 'secondary'}>
                            {hypothesis.confidence}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{hypothesis.hypothesis}</p>
                        <p className="text-sm mt-2">
                          Status: <span className="font-medium">{hypothesis.status}</span>
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações Científicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedReport.report_data?.recommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 border-l-4 border-primary rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                            {rec.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{rec.category}</span>
                        </div>
                        <p className="text-sm font-medium">{rec.action}</p>
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
