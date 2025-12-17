/**
 * Seção IGO (KAPI Metrics) padronizada para PDFs
 * IMPORTANTE: Usa kapiMetrics.ts como fonte única de verdade para classificações
 */

import { PDFSection, ExportDataIGO, ChartCapture } from '../types';
import { PDFGenerator } from '../core/pdfGenerator';
import { logger } from '@/utils/logger';
import { classifyKAPIMetric, KAPI_CONFIGS } from '@/config/kapiMetrics';

export function createIGOSection(data: ExportDataIGO, charts: ChartCapture[]): PDFSection {
  return {
    title: 'Métricas IGO (Intelligence Governance Observability)',
    
    generate: async (doc: any, yPosition: number): Promise<number> => {
      const generator = doc as PDFGenerator;
      generator.setCurrentY(yPosition);

      try {
        generator.addText('Framework IGO - Observabilidade Cognitiva de IAs Generativas', 12, true);

        // Tabela comparativa de marcas
        if (data.brands && data.brands.length > 0) {
          const headers = ['Marca', 'ICE', 'GAP', 'CPI', 'Estabilidade'];
          const rows = data.brands.map(brand => [
            brand.name,
            brand.metrics.ice.toFixed(1),
            brand.metrics.gap.toFixed(1),
            brand.metrics.cpi.toFixed(1),
            brand.metrics.stability.toFixed(1)
          ]);

          generator.addTable(headers, rows, {
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182] },
          });

          // Cálculo de médias
          const avgICE = data.brands.reduce((sum, b) => sum + b.metrics.ice, 0) / data.brands.length;
          const avgGAP = data.brands.reduce((sum, b) => sum + b.metrics.gap, 0) / data.brands.length;
          const avgCPI = data.brands.reduce((sum, b) => sum + b.metrics.cpi, 0) / data.brands.length;
          const avgStability = data.brands.reduce((sum, b) => sum + b.metrics.stability, 0) / data.brands.length;

          generator.addText('Médias do Portfólio:', 11, true);

          const avgHeaders = ['Métrica', 'Média', 'Interpretação'];
          const avgRows = [
            ['ICE (Eficiência Cognitiva)', avgICE.toFixed(1), formatKAPIClassification('ice', avgICE)],
            ['GAP (Precisão de Governança)', avgGAP.toFixed(1), formatKAPIClassification('gap', avgGAP)],
            ['CPI (Índice Preditivo)', avgCPI.toFixed(1), formatKAPIClassification('cpi', avgCPI)],
            ['Estabilidade Cognitiva', avgStability.toFixed(1), formatKAPIClassification('stability', avgStability)]
          ];

          generator.addTable(avgHeaders, avgRows, {
            theme: 'grid',
            headStyles: { fillColor: [52, 73, 94] },
          });
        }

        // Charts
        const igoChart = charts.find(c => 
          c.id.includes('igo-brands-comparison') || c.id.includes('igo-evolution')
        );
        if (igoChart?.dataUrl) {
          generator.addChart(igoChart, 180, 100);
        }

        // Análise interpretativa - usando configuração científica
        if (data.brands && data.brands.length > 0) {
          generator.addText('Análise Estratégica:', 11, true);

          const avgICE = data.brands.reduce((sum, b) => sum + b.metrics.ice, 0) / data.brands.length;
          const avgGAP = data.brands.reduce((sum, b) => sum + b.metrics.gap, 0) / data.brands.length;

          // GAP usa lógica DIRETA (maior = melhor alinhamento)
          let analysis = '';
          if (avgICE >= 85 && avgGAP >= 85) {
            analysis = '🚀 Portfólio com excelência em governança cognitiva. Marcas consolidadas em ecossistemas de IA.';
          } else if (avgICE >= 70 && avgGAP >= 70) {
            analysis = '📈 Portfólio em crescimento saudável. Oportunidades identificadas para otimização estratégica.';
          } else {
            analysis = '⚠️ Portfólio requer atenção estratégica. Recomenda-se priorizar governança e eficiência cognitiva.';
          }

          generator.addText(analysis, 10, false);
        }

        logger.info('Seção IGO gerada', { yFinal: generator.getCurrentY() });
        return generator.getCurrentY();

      } catch (error) {
        logger.error('Erro ao gerar seção IGO', { error });
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
