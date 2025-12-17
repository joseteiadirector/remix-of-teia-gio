/**
 * Lazy loader for PDF generation libraries
 * Loads jsPDF and autoTable only when needed to reduce initial bundle
 */

import { logger } from '@/utils/logger';

export async function loadPDFLibraries() {
  logger.info('🔄 Carregando bibliotecas PDF...');
  
  try {
    // Dynamic import para reduzir bundle inicial
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    
    logger.info('✅ jsPDF + autoTable carregados com sucesso!');
    return { 
      jsPDF: jsPDFModule.default,
      autoTable: autoTableModule.default 
    };
  } catch (error) {
    logger.error('❌ Erro ao inicializar PDF:', error);
    throw new Error(`Falha ao inicializar bibliotecas PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function loadHtml2Canvas() {
  const html2canvas = await import('html2canvas').then(module => module.default);
  return html2canvas;
}
