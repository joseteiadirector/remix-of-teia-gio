import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useNavigate } from 'react-router-dom';
import { AnalysisHistory } from '@/components/url-analysis/AnalysisHistory';
import { MonitoringSchedule } from '@/components/url-analysis/MonitoringSchedule';
import { CompetitorAnalysis } from '@/components/url-analysis/CompetitorAnalysis';
import { ActionableChecklist } from '@/components/url-analysis/ActionableChecklist';
import { VirtualizedAnalysisList } from '@/components/url-analysis/VirtualizedAnalysisList';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Download
} from 'lucide-react';
import { DataSourceBadge, DataSourceExplanation } from '@/components/DataSourceBadge';
import { logger } from "@/utils/logger";

// Função para gerar HTML do relatório de análises de URL
function generateUrlAnalysisHTML(historyData: any[]): string {
  const now = new Date().toLocaleString('pt-BR');
  const totalAnalyses = historyData.length;
  const avgOverallScore = (historyData.reduce((sum, h) => sum + (h.overall_score || 0), 0) / totalAnalyses).toFixed(1);
  const avgGeoScore = (historyData.reduce((sum, h) => sum + (h.geo_score || 0), 0) / totalAnalyses).toFixed(1);
  const avgSeoScore = (historyData.reduce((sum, h) => sum + (h.seo_score || 0), 0) / totalAnalyses).toFixed(1);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Análises de URL - Teia GEO</title>
      <style>
        @page { margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #f8f9fa;
          color: #212529;
          line-height: 1.6;
        }
        .container { 
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          color: white;
        }
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .header .brand {
          font-size: 18px;
          margin: 10px 0;
          opacity: 0.95;
        }
        .header .date {
          font-size: 14px;
          opacity: 0.85;
        }
        .note {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 6px;
          font-size: 14px;
          color: #856404;
        }
        .summary-box {
          background: linear-gradient(135deg, #0066cc 0%, #004999 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin: 30px 0;
        }
        .summary-box h2 {
          text-align: center;
          font-size: 22px;
          margin-bottom: 25px;
          font-weight: 600;
        }
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .stat-item {
          background: rgba(255, 255, 255, 0.15);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .stat-value {
          font-size: 36px;
          font-weight: bold;
          margin: 10px 0;
        }
        .stat-label {
          font-size: 13px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section-title {
          color: #212529;
          margin: 40px 0 25px 0;
          font-size: 24px;
          font-weight: 600;
          border-bottom: 3px solid #dee2e6;
          padding-bottom: 12px;
        }
        .analysis-card {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .card-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 20px;
          border-radius: 10px 10px 0 0;
          border-left: 5px solid #667eea;
        }
        .url-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .url-text {
          color: #495057;
          font-size: 14px;
          font-weight: 500;
          max-width: 70%;
          word-break: break-all;
        }
        .date-text {
          color: #6c757d;
          font-size: 13px;
          white-space: nowrap;
        }
        .scores-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 20px;
        }
        .scores-table th {
          background: #495057;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .scores-table th:first-child {
          border-radius: 8px 0 0 0;
        }
        .scores-table th:last-child {
          border-radius: 0 8px 0 0;
        }
        .scores-table td {
          background: white;
          padding: 25px;
          text-align: center;
          border-left: 1px solid #e9ecef;
          border-right: 1px solid #e9ecef;
        }
        .scores-table td:first-child {
          border-left: none;
        }
        .scores-table td:last-child {
          border-right: none;
          border-radius: 0 0 8px 0;
        }
        .scores-table tr:last-child td:first-child {
          border-radius: 0 0 0 8px;
        }
        .score-value {
          font-size: 40px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .score-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-excellent { background: #d1fae5; color: #065f46; }
        .badge-good { background: #d1fae5; color: #047857; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-critical { background: #fee2e2; color: #991b1b; }
        .score-excellent { color: #10b981; }
        .score-good { color: #10b981; }
        .score-warning { color: #f59e0b; }
        .score-critical { color: #ef4444; }
        .summary-section {
          background: white;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border-left: 5px solid #667eea;
          border-right: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
        }
        .summary-text {
          font-size: 14px;
          color: #495057;
          line-height: 1.7;
        }
        .footer {
          margin-top: 50px;
          padding-top: 25px;
          border-top: 3px solid #dee2e6;
          text-align: center;
          color: #6c757d;
          font-size: 12px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Relatório de Análises de URL</h1>
          <div class="brand"><strong>Teia GEO</strong></div>
          <div class="date">Gerado em: ${now}</div>
        </div>

        <div class="note">
          <strong>📄 Nota:</strong> Este PDF contém as ${totalAnalyses} análises mais recentes. Para visualizar todo o histórico, use a exportação em Excel.
        </div>

        <div class="summary-box">
          <h2>📈 RESUMO EXECUTIVO</h2>
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-label">Análises</div>
              <div class="stat-value">${totalAnalyses}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Score Médio</div>
              <div class="stat-value">${avgOverallScore}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">GEO Médio</div>
              <div class="stat-value">${avgGeoScore}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">SEO Médio</div>
              <div class="stat-value">${avgSeoScore}</div>
            </div>
          </div>
        </div>

        <h2 class="section-title">📋 Histórico de Análises</h2>

        ${historyData.map((analysis, index) => {
          const overallClass = analysis.overall_score >= 80 ? 'excellent' : 
                              analysis.overall_score >= 60 ? 'good' : 
                              analysis.overall_score >= 40 ? 'warning' : 'critical';
          const geoClass = analysis.geo_score >= 80 ? 'excellent' : 
                          analysis.geo_score >= 60 ? 'good' : 
                          analysis.geo_score >= 40 ? 'warning' : 'critical';
          const seoClass = analysis.seo_score >= 80 ? 'excellent' : 
                          analysis.seo_score >= 60 ? 'good' : 
                          analysis.seo_score >= 40 ? 'warning' : 'critical';
          
          const overallLabel = analysis.overall_score >= 80 ? 'Excelente' : 
                              analysis.overall_score >= 60 ? 'Bom' : 
                              analysis.overall_score >= 40 ? 'Regular' : 'Crítico';
          const geoLabel = analysis.geo_score >= 80 ? 'Excelente' : 
                          analysis.geo_score >= 60 ? 'Bom' : 
                          analysis.geo_score >= 40 ? 'Regular' : 'Crítico';
          const seoLabel = analysis.seo_score >= 80 ? 'Excelente' : 
                          analysis.seo_score >= 60 ? 'Bom' : 
                          analysis.seo_score >= 40 ? 'Regular' : 'Crítico';
          
          return `
            <div class="analysis-card">
              <div class="card-header">
                <div class="url-section">
                  <div class="url-text"><strong>${index + 1}.</strong> ${analysis.url}</div>
                  <div class="date-text">${new Date(analysis.created_at).toLocaleString('pt-BR')}</div>
                </div>
                
                <table class="scores-table">
                  <thead>
                    <tr>
                      <th>SCORE GERAL</th>
                      <th>GEO</th>
                      <th>SEO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="score-value score-${overallClass}">${analysis.overall_score}</div>
                        <span class="score-badge badge-${overallClass}">${overallLabel}</span>
                      </td>
                      <td>
                        <div class="score-value score-${geoClass}">${analysis.geo_score}</div>
                        <span class="score-badge badge-${geoClass}">${geoLabel}</span>
                      </td>
                      <td>
                        <div class="score-value score-${seoClass}">${analysis.seo_score}</div>
                        <span class="score-badge badge-${seoClass}">${seoLabel}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              ${analysis.summary ? `
                <div class="summary-section">
                  <div class="summary-text">${analysis.summary}</div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}

        <div class="footer">
          <p><strong>Relatório gerado automaticamente pela plataforma Teia GEO</strong></p>
          <p>Observabilidade Cognitiva de IAs Generativas</p>
          <p>© ${new Date().getFullYear()} Teia GEO - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

interface Analysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  geoOptimization: {
    score: number;
    insights: string[];
  };
  seoOptimization: {
    score: number;
    insights: string[];
  };
}

export default function UrlAnalysis() {
  const [url, setUrl] = useState('');
  
  // ✅ CORREÇÃO: Tentar acessar BrandContext de forma segura
  let brandContextAvailable = true;
  let selectedBrandId: string | null = null;
  let setSelectedBrandId: (id: string | null) => void = () => {};
  let brands: any[] = [];
  
  try {
    const brandContext = useBrand();
    selectedBrandId = brandContext.selectedBrandId;
    setSelectedBrandId = brandContext.setSelectedBrandId;
    brands = brandContext.brands;
  } catch (error) {
    brandContextAvailable = false;
    logger.warn('BrandContext não disponível em UrlAnalysis', { error });
  }
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const historyPageSize = 20;
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAnalyze, limits, usage } = useSubscriptionLimits();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch analysis history with pagination - FILTRA POR BRAND_ID
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['url-analysis-history', user?.id, selectedBrandId, historyPage],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 };
      
      let query = supabase
        .from('url_analysis_history')
        .select('id, url, created_at, overall_score, geo_score, seo_score, summary', { count: 'exact' })
        .eq('user_id', user.id);
      
      // ✅ FILTRAR POR BRAND_ID se uma marca específica estiver selecionada
      if (selectedBrandId && selectedBrandId !== 'all') {
        query = query.eq('brand_id', selectedBrandId);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(historyPage * historyPageSize, (historyPage + 1) * historyPageSize - 1);

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!user && !!selectedBrandId,
  });

  const totalHistoryPages = Math.ceil((historyData?.count || 0) / historyPageSize);

  // ✅ CORREÇÃO: Se BrandContext não disponível, mostrar mensagem
  if (!brandContextAvailable) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Contexto não carregado</h2>
          <p className="text-muted-foreground mb-4">
            O sistema de marcas ainda não está disponível. Por favor, aguarde ou recarregue a página.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </Card>
      </div>
    );
  }

  // Auto-preencher URL quando uma marca for selecionada
  useEffect(() => {
    if (selectedBrandId && selectedBrandId !== 'all') {
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      if (selectedBrand?.domain) {
        // Adicionar https:// se não tiver protocolo
        const domainWithProtocol = selectedBrand.domain.startsWith('http') 
          ? selectedBrand.domain 
          : `https://${selectedBrand.domain}`;
        setUrl(domainWithProtocol);
      }
    } else if (selectedBrandId === 'all') {
      // Limpar URL quando "Todas as marcas" for selecionado
      setUrl('');
    }
  }, [selectedBrandId, brands]);

  const handleExportHistory = async () => {
    if (!user) return;

    try {
      // Para PDF: limitar a 20 análises mais recentes para evitar limite de tamanho
      const limit = 20;
      
      let query = supabase
        .from('url_analysis_history')
        .select('url, created_at, overall_score, geo_score, seo_score, summary, analysis_data')
        .eq('user_id', user.id);
      
      // ✅ FILTRAR POR BRAND_ID se uma marca específica estiver selecionada
      if (selectedBrandId && selectedBrandId !== 'all') {
        query = query.eq('brand_id', selectedBrandId);
      }
      
      const { data: historyData, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!historyData || historyData.length === 0) {
        toast({
          title: "Nenhum histórico disponível",
          description: "Não há análises para exportar",
          variant: "destructive",
        });
        return;
      }

      const analysesData = historyData.map(h => ({
        url: h.url,
        created_at: h.created_at,
        status: 'completed',
        results: h.analysis_data,
      }));

      // ✅ Gerar PDF usando PDFShift (limitado a 20 análises)
      const html = generateUrlAnalysisHTML(historyData);
      
      // Chamar função via fetch para obter blob binário corretamente
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-with-pdfshift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          html,
          filename: `analises-url-${Date.now()}.pdf`,
          options: {
            landscape: false,
            format: 'A4',
            margin: {
              top: '20mm',
              bottom: '20mm',
              left: '15mm',
              right: '15mm',
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Erro ao gerar PDF', { error: errorText });
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }

      // Download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analises-url-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Exportação concluída!",
        description: `${historyData.length} análises mais recentes exportadas em PDF`,
      });
    } catch (error) {
      logger.error('Erro ao exportar análise URL', { error });
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o histórico",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      toast({
        title: "Limite de análises atingido",
        description: `Você atingiu o limite de ${limits.maxAnalysesPerMonth} análises/mês do plano ${limits.name}. Faça upgrade para continuar.`,
        variant: "destructive",
        action: <Button size="sm" onClick={() => navigate("/subscription")}>Ver Planos</Button>,
      });
      return;
    }

    if (!url) {
      toast({
        title: "URL Obrigatória",
        description: "Por favor, insira uma URL para análise",
        variant: "destructive"
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({
        title: "URL Inválida",
        description: "Por favor, insira uma URL válida (ex: https://exemplo.com)",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      logger.info('Iniciando análise de URL', { url });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('analyze-url', {
        body: { 
          url,
          userId: user?.id,
          brandId: selectedBrandId !== 'all' ? selectedBrandId : null,
          saveAsInsight: true // Salvar automaticamente como insight
        }
      });

      if (error) {
        logger.error('Erro na análise de URL', { error, url });
        throw error;
      }

      logger.debug('Análise de URL concluída', { url, score: data.score });
      setAnalysis(data);
      
      // Salvar no histórico e tarefas
      if (user) {
        logger.debug('Salvando dados de análise no histórico');
        try {
          // Salvar histórico - INCLUIR BRAND_ID
          const { data: historyData, error: historyError } = await supabase
            .from('url_analysis_history')
            .insert({
              user_id: user.id,
              brand_id: selectedBrandId && selectedBrandId !== 'all' ? selectedBrandId : null,
              url,
              overall_score: data.score,
              geo_score: data.geoOptimization.score,
              seo_score: data.seoOptimization.score,
              summary: data.summary,
              analysis_data: data,
            })
            .select()
            .single();

          if (historyError) {
            logger.error('Erro ao salvar histórico de análise', { error: historyError, url });
          }

          // Salvar também em ai_insights para aparecer na página Insights
          // Use brand name if selected, otherwise extract from URL
          let siteName = 'Site';
          
          if (selectedBrandId && selectedBrandId !== 'all') {
            // Use the selected brand name
            const selectedBrand = brands?.find(b => b.id === selectedBrandId);
            siteName = selectedBrand?.name || 'Site';
            logger.debug('Usando nome da marca selecionada', { siteName, brandId: selectedBrandId });
          } else {
            // Extract site name from URL
            try {
              const urlObj = new URL(url);
              const hostname = urlObj.hostname.replace('www.', '');
              const extractedName = hostname.split('.')[0];
              siteName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
              logger.debug('Extraindo nome do site da URL', { siteName, url });
            } catch {
              siteName = 'Site';
            }
          }
          
          // Save summary insight
          const insightData = {
            user_id: user.id,
            type: 'summary',
            title: `${siteName} - Análise de URL`,
            brand_id: selectedBrandId && selectedBrandId !== 'all' ? selectedBrandId : null,
            content: {
              url,
              score: data.score,
              geoScore: data.geoOptimization.score,
              seoScore: data.seoOptimization.score,
              summary: data.summary,
              recommendations: data.recommendations,
              strengths: data.strengths,
              weaknesses: data.weaknesses,
            }
          };
          
          logger.debug('Salvando insight de análise', { url });
          
          const { data: savedInsight, error: insightError } = await supabase
            .from('ai_insights')
            .insert(insightData)
            .select();

          if (insightError) {
            logger.error('Erro ao salvar insight', { error: insightError, url });
          } else if (savedInsight) {
            logger.info('Insight salvo com sucesso', { insightId: savedInsight[0].id });
          }

          // Salvar tarefas se disponíveis
          if (data.tasks && data.tasks.length > 0 && historyData) {
            const tasksToInsert = data.tasks.map((task: any) => ({
              user_id: user.id,
              analysis_id: historyData.id,
              url,
              ...task
            }));

            const { error: tasksError } = await supabase
              .from('url_optimization_tasks')
            .insert(tasksToInsert);
          
            if (tasksError) {
              logger.error('Erro ao salvar tarefas de otimização', { error: tasksError, count: tasksToInsert.length });
            } else {
              logger.info('Tarefas de otimização salvas', { count: tasksToInsert.length });
            }
          }
        } catch (historyError) {
          logger.error('Erro ao salvar dados da análise', { error: historyError, url });
          // Não bloqueia o fluxo se falhar ao salvar histórico
        }
      }
      
      toast({
        title: "Análise Concluída",
        description: "A análise da URL foi realizada com sucesso!"
      });

    } catch (error: any) {
      logger.error('Erro ao analisar URL', { error, url });
      toast({
        title: "Erro na Análise",
        description: error.message || "Não foi possível analisar a URL. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg" style={{ boxShadow: '0 0 20px rgba(147, 51, 234, 0.4)' }}>
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="hidden sm:inline bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Análise de URL em Tempo Real</span>
              <span className="sm:hidden">Análise de URL</span>
            </h1>
            <DataSourceBadge type="technical" />
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Analise qualquer página e receba insights de GEO e SEO instantaneamente
          </p>
        </div>
        
        {user && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExportHistory()}
              className="border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar Histórico (PDF)</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        )}
      </div>

      {/* Brand Selector */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <Select value={selectedBrandId || undefined} onValueChange={(value) => {
            // Update brand context
            setSelectedBrandId(value);
            
            // Update URL with brand domain
            const brand = brands.find(b => b.id === value);
            if (brand) {
              setUrl(brand.domain.startsWith('http') ? brand.domain : `https://${brand.domain}`);
            }
          }}>
            <SelectTrigger className="bg-background w-full">
              <SelectValue placeholder="Selecione uma marca" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {brands && brands.length > 0 ? (
                brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhuma marca cadastrada
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Source Explanation */}
      <DataSourceExplanation />

      <Card className="p-4 md:p-6">
        <div className="space-y-3">
          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Input
              type="url"
              placeholder="https://exemplo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1"
              disabled={isAnalyzing}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-foreground rounded-full" />
                  <span className="hidden sm:inline">Analisando...</span>
                  <span className="sm:hidden">Analisando</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Analisar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {analysis && (
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          {/* Overall Score - Premium */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-xl border-primary/20" style={{ boxShadow: '0 0 40px rgba(147, 51, 234, 0.15)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="relative p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold">Score Geral</h2>
                <div className={`text-3xl md:text-4xl font-bold ${getScoreColor(analysis.score)}`} style={{ textShadow: analysis.score >= 60 ? '0 0 20px rgba(34, 197, 94, 0.3)' : '0 0 20px rgba(239, 68, 68, 0.3)' }}>
                  {analysis.score}/100
                </div>
              </div>
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analysis.score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    analysis.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                    'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                  style={{ 
                    width: `${analysis.score}%`,
                    boxShadow: analysis.score >= 60 ? '0 0 15px rgba(34, 197, 94, 0.5)' : '0 0 15px rgba(239, 68, 68, 0.5)'
                  }}
                />
              </div>
              <p className="mt-4 text-muted-foreground">{analysis.summary}</p>
            </div>
          </Card>

          {/* Visão 360° - Premium */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-xl border-primary/20" style={{ boxShadow: '0 0 40px rgba(147, 51, 234, 0.15)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
            <div className="relative p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg" style={{ boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)' }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Visão 360° - Análise Completa</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 rounded-xl bg-background/50 border border-purple-500/20" style={{ boxShadow: '0 0 20px rgba(147, 51, 234, 0.1)' }}>
                  <div className="text-sm text-muted-foreground mb-2">GEO Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.geoOptimization.score)}`} style={{ textShadow: '0 0 15px currentColor' }}>
                    {analysis.geoOptimization.score}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Otimização para IAs</div>
                </div>

                <div className="text-center flex items-center justify-center">
                  <div className="text-center p-4 rounded-xl bg-background/50 border border-yellow-500/20" style={{ boxShadow: '0 0 20px rgba(234, 179, 8, 0.1)' }}>
                    <div className="text-sm text-muted-foreground mb-2">Gap</div>
                    <div className={`text-3xl font-bold ${
                      Math.abs(analysis.geoOptimization.score - analysis.seoOptimization.score) > 20 
                        ? 'text-red-500' 
                        : Math.abs(analysis.geoOptimization.score - analysis.seoOptimization.score) > 10
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`} style={{ textShadow: '0 0 15px currentColor' }}>
                      {Math.abs(analysis.geoOptimization.score - analysis.seoOptimization.score)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Diferença</div>
                  </div>
                </div>

                <div className="text-center p-4 rounded-xl bg-background/50 border border-orange-500/20" style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)' }}>
                  <div className="text-sm text-muted-foreground mb-2">SEO Score</div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.seoOptimization.score)}`} style={{ textShadow: '0 0 15px currentColor' }}>
                    {analysis.seoOptimization.score}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Otimização Tradicional</div>
                </div>
              </div>

              <div className="bg-background/50 backdrop-blur rounded-xl p-4 border border-border/30">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" style={{ filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.5))' }} />
                  Diagnóstico Estratégico
                </h4>
                {analysis.geoOptimization.score > analysis.seoOptimization.score + 15 ? (
                  <p className="text-sm flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.5))' }} />
                    <span><strong>Forte em GEO, fraco em SEO.</strong> Seu site está otimizado para IAs mas pode estar perdendo tráfego orgânico tradicional. 
                    Priorize: melhorias técnicas de SEO (H1, meta tags, estrutura).</span>
                  </p>
                ) : analysis.seoOptimization.score > analysis.geoOptimization.score + 15 ? (
                  <p className="text-sm flex items-start gap-2">
                    <Search className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' }} />
                    <span><strong>Forte em SEO, fraco em GEO.</strong> Você domina o Google mas IAs não estão citando seu conteúdo. 
                    Priorize: autoridade, conteúdo semântico, estruturação para IA.</span>
                  </p>
                ) : Math.abs(analysis.geoOptimization.score - analysis.seoOptimization.score) <= 10 && 
                     analysis.score >= 70 ? (
                  <p className="text-sm flex items-start gap-2">
                    <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' }} />
                    <span><strong>Equilíbrio excelente!</strong> Seu site está bem otimizado para ambos os canais. 
                    Mantenha o foco em melhorias incrementais e monitore tendências.</span>
                  </p>
                ) : (
                  <p className="text-sm flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.5))' }} />
                    <span><strong>Equilibrado mas com espaço para crescer.</strong> Ambos os scores podem melhorar. 
                    Use as recomendações abaixo para fortalecer tanto SEO quanto GEO simultaneamente.</span>
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* GEO vs SEO Scores - Premium */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-xl border-purple-500/20 group hover:scale-[1.01] transition-all duration-300" style={{ boxShadow: '0 0 30px rgba(147, 51, 234, 0.15)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full transition-all duration-500 group-hover:w-32 group-hover:h-32" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg" style={{ boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)' }}>
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">GEO Score</h3>
                </div>
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(analysis.geoOptimization.score)}`} style={{ textShadow: '0 0 15px currentColor' }}>
                  {analysis.geoOptimization.score}/100
                </div>
                <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-1000"
                    style={{ width: `${analysis.geoOptimization.score}%`, boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)' }}
                  />
                </div>
                <ul className="space-y-2">
                  {analysis.geoOptimization.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Target className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 3px rgba(147, 51, 234, 0.5))' }} />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur-xl border-orange-500/20 group hover:scale-[1.01] transition-all duration-300" style={{ boxShadow: '0 0 30px rgba(249, 115, 22, 0.15)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-full transition-all duration-500 group-hover:w-32 group-hover:h-32" />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg" style={{ boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)' }}>
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">SEO Score</h3>
                </div>
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(analysis.seoOptimization.score)}`} style={{ textShadow: '0 0 15px currentColor' }}>
                  {analysis.seoOptimization.score}/100
                </div>
                <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000"
                    style={{ width: `${analysis.seoOptimization.score}%`, boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }}
                  />
                </div>
                <ul className="space-y-2">
                  {analysis.seoOptimization.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" style={{ filter: 'drop-shadow(0 0 3px rgba(249, 115, 22, 0.5))' }} />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          {/* Strengths & Weaknesses - Premium Tabs */}
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur">
              <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Recomendações</TabsTrigger>
              <TabsTrigger value="strengths" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">Pontos Fortes</TabsTrigger>
              <TabsTrigger value="weaknesses" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">Pontos Fracos</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              {analysis.recommendations.map((rec, idx) => (
                <Card key={idx} className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-600" />
                  <div className="p-4 pl-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge variant={getPriorityColor(rec.priority)} className={rec.priority === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/30' : rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-muted'}>
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <p className="text-sm flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-primary" style={{ filter: 'drop-shadow(0 0 3px rgba(147, 51, 234, 0.5))' }} />
                          <span className="font-medium">Impacto:</span> {rec.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="strengths" className="space-y-2">
              {analysis.strengths.map((strength, idx) => (
                <Card key={idx} className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-600" />
                  <div className="p-4 pl-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.5))' }} />
                      <p>{strength}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="weaknesses" className="space-y-2">
              {analysis.weaknesses.map((weakness, idx) => (
                <Card key={idx} className="relative overflow-hidden bg-gradient-to-br from-background/90 to-muted/30 backdrop-blur border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-rose-600" />
                  <div className="p-4 pl-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' }} />
                      <p>{weakness}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Histórico, Monitoramento e Análise Competitiva */}
          <div className="space-y-6 mt-6">
            {/* Checklist Acionável */}
            <ActionableChecklist url={url} />
            
            <CompetitorAnalysis mainUrl={url} />
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Histórico com Virtualização e Paginação */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Histórico de Análises</h3>
                {historyLoading ? (
                  <p className="text-muted-foreground">Carregando histórico...</p>
                ) : historyData && historyData.data.length > 0 ? (
                  <>
                    <VirtualizedAnalysisList 
                      items={historyData.data}
                      onItemClick={(item) => {
                        setUrl(item.url);
                        setAnalysis({
                          score: item.overall_score,
                          summary: item.summary,
                          strengths: [],
                          weaknesses: [],
                          recommendations: [],
                          geoOptimization: { score: item.geo_score, insights: [] },
                          seoOptimization: { score: item.seo_score, insights: [] },
                        });
                      }}
                    />
                    {totalHistoryPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                          disabled={historyPage === 0}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {historyPage + 1} de {totalHistoryPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(p => Math.min(totalHistoryPages - 1, p + 1))}
                          disabled={historyPage >= totalHistoryPages - 1}
                        >
                          Próxima
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Nenhuma análise no histórico ainda.</p>
                )}
              </Card>
              
              <MonitoringSchedule url={url} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
