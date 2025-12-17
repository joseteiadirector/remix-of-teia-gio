/**
 * Motor Central de Geração de PDF
 * Single Source of Truth para TODOS os PDFs da plataforma
 */

import { PDFMetadata, PDFSection, ChartCapture } from '../types';
import { loadPDFLibraries } from '@/utils/lazyPDF';
import { logger } from '@/utils/logger';

export class PDFGenerator {
  private doc: any = null;
  private jsPDF: any = null;
  private autoTable: any = null;
  private currentY: number = 20;
  private readonly pageWidth = 210; // A4 width in mm
  private readonly pageHeight = 297; // A4 height in mm
  private readonly margins = { left: 15, right: 15, top: 20, bottom: 20 };

  /**
   * Inicializa o gerador de PDF
   */
  async initialize(): Promise<void> {
    try {
      const { jsPDF, autoTable } = await loadPDFLibraries();
      this.jsPDF = jsPDF;
      this.autoTable = autoTable;
      this.doc = new jsPDF('portrait', 'mm', 'a4');
      logger.info('PDF Generator inicializado');
    } catch (error) {
      logger.error('Erro ao inicializar PDF Generator', { error });
      throw new Error('Falha ao carregar bibliotecas de PDF');
    }
  }

  /**
   * Adiciona cabeçalho padrão
   */
  addHeader(metadata: PDFMetadata): void {
    if (!this.doc) throw new Error('PDF não inicializado');

    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(metadata.title, this.margins.left, this.currentY);
    this.currentY += 10;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Marca: ${metadata.brandName}`, this.margins.left, this.currentY);
    this.currentY += 6;

    if (metadata.period) {
      this.doc.text(`Período: ${metadata.period}`, this.margins.left, this.currentY);
      this.currentY += 6;
    }

    const dateStr = metadata.generatedAt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    this.doc.text(`Gerado em: ${dateStr}`, this.margins.left, this.currentY);
    this.currentY += 10;

    logger.info('Cabeçalho adicionado', { metadata });
  }

  /**
   * Adiciona seção ao PDF
   */
  async addSection(section: PDFSection): Promise<void> {
    if (!this.doc) throw new Error('PDF não inicializado');

    try {
      logger.info('Adicionando seção', { title: section.title, currentY: this.currentY });
      
      // Título da seção
      this.checkPageBreak(20);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(section.title, this.margins.left, this.currentY);
      this.currentY += 8;

      // Gera conteúdo da seção (passa THIS, não this.doc)
      this.currentY = await section.generate(this, this.currentY);
      this.currentY += 5;

      logger.info('Seção adicionada com sucesso', { title: section.title });
    } catch (error) {
      logger.error('Erro ao adicionar seção', { section: section.title, error });
      throw error;
    }
  }

  /**
   * Adiciona chart capturado
   */
  addChart(capture: ChartCapture, width: number = 180, height: number = 100): void {
    if (!this.doc) throw new Error('PDF não inicializado');
    
    if (!capture.dataUrl) {
      logger.warn('Chart sem imagem, pulando', { chartId: capture.id });
      return;
    }

    try {
      this.checkPageBreak(height + 10);
      
      const x = (this.pageWidth - width) / 2;
      this.doc.addImage(capture.dataUrl, 'PNG', x, this.currentY, width, height);
      this.currentY += height + 5;

      logger.info('Chart adicionado', { chartId: capture.id });
    } catch (error) {
      logger.error('Erro ao adicionar chart', { chartId: capture.id, error });
    }
  }

  /**
   * Adiciona tabela usando autoTable
   */
  addTable(headers: string[], rows: any[][], options: any = {}): void {
    if (!this.doc) throw new Error('PDF não inicializado');

    try {
      this.autoTable(this.doc, {
        startY: this.currentY,
        head: [headers],
        body: rows,
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        ...options,
      });

      this.currentY = this.doc.lastAutoTable.finalY + 5;
      logger.info('Tabela adicionada');
    } catch (error) {
      logger.error('Erro ao adicionar tabela', { error });
    }
  }

  /**
   * Adiciona texto formatado
   */
  addText(text: string, fontSize: number = 10, bold: boolean = false): void {
    if (!this.doc) throw new Error('PDF não inicializado');

    this.checkPageBreak(10);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margins.left - this.margins.right);
    lines.forEach((line: string) => {
      this.checkPageBreak(6);
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += 6;
    });
  }

  /**
   * Adiciona rodapé
   */
  addFooter(): void {
    if (!this.doc) throw new Error('PDF não inicializado');

    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(128);
      
      const footerText = `Teia GEO - Observabilidade Cognitiva | Página ${i} de ${pageCount}`;
      const textWidth = this.doc.getTextWidth(footerText);
      const x = (this.pageWidth - textWidth) / 2;
      
      this.doc.text(footerText, x, this.pageHeight - 10);
    }

    logger.info('Rodapé adicionado', { pageCount });
  }

  /**
   * Verifica se precisa adicionar nova página
   */
  private checkPageBreak(requiredSpace: number): void {
    if (!this.doc) return;

    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.margins.top;
      logger.info('Nova página adicionada');
    }
  }

  /**
   * Salva o PDF
   */
  save(filename: string): void {
    if (!this.doc) throw new Error('PDF não inicializado');

    try {
      this.addFooter();
      this.doc.save(filename);
      logger.info('PDF salvo com sucesso', { filename });
    } catch (error) {
      logger.error('Erro ao salvar PDF', { filename, error });
      throw error;
    }
  }

  /**
   * Retorna Y atual
   */
  getCurrentY(): number {
    return this.currentY;
  }

  /**
   * Define Y atual
   */
  setCurrentY(y: number): void {
    this.currentY = y;
  }

  /**
   * Retorna largura da página
   */
  getPageWidth(): number {
    return this.pageWidth;
  }

  /**
   * Retorna margens
   */
  getMargins() {
    return this.margins;
  }
}
