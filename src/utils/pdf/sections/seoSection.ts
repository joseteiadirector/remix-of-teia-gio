/**
 * Seção SEO padronizada para PDFs
 */

import { PDFSection, ExportDataSEO, ChartCapture } from '../types';
import { PDFGenerator } from '../core/pdfGenerator';
import { logger } from '@/utils/logger';

export function createSEOSection(data: ExportDataSEO, charts: ChartCapture[]): PDFSection {
  return {
    title: 'Métricas SEO (Search Engine Optimization)',
    
    generate: async (doc: any, yPosition: number): Promise<number> => {
      const generator = doc as PDFGenerator;
      generator.setCurrentY(yPosition);

      try {
        // Score SEO principal
        generator.addText(`Score SEO: ${data.seoScore.toFixed(1)}/100`, 14, true);

        // Tabela de métricas
        if (data.metrics) {
          const headers = ['Métrica', 'Valor'];
          const rows = [
            ['Tráfego Orgânico', data.metrics.organic_traffic.toLocaleString('pt-BR')],
            ['Total de Cliques', data.metrics.total_clicks.toLocaleString('pt-BR')],
            ['Total de Impressões', data.metrics.total_impressions.toLocaleString('pt-BR')],
            ['CTR Médio', `${(data.metrics.ctr * 100).toFixed(2)}%`],
            ['Posição Média', data.metrics.avg_position.toFixed(1)]
          ];

          generator.addTable(headers, rows, {
            theme: 'grid',
            headStyles: { fillColor: [46, 204, 113] },
          });
        }

        // Charts
        const seoChart = charts.find(c => c.id.includes('seo-metrics'));
        if (seoChart?.dataUrl) {
          generator.addChart(seoChart, 180, 100);
        }

        // Análise interpretativa
        if (data.metrics) {
          generator.addText('Análise Interpretativa:', 11, true);

          const ctr = data.metrics.ctr * 100;
          const position = data.metrics.avg_position;

          let analysis = '';
          if (ctr > 5 && position < 5) {
            analysis = '✅ Excelente desempenho: CTR alto com posições privilegiadas.';
          } else if (ctr > 3 && position < 10) {
            analysis = '🟡 Bom desempenho: Resultados consistentes com oportunidades de melhoria.';
          } else {
            analysis = '⚠️ Atenção necessária: Há espaço significativo para otimização de CTR e posicionamento.';
          }

          generator.addText(analysis, 10, false);
        }

        logger.info('Seção SEO gerada', { yFinal: generator.getCurrentY() });
        return generator.getCurrentY();

      } catch (error) {
        logger.error('Erro ao gerar seção SEO', { error });
        throw error;
      }
    }
  };
}
