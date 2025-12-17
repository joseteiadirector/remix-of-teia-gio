import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ValidationResult {
  metric: string;
  kpi_value: number | null;
  seo_value?: number | null;
  geo_value?: number | null;
  seo_metrics_value?: number | null;
  geo_metrics_value?: number | null;
  complete_report_value?: number | null;
  max_divergence?: number;
  divergence?: number;
  status: 'ok' | 'warning' | 'error' | 'critical';
  message?: string;
  observation?: string;
}

export interface MonthlyPillar {
  month_year: string;
  base_tecnica: number;
  estrutura_semantica: number;
  relevancia_conversacional: number;
  autoridade_cognitiva: number;
  inteligencia_estrategica: number;
  geo_score_final: number;
  total_mentions: number;
  total_queries: number;
}

export interface AuditData {
  brand_name: string;
  audit_date: string;
  validation_results: ValidationResult[];
  inconsistencies_found: number;
  max_divergence_percentage: number;
  monthly_pillars: MonthlyPillar[];
  report_sources?: string[];
  geo_score_formula?: string;
  formula_version?: string;
}

export const generateAuditPDF = (auditData: AuditData): void => {
  const doc = new jsPDF();
  let yPos = 20;
  
  // Configurações do relatório (conforme especificação JSON)
  const config = {
    allowed_variance_percent: 5,
    report_sources: auditData.report_sources || [
      "KPIs_PDF",
      "SEO_Metrics_PDF", 
      "GEO_Metrics_PDF",
      "Relatorio_GEO_Completo"
    ],
    geo_score_formula: auditData.geo_score_formula || "(BT * 0.20) + (ES * 0.15) + (RC * 0.25) + (AC * 0.25) + (IE * 0.15)",
    formula_version: auditData.formula_version || "1.0.0"
  };

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Auditoria de Consistência Matemática', 105, 18, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Marca: ${auditData.brand_name}`, 105, 28, { align: 'center' });
  doc.text(`Data: ${new Date(auditData.audit_date).toLocaleString('pt-BR')}`, 105, 34, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text(`Fontes: ${config.report_sources.join(', ')}`, 105, 40, { align: 'center' });

  yPos = 55;

  // Status Geral
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Status da Certificação Matemática', 14, yPos);
  yPos += 10;

  const maxDiv = auditData.max_divergence_percentage;
  const statusColor = maxDiv < config.allowed_variance_percent * 0.4 ? [34, 197, 94] : 
                      maxDiv <= config.allowed_variance_percent ? [234, 179, 8] : 
                      [239, 68, 68];
  
  const statusText = maxDiv < config.allowed_variance_percent * 0.4 ? '✓ CERTIFICADO' :
                     maxDiv <= config.allowed_variance_percent ? '⚠ ATENÇÃO' :
                     '✗ REPROVADO';

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(14, yPos - 5, 4, 4, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, 22, yPos);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  yPos += 6;

  doc.text(`Inconsistências Detectadas: ${auditData.inconsistencies_found}`, 22, yPos);
  yPos += 6;

  doc.text(`Divergência Máxima: ${maxDiv.toFixed(2)}% (Limite: ${config.allowed_variance_percent}%)`, 22, yPos);
  yPos += 6;
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Variância permitida entre fontes: ±${config.allowed_variance_percent}%`, 22, yPos);
  doc.setTextColor(0);
  yPos += 15;

  // Tabela de Validação
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Validação de Consistência entre Métricas', 14, yPos);
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Campos validados: geo_score, seo_score, ctr, conversion_rate, avg_position', 14, yPos);
  doc.setTextColor(0);
  yPos += 8;

  const validationTableData = auditData.validation_results.map(result => [
    result.metric,
    result.kpi_value?.toFixed(2) || '-',
    (result.seo_value || result.seo_metrics_value)?.toFixed(2) || '-',
    (result.geo_value || result.geo_metrics_value)?.toFixed(2) || '-',
    (result.divergence || result.max_divergence || 0).toFixed(2),
    result.status === 'ok' ? '✓' : (result.status === 'warning' || result.status === 'critical') ? '⚠' : '✗',
    result.observation || result.message || ''
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'KPI', 'SEO', 'GEO', 'Div.%', 'Status', 'Observação']],
    body: validationTableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const status = auditData.validation_results[data.row.index].status;
        if (status === 'error' || status === 'critical') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'warning') {
          data.cell.styles.textColor = [234, 179, 8];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [34, 197, 94];
        }
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Nova página se necessário
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Histórico Mensal dos Pilares
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Evolução Mensal dos 5 Pilares GEO', 14, yPos);
  yPos += 8;

  if (auditData.monthly_pillars && auditData.monthly_pillars.length > 0) {
    const monthlyTableData = auditData.monthly_pillars.map(pillar => [
      new Date(pillar.month_year).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
      pillar.base_tecnica.toFixed(1),
      pillar.estrutura_semantica.toFixed(1),
      pillar.relevancia_conversacional.toFixed(1),
      pillar.autoridade_cognitiva.toFixed(1),
      pillar.inteligencia_estrategica.toFixed(1),
      pillar.geo_score_final.toFixed(1),
      pillar.total_mentions?.toString() || '0',
      pillar.total_queries?.toString() || '0'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Mês', 'BT', 'ES', 'RC', 'AC', 'IE', 'GEO', 'Menções', 'Queries']],
      body: monthlyTableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234], fontSize: 9 },
      bodyStyles: { fontSize: 9, halign: 'right' },
      columnStyles: {
        0: { cellWidth: 20, halign: 'left' },
        6: { fontStyle: 'bold' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Dados históricos insuficientes para análise mensal.', 14, yPos);
    yPos += 15;
  }

  // Recomendações
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Recomendações Técnicas', 14, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (maxDiv < config.allowed_variance_percent * 0.4) {
    doc.text('✓ Certificação matemática APROVADA', 14, yPos);
    yPos += 6;
    doc.text('  • Todas as métricas estão dentro da margem de confiança estatística', 14, yPos);
    yPos += 6;
    doc.text('  • Manter monitoramento periódico (recomendado: semanal)', 14, yPos);
    yPos += 6;
    doc.text('  • Documentar este resultado como baseline de qualidade', 14, yPos);
  } else if (maxDiv <= config.allowed_variance_percent) {
    doc.text('⚠ Alertas de atenção detectados', 14, yPos);
    yPos += 6;
    doc.text('  • Divergência dentro do limite aceitável, mas próxima do threshold', 14, yPos);
    yPos += 6;
    doc.text('  • Verificar fontes de dados para possíveis desatualizações', 14, yPos);
    yPos += 6;
    doc.text('  • Revisar cálculos em: ' + config.report_sources.join(', '), 14, yPos);
    yPos += 6;
    doc.text('  • Executar nova auditoria em 48h para confirmar tendência', 14, yPos);
  } else {
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.text('✗ CRÍTICO - Ação imediata necessária', 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    yPos += 6;
    doc.text('  • Divergência EXCEDE o limite de ' + config.allowed_variance_percent + '% - integridade comprometida', 14, yPos);
    yPos += 6;
    doc.text('  • SUSPENDER uso dos dados até correção', 14, yPos);
    yPos += 6;
    doc.text('  • Verificar edge function: calculate-geo-metrics/index.ts', 14, yPos);
    yPos += 6;
    doc.text('  • Consultar: FORMULAS_PADRONIZADAS.md e CALCULATION_SPEC.md', 14, yPos);
    yPos += 6;
    doc.text('  • Re-executar cálculos e validar contra especificação oficial', 14, yPos);
  }
  
  yPos += 15;

  // Metodologia
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Metodologia de Validação', 14, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fórmula GEO Score v${config.formula_version}:`, 14, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.text(config.geo_score_formula, 14, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Campos validados: geo_score, seo_score, ctr, conversion_rate, avg_position', 14, yPos);
  yPos += 5;
  doc.text(`Variância permitida: ±${config.allowed_variance_percent}% entre todas as fontes`, 14, yPos);
  yPos += 5;
  doc.text('Fontes comparadas: ' + config.report_sources.join(', '), 14, yPos);
  yPos += 5;
  doc.text('Análise de tendências: Janela mensal dos últimos 12 meses', 14, yPos);
  yPos += 5;
  doc.text('Documentação oficial: FORMULAS_PADRONIZADAS.md, CALCULATION_SPEC.md', 14, yPos);
  yPos += 7;

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Trigger: Executado automaticamente a cada geração/atualização de PDF', 14, yPos);
  doc.setTextColor(0);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Gerado: ${new Date().toLocaleString('pt-BR')} | Fórmula v${config.formula_version}`,
      105,
      285,
      { align: 'center' }
    );
    doc.setFontSize(7);
    doc.text(
      'CONFIDENCIAL - Auditoria de Consistência Matemática - Teia GEO',
      105,
      290,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `auditoria-geo-${auditData.brand_name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
