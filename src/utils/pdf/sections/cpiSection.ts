/**
 * Seção CPI Dashboard padronizada para PDFs
 * IMPORTANTE: Usa kapiMetrics.ts como fonte única de verdade para classificações
 */

import { PDFSection, ExportDataCPI, ChartCapture } from '../types';
import { PDFGenerator } from '../core/pdfGenerator';
import { logger } from '@/utils/logger';
import { classifyKAPIMetric, KAPI_CONFIGS } from '@/config/kapiMetrics';

export function createCPISection(data: ExportDataCPI, charts: ChartCapture[]): PDFSection {
  return {
    title: 'CPI Dashboard - Cognitive Predictive Index',
    
    generate: async (doc: any, yPosition: number): Promise<number> => {
      const generator = doc as PDFGenerator;
      generator.setCurrentY(yPosition);

      try {
        // CPI Score principal
        generator.addText(`CPI Score: ${data.cpiMetrics.cpi.toFixed(1)}/100`, 14, true);

        // Tabela de métricas - usando configuração científica centralizada
        const headers = ['Métrica', 'Valor', 'Interpretação'];
        const rows = [
          ['CPI (Cognitive Predictive Index)', data.cpiMetrics.cpi.toFixed(1), formatKAPIClassification('cpi', data.cpiMetrics.cpi)],
          ['ICE (Index of Cognitive Efficiency)', data.cpiMetrics.ice.toFixed(1), formatKAPIClassification('ice', data.cpiMetrics.ice)],
          ['GAP (Governance Alignment Precision)', data.cpiMetrics.gap.toFixed(1), formatKAPIClassification('gap', data.cpiMetrics.gap)],
          ['Estabilidade Cognitiva', data.cpiMetrics.stability.toFixed(1), formatKAPIClassification('stability', data.cpiMetrics.stability)]
        ];

        generator.addTable(headers, rows, {
          theme: 'grid',
          headStyles: { fillColor: [230, 126, 34] },
        });

        // Charts
        const cpiChart = charts.find(c => c.id.includes('cpi-gauge') || c.id.includes('cpi-metrics'));
        if (cpiChart?.dataUrl) {
          generator.addChart(cpiChart, 180, 100);
        }

        // Consenso LLM
        if (data.llmConsensus && data.llmConsensus.length > 0) {
          generator.addText('Consenso entre LLMs:', 11, true);

          const consensusHeaders = ['Provider', 'Menções', 'Confiança Média'];
          const consensusRows = data.llmConsensus.map(item => [
            item.provider,
            item.mentions.toString(),
            `${(item.confidence * 100).toFixed(1)}%`
          ]);

          generator.addTable(consensusHeaders, consensusRows, {
            theme: 'grid',
          });
        }

        // Análise interpretativa baseada no artigo científico
        const cpiValue = data.cpiMetrics.cpi;
        generator.addText('Análise Executiva:', 11, true);

        // Usando thresholds do artigo científico: CPI >= 80 estável, < 50 volatilidade crítica
        let analysis = '';
        if (cpiValue >= 80) {
          analysis = '🎯 CPI Excelente: Marca demonstra forte presença cognitiva e governança eficaz em ecossistemas de IA generativa. Recomenda-se manutenção estratégica e expansão controlada.';
        } else if (cpiValue >= 60) {
          analysis = '📊 CPI Bom: Marca apresenta desempenho sólido com oportunidades identificadas de otimização. Foco em consistência e expansão de cobertura semântica.';
        } else if (cpiValue >= 40) {
          analysis = '⚡ CPI Regular: Marca requer atenção estratégica. Priorizar melhorias em eficiência cognitiva (ICE) e alinhamento de governança (GAP) para aumentar previsibilidade.';
        } else {
          analysis = '🚨 CPI Crítico: Situação demanda intervenção imediata. Implementar plano de governança cognitiva urgente para recuperar visibilidade e confiabilidade em IAs generativas.';
        }

        generator.addText(analysis, 10, false);

        logger.info('Seção CPI gerada', { yFinal: generator.getCurrentY() });
        return generator.getCurrentY();

      } catch (error) {
        logger.error('Erro ao gerar seção CPI', { error });
        throw error;
      }
    }
  };
}

/**
 * Formata classificação KAPI usando a configuração centralizada (artigo científico)
 * TODAS as métricas usam lógica DIRETA: maior valor = melhor performance
 */
function formatKAPIClassification(metricId: keyof typeof KAPI_CONFIGS, value: number): string {
  const classification = classifyKAPIMetric(metricId, value);
  const emoji = classification.color === 'green' ? '🟢' : 
                classification.color === 'yellow' ? '🟡' : 
                classification.color === 'orange' ? '🟠' : '🔴';
  return `${emoji} ${classification.label}`;
}
