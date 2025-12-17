/**
 * Seção GEO padronizada para PDFs
 * IMPORTANTE: Usa kapiMetrics.ts como fonte única de verdade para classificações
 */

import { PDFSection, ExportDataGEO, ChartCapture } from '../types';
import { PDFGenerator } from '../core/pdfGenerator';
import { logger } from '@/utils/logger';
import { classifyKAPIMetric, KAPI_CONFIGS } from '@/config/kapiMetrics';

export function createGEOSection(data: ExportDataGEO, charts: ChartCapture[]): PDFSection {
  return {
    title: 'Métricas GEO (Generative Engine Optimization)',
    
    generate: async (doc: any, yPosition: number): Promise<number> => {
      const generator = doc as PDFGenerator;
      generator.setCurrentY(yPosition);

      try {
        // Score GEO principal  
        generator.addText(`Score GEO: ${data.geoScore.toFixed(1)}/100`, 14, true);

        // Tabela de pilares
        if (data.pillars && data.pillars.length > 0) {
          const headers = ['Pilar', 'Valor', 'Variação'];
          const rows = data.pillars.map(pillar => [
            pillar.name,
            pillar.value.toFixed(1),
            pillar.variation ? `${pillar.variation > 0 ? '+' : ''}${pillar.variation.toFixed(1)}%` : 'N/A'
          ]);

          generator.addTable(headers, rows, {
            theme: 'grid',
            headStyles: { fillColor: [52, 152, 219] },
          });
        }

        // Métricas KAPI - usando configuração centralizada do artigo científico
        if (data.kapiMetrics) {
          generator.addText('Métricas KAPI (IGO Framework)', 12, true);

          const kapiHeaders = ['Métrica', 'Valor', 'Interpretação'];
          const kapiRows = [
            ['ICE (Eficiência Cognitiva)', data.kapiMetrics.ice.toFixed(1), formatKAPIClassification('ice', data.kapiMetrics.ice)],
            ['GAP (Precisão de Governança)', data.kapiMetrics.gap.toFixed(1), formatKAPIClassification('gap', data.kapiMetrics.gap)],
            ['CPI (Índice Preditivo)', data.kapiMetrics.cpi.toFixed(1), formatKAPIClassification('cpi', data.kapiMetrics.cpi)],
            ['Estabilidade Cognitiva', data.kapiMetrics.stability.toFixed(1), formatKAPIClassification('stability', data.kapiMetrics.stability)]
          ];

          generator.addTable(kapiHeaders, kapiRows, {
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182] },
          });
        }

        // Charts
        const geoChart = charts.find(c => c.id.includes('geo-pillars'));
        if (geoChart?.dataUrl) {
          generator.addChart(geoChart, 180, 100);
        }

        // Menções LLM
        if (data.mentions && data.mentions.length > 0) {
          generator.addText(`Total de Menções: ${data.mentions.length}`, 11, true);

          const mentionHeaders = ['Provider', 'Mencionado', 'Confiança'];
          const mentionRows = data.mentions.slice(0, 10).map(m => [
            m.provider,
            m.mentioned ? '✓ Sim' : '✗ Não',
            `${(m.confidence * 100).toFixed(0)}%`
          ]);

          generator.addTable(mentionHeaders, mentionRows, {
            theme: 'grid',
          });
        }

        logger.info('Seção GEO gerada', { yFinal: generator.getCurrentY() });
        return generator.getCurrentY();

      } catch (error) {
        logger.error('Erro ao gerar seção GEO', { error });
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
