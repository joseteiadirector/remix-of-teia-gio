/**
 * Exportações Unificadas de PDF com PDFShift
 * Gera PDFs profissionais com charts perfeitos usando PDFShift API
 */

import { 
  captureMultipleCharts, 
  validateGEOData, 
  validateSEOData, 
  validateIGOData, 
  validateCPIData,
  CHART_IDS,
  type ExportDataGEO,
  type ExportDataSEO,
  type ExportDataIGO,
  type ExportDataCPI,
  type ChartCapture
} from './index';
import { 
  generateGEOHTML, 
  generateSEOHTML, 
  generateIGOHTML, 
  generateCPIHTML 
} from './pdfshift-generator';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

/**
 * Helper para chamar PDFShift via Edge Function
 */
async function generatePDFWithPDFShift(
  html: string, 
  filename: string
): Promise<void> {
  logger.info('🚀 Gerando PDF com PDFShift', { filename });

  try {
    const { data, error } = await supabase.functions.invoke('generate-pdf-with-pdfshift', {
      body: {
        html,
        filename,
        options: {
          format: 'A4',
          margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm',
          },
        },
      },
      // @ts-ignore - responseType não está tipado mas é suportado
      responseType: 'blob',
    });

    if (error) throw error;

    if (!data) {
      throw new Error('Nenhum PDF retornado pela Edge Function');
    }

    // Download do PDF
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('✅ PDF gerado e baixado com sucesso', { filename });
  } catch (error) {
    logger.error('❌ Erro ao gerar PDF com PDFShift', { error, filename });
    throw error;
  }
}

/**
 * Exporta relatório GEO completo usando PDFShift
 */
