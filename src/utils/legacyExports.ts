/**
 * FUNÇÕES LEGACY DE EXPORTAÇÃO
 * Mantidas para compatibilidade com páginas específicas
 * Essas funções serão migradas gradualmente para o sistema unificado
 */

import * as XLSX from 'xlsx';

export const exportToCSV = (data: any) => {
  const csvContent = [
    ['Métrica', 'Valor', 'Mudança'],
    ...data.metrics.map((m: any) => [m.label, m.value, m.change])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-${data.brand.replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
};

// Generic PDF export for backward compatibility
export const exportToPDF = async (data: any) => {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  
  const doc = new jsPDF() as any;
  doc.text(`Relatório - ${data.brand}`, 14, 15);
  doc.text(`Período: ${data.period || 'N/A'}`, 14, 22);
  
  if (data.chartImage) {
    doc.addImage(data.chartImage, 'PNG', 14, 30, 180, 100);
  }
  
  if (data.gapChartImage) {
    doc.addImage(data.gapChartImage, 'PNG', 14, 140, 180, 80);
  }
  
  doc.save(`relatorio-${data.brand.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

// ============= EXCEL EXPORTS =============
export const exportToExcel = async (data: any) => {
  const ws = XLSX.utils.json_to_sheet(data.metrics);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Métricas');
  XLSX.writeFile(wb, `relatorio-${data.brand.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
};

export const exportMentionsToExcel = (mentions: any[], brandName: string) => {
  const ws = XLSX.utils.json_to_sheet(mentions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Menções LLM');
  XLSX.writeFile(wb, `mencoes-llm-${brandName.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
};

export const exportAnalysisToExcel = (analyses: any[]) => {
  const ws = XLSX.utils.json_to_sheet(analyses);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Análises');
  XLSX.writeFile(wb, `analises-url-${Date.now()}.xlsx`);
};

// ============= PDF EXPORTS (LEGACY) =============
// REMOVIDO: Todas as funções legacy foram migradas para o sistema unificado PDFShift
// Use as funções de src/utils/pdf/pdfshift-generator.ts ao invés destas

// As seguintes funções foram DESCONTINUADAS e removidas:
// - exportGeoMetricsToPDF → Use generateGEOHTML
// - exportSeoMetricsToPDF → Use generateSEOHTML  
// - exportKPIsToPDF → Use generateCPIHTML
// - exportMentionsToPDF → Incluído em generateGEOHTML
// - exportAnalysisToPDF → Use sistema de URL analysis
// - exportToPDF → Use PDFShift API diretamente
