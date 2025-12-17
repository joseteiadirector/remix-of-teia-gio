/**
 * ConsolidatedPDFExport - Exporta todos os relatórios em um único PDF
 * Para facilitar upload em ferramentas externas como NotebookLM
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ConsolidatedData {
  brand: {
    name: string;
    domain: string;
  };
  geoScore: number;
  seoScore: number;
  kapiMetrics: {
    ice: number;
    gap: number;
    cpi: number;
    stability: number;
  };
  geoPillars: Array<{
    name: string;
    value: number;
  }>;
  seoMetrics: {
    organic_traffic: number;
    total_clicks: number;
    total_impressions: number;
    ctr: number;
    avg_position: number;
  };
  llmMentions: Array<{
    provider: string;
    total: number;
    positive: number;
    confidence: number;
  }>;
  alerts: Array<{
    title: string;
    priority: string;
    created_at: string;
  }>;
}

export const ConsolidatedPDFExport = () => {
  const { selectedBrandId, brands } = useBrand();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const fetchConsolidatedData = async (): Promise<ConsolidatedData | null> => {
    if (!selectedBrandId || !selectedBrand) return null;

    try {
      setProgressMessage('Coletando GEO Scores...');
      setProgress(10);

      // Fetch GEO Score
      const { data: geoData } = await supabase
        .from('geo_scores')
        .select('score, cpi, breakdown')
        .eq('brand_id', selectedBrandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setProgressMessage('Coletando métricas SEO...');
      setProgress(25);

      // Fetch SEO Metrics
      const { data: seoData } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .gt('seo_score', 0)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setProgressMessage('Coletando métricas KAPI...');
      setProgress(40);

      // Fetch IGO/KAPI Metrics
      const { data: igoData } = await supabase
        .from('igo_metrics_history')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setProgressMessage('Coletando menções LLM...');
      setProgress(55);

      // Fetch LLM Mentions summary
      const { data: mentionsData } = await supabase
        .from('mentions_llm')
        .select('provider, mentioned, confidence')
        .eq('brand_id', selectedBrandId);

      setProgressMessage('Coletando alertas...');
      setProgress(70);

      // Fetch Recent Alerts
      const { data: user } = await supabase.auth.getUser();
      const { data: alertsData } = await supabase
        .from('alerts_history')
        .select('title, priority, created_at')
        .eq('user_id', user.user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setProgressMessage('Coletando pilares GEO...');
      setProgress(85);

      // Fetch GEO Pillars
      const { data: pillarsData } = await supabase
        .from('geo_pillars_monthly')
        .select('*')
        .eq('brand_id', selectedBrandId)
        .order('month_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Process LLM mentions by provider
      const llmSummary = mentionsData?.reduce((acc, m) => {
        const key = m.provider;
        if (!acc[key]) {
          acc[key] = { total: 0, positive: 0, confidenceSum: 0 };
        }
        acc[key].total++;
        if (m.mentioned) acc[key].positive++;
        acc[key].confidenceSum += m.confidence || 0;
        return acc;
      }, {} as Record<string, { total: number; positive: number; confidenceSum: number }>) || {};

      const llmMentions = Object.entries(llmSummary).map(([provider, data]) => ({
        provider,
        total: data.total,
        positive: data.positive,
        confidence: data.total > 0 ? Math.round(data.confidenceSum / data.total) : 0
      }));

      return {
        brand: {
          name: selectedBrand.name,
          domain: selectedBrand.domain
        },
        geoScore: geoData?.score || 0,
        seoScore: seoData?.seo_score || 0,
        kapiMetrics: {
          ice: igoData?.ice || 0,
          gap: igoData?.gap || 0,
          cpi: igoData?.cpi || geoData?.cpi || 0,
          stability: igoData?.cognitive_stability || 0
        },
        geoPillars: pillarsData ? [
          { name: 'Base Técnica', value: pillarsData.base_tecnica },
          { name: 'Estrutura Semântica', value: pillarsData.estrutura_semantica },
          { name: 'Relevância Conversacional', value: pillarsData.relevancia_conversacional },
          { name: 'Autoridade Cognitiva', value: pillarsData.autoridade_cognitiva },
          { name: 'Inteligência Estratégica', value: pillarsData.inteligencia_estrategica }
        ] : [],
        seoMetrics: {
          organic_traffic: seoData?.organic_traffic || 0,
          total_clicks: seoData?.total_clicks || 0,
          total_impressions: seoData?.total_impressions || 0,
          ctr: seoData?.ctr || 0,
          avg_position: seoData?.avg_position || 0
        },
        llmMentions,
        alerts: (alertsData || []).map(a => ({
          title: a.title,
          priority: a.priority,
          created_at: a.created_at
        }))
      };
    } catch (error) {
      logger.error('Erro ao coletar dados consolidados:', error);
      return null;
    }
  };

  const generateConsolidatedHTML = (data: ConsolidatedData): string => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getScoreColor = (score: number) => {
      if (score >= 80) return '#22c55e';
      if (score >= 60) return '#eab308';
      if (score >= 40) return '#f97316';
      return '#ef4444';
    };

    const getKAPIColor = (metric: string, value: number) => {
      const thresholds: Record<string, number> = {
        ice: 80, gap: 75, cpi: 60, stability: 70
      };
      return value >= (thresholds[metric] || 60) ? '#22c55e' : value >= 50 ? '#eab308' : '#ef4444';
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Consolidado - ${data.brand.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
      padding: 15mm;
    }
    
    .cover {
      text-align: center;
      padding: 40px 20px;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 30px;
    }
    
    .cover h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    
    .cover .subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 20px;
    }
    
    .cover .brand-name {
      font-size: 22px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 5px;
    }
    
    .cover .domain {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .cover .date {
      margin-top: 30px;
      font-size: 11px;
      color: #94a3b8;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 15px;
    }
    
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    
    .metric-card .label {
      font-size: 9px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .metric-card .value {
      font-size: 20px;
      font-weight: 700;
    }
    
    .metric-card .unit {
      font-size: 10px;
      color: #94a3b8;
    }
    
    .scores-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .score-box {
      flex: 1;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .score-box .label {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .score-box .value {
      font-size: 36px;
      font-weight: 700;
    }
    
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    
    .pillar-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    
    .pillar-card .name {
      font-size: 8px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .pillar-card .value {
      font-size: 16px;
      font-weight: 700;
      color: #2563eb;
    }
    
    .llm-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .llm-table th, .llm-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .llm-table th {
      background: #f8fafc;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
    }
    
    .alerts-list {
      list-style: none;
    }
    
    .alerts-list li {
      padding: 8px 12px;
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
    }
    
    .alerts-list li.high {
      background: #fee2e2;
      border-left-color: #ef4444;
    }
    
    .alerts-list li.critical {
      background: #fecaca;
      border-left-color: #dc2626;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
    }
    
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <!-- Capa -->
  <div class="cover">
    <h1>📊 Relatório Consolidado</h1>
    <p class="subtitle">Teia GEO — Inteligência Artificial Generativa Observacional</p>
    <p class="brand-name">${data.brand.name}</p>
    <p class="domain">${data.brand.domain}</p>
    <p class="date">Gerado em ${formatDate(new Date())}</p>
  </div>

  <!-- Scores Principais -->
  <div class="section">
    <h2 class="section-title">📈 Scores Principais</h2>
    <div class="scores-row">
      <div class="score-box">
        <div class="label">GEO Score</div>
        <div class="value" style="color: ${getScoreColor(data.geoScore)}">${data.geoScore.toFixed(1)}</div>
      </div>
      <div class="score-box">
        <div class="label">SEO Score</div>
        <div class="value" style="color: ${getScoreColor(data.seoScore)}">${data.seoScore.toFixed(1)}</div>
      </div>
      <div class="score-box">
        <div class="label">CPI Score</div>
        <div class="value" style="color: ${getScoreColor(data.kapiMetrics.cpi)}">${data.kapiMetrics.cpi.toFixed(1)}</div>
      </div>
    </div>
  </div>

  <!-- Métricas KAPI -->
  <div class="section">
    <h2 class="section-title">🧠 Métricas KAPI (IGO Framework)</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="label">ICE</div>
        <div class="value" style="color: ${getKAPIColor('ice', data.kapiMetrics.ice)}">${data.kapiMetrics.ice.toFixed(1)}%</div>
        <div class="unit">Índice de Eficiência Cognitiva</div>
      </div>
      <div class="metric-card">
        <div class="label">GAP</div>
        <div class="value" style="color: ${getKAPIColor('gap', data.kapiMetrics.gap)}">${data.kapiMetrics.gap.toFixed(1)}%</div>
        <div class="unit">Alinhamento LLM</div>
      </div>
      <div class="metric-card">
        <div class="label">CPI</div>
        <div class="value" style="color: ${getKAPIColor('cpi', data.kapiMetrics.cpi)}">${data.kapiMetrics.cpi.toFixed(1)}%</div>
        <div class="unit">Índice de Performance Cognitiva</div>
      </div>
      <div class="metric-card">
        <div class="label">Estabilidade</div>
        <div class="value" style="color: ${getKAPIColor('stability', data.kapiMetrics.stability)}">${data.kapiMetrics.stability.toFixed(1)}%</div>
        <div class="unit">Estabilidade Cognitiva</div>
      </div>
    </div>
  </div>

  <!-- Pilares GEO -->
  ${data.geoPillars.length > 0 ? `
  <div class="section">
    <h2 class="section-title">🏛️ Pilares GEO</h2>
    <div class="pillars-grid">
      ${data.geoPillars.map(p => `
        <div class="pillar-card">
          <div class="name">${p.name}</div>
          <div class="value">${p.value.toFixed(0)}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Métricas SEO -->
  <div class="section">
    <h2 class="section-title">🔍 Métricas SEO</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="label">Tráfego Orgânico</div>
        <div class="value" style="color: #2563eb">${data.seoMetrics.organic_traffic.toLocaleString('pt-BR')}</div>
      </div>
      <div class="metric-card">
        <div class="label">Cliques</div>
        <div class="value" style="color: #2563eb">${data.seoMetrics.total_clicks.toLocaleString('pt-BR')}</div>
      </div>
      <div class="metric-card">
        <div class="label">Impressões</div>
        <div class="value" style="color: #2563eb">${data.seoMetrics.total_impressions.toLocaleString('pt-BR')}</div>
      </div>
      <div class="metric-card">
        <div class="label">CTR</div>
        <div class="value" style="color: #2563eb">${data.seoMetrics.ctr.toFixed(2)}%</div>
      </div>
    </div>
  </div>

  <!-- Menções LLM -->
  ${data.llmMentions.length > 0 ? `
  <div class="section">
    <h2 class="section-title">🤖 Análise Multi-LLM</h2>
    <table class="llm-table">
      <thead>
        <tr>
          <th>Provedor</th>
          <th>Total Menções</th>
          <th>Menções Positivas</th>
          <th>Confiança Média</th>
        </tr>
      </thead>
      <tbody>
        ${data.llmMentions.map(llm => `
          <tr>
            <td><strong>${llm.provider}</strong></td>
            <td>${llm.total}</td>
            <td>${llm.positive}</td>
            <td>${llm.confidence}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Alertas Recentes -->
  ${data.alerts.length > 0 ? `
  <div class="section">
    <h2 class="section-title">⚠️ Alertas Recentes</h2>
    <ul class="alerts-list">
      ${data.alerts.map(alert => `
        <li class="${alert.priority}">
          <strong>${alert.title}</strong>
          <br><small>${new Date(alert.created_at).toLocaleDateString('pt-BR')}</small>
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    <p>Relatório gerado automaticamente pela plataforma Teia GEO</p>
    <p>© ${new Date().getFullYear()} Teia GEO — Observabilidade Cognitiva de IAs Generativas</p>
  </div>
</body>
</html>
    `;
  };

  const handleExport = async () => {
    if (!selectedBrandId) {
      toast.error('Selecione uma marca primeiro');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      setProgressMessage('Iniciando coleta de dados...');
      const data = await fetchConsolidatedData();

      if (!data) {
        throw new Error('Falha ao coletar dados');
      }

      setProgressMessage('Gerando PDF...');
      setProgress(90);

      const html = generateConsolidatedHTML(data);

      // Call PDFShift API
      const { data: pdfData, error } = await supabase.functions.invoke('generate-pdf-with-pdfshift', {
        body: {
          html,
          filename: `relatorio-consolidado-${data.brand.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
        }
      });

      if (error) throw error;

      // Download PDF
      if (pdfData?.pdf) {
        const binaryString = atob(pdfData.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-consolidado-${data.brand.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setProgress(100);
      setProgressMessage('Concluído!');
      toast.success('PDF consolidado exportado com sucesso!');
      
      setTimeout(() => {
        setIsOpen(false);
        setProgress(0);
      }, 1500);

    } catch (error) {
      logger.error('Erro ao exportar PDF consolidado:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
          disabled={!selectedBrandId}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar Tudo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Exportar Relatório Consolidado
          </DialogTitle>
          <DialogDescription>
            Gera um PDF único com todos os relatórios da plataforma para a marca {selectedBrand?.name || 'selecionada'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">O relatório incluirá:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Scores GEO, SEO e CPI</li>
              <li>Métricas KAPI (ICE, GAP, CPI, Estabilidade)</li>
              <li>Pilares GEO</li>
              <li>Métricas SEO detalhadas</li>
              <li>Análise Multi-LLM</li>
              <li>Alertas recentes</li>
            </ul>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{progressMessage}</p>
            </div>
          )}

          <Button 
            onClick={handleExport} 
            disabled={isExporting || !selectedBrandId}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF Consolidado
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