export async function exportGEOReport(data: ExportDataGEO): Promise<void> {
  logger.info('🚀 Iniciando exportação GEO Report com PDFShift', { brand: data.brandName });

  try {
    // 1. VALIDAÇÃO ROBUSTA
    const validation = validateGEOData(data);
    if (!validation.isValid) {
      const errorMsg = `Dados inválidos: ${validation.errors.join(', ')}`;
      logger.error('Validação GEO falhou', { errors: validation.errors });
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (validation.warnings.length > 0) {
      logger.warn('Validação GEO com avisos', { warnings: validation.warnings });
      toast.warning('Alguns dados estão incompletos, mas o PDF será gerado');
    }

    // 2. CHARTS - Não capturar (Puppeteer não funciona em Edge Functions)
    // PDF terá todos os dados em tabelas
    const charts: ChartCapture[] = [];

    // 3. GERAR HTML COMPLETO
    toast.info('Gerando PDF...');
    const html = generateGEOHTML(data, charts);

    // 4. GERAR PDF COM PDFSHIFT
    const filename = `geo-report-${data.brandName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(html, filename);

    logger.info('✅ PDF GEO exportado com sucesso', { filename });
    toast.success('Relatório GEO exportado com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao exportar GEO Report', { error });
    toast.error('Erro ao gerar relatório GEO');
    throw error;
  }
}

/**
 * Exporta relatório SEO completo usando PDFShift
 */
export async function exportSEOReport(data: ExportDataSEO): Promise<void> {
  logger.info('🚀 Iniciando exportação SEO Report com PDFShift', { brand: data.brandName });

  try {
    const validation = validateSEOData(data);
    if (!validation.isValid) {
      const errorMsg = `Dados inválidos: ${validation.errors.join(', ')}`;
      logger.error('Validação SEO falhou', { errors: validation.errors });
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Não capturar charts (Puppeteer não funciona em Edge Functions)
    const charts: ChartCapture[] = [];

    toast.info('Gerando PDF...');
    const html = generateSEOHTML(data, charts);

    const filename = `seo-report-${data.brandName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(html, filename);

    logger.info('✅ PDF SEO exportado com sucesso', { filename });
    toast.success('Relatório SEO exportado com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao exportar SEO Report', { error });
    toast.error('Erro ao gerar relatório SEO');
    throw error;
  }
}

/**
 * Exporta relatório IGO (KAPI Metrics) completo usando PDFShift
 */
export async function exportIGOReport(data: ExportDataIGO): Promise<void> {
  logger.info('🚀 Iniciando exportação IGO Report com PDFShift', { brandCount: data.brands.length });

  try {
    const validation = validateIGOData(data);
    if (!validation.isValid) {
      const errorMsg = `Dados inválidos: ${validation.errors.join(', ')}`;
      logger.error('Validação IGO falhou', { errors: validation.errors });
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Não capturar charts (Puppeteer não funciona em Edge Functions)
    const charts: ChartCapture[] = [];

    toast.info('Gerando PDF...');
    const html = generateIGOHTML(data, charts);

    const filename = `igo-report-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(html, filename);

    logger.info('✅ PDF IGO exportado com sucesso', { filename });
    toast.success('Relatório IGO exportado com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao exportar IGO Report', { error });
    toast.error('Erro ao gerar relatório IGO');
    throw error;
  }
}

/**
 * Exporta relatório CPI Dashboard completo usando PDFShift
 */
export async function exportCPIReport(data: ExportDataCPI): Promise<void> {
  logger.info('🚀 Iniciando exportação CPI Report com PDFShift', { brand: data.brandName });

  try {
    const validation = validateCPIData(data);
    if (!validation.isValid) {
      const errorMsg = `Dados inválidos: ${validation.errors.join(', ')}`;
      logger.error('Validação CPI falhou', { errors: validation.errors });
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Não capturar charts (Puppeteer não funciona em Edge Functions)
    const charts: ChartCapture[] = [];

    toast.info('Gerando PDF...');
    const html = generateCPIHTML(data, charts);

    const filename = `cpi-dashboard-${data.brandName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(html, filename);

    logger.info('✅ PDF CPI exportado com sucesso', { filename });
    toast.success('Relatório CPI exportado com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao exportar CPI Report', { error });
    toast.error('Erro ao gerar relatório CPI');
    throw error;
  }
}

/**
 * Exporta relatório de LLM Mentions (sem pilares GEO)
 */
export async function exportLLMMentionsReport(data: {
  brandName: string;
  brandDomain: string;
  mentions: Array<{
    provider: string;
    query: string;
    mentioned: boolean;
    confidence: number; // valor entre 0-1
    answer_excerpt: string | null;
  }>;
  visibilityScore: number; // valor entre 0-100
  avgConfidence?: number; // média das confianças (0-100) - opcional para compatibilidade
  period: string;
}): Promise<void> {
  logger.info('🚀 Iniciando exportação LLM Mentions Report com PDFShift', { brand: data.brandName });

  try {
    // Validação básica
    if (!data.mentions || data.mentions.length === 0) {
      const errorMsg = 'Nenhuma menção encontrada para exportar';
      logger.error(errorMsg);
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    toast.info('Gerando PDF de menções...');

    // Gerar HTML específico para menções
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Menções LLM - ${data.brandName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #8b5cf6; }
          .header h1 { font-size: 32px; color: #8b5cf6; margin-bottom: 10px; }
          .metadata { display: flex; justify-content: center; gap: 30px; font-size: 14px; color: #64748b; margin-top: 15px; }
          .section { background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
          .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
          .metric-card { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 10px; padding: 20px; color: white; text-align: center; }
          .metric-card .label { font-size: 12px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-card .value { font-size: 32px; font-weight: 700; }
          .mention-item { background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
          .mention-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .provider { font-weight: 700; color: #8b5cf6; font-size: 14px; }
          .confidence { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .query { color: #64748b; font-size: 13px; margin-bottom: 8px; }
          .excerpt { color: #475569; font-size: 12px; line-height: 1.6; font-style: italic; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 Relatório de Menções em LLMs</h1>
          <div class="metadata">
            <span><strong>Marca:</strong> ${data.brandName}</span>
            <span><strong>Período:</strong> ${data.period}</span>
            <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📊 Resumo Geral</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="label">Total de Menções</div>
              <div class="value">${data.mentions.length}</div>
            </div>
            <div class="metric-card">
              <div class="label">Score de Visibilidade</div>
              <div class="value">${Math.round(data.visibilityScore)}%</div>
            </div>
            <div class="metric-card">
              <div class="label">Confiança Média</div>
              <div class="value">${data.avgConfidence ? Math.round(data.avgConfidence) : Math.round(data.mentions.reduce((sum, m) => sum + m.confidence * 100, 0) / data.mentions.length)}%</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📝 Todas as Menções</h2>
          ${data.mentions.map(mention => `
            <div class="mention-item">
              <div class="mention-header">
                <span class="provider">${mention.provider.toUpperCase()}</span>
                <span class="confidence">${(mention.confidence * 100).toFixed(0)}% confiança</span>
              </div>
              <div class="query"><strong>Query:</strong> ${mention.query}</div>
              ${mention.answer_excerpt ? `<div class="excerpt">"${mention.answer_excerpt}"</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p><strong>Teia GEO</strong> - IGO Observational Layer</p>
          <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
      </body>
      </html>
    `;

    const filename = `llm-mentions-${data.brandName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(html, filename);

    logger.info('✅ PDF de menções LLM exportado com sucesso', { filename, mentionsCount: data.mentions.length });
    toast.success(`Relatório com ${data.mentions.length} menções exportado com sucesso!`);

  } catch (error) {
    logger.error('❌ Erro ao exportar LLM Mentions Report', { error });
    toast.error('Erro ao gerar relatório de menções');
    throw error;
  }
}

/**
 * Exporta relatório KPIs específico (página KPIs)
 */
export async function exportKPIsReport(data: {
  brandName: string;
  geoScore: number;
  seoScore: number;
  pillars: Array<{ name: string; value: number }>;
  kapiMetrics: {
    ice: number;
    gap: number;
    cpi: number;
    stability: number;
  };
  seoMetrics?: {
    traffic: number;
    position: number;
    clicks: number;
    ctr: number;
    conversionRate: number;
  };
  geoMetrics?: {
    mentionRate: number;
    topicCoverage: number;
    confidence: number;
  };
  period: string;
}): Promise<void> {
  logger.info('🚀 Iniciando exportação KPIs Report com PDFShift', { brand: data.brandName });

  try {
    if (!data.brandName) {
      throw new Error('Nome da marca é obrigatório');
    }

    toast.info('Gerando PDF de KPIs...');

    // Classificar métricas KAPI
    const classifyKAPI = (metric: string, value: number): { status: string; color: string } => {
      if (metric === 'ice') {
        if (value >= 80) return { status: 'Excelente', color: '#10b981' };
        if (value >= 60) return { status: 'Bom', color: '#3b82f6' };
        if (value >= 40) return { status: 'Regular', color: '#f59e0b' };
        return { status: 'Crítico', color: '#ef4444' };
      }
      if (metric === 'gap') {
        if (value >= 75) return { status: 'Excelente', color: '#10b981' };
        if (value >= 50) return { status: 'Bom', color: '#3b82f6' };
        if (value >= 25) return { status: 'Regular', color: '#f59e0b' };
        return { status: 'Crítico', color: '#ef4444' };
      }
      if (metric === 'cpi') {
        if (value >= 60) return { status: 'Excelente', color: '#10b981' };
        if (value >= 45) return { status: 'Bom', color: '#3b82f6' };
        if (value >= 30) return { status: 'Regular', color: '#f59e0b' };
        return { status: 'Crítico', color: '#ef4444' };
      }
      // stability
      if (value >= 70) return { status: 'Excelente', color: '#10b981' };
      if (value >= 55) return { status: 'Bom', color: '#3b82f6' };
      if (value >= 40) return { status: 'Regular', color: '#f59e0b' };
      return { status: 'Crítico', color: '#ef4444' };
    };

    const iceClass = classifyKAPI('ice', data.kapiMetrics.ice);
    const gapClass = classifyKAPI('gap', data.kapiMetrics.gap);
    const cpiClass = classifyKAPI('cpi', data.kapiMetrics.cpi);
    const stabilityClass = classifyKAPI('stability', data.kapiMetrics.stability);

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório KPIs - ${data.brandName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; }
          .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #8b5cf6; }
          .header h1 { font-size: 32px; color: #8b5cf6; margin-bottom: 10px; }
          .metadata { display: flex; justify-content: center; gap: 30px; font-size: 14px; color: #64748b; margin-top: 15px; }
          .section { background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
          .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .score-card { border-radius: 12px; padding: 30px; text-align: center; }
          .score-card.geo { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
          .score-card.seo { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
          .score-card .label { font-size: 14px; opacity: 0.9; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .score-card .value { font-size: 56px; font-weight: 800; }
          .score-card .desc { font-size: 12px; opacity: 0.8; margin-top: 8px; }
          .kapi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .kapi-card { background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center; border-left: 4px solid; }
          .kapi-card .name { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .kapi-card .value { font-size: 28px; font-weight: 700; margin-bottom: 5px; }
          .kapi-card .status { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px; display: inline-block; }
          .pillars-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
          .pillar-card { background: #f8fafc; border-radius: 8px; padding: 15px; text-align: center; }
          .pillar-card .name { font-size: 10px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
          .pillar-card .value { font-size: 24px; font-weight: 700; color: #8b5cf6; }
          .pillar-bar { height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 8px; overflow: hidden; }
          .pillar-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #7c3aed); border-radius: 3px; }
          .metrics-table { width: 100%; border-collapse: collapse; }
          .metrics-table th, .metrics-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .metrics-table th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
          .metrics-table td { font-size: 14px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Relatório KPIs</h1>
          <div class="metadata">
            <span><strong>Marca:</strong> ${data.brandName}</span>
            <span><strong>Período:</strong> ${data.period}</span>
            <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div class="score-grid">
          <div class="score-card geo">
            <div class="label">Score GEO (IAs)</div>
            <div class="value">${data.geoScore.toFixed(1)}</div>
            <div class="desc">Posicionamento nas Inteligências Artificiais</div>
          </div>
          <div class="score-card seo">
            <div class="label">Score SEO</div>
            <div class="value">${data.seoScore.toFixed(1)}</div>
            <div class="desc">Otimização para Motores de Busca</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🎯 Métricas KAPI</h2>
          <div class="kapi-grid">
            <div class="kapi-card" style="border-color: ${iceClass.color}">
              <div class="name">ICE Score</div>
              <div class="value" style="color: ${iceClass.color}">${data.kapiMetrics.ice.toFixed(1)}</div>
              <span class="status" style="background: ${iceClass.color}20; color: ${iceClass.color}">${iceClass.status}</span>
            </div>
            <div class="kapi-card" style="border-color: ${gapClass.color}">
              <div class="name">GAP Score</div>
              <div class="value" style="color: ${gapClass.color}">${data.kapiMetrics.gap.toFixed(1)}</div>
              <span class="status" style="background: ${gapClass.color}20; color: ${gapClass.color}">${gapClass.status}</span>
            </div>
            <div class="kapi-card" style="border-color: ${cpiClass.color}">
              <div class="name">CPI Score</div>
              <div class="value" style="color: ${cpiClass.color}">${data.kapiMetrics.cpi.toFixed(1)}</div>
              <span class="status" style="background: ${cpiClass.color}20; color: ${cpiClass.color}">${cpiClass.status}</span>
            </div>
            <div class="kapi-card" style="border-color: ${stabilityClass.color}">
              <div class="name">Estabilidade</div>
              <div class="value" style="color: ${stabilityClass.color}">${data.kapiMetrics.stability.toFixed(1)}%</div>
              <span class="status" style="background: ${stabilityClass.color}20; color: ${stabilityClass.color}">${stabilityClass.status}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">🏛 Pilares GEO</h2>
          <div class="pillars-grid">
            ${data.pillars.map(pillar => `
              <div class="pillar-card">
                <div class="name">${pillar.name}</div>
                <div class="value">${pillar.value.toFixed(0)}</div>
                <div class="pillar-bar">
                  <div class="pillar-fill" style="width: ${pillar.value}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${data.geoMetrics ? `
        <div class="section">
          <h2 class="section-title">🤖 Presença nas IAs</h2>
          <table class="metrics-table">
            <tr><th>Métrica</th><th>Valor</th></tr>
            <tr><td>Menções Positivas</td><td>${data.geoMetrics.mentionRate.toFixed(0)}%</td></tr>
            <tr><td>Tópicos Cobertos</td><td>${data.geoMetrics.topicCoverage}</td></tr>
            <tr><td>Confiança das IAs</td><td>${data.geoMetrics.confidence.toFixed(0)}%</td></tr>
          </table>
        </div>
        ` : ''}

        ${data.seoMetrics ? `
        <div class="section">
          <h2 class="section-title">🔍 Métricas SEO</h2>
          <table class="metrics-table">
            <tr><th>Métrica</th><th>Valor</th></tr>
            <tr><td>Tráfego Orgânico</td><td>${data.seoMetrics.traffic.toLocaleString('pt-BR')}</td></tr>
            <tr><td>Posição Média</td><td>${data.seoMetrics.position.toFixed(1)}</td></tr>
            <tr><td>Total de Cliques</td><td>${data.seoMetrics.clicks.toLocaleString('pt-BR')}</td></tr>
            <tr><td>CTR</td><td>${data.seoMetrics.ctr.toFixed(1)}%</td></tr>
            <tr><td>Taxa de Conversão</td><td>${data.seoMetrics.conversionRate.toFixed(1)}%</td></tr>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>Teia GEO</strong> - Observabilidade Cognitiva de IAs Generativas</p>
          <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
      </body>
      </html>
    `;

    const filename = `kpis-report-${data.brandName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(html, filename);

    logger.info('✅ PDF KPIs exportado com sucesso', { filename });
    toast.success('Relatório KPIs exportado com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao exportar KPIs Report', { error });
    toast.error('Erro ao gerar relatório KPIs');
    throw error;
  }
}

/**
 * Exporta relatório combinado GEO + SEO usando PDFShift
 */
export async function exportCombinedReport(
  geoData: ExportDataGEO,
  seoData: ExportDataSEO
): Promise<void> {
  logger.info('🚀 Iniciando exportação Relatório Combinado com PDFShift', { brand: geoData.brandName });

  try {
    // Validações
    const geoValidation = validateGEOData(geoData);
    const seoValidation = validateSEOData(seoData);

    if (!geoValidation.isValid || !seoValidation.isValid) {
      const errors = [...geoValidation.errors, ...seoValidation.errors];
      const errorMsg = `Dados inválidos: ${errors.join(', ')}`;
      logger.error('Validação combinada falhou', { errors });
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Não capturar charts (Puppeteer não funciona em Edge Functions)
    const charts: ChartCapture[] = [];

    toast.info('Gerando PDF combinado...');
    
    // Gerar HTML combinado (GEO + SEO)
    const geoHTML = generateGEOHTML(geoData, charts);
    const seoHTML = generateSEOHTML(seoData, charts);
    
    // Combinar HTMLs (remover tags duplicadas)
    const combinedHTML = geoHTML.replace('</body></html>', '') + 
                        seoHTML.split('<body>')[1];

    const filename = `relatorio-completo-${geoData.brandName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    await generatePDFWithPDFShift(combinedHTML, filename);

    logger.info('✅ PDF Combinado exportado com sucesso', { filename });
    toast.success('Relatório completo exportado com sucesso!');

  } catch (error) {
    logger.error('❌ Erro ao exportar Relatório Combinado', { error });
    toast.error('Erro ao gerar relatório combinado');
    throw error;
  }
}
